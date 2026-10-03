import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

// Frames are downscaled before decoding to keep the scan loop cheap
const MAX_SCAN_WIDTH = 640

type Props = {
  onResult: (value: string) => void
  onError: (message: string) => void
}

const BACK_CAMERA_LABEL = /back|rear|environment/i

async function listCameras(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput')
}

function cameraErrorMessage(err: unknown): string {
  const name = (err as DOMException)?.name
  if (name === 'NotAllowedError') return 'Camera permission was denied.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera found.'
  if (name === 'NotReadableError') return 'Camera is already in use by another app.'
  return 'Could not start the camera.'
}

export default function CameraScanner({ onResult, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  // Camera explicitly requested; null means "default to the back camera"
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Camera actually streaming, as reported by the browser
  const [activeId, setActiveId] = useState('')
  // Keep latest callbacks without restarting the camera when they change
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current('Camera is not supported in this browser (HTTPS or localhost is required).')
      return
    }

    let stream: MediaStream | null = null
    let frameId = 0
    let cancelled = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const scan = () => {
      const video = videoRef.current
      if (cancelled || !video || !ctx) return

      if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth) {
        const scale = Math.min(1, MAX_SCAN_WIDTH / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(data, width, height, { inversionAttempts: 'dontInvert' })
        if (code?.data) {
          onResultRef.current(code.data)
          return
        }
      }
      frameId = requestAnimationFrame(scan)
    }

    const video: MediaTrackConstraints = selectedId
      ? { deviceId: { exact: selectedId } }
      : { facingMode: { ideal: 'environment' } }

    navigator.mediaDevices
      .getUserMedia({ video, audio: false })
      .then(async (mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        stream = mediaStream

        // Device labels are only exposed once permission is granted, so list cameras now
        const settings = mediaStream.getVideoTracks()[0]?.getSettings() ?? {}
        const available = await listCameras()
        if (cancelled) return
        setCameras(available)
        setActiveId(settings.deviceId ?? '')

        // Some browsers ignore facingMode; fall back to a camera labelled as back/rear
        if (!selectedId && settings.facingMode !== 'environment') {
          const back = available.find((camera) => BACK_CAMERA_LABEL.test(camera.label))
          if (back && back.deviceId !== settings.deviceId) {
            setSelectedId(back.deviceId)
            return
          }
        }

        const videoEl = videoRef.current
        if (!videoEl) return
        videoEl.srcObject = mediaStream
        await videoEl.play()
        frameId = requestAnimationFrame(scan)
      })
      .catch((err) => {
        if (!cancelled) onErrorRef.current(cameraErrorMessage(err))
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [selectedId])

  // Keep the list in sync when cameras are plugged in or removed
  useEffect(() => {
    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices?.addEventListener) return
    const refresh = () => {
      listCameras().then(setCameras).catch(() => {})
    }
    mediaDevices.addEventListener('devicechange', refresh)
    return () => mediaDevices.removeEventListener('devicechange', refresh)
  }, [])

  return (
    <div className="camera-wrapper">
      <div className="camera">
        <video ref={videoRef} muted playsInline />
        <div className="camera-frame" aria-hidden="true" />
      </div>
      {cameras.length > 1 && (
        <select
          className="camera-select"
          aria-label="Select camera"
          value={activeId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {cameras.map((camera, index) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
