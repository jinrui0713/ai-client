import { useEffect, useState } from 'react'

function SettingPathField({ settingKey, label, placeholder }) {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.getSetting(settingKey).then((stored) => setValue(stored || ''))
  }, [settingKey])

  const handleSave = async () => {
    await window.api.setSetting(settingKey, value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="field-row">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <button type="button" className="primary" onClick={handleSave}>
          保存
        </button>
      </div>
      {saved && <p style={{ color: '#0a8a3c', fontSize: 13 }}>保存しました</p>}
    </div>
  )
}

function ClaudeCodeStatus() {
  const [status, setStatus] = useState(null)
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    const result = await window.api.checkClaudeCodeStatus()
    setStatus(result)
    setChecking(false)
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <div className="field-row">
      <label>Claude Code CLI（Pro/Maxプラン）</label>
      <p style={{ fontSize: 13, color: '#555' }}>
        このアプリはAnthropic APIキー（従量課金）を使わず、ローカルにログイン済みのClaude Code
        CLIを呼び出してClaude Pro/Maxプランの利用枠でClaudeを使います。事前に
        <code> npm install -g @anthropic-ai/claude-code </code>
        でインストールし、ターミナルで<code> claude login </code>
        を一度実行してログインしておいてください。
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" className="secondary" onClick={check} disabled={checking}>
          {checking ? '確認中...' : '接続状態を確認'}
        </button>
        {status && (
          <span style={{ color: status.available ? '#0a8a3c' : '#d70015', fontSize: 13 }}>
            {status.available ? `検出済み（${status.version}）` : 'claudeコマンドが見つかりません'}
          </span>
        )}
      </div>
    </div>
  )
}

function TranscriptionStatus() {
  const [status, setStatus] = useState(null)
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    const result = await window.api.checkTranscriptionStatus()
    setStatus(result)
    setChecking(false)
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <div className="field-row">
      <label>音声認識（ローカルwhisper.cpp）</label>
      <p style={{ fontSize: 13, color: '#555' }}>
        音声認識（文字起こし）はClaudeでは行えないため、クラウドAPIを使わずローカルの
        whisper.cppを呼び出します。事前にwhisper.cppをビルドし、ggml形式のモデルファイルと
        whisper-cliバイナリのパスを下に設定してください（音声変換にはffmpegも必要です）。
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" className="secondary" onClick={check} disabled={checking}>
          {checking ? '確認中...' : '状態を確認'}
        </button>
        {status && (
          <span style={{ fontSize: 13 }}>
            <span style={{ color: status.ffmpeg ? '#0a8a3c' : '#d70015' }}>
              ffmpeg: {status.ffmpeg ? 'OK' : '未検出'}
            </span>
            {' / '}
            <span style={{ color: status.whisperCli ? '#0a8a3c' : '#d70015' }}>
              whisper-cli: {status.whisperCli ? 'OK' : '未検出'}
            </span>
            {' / '}
            <span style={{ color: status.modelExists ? '#0a8a3c' : '#d70015' }}>
              モデル: {status.modelExists ? 'OK' : '未検出'}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

export default function SettingsView() {
  return (
    <div className="card">
      <ClaudeCodeStatus />
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
      <TranscriptionStatus />
      <SettingPathField
        settingKey="whisperBinaryPath"
        label="whisper-cliバイナリのパス"
        placeholder="whisper-cli（PATH上にある場合は空欄可）"
      />
      <SettingPathField
        settingKey="whisperModelPath"
        label="ggmlモデルファイルのパス"
        placeholder="/path/to/ggml-base.bin"
      />
    </div>
  )
}
