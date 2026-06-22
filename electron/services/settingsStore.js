import { getDb } from '../db.js'

export async function getSetting(key) {
  const db = await getDb()
  return db.data.settings[key] ?? null
}

export async function setSetting(key, value) {
  const db = await getDb()
  db.data.settings[key] = value
  await db.write()
}

export async function getAllSettings() {
  const db = await getDb()
  return db.data.settings
}
