# AI Word Cloud

A simple, powerful web application for generating beautiful, customized word clouds from any text using Google's Gemini API.

![AI Word Cloud Screenshot](./images/Screenshot.png)

## Features

-   **AI-Powered Text Analysis:** Uses Google's Gemini to extract keywords based on your instructions (e.g., "all nouns," "adjectives describing the protagonist").
-   **Instant Customization:** After generating the text, you can instantly customize the appearance of the word cloud without new API calls.
-   **Customizable Appearance:**
    -   **Shapes:** Render as a classic rectangle or a modern sphere.
    -   **Color Palettes:** Choose from multiple themes like Ocean, Sunset, and Monochrome.
    -   **Word Exclusion:** Easily filter out common or unwanted words.
-   **Downloadable Images:** Save your final creation as a high-quality PNG.
-   **Single Server:** Both the React frontend and FastAPI backend are run from a single process for simple setup.

## How to Run

### 1. Install Frontend Dependencies
From the project root, navigate to the `frontend` directory to install dependencies and build the production files.
```bash
cd frontend
npm install
npm run build
```

### 2. Install uv (Python Package Manager)
**uv** is a fast, modern Python package manager that we use instead of pip for much better performance.

**Install uv:**
-   On **macOS / Linux**:
    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```
-   On **Windows**:
    ```powershell
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```
-   **Alternative (via pip):**
    ```bash
    pip install uv
    ```

### 3. Set Up Backend Environment
Navigate back to the project root.

**Install dependencies using uv:**
```bash
uv sync
```

> **⚡ Performance Note:** uv is typically 10-100x faster than pip for dependency resolution and installation, completing in under 1 second thanks to its Rust-based resolver and parallel downloads.

**Alternative: Manual setup** (if you want to understand the process):
```bash
# uv automatically creates and manages the virtual environment
uv venv  # Creates .venv automatically
uv sync  # Installs dependencies from pyproject.toml
```

<details>
<summary>🔄 <strong>Migrating from pip?</strong> Click here for migration guide</summary>

**We now use `pyproject.toml` instead of `requirements.txt` for modern Python packaging:**

- ✅ **Faster dependency resolution**
- ✅ **Lockfile support** (`uv.lock`) for reproducible builds  
- ✅ **Automatic virtual environment management**
- ✅ **Modern Python packaging standards**

**If you were previously using pip:**

1. **Remove old virtual environment** (optional):
   ```bash
   rm -rf backend/.venv  # Remove old venv if it exists
   ```

2. **Use uv sync for instant setup:**
   ```bash
   uv sync  # Creates .venv and installs all dependencies
   ```

**Legacy fallback** (still supported):
```bash
# Create manual venv and use pip (slower)
cd backend
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
uv pip install -r ../requirements.txt
```
</details>

### 4. Start the Server
From the project root, start the FastAPI server using uv:
```bash
uv run uvicorn backend.main:app --reload
```

**Alternative:** Traditional method (slower setup):
```bash
cd backend
source .venv/bin/activate  # Activate venv manually
uvicorn main:app --reload
```

### 5. Use the App
-   Navigate to `http://127.0.0.1:8000` in your browser.
-   Enter your Google AI Studio (Gemini) API key in the designated input field. The key is sent with each request and is not stored on the server.
-   Enter your source text and instructions, and click "Generate New Text."
-   Use the customization panel to adjust the appearance instantly.
-   Download your finished word cloud!
