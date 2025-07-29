# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a full-stack AI-powered word cloud generator consisting of:

- **Frontend**: React application built with Vite, located in `frontend/`
- **Backend**: FastAPI server in `backend/main.py` that serves both API endpoints and static files
- **Single-server deployment**: The FastAPI backend serves the built React frontend from `frontend/dist/`

### Key Components

**Backend (`backend/main.py`)**:
- `/generate` endpoint: Uses Google Gemini API to extract keywords from text based on user instructions
- `/render-image` endpoint: Generates word cloud images using the `wordcloud` library with customizable shapes, colors, and word exclusions
- Static file serving: Mounts the built React app at root path

**Frontend (`frontend/src/App.jsx`)**:
- Single-page React application with two main sections:
  1. Text generation form (requires Gemini API key)
  2. Real-time appearance customization (shape, colors, word exclusions)
- Uses debounced re-rendering for instant visual feedback on customization changes

## Development Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development
```bash
uv sync                                    # Install dependencies (auto-creates .venv)
uv run uvicorn backend.main:app --reload  # Start development server
```

**Note:** We use native `uv` commands with `pyproject.toml` for modern Python development. Install uv first: `curl -LsSf https://astral.sh/uv/install.sh | sh`

**Adding new dependencies:**
```bash
uv add package-name        # Add to pyproject.toml and install
uv add --dev pytest        # Add development dependency
uv remove package-name     # Remove dependency
```

### Production Deployment
1. Build frontend: `cd frontend && npm run build`
2. Install dependencies: `uv sync --frozen`  # Uses uv.lock for exact reproducible install
3. Start backend: `uv run uvicorn backend.main:app`
4. Access at `http://127.0.0.1:8000`

## Key Dependencies

- **Backend**: FastAPI, uvicorn, wordcloud, google-generativeai, Pillow, numpy
- **Package Management**: Modern `pyproject.toml` + `uv.lock` for reproducible builds
- **Frontend**: React 19, Vite, ESLint

## API Integration

The app requires a Google AI Studio (Gemini) API key provided by users at runtime. The key is passed via `X-Gemini-API-Key` header and is not stored server-side.

## Troubleshooting

### Common uv Issues

**Issue: `uv command not found`**
```bash
# Solution: Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
# Restart terminal or source shell config
```

**Issue: `No solution found when resolving dependencies`**
```bash
# Solution: Clear cache and retry
uv cache clean
uv sync
```

**Issue: `Virtual environment activation issues`**
```bash
# Solution: Use uv run instead of manual activation
uv run python backend/main.py
# Or recreate virtual environment
rm -rf .venv && uv sync
```

**Issue: `Module not found errors`**
```bash
# Solution: Ensure you're using uv run for script execution
uv run uvicorn backend.main:app --reload
# Or check if dependencies are installed
uv sync --frozen
```

**Issue: `Permission denied` on Windows**
```powershell
# Solution: Run PowerShell as Administrator or use alternative install
pip install uv
```

### Development Dependencies

Install development tools:
```bash
uv sync --group dev  # Install dev dependencies
uv run black .       # Format code
uv run ruff check .  # Lint code
uv run pytest       # Run tests
```