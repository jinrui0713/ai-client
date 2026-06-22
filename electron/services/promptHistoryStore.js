import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const MAX_HISTORY_PER_FEATURE = 5

export async function listPromptHistory(feature) {
  const db = await getDb()
  return db.data.promptHistory
    .filter((entry) => entry.feature === feature)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function addPromptHistory(feature, text) {
  const trimmed = text.trim()
  if (!trimmed) return listPromptHistory(feature)

  const db = await getDb()
  const all = db.data.promptHistory
  const others = all.filter((entry) => entry.feature !== feature)
  const sameFeature = all.filter((entry) => entry.feature === feature)

  const withoutDuplicate = sameFeature.filter((entry) => entry.text !== trimmed)
  const updated = [
    { id: uuidv4(), feature, text: trimmed, updatedAt: new Date().toISOString() },
    ...withoutDuplicate
  ].slice(0, MAX_HISTORY_PER_FEATURE)

  db.data.promptHistory = [...others, ...updated]
  await db.write()

  return listPromptHistory(feature)
}
