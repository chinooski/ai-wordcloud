# ai-wordcloud

This project provides a simple FastAPI backend for generating word cloud images
using text from OpenAI completions.

## Running the API locally

1. Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Export your OpenAI API key so the backend can authenticate with the
   OpenAI service:

```bash
export OPENAI_API_KEY=YOUR_KEY
```

3. Start the application with Uvicorn:

```bash
uvicorn backend.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. You can send a POST request
to `/generate` with a JSON body containing a `prompt` field to receive a
base64-encoded PNG image of the generated word cloud.
