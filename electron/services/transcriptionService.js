import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { getSetting } from './settingsStore.js'

// 音声認識はクラウドAPI（従量課金）を使わず、ローカルのwhisper.cpp（whisper-cli）を
// サブプロセスとして呼び出す。whisper-cliは16kHzモノラル16bit PCM WAVのみ受け付けるため、
// ブラウザ録音（webm/opus等）はffmpegで事前変換する。
const EXTRA_BIN_DIRS = [
  '/usr/local/bin',
  '/opt/homebrew/bin',
  path.join(os.homedir(), '.npm-global', 'bin'),
  path.join(os.homedir(), '.volta', 'bin')
]

function buildEnv() {
  const pathSep = process.platform === 'win32' ? ';' : ':'
  const existingPath = process.env.PATH || ''
  return { ...process.env, PATH: [existingPath, ...EXTRA_BIN_DIRS].join(pathSep) }
}

function runCommand(command, args, { env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: env || buildEnv() })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(Object.assign(new Error(`${command}コマンドが見つかりません。`), { code: 'ENOENT' }))
        return
      }
      reject(err)
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command}の実行に失敗しました (code ${code}): ${stderr || stdout}`))
        return
      }
      resolve(stdout)
    })
  })
}

async function getWhisperBinaryPath() {
  return (await getSetting('whisperBinaryPath')) || 'whisper-cli'
}

async function getWhisperModelPath() {
  return await getSetting('whisperModelPath')
}

export async function transcribeAudio(audioBase64, mimeType) {
  const modelPath = await getWhisperModelPath()
  if (!modelPath) {
    throw new Error(
      '音声認識モデル（ggml形式）が設定されていません。設定画面からモデルファイルのパスを登録してください。'
    )
  }

  const whisperBinaryPath = await getWhisperBinaryPath()
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-task-client-audio-'))
  try {
    const extension = mimeType.includes('webm') ? 'webm' : 'wav'
    const inputPath = path.join(tmpDir, `recording.${extension}`)
    const wavPath = path.join(tmpDir, 'recording-16k.wav')
    await fs.writeFile(inputPath, Buffer.from(audioBase64, 'base64'))

    try {
      await runCommand('ffmpeg', [
        '-y',
        '-i', inputPath,
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        wavPath
      ])
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(
          'ffmpegコマンドが見つかりません。音声変換に必要です。「brew install ffmpeg」等でインストールしてください。'
        )
      }
      throw err
    }

    try {
      await runCommand(whisperBinaryPath, ['-m', modelPath, '-f', wavPath, '-nt', '-otxt'])
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(
          'whisper-cliコマンドが見つかりません。whisper.cppをビルド/インストールし、' +
            '設定画面でバイナリのパスを指定してください。'
        )
      }
      throw err
    }

    const text = await fs.readFile(`${wavPath}.txt`, 'utf-8')
    return text.trim()
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

export async function checkAvailability() {
  const [ffmpeg, whisperBinaryPath, modelPath] = await Promise.all([
    runCommand('ffmpeg', ['-version'])
      .then(() => true)
      .catch(() => false),
    getWhisperBinaryPath(),
    getWhisperModelPath()
  ])

  const whisperCli = await runCommand(whisperBinaryPath, ['--help'])
    .then(() => true)
    .catch(() => false)

  let modelExists = false
  if (modelPath) {
    modelExists = await fs
      .access(modelPath)
      .then(() => true)
      .catch(() => false)
  }

  return { ffmpeg, whisperCli, modelPath, modelExists }
}
