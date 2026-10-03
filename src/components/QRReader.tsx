import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import CameraScanner from './CameraScanner'

function decodeImage(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return reject(new Error('Canvas not supported'))
      }
      ctx.drawImage(img, 0, 0)
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(jsQR(data, width, height)?.data ?? null)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}

// For browsers/contexts where the async Clipboard API is unavailable or denied
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  return ok
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function QRReader() {
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [scanning, setScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setResult(null)
    setError(null)
    setCopied(false)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    reset()
    setScanning(false)
    if (!file) return
    setPreview(URL.createObjectURL(file))

    try {
      const value = await decodeImage(file)
      if (value === null) setError('No QR code found in this image.')
      else setResult(value)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const toggleCamera = () => {
    if (scanning) {
      setScanning(false)
      return
    }
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
    setScanning(true)
  }

  const handleScanResult = (value: string) => {
    setResult(value)
    setScanning(false)
  }

  const handleScanError = (message: string) => {
    setError(message)
    setScanning(false)
  }

  const copy = async () => {
    if (result === null) return
    try {
      await navigator.clipboard.writeText(result)
    } catch {
      if (!fallbackCopy(result)) {
        setError('Failed to copy to clipboard.')
        return
      }
    }
    setError(null)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="card">
      <h2>Read QR Code</h2>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} />
      <button className="secondary" onClick={toggleCamera}>
        {scanning ? 'Stop camera' : 'Scan with camera'}
      </button>
      {scanning && <CameraScanner onResult={handleScanResult} onError={handleScanError} />}
      {preview && <img className="preview" src={preview} alt="Uploaded QR" />}
      {error && <p className="error">{error}</p>}
      {result !== null && (
        <div className="result">
          <span className="result-text">{result}</span>
          <button
            className="icon-button"
            onClick={copy}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            aria-label="Copy to clipboard"
          >
            {copied ? <CheckIcon /> : <ClipboardIcon />}
          </button>
        </div>
      )}
    </section>
  )
}
