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

export default function SettingsView() {
  return (
    <div className="card">
      <p style={{ fontSize: 13, color: '#555' }}>
        APIキーはOSのキーチェーンで暗号化して保存され、平文では保存されません。
      </p>
      <ApiKeyField service="anthropic" label="Anthropic APIキー" placeholder="sk-ant-..." />
      <ApiKeyField service="transcription" label="音声認識APIキー（OpenAI）" placeholder="sk-..." />
    </div>
  )
}
