import { ipcMain, dialog } from 'electron'
import fs from 'node:fs/promises'

import * as claudeService from './services/claudeService.js'
import * as transcriptionService from './services/transcriptionService.js'
import * as promptHistoryStore from './services/promptHistoryStore.js'
import * as notesStore from './services/notesStore.js'
import * as settingsStore from './services/settingsStore.js'

export function registerIpcHandlers() {
  ipcMain.handle('dialog:selectPdfFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const buffer = await fs.readFile(filePath)
    return { fileName: filePath.split(/[/\\]/).pop(), base64: buffer.toString('base64') }
  })

  ipcMain.handle('claude:askPdfQuestion', async (_event, { pdfBase64, prompt }) => {
    return claudeService.askPdfQuestion(pdfBase64, prompt)
  })

  ipcMain.handle('claude:generateNote', async (_event, { transcript, photoBase64List, prompt }) => {
    return claudeService.generateNote(transcript, photoBase64List, prompt)
  })

  ipcMain.handle('claudeCode:checkStatus', async () => {
    return claudeService.checkAvailability()
  })

  ipcMain.handle('transcription:transcribe', async (_event, { audioBase64, mimeType }) => {
    return transcriptionService.transcribeAudio(audioBase64, mimeType)
  })

  ipcMain.handle('notes:save', async (_event, note) => {
    return notesStore.saveNote(note)
  })

  ipcMain.handle('notes:list', async () => {
    return notesStore.listNotes()
  })

  ipcMain.handle('promptHistory:list', async (_event, feature) => {
    return promptHistoryStore.listPromptHistory(feature)
  })

  ipcMain.handle('promptHistory:add', async (_event, { feature, text }) => {
    return promptHistoryStore.addPromptHistory(feature, text)
  })

  ipcMain.handle('transcription:checkStatus', async () => {
    return transcriptionService.checkAvailability()
  })

  ipcMain.handle('settings:get', async (_event, key) => {
    return settingsStore.getSetting(key)
  })

  ipcMain.handle('settings:set', async (_event, { key, value }) => {
    await settingsStore.setSetting(key, value)
    return true
  })
}
