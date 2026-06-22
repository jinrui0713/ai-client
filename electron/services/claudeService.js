import { getApiKey } from './apiKeyStore.js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 4096

async function callMessagesApi(content) {
  const apiKey = await getApiKey('anthropic')
  if (!apiKey) {
    throw new Error('Anthropic APIキーが設定されていません。設定画面から登録してください。')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content }]
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Claude APIエラー (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  return data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}

export async function askPdfQuestion(pdfBase64, prompt) {
  return callMessagesApi([
    { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
    { type: 'text', text: prompt }
  ])
}

export async function generateNote(transcript, photoBase64List, prompt) {
  const content = []

  if (transcript) {
    content.push({ type: 'text', text: `【文字起こし】\n${transcript}` })
  }

  for (const photoBase64 of photoBase64List || []) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 }
    })
  }

  content.push({ type: 'text', text: prompt })

  return callMessagesApi(content)
}
