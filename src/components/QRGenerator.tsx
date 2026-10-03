import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export default function QRGenerator() {
  const [text, setText] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'qrcode.png'
    link.click()
  }

  return (
    <section className="card">
      <h2>Generate QR Code</h2>
      <input
        type="text"
        placeholder="Enter text or URL"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {text ? (
        <div className="qr-output">
          <QRCodeCanvas ref={canvasRef} value={text} size={220} marginSize={2} />
          <button onClick={download}>Download PNG</button>
        </div>
      ) : (
        <p className="hint">Type something to generate a QR code.</p>
      )}
    </section>
  )
}
