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
  const [imageData, setImageData] = useState(null)
  const [generatedText, setGeneratedText] = useState(''); // Cache for the API response
  const [loading, setLoading] = useState(false)
  const [isRendering, setIsRendering] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await fetch('/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const data = await res.json();
      setText(data.text);
      setUploadedFile({ name: data.filename, size: data.file_size });
      alert(`File uploaded successfully! Extracted ${data.text.length} characters from ${data.filename}`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!apiKey) {
      alert('Please enter your Gemini API key.');
      return;
    }

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
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey,
        },
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
      <div className="api-key-section">
        <input
          type="password"
          placeholder="Enter your Gemini API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="api-key-input"
        />
      </div>
      <form onSubmit={handleSubmit} className="generate-form">
        <div 
          className={`file-upload-zone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            id="file-input"
            accept=".txt,.csv,.tsv,.md,.log"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="file-upload-label">
            📁 Drop a file here or click to browse
            <div className="file-types">Supports: .txt, .csv, .tsv, .md, .log (max 10MB)</div>
          </label>
        </div>
        
        {uploadedFile && (
          <div className="uploaded-file-info">
            ✅ Uploaded: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
          </div>
        )}

        <textarea
          rows="6"
          placeholder="Enter text to analyze (e.g., a chapter from a book, an essay, etc.) or upload a file above"
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
