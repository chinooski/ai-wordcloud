from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
from wordcloud import WordCloud
import imageio.v2 as imageio
from io import BytesIO
import base64
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
import numpy as np
from PIL import Image

app = FastAPI()

# --- API Key Management ---
# The client will be configured by the /set-key endpoint
genai.configure(api_key="dummy") # Dummy key, will be replaced by user input

class ApiKey(BaseModel):
    api_key: str

@app.post("/set-key")
async def set_api_key(key: ApiKey):
    """Receives and sets the Gemini API key for the server session."""
    try:
        genai.configure(api_key=key.api_key)
        # Test the key to ensure it's valid
        genai.get_model('models/gemini-1.5-flash')
        return {"message": "API key set successfully"}
    except google_exceptions.PermissionDenied:
        raise HTTPException(status_code=401, detail="Invalid Gemini API key.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
# -------------------------

class Prompt(BaseModel):
    prompt: str
    exclude_words: str | None = None
    shape: str | None = "rectangle"
    color_palette: str | None = "viridis"

@app.post("/generate")
async def generate(prompt: Prompt):
    """Generate a word cloud image from a Gemini completion."""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt.prompt)
        text = response.text
        return {"text": text}
        
    except google_exceptions.ResourceExhausted:
        raise HTTPException(status_code=429, detail="You've exceeded your Gemini quota. Please check your plan and billing details.")
    except google_exceptions.PermissionDenied:
        raise HTTPException(status_code=401, detail="Invalid Gemini API key. Please check your key and try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

class RenderRequest(BaseModel):
    text: str
    exclude_words: str | None = None
    shape: str | None = "rectangle"
    color_palette: str | None = "viridis"

@app.post("/render-image")
async def render_image(request: RenderRequest):
    """Generates a word cloud image from provided text and settings."""
    text = request.text
    # --- Exclude Words ---
    if request.exclude_words:
        exclude_list = [word.strip().lower() for word in request.exclude_words.split(',')]
        words = text.lower().split()
        filtered_words = [word for word in words if word not in exclude_list]
        text = " ".join(filtered_words)
        if not text:
            raise HTTPException(status_code=400, detail="All words were excluded, nothing to generate.")
    # ---------------------

    # --- Create Mask ---
    mask = None
    if request.shape == "sphere":
        x, y = np.ogrid[:800, :800]
        mask = (x - 400) ** 2 + (y - 400) ** 2 > 400 ** 2
        mask = 255 * mask.astype(int)
    # -------------------

    # Build the word cloud from the generated text
    wc = WordCloud(
        width=800, 
        height=800 if request.shape == "sphere" else 400, 
        background_color="white", 
        mode="RGB", 
        mask=mask,
        colormap=request.color_palette
    ).generate(text)
    img_array = wc.to_array()

    # Encode image to base64 PNG
    buf = BytesIO()
    imageio.imwrite(buf, img_array, format="png")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"image": encoded}

# Mount the static files directory (after API routes)
app.mount("/", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../frontend/dist"), html=True), name="static")

# Optional: Catch-all route for client-side routing (e.g., React Router)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = os.path.join(os.path.dirname(__file__), "../frontend/dist/index.html")
    return FileResponse(index_path)
