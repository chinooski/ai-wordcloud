import { useState } from 'react'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [instructions, setInstructions] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [imageData, setImageData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setImageData(null)
    try {
      const res = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, instructions, api_key: apiKey })
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setImageData(data.image)
    } catch (err) {
      console.error(err)
      alert('Failed to generate word cloud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>AI Word Cloud</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="6"
          placeholder="Enter text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          type="text"
          placeholder="Extraction instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <input
          type="password"
          placeholder="API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {imageData && (
        <img
          src={`data:image/png;base64,${imageData}`}
          alt="Word Cloud"
          className="result-image"
        />
      )}
    </div>
  )
}

export default App
