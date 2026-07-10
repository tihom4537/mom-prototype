"""
OCR (Optical Character Recognition) via Google Gemini API.

Extracts text from images (JPG, PNG) and detects language (English or Kannada).
Uses Gemini 2.5 Flash model for fast, accurate text extraction.
"""

import base64
import logging
import os

import google.generativeai as genai

logger = logging.getLogger(__name__)


def detect_language(text: str) -> str:
    """Detect if text is Kannada or English based on Unicode ranges."""
    # Kannada Unicode block: U+0C80 to U+0CFF
    if any(0x0C80 <= ord(char) <= 0x0CFF for char in text):
        return "kn"
    return "en"


async def process_image_ocr(image_base64: str, image_format: str) -> dict:
    """
    Extract text from an image using Google Gemini 2.5 Flash API.

    Args:
        image_base64: Base64-encoded image bytes.
        image_format: Image MIME type (e.g., "image/jpeg", "image/png").

    Returns:
        Dictionary with extracted_text, detected_language, confidence, and optional error.
    """
    try:
        # Validate input
        if not image_base64:
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": "No image data provided.",
            }

        # Decode base64
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as e:
            logger.error(f"Failed to decode base64 image: {e}")
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": "Invalid image format.",
            }

        # Validate file size (max 5MB)
        if len(image_bytes) > 5 * 1024 * 1024:
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": "Image too large. Maximum size is 5MB.",
            }

        # Get API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY is not set")
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": "Server configuration error: OCR service not available.",
            }

        # Configure Gemini API
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Create image data for Gemini
        image_data = {
            "mime_type": image_format,
            "data": image_base64,
        }

        # Call Gemini with vision
        try:
            response = model.generate_content([
                "Extract all text from this image. Return ONLY the extracted text, nothing else. If no text is found, return 'NO_TEXT'.",
                image_data,
            ])

            extracted_text = response.text.strip()

            # Check if no text was found
            if extracted_text == "NO_TEXT" or not extracted_text:
                extracted_text = ""

            logger.info(
                f"OCR processed image via Gemini 2.5 Flash: {len(extracted_text)} chars, "
                f"language={detect_language(extracted_text)}"
            )

            return {
                "extracted_text": extracted_text,
                "detected_language": detect_language(extracted_text),
                "confidence": 0.9 if extracted_text else 0.0,
                "error": None,
            }

        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": f"OCR processing failed: {str(e)}",
            }

    except Exception as e:
        logger.exception(f"Unexpected error in OCR processing: {e}")
        return {
            "extracted_text": "",
            "detected_language": "en",
            "confidence": 0,
            "error": f"Unexpected error: {str(e)}",
        }
