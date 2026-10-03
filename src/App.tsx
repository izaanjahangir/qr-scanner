import QRGenerator from './components/QRGenerator'
import QRReader from './components/QRReader'
import './App.css'

function App() {
  return (
    <main className="app">
      <h1>QR Code Tools</h1>
      <div className="grid">
        <QRGenerator />
        <QRReader />
      </div>
    </main>
  )
}

export default App
