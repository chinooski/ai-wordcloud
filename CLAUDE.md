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
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate
pip install -r ../requirements.txt
uvicorn main:app --reload  # Start development server
```

### Production Deployment
1. Build frontend: `cd frontend && npm run build`
2. Start backend: `cd backend && uvicorn main:app`
3. Access at `http://127.0.0.1:8000`

## Key Dependencies

- **Backend**: FastAPI, uvicorn, wordcloud, google-generativeai, Pillow, numpy
- **Frontend**: React 19, Vite, ESLint

## API Integration

The app requires a Google AI Studio (Gemini) API key provided by users at runtime. The key is passed via `X-Gemini-API-Key` header and is not stored server-side.