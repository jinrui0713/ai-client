import { useEffect, useState } from 'react'

function ApiKeyField({ service, label, placeholder }) {
  const [key, setKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.hasApiKey(service).then(setHasKey)
  }, [service])

  const handleSave = async () => {
    if (!key.trim()) return
    await window.api.setApiKey(service, key.trim())
    setHasKey(true)
    setSaved(true)
    setKey('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="field-row">
      <label>
        {label} {hasKey && <span style={{ color: '#0a8a3c' }}>（設定済み）</span>}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={placeholder}
        />
        <button type="button" className="primary" onClick={handleSave} disabled={!key.trim()}>
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

export default function SettingsView() {
  return (
    <div className="card">
      <ClaudeCodeStatus />
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
      <p style={{ fontSize: 13, color: '#555' }}>
        音声認識（文字起こし）はClaudeでは行えないため、別途クラウドAPIを使用します。
        このAPIキーはOSのキーチェーンで暗号化して保存され、平文では保存されません。
      </p>
      <ApiKeyField service="transcription" label="音声認識APIキー（OpenAI）" placeholder="sk-..." />
    </div>
  )
}
