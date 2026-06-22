import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'

// Electronアプリ（特にmacOSでDockから起動した場合）はログインシェルのPATHを
// 継承しないことがあるため、claudeコマンドの一般的なインストール先を補完する。
const EXTRA_BIN_DIRS = [
  '/usr/local/bin',
  '/opt/homebrew/bin',
  path.join(os.homedir(), '.claude', 'local'),
  path.join(os.homedir(), '.npm-global', 'bin'),
  path.join(os.homedir(), '.volta', 'bin')
]

function buildEnv() {
  const pathSep = process.platform === 'win32' ? ';' : ':'
  const existingPath = process.env.PATH || ''
  return { ...process.env, PATH: [existingPath, ...EXTRA_BIN_DIRS].join(pathSep) }
}

// 課題解決AIクライアントはAnthropic APIキー（従量課金）を使わず、
// ローカルにログイン済みのClaude Code CLI（Pro/Maxプランの認証）を
// サブプロセスとして呼び出す。`--bare`を付けないことでOAuth/キーチェーン
// 認証を維持しつつ、`--safe-mode`でユーザーのhooks/プラグイン/CLAUDE.md等の
// カスタマイズが本処理に影響しないようにする。
function runClaudeCode(prompt, { cwd }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      prompt,
      '--output-format',
      'json',
      '--allowedTools',
      'Read',
      '--safe-mode',
      '--max-turns',
      '8'
    ]

    const child = spawn('claude', args, { cwd, env: buildEnv() })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'Claude Code CLI（claudeコマンド）が見つかりません。' +
              '「npm install -g @anthropic-ai/claude-code」でインストールし、' +
              '「claude login」でPro/Maxプランにログインしてください。'
          )
        )
        return
      }
      reject(err)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude Codeの実行に失敗しました (code ${code}): ${stderr || stdout}`))
        return
      }
      let parsed
      try {
        parsed = JSON.parse(stdout)
      } catch {
        reject(new Error(`Claude Codeの出力を解析できませんでした: ${stdout}`))
        return
      }
      if (parsed.is_error) {
        reject(new Error(parsed.result || 'Claude Codeがエラーを返しました。'))
        return
      }
      resolve(parsed.result)
    })
  })
}

export async function askPdfQuestion(pdfBase64, prompt) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-task-client-pdf-'))
  const pdfPath = path.join(tmpDir, 'document.pdf')
  try {
    await fs.writeFile(pdfPath, Buffer.from(pdfBase64, 'base64'))
    const fullPrompt = `添付PDF（${pdfPath}）を読んで、次の質問に答えてください。\n\n質問: ${prompt}`
    return await runClaudeCode(fullPrompt, { cwd: tmpDir })
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

export async function generateNote(transcript, photoBase64List, prompt) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-task-client-note-'))
  try {
    const photoPaths = []
    for (const [index, photoBase64] of (photoBase64List || []).entries()) {
      const photoPath = path.join(tmpDir, `photo-${index}.jpg`)
      await fs.writeFile(photoPath, Buffer.from(photoBase64, 'base64'))
      photoPaths.push(photoPath)
    }

    const sections = []
    if (transcript) sections.push(`【文字起こし】\n${transcript}`)
    if (photoPaths.length > 0) {
      sections.push(`【添付写真】\n${photoPaths.map((p) => `- ${p}`).join('\n')}`)
    }
    sections.push(`【指示】\n${prompt}`)

    return await runClaudeCode(sections.join('\n\n'), { cwd: tmpDir })
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

export async function checkAvailability() {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version'], { env: buildEnv() })
    let stdout = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.on('error', () => resolve({ available: false }))
    child.on('close', (code) => {
      resolve(code === 0 ? { available: true, version: stdout.trim() } : { available: false })
    })
  })
}
