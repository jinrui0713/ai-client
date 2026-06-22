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
  saveNote: (note) => ipcRenderer.invoke('notes:save', note),
  listNotes: () => ipcRenderer.invoke('notes:list'),

  // プロンプト履歴機能
  listPromptHistory: (feature) => ipcRenderer.invoke('promptHistory:list', feature),
  addPromptHistory: (feature, text) => ipcRenderer.invoke('promptHistory:add', { feature, text }),

  // APIキー管理（safeStorage経由、平文保存なし）
  setApiKey: (service, key) => ipcRenderer.invoke('apiKey:set', { service, key }),
  hasApiKey: (service) => ipcRenderer.invoke('apiKey:has', service)
})
