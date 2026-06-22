import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

function getNotesDir() {
  return path.join(app.getPath('userData'), 'notes')
}

export async function saveNote({ title, transcript, photoPaths, generatedNote }) {
  const notesDir = getNotesDir()
  await fs.mkdir(notesDir, { recursive: true })

  const id = uuidv4()
  const createdAt = new Date().toISOString()
  const fileName = `${createdAt.replace(/[:.]/g, '-')}_${id}.md`
  const filePath = path.join(notesDir, fileName)

  await fs.writeFile(filePath, generatedNote, 'utf-8')

  const db = await getDb()
  const record = {
    id,
    title: title || '無題のノート',
    transcript: transcript || '',
    photoPaths: photoPaths || [],
    generatedNote,
    filePath,
    createdAt
  }
  db.data.notes.unshift(record)
  await db.write()

  return record
}

export async function listNotes() {
  const db = await getDb()
  return db.data.notes
}
