import { getApiKey } from './apiKeyStore.js'

// v1: クラウドAPI（OpenAI Whisper）を使用。
// プライバシー/コスト要件が変わった場合は、この関数の実装を
// whisper.cpp等のローカル実行に差し替える（呼び出し側のインターフェースは変えない）。
export async function transcribeAudio(audioBase64, mimeType) {
  const apiKey = await getApiKey('transcription')
  if (!apiKey) {
    throw new Error('音声認識APIキーが設定されていません。設定画面から登録してください。')
  }

  const audioBuffer = Buffer.from(audioBase64, 'base64')
  const extension = mimeType.includes('webm') ? 'webm' : 'wav'

  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer], { type: mimeType }), `recording.${extension}`)
  formData.append('model', 'whisper-1')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`音声認識APIエラー (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  return data.text
}
