from fastapi import FastAPI, HTTPException, Header, File, UploadFile
from pydantic import BaseModel
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
import re
import csv
from io import StringIO
import chardet

app = FastAPI()

# --- Constants ---
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.txt', '.csv', '.tsv', '.md', '.log'}
ALLOWED_MIME_TYPES = {
    'text/plain', 'text/csv', 'text/tab-separated-values', 
    'text/markdown', 'application/csv', 'text/x-log'
}


# --- Helper Functions ---
def detect_encoding(file_bytes: bytes) -> str:
    """Detect text encoding of uploaded file."""
    detected = chardet.detect(file_bytes)
    return detected.get('encoding', 'utf-8') or 'utf-8'


def extract_text_from_csv(content: str, filename: str) -> str:
    """Extract meaningful text from CSV content."""
    try:
        # Try different delimiters based on file extension
        delimiter = '\t' if filename.lower().endswith('.tsv') else ','
        
        # Parse CSV content
        csv_reader = csv.reader(StringIO(content), delimiter=delimiter)
        
        # Extract all non-empty text values
        text_parts = []
        for row_num, row in enumerate(csv_reader):
            if row_num > 1000:  # Limit rows for performance
                break
            for cell in row:
                cell = cell.strip()
                if cell and not cell.isdigit():  # Skip empty cells and pure numbers
                    text_parts.append(cell)
        
        return ' '.join(text_parts)
    except Exception:
        # Fallback: treat as plain text
        return content


def validate_file_type(filename: str, content_type: str) -> bool:
    """Validate file type by extension and MIME type."""
    if not filename:
        return False
    
    # Check file extension
    file_ext = os.path.splitext(filename.lower())[1]
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    
    # For FastAPI file uploads, content_type might be 'application/octet-stream' or None
    # So we primarily rely on file extension, with MIME type as secondary validation
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        # Allow generic text types and common upload content types
        if not (content_type.startswith('text/') or 
                content_type == 'application/octet-stream' or
                content_type == 'application/csv'):
            return False
    
    return True


# --- Models ---
class Prompt(BaseModel):
    prompt: str
    density: str | None = "default"  # concise, default, verbose
    exclude_words: str | None = None
    shape: str | None = "rectangle"
    color_palette: str | None = "viridis"


@app.post("/generate")
async def generate(prompt: Prompt, x_gemini_api_key: str | None = Header(None)):
    """Generate a word cloud image from a Gemini completion."""
    if not x_gemini_api_key:
        raise HTTPException(status_code=401, detail="Missing X-Gemini-API-Key header.")

    try:
        genai.configure(api_key=x_gemini_api_key)
        # Test the key to ensure it's valid
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt.prompt)
        text = response.text
        return {"text": text}

    except google_exceptions.ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="You've exceeded your Gemini quota. Please check your plan and billing details.",
        )
    except google_exceptions.PermissionDenied:
        raise HTTPException(
            status_code=401,
            detail="Invalid Gemini API key. Please check your key and try again.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


class FileUploadResponse(BaseModel):
    text: str
    filename: str
    file_size: int


@app.post("/upload-file", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a text file and extract its content for word cloud generation."""
    
    # Validate file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB."
        )
    
    # Validate file type
    if not validate_file_type(file.filename or "", file.content_type or ""):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    try:
        # Read file content
        file_bytes = await file.read()
        
        # Double-check file size after reading
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB."
            )
        
        # Detect encoding and decode content
        encoding = detect_encoding(file_bytes)
        try:
            content = file_bytes.decode(encoding)
        except UnicodeDecodeError:
            # Fallback to utf-8 with error handling
            content = file_bytes.decode('utf-8', errors='replace')
        
        # Extract text based on file type
        filename = file.filename or ""
        if filename.lower().endswith(('.csv', '.tsv')):
            extracted_text = extract_text_from_csv(content, filename)
        else:
            # For plain text files, use content as-is
            extracted_text = content.strip()
        
        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail="No readable text content found in the uploaded file."
            )
        
        return FileUploadResponse(
            text=extracted_text,
            filename=filename,
            file_size=len(file_bytes)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )


class RenderRequest(BaseModel):
    text: str
    exclude_words: str | None = None
    shape: str | None = "rectangle"
    color_palette: str | None = "viridis"


@app.post("/render-image")
async def render_image(request: RenderRequest):
    """Generates a word cloud image from provided text and settings."""
    print(f"--- Raw text from AI ---\n{request.text}\n------------------------")
    text = request.text

    # Process the text into a clean list of words, removing punctuation
    words = re.split(r"[,\s]+", text)
    cleaned_words = [re.sub(r"[^\w-]", "", word).lower() for word in words if word]

    # --- Exclude Words ---
    if request.exclude_words:
        exclude_set = {
            word.strip().lower() for word in request.exclude_words.split(",")
        }
        final_words = [word for word in cleaned_words if word not in exclude_set]
    else:
        final_words = cleaned_words

    if not final_words:
        raise HTTPException(
            status_code=400,
            detail="All words were excluded, or the source text was empty.",
        )

    print(f"--- Final words for cloud ---\n{final_words}\n---------------------------")
    text_for_cloud = " ".join(final_words)
    # ---------------------

    # --- Create Mask ---
    mask = None
    if request.shape == "sphere":
        x, y = np.ogrid[:800, :800]
        mask = (x - 400) ** 2 + (y - 400) ** 2 > 400**2
        mask = 255 * mask.astype(int)
    # -------------------

    # Build the word cloud from the generated text
    wc = WordCloud(
        width=800,
        height=800 if request.shape == "sphere" else 400,
        background_color="white",
        mode="RGB",
        mask=mask,
        regexp=r"[\w-]+",  # <-- Add this to handle hyphenated words
        colormap=request.color_palette,
    ).generate(text_for_cloud)
    img_array = wc.to_array()

    # Encode image to base64 PNG
    buf = BytesIO()
    imageio.imwrite(buf, img_array, format="png")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"image": encoded}


# Mount the static files directory (after API routes)
app.mount(
    "/",
    StaticFiles(
        directory=os.path.join(os.path.dirname(__file__), "../frontend/dist"), html=True
    ),
    name="static",
)


# Optional: Catch-all route for client-side routing (e.g., React Router)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = os.path.join(os.path.dirname(__file__), "../frontend/dist/index.html")
    return FileResponse(index_path)
