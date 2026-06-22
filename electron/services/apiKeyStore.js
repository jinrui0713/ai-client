import { app, safeStorage } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

function getKeysFilePath() {
  return path.join(app.getPath('userData'), 'keys.enc.json')
}

async function readKeysFile() {
  try {
    const raw = await fs.readFile(getKeysFilePath(), 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw err
  }
}

async function writeKeysFile(data) {
  await fs.writeFile(getKeysFilePath(), JSON.stringify(data), 'utf-8')
}

// service: 'anthropic' | 'transcription'
export async function setApiKey(service, key) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('このOSではセキュアな保存（safeStorage）が利用できません。')
  }
  const encrypted = safeStorage.encryptString(key)
  const all = await readKeysFile()
  all[service] = encrypted.toString('base64')
  await writeKeysFile(all)
}

export async function getApiKey(service) {
  const all = await readKeysFile()
  const stored = all[service]
  if (!stored) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  const buffer = Buffer.from(stored, 'base64')
  return safeStorage.decryptString(buffer)
}

export async function hasApiKey(service) {
  const all = await readKeysFile()
  return Boolean(all[service])
}
