import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // ファイル選択（PDF）
  selectPdfFile: () => ipcRenderer.invoke('dialog:selectPdfFile'),

  // PDF即答機能
  askPdfQuestion: (pdfBase64, prompt) =>
    ipcRenderer.invoke('claude:askPdfQuestion', { pdfBase64, prompt }),

  // 音声+写真ノート機能
  transcribeAudio: (audioBase64, mimeType) =>
    ipcRenderer.invoke('transcription:transcribe', { audioBase64, mimeType }),
  generateNote: (transcript, photoBase64List, prompt) =>
    ipcRenderer.invoke('claude:generateNote', { transcript, photoBase64List, prompt }),
  checkClaudeCodeStatus: () => ipcRenderer.invoke('claudeCode:checkStatus'),
  checkTranscriptionStatus: () => ipcRenderer.invoke('transcription:checkStatus'),
  saveNote: (note) => ipcRenderer.invoke('notes:save', note),
  listNotes: () => ipcRenderer.invoke('notes:list'),

  // プロンプト履歴機能
  listPromptHistory: (feature) => ipcRenderer.invoke('promptHistory:list', feature),
  addPromptHistory: (feature, text) => ipcRenderer.invoke('promptHistory:add', { feature, text }),

  // ローカル設定（whisper.cppのバイナリ/モデルパス等、機密情報ではないためlowdbに保存）
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value })
})
