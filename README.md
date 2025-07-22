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

### 1. Set Up the Environment

Clone the repository, navigate into the project directory, and install all dependencies for both the frontend and backend.

```bash
# From the project root
# Install frontend dependencies
cd frontend
npm install
npm run build

# Install backend dependencies
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
# On Windows, use: .\.venv\Scripts\activate
pip install -r ../requirements.txt
```

### 2. Start the Server

From the `backend` directory (with your virtual environment activated), start the FastAPI server:

```bash
uvicorn main:app --reload
```

### 3. Use the App

-   Navigate to `http://127.0.0.1:8000` in your browser.
-   You will be prompted to enter your Google AI Studio API key. This is required once per server session.
-   Enter your source text and instructions, and click "Generate New Text."
-   Use the customization panel to adjust the appearance instantly.
-   Download your finished word cloud!
