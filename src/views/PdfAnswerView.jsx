import { useState } from 'react'
import PromptHistoryPicker from '../components/PromptHistoryPicker.jsx'

export default function PdfAnswerView() {
  const [pdfFile, setPdfFile] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const handleSelectFile = async () => {
    setError('')
    const file = await window.api.selectPdfFile()
    if (file) setPdfFile(file)
  }

  const handleAsk = async () => {
    if (!pdfFile || !prompt.trim()) return
    setLoading(true)
    setError('')
    setAnswer('')
    try {
      const result = await window.api.askPdfQuestion(pdfFile.base64, prompt.trim())
      setAnswer(result)
      await window.api.addPromptHistory('pdf', prompt.trim())
      setHistoryRefreshKey((key) => key + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="field-row">
          <label>課題PDF</label>
          <button type="button" className="secondary" onClick={handleSelectFile}>
            PDFを選択
          </button>
          {pdfFile && <span style={{ marginLeft: 12 }}>{pdfFile.fileName}</span>}
        </div>

        <div className="field-row">
          <label>質問プロンプト</label>
          <PromptHistoryPicker feature="pdf" onSelect={setPrompt} refreshKey={historyRefreshKey} />
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例：この課題の解答を解説付きで教えて"
          />
        </div>

        <button
          type="button"
          className="primary"
          disabled={!pdfFile || !prompt.trim() || loading}
          onClick={handleAsk}
        >
          {loading ? '回答中...' : '質問する'}
        </button>

        {error && <div className="error-box">{error}</div>}
        {answer && <div className="answer-box">{answer}</div>}
      </div>
    </div>
  )
}
