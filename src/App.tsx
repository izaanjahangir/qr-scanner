import QRGenerator from './components/QRGenerator'
import QRReader from './components/QRReader'
import './App.css'

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function App() {
  return (
    <main className="app">
      <header className="intro">
        <h1>QR Code Tools</h1>
        <p className="tagline">
          Create QR codes with an optional title and description, download them in high resolution,
          or read QR codes from an image or your camera.
        </p>
        <p className="privacy">
          <ShieldIcon />
          <span>
            <strong>Your data stays private.</strong> Everything happens right here in your browser. Nothing
            you type, upload or scan is sent to a server.
          </span>
        </p>
      </header>
      <div className="grid">
        <QRGenerator />
        <QRReader />
      </div>
    </main>
  )
}

export default App
