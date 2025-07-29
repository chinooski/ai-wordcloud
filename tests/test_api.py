"""
Basic tests for the FastAPI endpoints.

Run tests with: uv run pytest
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app

client = TestClient(app)


def test_read_root():
    """Test that the root endpoint serves the frontend."""
    response = client.get("/")
    assert response.status_code == 200
    # Should serve the built React app (index.html)
    assert "text/html" in response.headers.get("content-type", "")


def test_generate_endpoint_missing_api_key():
    """Test generate endpoint returns 401 when no API key provided."""
    response = client.post(
        "/generate",
        json={"prompt": "Generate keywords for: test text", "density": "default"},
    )
    assert response.status_code == 401
    assert "Missing X-Gemini-API-Key header" in response.json()["detail"]


def test_generate_endpoint_invalid_request():
    """Test generate endpoint with invalid request body."""
    response = client.post(
        "/generate",
        json={},  # Missing required fields
        headers={"X-Gemini-API-Key": "fake-key"},
    )
    assert response.status_code == 422  # Validation error


def test_render_image_missing_text():
    """Test render-image endpoint with missing text parameter."""
    response = client.post(
        "/render-image", json={"shape": "rectangle", "color_palette": "viridis"}
    )
    assert response.status_code == 422  # Validation error


def test_render_image_basic_functionality():
    """Test render-image endpoint with minimal valid data."""
    response = client.post(
        "/render-image",
        json={
            "text": "test word cloud generation",
            "shape": "rectangle",
            "color_palette": "viridis",
            "exclude_words": None,
        },
    )
    # Should return a base64 encoded image
    assert response.status_code == 200
    response_data = response.json()
    assert "image" in response_data
    assert isinstance(response_data["image"], str)  # base64 string


def test_health_check():
    """Test that the app is running and responsive."""
    # Try to access docs endpoint as a health check
    response = client.get("/docs")
    assert response.status_code == 200


@pytest.mark.parametrize("shape", ["rectangle", "sphere"])
@pytest.mark.parametrize("color_palette", ["viridis", "plasma", "Blues"])
def test_render_image_shape_and_color_combinations(shape, color_palette):
    """Test different shape and color palette combinations."""
    response = client.post(
        "/render-image",
        json={
            "text": "hello world test cloud generation",
            "shape": shape,
            "color_palette": color_palette,
            "exclude_words": None,
        },
    )
    assert response.status_code == 200
    response_data = response.json()
    assert "image" in response_data
    assert isinstance(response_data["image"], str)  # base64 string
