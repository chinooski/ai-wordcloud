# AI Word Cloud

This project provides a simple FastAPI backend and React frontend for generating word cloud images using text from Google's Gemini API. The app is served from a single FastAPI server for easier development and deployment.

## Running the App (Single Server Setup)

### 1. Build the Frontend

Navigate to the `frontend` directory and build the production-ready frontend:

```bash
cd frontend
npm install  # if you haven't already
npm run build
```

This will create a `dist` directory containing the static files.

### 2. Set Up the Python Backend Environment

Navigate to the `backend` directory and create a virtual environment:

```bash
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
```
- On Windows, use: `./.venv/Scripts/activate`

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 3. Start the Backend (Serves Both Frontend & API)

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

- Visit `http://127.0.0.1:8000` in your browser to see the app.
- All API requests and static frontend files are served from the same server.

### Notes
- You no longer need to configure CORS for local development, since both frontend and backend are served from the same origin.
- If you make changes to the frontend, re-run `npm run build` to update the static files.

---

## (Legacy) Enabling CORS for Separate Frontend/Backend

<details>
<summary>Show CORS Setup</summary>

If you ever need to run the frontend and backend separately (e.g., for development), enable CORS in your FastAPI backend.

</details>
