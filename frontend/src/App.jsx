import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [instructions, setInstructions] = useState('')
  const [density, setDensity] = useState('default'); // New state for density
  const [excludeWords, setExcludeWords] = useState('') // New state
  const [debouncedExcludeWords, setDebouncedExcludeWords] = useState(''); // Debounced state
  const [shape, setShape] = useState('rectangle') // New state for shape
  const [colorPalette, setColorPalette] = useState('viridis') // New state for color
  const [apiKey, setApiKey] = useState('')
  const [apiKeyIsSet, setApiKeyIsSet] = useState(false) // New state
  const [imageData, setImageData] = useState(null)
  const [generatedText, setGeneratedText] = useState(''); // Cache for the API response
  const [loading, setLoading] = useState(false)
  const [isRendering, setIsRendering] = useState(false);

  // Debounce the exclude words input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedExcludeWords(excludeWords);
    }, 500); // Wait 500ms after the user stops typing

    return () => {
      clearTimeout(timerId);
    };
  }, [excludeWords]);
  
  // Effect to re-render the image when settings change
  useEffect(() => {
    if (!generatedText) return;

    const renderImage = async () => {
      setIsRendering(true);
      try {
        const res = await fetch('/render-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: generatedText,
            exclude_words: debouncedExcludeWords,
            shape,
            color_palette: colorPalette,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to render image');
        }
        const data = await res.json();
        setImageData(data.image);
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setIsRendering(false);
      }
    };

    renderImage();
  }, [generatedText, debouncedExcludeWords, shape, colorPalette]);

  const handleDownload = () => {
    if (!imageData) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = 'ai-word-cloud.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to set API key');
      }
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
    e.preventDefault();
    setLoading(true);
    setImageData(null);
    try {
      let densityInstruction = '';
      if (density === 'concise') {
        densityInstruction = '0-15 words';
      } else if (density === 'verbose') {
        densityInstruction = '40-75 words';
      } else {
        densityInstruction = '15-40 words';
      }

      const prompt = `Your primary task is to extract ${instructions} from the following text. You must return a comma-separated list containing approximately ${densityInstruction}. It is very important that you generate a list within this range. For multi-word concepts, join them with a hyphen. The final output should only be the comma-separated list and nothing else.\n\nText:\n${text}`;
      const res = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, density }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Request failed');
      }
      const data = await res.json()
      setGeneratedText(data.text); // Cache the new text
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
        <form onSubmit={handleApiKeySubmit} className="api-key-form">
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
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Generating text from AI... <br/> This may take a moment.</p>
        </div>
      )}
      <h1>AI Word Cloud</h1>

      {/* --- Section 1: Generate Content --- */}
      <form onSubmit={handleSubmit} className="generate-form">
        <textarea
          rows="6"
          placeholder="Enter text to analyze (e.g., a chapter from a book, an essay, etc.)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          type="text"
          placeholder="Extraction instructions (e.g., 'all nouns', 'adjectives describing the protagonist')"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <select value={density} onChange={(e) => setDensity(e.target.value)}>
          <option value="concise">Concise (0-15 words)</option>
          <option value="default">Default (15-40 words)</option>
          <option value="verbose">Verbose (40-75 words)</option>
        </select>
        <button type="submit" disabled={loading || isRendering}>
          {loading ? 'Generating Text...' : 'Generate New Text'}
        </button>
      </form>

      {/* --- Section 2: Customize Appearance --- */}
      {generatedText && (
        <div className="customize-section">
          <h2>Customize Appearance</h2>
          <p className="subtitle">Changes here are instant and free.</p>
          <div className="controls">
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
            <select value={colorPalette} onChange={(e) => setColorPalette(e.target.value)}>
              <option value="viridis">Viridis</option>
              <option value="ocean">Ocean</option>
              <option value="autumn">Sunset</option>
              <option value="gray">Monochrome</option>
            </select>
          </div>
        </div>
      )}

      {isRendering && <div className="spinner"></div>}
      {imageData && !isRendering && (
        <div className="result-container">
          <img
            src={`data:image/png;base64,${imageData}`}
            alt="Word Cloud"
            className="result-image"
          />
          <button onClick={handleDownload} className="download-button">
            Download Image
          </button>
        </div>
      )}
    </div>
  )
}

export default App
