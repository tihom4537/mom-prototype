/// <reference types="vite/client" />
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const STT_API      = `${BASE}/speech-to-text`;
export const FEEDBACK_API = `${BASE}/feedback`;
export const TRANSLATE_API = `${BASE}/translate`;
