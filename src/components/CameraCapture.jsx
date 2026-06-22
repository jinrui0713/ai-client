import { useEffect, useRef, useState } from 'react'

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const startCamera = async () => {
    const initialStream = await navigator.mediaDevices.getUserMedia({ video: true })
    initialStream.getTracks().forEach((track) => track.stop())

    const allDevices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
    setDevices(videoDevices)

    const deviceId = selectedDeviceId || videoDevices[0]?.deviceId
    setSelectedDeviceId(deviceId)
    await openStream(deviceId)
  }

  const openStream = async (deviceId) => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true
    })
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
    setIsActive(true)
  }

  const handleDeviceChange = async (e) => {
    const deviceId = e.target.value
    setSelectedDeviceId(deviceId)
    await openStream(deviceId)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onCapture(dataUrl.split(',')[1], dataUrl)
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setIsActive(false)
  }

  return (
    <div>
      {!isActive ? (
        <button type="button" className="secondary" onClick={startCamera}>
          カメラを起動
        </button>
      ) : (
        <>
          {devices.length > 1 && (
            <select value={selectedDeviceId} onChange={handleDeviceChange} style={{ marginBottom: 8 }}>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'カメラ'}
                </option>
              ))}
            </select>
          )}
          <video ref={videoRef} autoPlay playsInline className="camera-preview" />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" className="primary" onClick={capturePhoto}>
              撮影
            </button>
            <button type="button" className="secondary" onClick={stopCamera}>
              カメラを停止
            </button>
          </div>
        </>
      )}
    </div>
  )
}
