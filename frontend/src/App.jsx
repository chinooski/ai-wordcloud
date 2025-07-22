import { useState } from 'react'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [instructions, setInstructions] = useState('')
  const [excludeWords, setExcludeWords] = useState('') // New state
  const [shape, setShape] = useState('rectangle') // New state for shape
  const [apiKey, setApiKey] = useState('')
  const [apiKeyIsSet, setApiKeyIsSet] = useState(false) // New state
  const [imageData, setImageData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });
      if (!res.ok) throw new Error('Failed to set API key');
      setApiKeyIsSet(true);
      alert('API Key set successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setImageData(null)
    try {
      const prompt = `Extract ${instructions} from the following text and return a comma-separated list of words.\n\nText:\n${text}`
      const res = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, exclude_words: excludeWords, shape })
      })
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Request failed');
      }
      const data = await res.json()
      setImageData(data.image)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!apiKeyIsSet) {
    return (
      <div className="app">
        <h1>Set Gemini API Key</h1>
        <p>Please provide your API key to begin.</p>
        <form onSubmit={handleApiKeySubmit}>
          <input
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Setting Key...' : 'Set API Key'}
          </button>
        </form>
      </div>
    );
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
          type="text"
          placeholder="Words to exclude (comma-separated)"
          value={excludeWords}
          onChange={(e) => setExcludeWords(e.target.value)}
        />
        <select value={shape} onChange={(e) => setShape(e.target.value)}>
          <option value="rectangle">Rectangle</option>
          <option value="sphere">Sphere</option>
        </select>
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
