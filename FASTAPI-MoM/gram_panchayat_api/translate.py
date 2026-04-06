import logging

from .llm_client import generate_text

logger = logging.getLogger(__name__)

_LANG_NAME = {"en": "English", "kn": "Kannada"}


async def translate_text(text: str, from_locale: str, to_locale: str) -> str:
    """
    Translate meeting minutes text between English and Kannada using the LLM.
    Preserves proper nouns, scheme names, numbers, and official document tone.
    """
    if from_locale == to_locale:
        return text

    target_lang = _LANG_NAME.get(to_locale, to_locale)

    prompt = (
        f"You are translating official Gram Panchayat meeting minutes.\n"
        f"Translate the following text to {target_lang}.\n"
        f"Rules:\n"
        f"- Preserve all proper nouns, personal names, place names, scheme names, and numbers exactly as they are.\n"
        f"- Use formal language appropriate for official government records.\n"
        f"- Do NOT add explanations, notes, or any text other than the translation.\n"
        f"- Return ONLY the translated text.\n\n"
        f"Text to translate:\n{text}"
    )

    translation = await generate_text(prompt)
    logger.info("Translated text from %s to %s (%d chars)", from_locale, to_locale, len(text))
    return translation.strip()
