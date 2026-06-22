import { app } from 'electron'
import path from 'node:path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

let dbInstance = null

export async function getDb() {
  if (dbInstance) return dbInstance

  const dbPath = path.join(app.getPath('userData'), 'db.json')
  const adapter = new JSONFile(dbPath)
  const db = new Low(adapter, { promptHistory: [], notes: [], settings: {} })

  await db.read()
  db.data ||= { promptHistory: [], notes: [], settings: {} }
  db.data.promptHistory ||= []
  db.data.notes ||= []
  db.data.settings ||= {}

  dbInstance = db
  return dbInstance
}
