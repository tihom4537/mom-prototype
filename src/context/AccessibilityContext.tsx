import { createContext, useContext, useEffect, useRef, useState } from 'react';

type FontStep = 0 | 1 | 2;
const FONT_SCALES: Record<FontStep, number> = { 0: 1, 1: 1.125, 2: 1.25 };

// Line height: base computed * 1.2, then +1px per step, 4 steps (UX4G)
const LINE_HEIGHT_STEPS = [0, 1, 2, 3, 4];
// Text spacing: letter 0.12em/step, word 0.16em/step, 3 steps (UX4G)
const TEXT_SPACING_STEPS = [0, 1, 2, 3];

const SK = {
  font: 'a11y-font-step',
  contrast: 'a11y-high-contrast',
  screenReader: 'a11y-screen-reader',
  lineHeight: 'a11y-line-height',
  textSpacing: 'a11y-text-spacing',
  highlightLinks: 'a11y-highlight-links',
  dyslexia: 'a11y-dyslexia',
  adhd: 'a11y-adhd',
  hideImages: 'a11y-hide-images',
  invertColors: 'a11y-invert-colors',
  darkMode: 'a11y-dark-mode',
};

function readBool(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(key) === 'true';
}
function readInt(key: string, fallback = 0): number {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  return raw !== null ? parseInt(raw, 10) : fallback;
}
function readFontStep(): FontStep {
  const n = readInt(SK.font, 0);
  return (n === 1 || n === 2 ? n : 0) as FontStep;
}

