from fastapi import FastAPI
from pydantic import BaseModel
import openai
from wordcloud import WordCloud
import imageio.v2 as imageio
from io import BytesIO
import base64

app = FastAPI()

class Prompt(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(prompt: Prompt):
    """Generate a word cloud image from an OpenAI completion."""
    # Call OpenAI API to expand the prompt
    completion = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt.prompt,
        max_tokens=100,
    )
    text = completion.choices[0].text

    # Build the word cloud from the generated text
    wc = WordCloud(width=800, height=400).generate(text)
    img_array = wc.to_array()

    # Encode image to base64 PNG
    buf = BytesIO()
    imageio.imwrite(buf, img_array, format="png")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"image": encoded}
