import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

// Rendered at high resolution so the downloaded PNG stays sharp; scaled down via CSS for display
const QR_SIZE = 1024
const PADDING = 64
const TITLE_FONT_SIZE = 76
const DESCRIPTION_FONT_SIZE = 50
const LINE_HEIGHT = 1.3
const GAP = 24
const FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (ctx.measureText(candidate).width <= maxWidth || !line) {
        line = candidate
      } else {
        lines.push(line)
        line = word
      }
    }
    lines.push(line)
  }
  return lines
}

function drawComposite(
  target: HTMLCanvasElement,
  qr: HTMLCanvasElement,
  title: string,
  description: string,
) {
  const ctx = target.getContext('2d')
  if (!ctx) return

  const width = QR_SIZE + PADDING * 2
  const maxTextWidth = width - PADDING * 2
  const titleFont = `bold ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`
  const descriptionFont = `${DESCRIPTION_FONT_SIZE}px ${FONT_FAMILY}`

  ctx.font = titleFont
  const titleLines = title ? wrapText(ctx, title, maxTextWidth) : []
  ctx.font = descriptionFont
  const descriptionLines = description ? wrapText(ctx, description, maxTextWidth) : []

  const titleLineHeight = TITLE_FONT_SIZE * LINE_HEIGHT
  const descriptionLineHeight = DESCRIPTION_FONT_SIZE * LINE_HEIGHT
  const titleHeight = titleLines.length * titleLineHeight
  const descriptionHeight = descriptionLines.length * descriptionLineHeight
  const textHeight =
    titleHeight + descriptionHeight + (titleLines.length && descriptionLines.length ? GAP / 2 : 0)
  const headerHeight = textHeight ? textHeight + GAP : 0

  target.width = width
  target.height = PADDING + headerHeight + QR_SIZE + PADDING

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, target.width, target.height)
  ctx.fillStyle = '#111111'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  let y = PADDING
  ctx.font = titleFont
  for (const line of titleLines) {
    ctx.fillText(line, width / 2, y)
    y += titleLineHeight
  }
  if (titleLines.length && descriptionLines.length) y += GAP / 2

  ctx.font = descriptionFont
  ctx.fillStyle = '#444444'
  for (const line of descriptionLines) {
    ctx.fillText(line, width / 2, y)
    y += descriptionLineHeight
  }

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qr, PADDING, PADDING + headerHeight, QR_SIZE, QR_SIZE)
}

export default function QRGenerator() {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const qrRef = useRef<HTMLCanvasElement>(null)
  const outputRef = useRef<HTMLCanvasElement>(null)

  // Runs after QRCodeCanvas (a child) has drawn into qrRef
  useEffect(() => {
    if (!text || !qrRef.current || !outputRef.current) return
    drawComposite(outputRef.current, qrRef.current, title.trim(), description.trim())
  }, [text, title, description])

  const download = () => {
    const canvas = outputRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${title.trim().replace(/[^\w-]+/g, '-').toLowerCase() || 'qrcode'}.png`
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
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description (optional)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {text ? (
        <div className="qr-output">
          <QRCodeCanvas
            ref={qrRef}
            value={text}
            size={QR_SIZE}
            marginSize={0}
            level="M"
            style={{ display: 'none' }}
          />
          <canvas ref={outputRef} className="qr-image" />
          <button onClick={download}>Download PNG</button>
        </div>
      ) : (
        <p className="hint">Type something to generate a QR code.</p>
      )}
    </section>
  )
}
