import { useRef, useState } from 'react'

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function AudioRecorder({ onRecorded }) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    const mimeType = 'audio/webm'
    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const base64 = await blobToBase64(blob)
      onRecorded(base64, mimeType)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }

    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  return (
    <div>
      {!isRecording ? (
        <button type="button" className="secondary" onClick={startRecording}>
          録音開始
        </button>
      ) : (
        <button type="button" className="primary" onClick={stopRecording}>
          録音停止
        </button>
      )}
    </div>
  )
}