interface AccessibilityContextValue {
  // Existing
  fontStep: FontStep;
  highContrast: boolean;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  toggleContrast: () => void;
  skipToContent: () => void;
  // Panel open state
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  // Screen reader
  screenReaderMode: boolean;
  toggleScreenReader: () => void;
  speak: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  // Line height (0–4 steps)
  lineHeightStep: number;
  increaseLineHeight: () => void;
  decreaseLineHeight: () => void;
  // Text spacing (0–3 steps)
  textSpacingStep: number;
  increaseTextSpacing: () => void;
  decreaseTextSpacing: () => void;
  // Toggles
  highlightLinks: boolean;
  toggleHighlightLinks: () => void;
  dyslexiaMode: boolean;
  toggleDyslexia: () => void;
  adhdMode: boolean;
  toggleAdhd: () => void;
  hideImages: boolean;
  toggleHideImages: () => void;
  invertColors: boolean;
  toggleInvertColors: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  // Reset all
  resetAll: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontStep, setFontStep] = useState<FontStep>(readFontStep);
  const [highContrast, setHighContrast] = useState(() => readBool(SK.contrast));
  const [panelOpen, setPanelOpen] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(() => readBool(SK.screenReader));
  const [lineHeightStep, setLineHeightStep] = useState(() => readInt(SK.lineHeight, 0));
  const [textSpacingStep, setTextSpacingStep] = useState(() => readInt(SK.textSpacing, 0));
  const [highlightLinks, setHighlightLinks] = useState(() => readBool(SK.highlightLinks));
  const [dyslexiaMode, setDyslexiaMode] = useState(() => readBool(SK.dyslexia));
  const [adhdMode, setAdhdMode] = useState(() => readBool(SK.adhd));
  const [hideImages, setHideImages] = useState(() => readBool(SK.hideImages));
  const [invertColors, setInvertColors] = useState(() => readBool(SK.invertColors));
  const [darkMode, setDarkMode] = useState(() => readBool(SK.darkMode));

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const adhdObserverRef = useRef<MutationObserver | null>(null);

  // ── Font size ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const scale = FONT_SCALES[fontStep];
    const style = document.documentElement.style;
    if (CSS.supports('zoom', '1')) {
      style.setProperty('zoom', String(scale));
    } else {
      style.setProperty('transform', scale === 1 ? '' : `scale(${scale})`);
      style.setProperty('transform-origin', 'top left');
      style.setProperty('width', scale === 1 ? '' : `${100 / scale}%`);
    }
    window.localStorage.setItem(SK.font, String(fontStep));
  }, [fontStep]);

  // ── High contrast ──────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('a11y-high-contrast', highContrast);
    window.localStorage.setItem(SK.contrast, String(highContrast));
  }, [highContrast]);

  // ── Line height (UX4G: base * 1.2 + step px applied to body) ─────────────
  useEffect(() => {
    if (lineHeightStep === 0) {
      document.body.style.removeProperty('line-height');
    } else {
      const base = parseFloat(getComputedStyle(document.body).fontSize) * 1.2;
      document.body.style.lineHeight = `${base + lineHeightStep}px`;
    }
    window.localStorage.setItem(SK.lineHeight, String(lineHeightStep));
  }, [lineHeightStep]);

  // ── Text spacing (UX4G: letter 0.12em/step, word 0.16em/step) ────────────
  useEffect(() => {
    if (textSpacingStep === 0) {
      document.body.style.removeProperty('letter-spacing');
      document.body.style.removeProperty('word-spacing');
    } else {
      document.body.style.letterSpacing = `${textSpacingStep * 0.12}em`;
      document.body.style.wordSpacing = `${textSpacingStep * 0.16}em`;
    }
    window.localStorage.setItem(SK.textSpacing, String(textSpacingStep));
  }, [textSpacingStep]);

  // ── Class-based toggles ────────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle('highlight-links', highlightLinks);
    window.localStorage.setItem(SK.highlightLinks, String(highlightLinks));
  }, [highlightLinks]);

  useEffect(() => {
    document.body.classList.toggle('dyslexia-mode', dyslexiaMode);
    window.localStorage.setItem(SK.dyslexia, String(dyslexiaMode));
  }, [dyslexiaMode]);

  useEffect(() => {
    document.body.classList.toggle('adhd-friendly', adhdMode);
    window.localStorage.setItem(SK.adhd, String(adhdMode));

    if (adhdMode) {
      // Initial pass
      adhdBoldSubtree(document.body);

      // MutationObserver re-applies bold after React re-renders
      const observer = new MutationObserver(mutations => {
        let processing = false;
        if (processing) return;
        processing = true;
        requestAnimationFrame(() => {
          for (const m of mutations) {
            for (const node of Array.from(m.addedNodes)) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                adhdBoldSubtree(node as Element);
              }
            }
          }
          processing = false;
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
      adhdObserverRef.current = observer;
    } else {
      adhdObserverRef.current?.disconnect();
      adhdObserverRef.current = null;
      removeAdhdBold();
    }

    return () => {
      adhdObserverRef.current?.disconnect();
      adhdObserverRef.current = null;
    };
  }, [adhdMode]);

  useEffect(() => {
    document.body.classList.toggle('hide-images', hideImages);
    window.localStorage.setItem(SK.hideImages, String(hideImages));
  }, [hideImages]);

  useEffect(() => {
    document.documentElement.classList.toggle('invert-colors', invertColors);
    window.localStorage.setItem(SK.invertColors, String(invertColors));
  }, [invertColors]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    window.localStorage.setItem(SK.darkMode, String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    window.localStorage.setItem(SK.screenReader, String(screenReaderMode));
    // sync body class globally so screens don't need to do it themselves
    document.body.classList.toggle('screen-reader-active', screenReaderMode);
  }, [screenReaderMode]);

  // ── ADHD Bionic Reading: bold first half of each word ────────────────────
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE', 'SVG']);

  function adhdBoldSubtree(root: Element | Node) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // Skip already-bolded nodes, icon fonts, skip-marked zones, form inputs, code blocks
        if (
          parent.classList.contains('a11y-adhd-bold') ||
          parent.classList.contains('material-icons') ||
          parent.classList.contains('material-icons-outlined') ||
          parent.classList.contains('material-icons-round') ||
          parent.classList.contains('material-icons-sharp') ||
          parent.closest('.a11y-adhd-skip') ||
          parent.closest('[data-adhd-skip]') ||
          SKIP_TAGS.has(parent.tagName) ||
          parent.isContentEditable
        ) return NodeFilter.FILTER_REJECT;
        // Skip pure-whitespace nodes
        if (/^\s*$/.test(node.textContent ?? '')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) nodes.push(node as Text);

    for (const n of nodes) {
      const parent = n.parentElement;
      if (!parent) continue;
      const words = n.textContent?.split(/(\s+)/) ?? [];
      const frag = document.createDocumentFragment();
      for (const word of words) {
        if (/^\s+$/.test(word) || word === '') {
          frag.appendChild(document.createTextNode(word));
        } else {
          const mid = Math.ceil(word.length / 2);
          const b = document.createElement('b');
          b.className = 'a11y-adhd-bold';
          b.textContent = word.slice(0, mid);
          frag.appendChild(b);
          frag.appendChild(document.createTextNode(word.slice(mid)));
        }
      }
      parent.replaceChild(frag, n);
    }
  }

  function removeAdhdBold() {
    document.querySelectorAll('.a11y-adhd-bold').forEach(el => {
      const parent = el.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
      parent.normalize();
    });
  }

  // ── Speech synthesis ───────────────────────────────────────────────────────
  function pickBestVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Priority 1: any voice whose name contains "Enhanced" or "Natural" (macOS premium)
    const premium = voices.find(v =>
      /enhanced|natural|premium/i.test(v.name) && /en[-_]/i.test(v.lang)
    );
    if (premium) return premium;

    // Priority 2: en-IN
    const enIN = voices.find(v => v.lang === 'en-IN');
    if (enIN) return enIN;

    // Priority 3: en-GB (generally clearer than en-US default)
    const enGB = voices.find(v => v.lang === 'en-GB');
    if (enGB) return enGB;

    // Priority 4: en-AU
    const enAU = voices.find(v => v.lang === 'en-AU');
    if (enAU) return enAU;

    // Fallback: any English
    return voices.find(v => /^en/i.test(v.lang)) ?? null;
  }

  function speak(text: string, onEnd?: () => void) {
    if (!screenReaderMode) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88;
    u.pitch = 1.0;
    if (onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }

    // Voices may not be loaded yet — wait for them if needed
    const trySpeak = () => {
      const voice = pickBestVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = 'en-IN';
      }
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    }
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  function skipToContent() {
    const target = document.getElementById('main-content');
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function resetAll() {
    setFontStep(0);
    setHighContrast(false);
    setScreenReaderMode(false);
    setLineHeightStep(0);
    setTextSpacingStep(0);
    setHighlightLinks(false);
    setDyslexiaMode(false);
    setAdhdMode(false);
    setHideImages(false);
    setInvertColors(false);
    setDarkMode(false);
    stopSpeaking();
  }

  return (
    <AccessibilityContext.Provider value={{
      fontStep,
      highContrast,
      increaseFont: () => setFontStep(s => (s < 2 ? (s + 1) as FontStep : s)),
      decreaseFont: () => setFontStep(s => (s > 0 ? (s - 1) as FontStep : s)),
      resetFont: () => setFontStep(0),
      toggleContrast: () => setHighContrast(v => !v),
      skipToContent,
      panelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
      screenReaderMode,
      toggleScreenReader: () => setScreenReaderMode(v => !v),
      speak,
      stopSpeaking,
      lineHeightStep,
      increaseLineHeight: () => setLineHeightStep(s => Math.min(s + 1, LINE_HEIGHT_STEPS[LINE_HEIGHT_STEPS.length - 1])),
      decreaseLineHeight: () => setLineHeightStep(s => Math.max(s - 1, 0)),
      textSpacingStep,
      increaseTextSpacing: () => setTextSpacingStep(s => Math.min(s + 1, TEXT_SPACING_STEPS[TEXT_SPACING_STEPS.length - 1])),
      decreaseTextSpacing: () => setTextSpacingStep(s => Math.max(s - 1, 0)),
      highlightLinks,
      toggleHighlightLinks: () => setHighlightLinks(v => !v),
      dyslexiaMode,
      toggleDyslexia: () => setDyslexiaMode(v => !v),
      adhdMode,
      toggleAdhd: () => setAdhdMode(v => !v),
      hideImages,
      toggleHideImages: () => setHideImages(v => !v),
      invertColors,
      toggleInvertColors: () => setInvertColors(v => !v),
      darkMode,
      toggleDarkMode: () => setDarkMode(v => !v),
      resetAll,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
