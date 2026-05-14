"""
OCR (Optical Character Recognition) via Google Cloud Vision API.

Extracts text from images (JPG, PNG) and detects language (English or Kannada).
"""

import base64
import logging
import os
from typing import Optional

from google.cloud import vision
from google.oauth2 import service_account

logger = logging.getLogger(__name__)


def detect_language(text: str) -> str:
    """Detect if text is Kannada or English based on Unicode ranges."""
    # Kannada Unicode block: U+0C80 to U+0CFF
    if any(0x0C80 <= ord(char) <= 0x0CFF for char in text):
        return "kn"
    return "en"


async def process_image_ocr(image_base64: str, image_format: str) -> dict:
    """
    Extract text from an image using Google Cloud Vision API.

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

        # Initialize Google Vision client
        try:
            # Try to use service account credentials if available
            credentials_json = os.getenv("GOOGLE_CLOUD_CREDENTIALS_JSON")
            if credentials_json:
                # Parse JSON credentials from env var
                import json
                creds_dict = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(creds_dict)
                client = vision.ImageAnnotatorClient(credentials=credentials)
            else:
                # Fall back to default credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
                client = vision.ImageAnnotatorClient()
        except Exception as e:
            logger.error(f"Failed to initialize Google Vision client: {e}")
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": "Server configuration error: OCR service not available.",
            }

        # Create image object
        image = vision.Image(content=image_bytes)

        # Call text detection
        try:
            response = client.document_text_detection(image=image)
        except Exception as e:
            logger.error(f"Google Vision API call failed: {e}")
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": f"OCR processing failed: {str(e)}",
            }

        # Extract text from response
        if response.error.message:
            logger.error(f"Google Vision API error: {response.error.message}")
            return {
                "extracted_text": "",
                "detected_language": "en",
                "confidence": 0,
                "error": f"OCR error: {response.error.message}",
            }

        # Get full text from response
        full_text = ""
        if response.full_text_annotation:
            full_text = response.full_text_annotation.text.strip()

        # Calculate confidence (average of all text block confidences)
        confidence = 0.0
        if response.text_annotations:
            confidences = [
                annotation.confidence for annotation in response.text_annotations
                if annotation.confidence > 0
            ]
            if confidences:
                confidence = sum(confidences) / len(confidences)

        # Detect language
        detected_lang = detect_language(full_text)

        logger.info(
            f"OCR processed image: {len(full_text)} chars, "
            f"language={detected_lang}, confidence={confidence:.2f}"
        )

        return {
            "extracted_text": full_text,
            "detected_language": detected_lang,
            "confidence": confidence,
            "error": None,
        }

    except Exception as e:
        logger.exception(f"Unexpected error in OCR processing: {e}")
        return {
            "extracted_text": "",
            "detected_language": "en",
            "confidence": 0,
            "error": f"Unexpected error: {str(e)}",
        }
