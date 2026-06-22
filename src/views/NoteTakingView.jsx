import { useState } from 'react'
import AudioRecorder from '../components/AudioRecorder.jsx'
import CameraCapture from '../components/CameraCapture.jsx'
import PromptHistoryPicker from '../components/PromptHistoryPicker.jsx'

export default function NoteTakingView() {
  const [transcript, setTranscript] = useState('')
  const [photos, setPhotos] = useState([])
  const [prompt, setPrompt] = useState('箇条書きで要点をまとめて')
  const [generatedNote, setGeneratedNote] = useState('')
  const [error, setError] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const handleRecorded = async (audioBase64, mimeType) => {
    setIsTranscribing(true)
    setError('')
    try {
      const text = await window.api.transcribeAudio(audioBase64, mimeType)
      setTranscript((prev) => (prev ? `${prev}\n${text}` : text))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleCapture = (base64, dataUrl) => {
    setPhotos((prev) => [...prev, { base64, dataUrl }])
  }

  const handleGenerate = async () => {
    if (!transcript.trim() && photos.length === 0) return
    setIsGenerating(true)
    setError('')
    try {
      const note = await window.api.generateNote(
        transcript,
        photos.map((p) => p.base64),
        prompt.trim()
      )
      setGeneratedNote(note)
      await window.api.addPromptHistory('notes', prompt.trim())
      setHistoryRefreshKey((key) => key + 1)
      await window.api.saveNote({
        title: transcript.slice(0, 30) || '無題のノート',
        transcript,
        photoPaths: [],
        generatedNote: note
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="field-row">
          <label>録音</label>
          <AudioRecorder onRecorded={handleRecorded} />
          {isTranscribing && <p>文字起こし中...</p>}
        </div>

        <div className="field-row">
          <label>文字起こし結果（編集可）</label>
          <textarea rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
        </div>

        <div className="field-row">
          <label>写真（iPhoneカメラを含む）</label>
          <CameraCapture onCapture={handleCapture} />
          {photos.length > 0 && (
            <div className="photo-thumbs">
              {photos.map((p, i) => (
                <img key={i} src={p.dataUrl} alt={`photo-${i}`} />
              ))}
            </div>
          )}
        </div>

        <div className="field-row">
          <label>ノート生成プロンプト</label>
          <PromptHistoryPicker feature="notes" onSelect={setPrompt} refreshKey={historyRefreshKey} />
          <textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <button
          type="button"
          className="primary"
          disabled={isGenerating || (!transcript.trim() && photos.length === 0)}
          onClick={handleGenerate}
        >
          {isGenerating ? 'ノート生成中...' : 'ノートを生成'}
        </button>

        {error && <div className="error-box">{error}</div>}
        {generatedNote && <div className="answer-box">{generatedNote}</div>}
      </div>
    </div>
  )
}
