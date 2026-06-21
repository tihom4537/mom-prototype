import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { getPageSummary } from '../data/pageSummaries';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

// All icon names verified against Material Icons Outlined (the font loaded in this project)
// graphic_eq ✓, text_fields ✓, format_line_spacing ✓, format_size ✓,
// link ✓, font_download ✓, psychology ✓, hide_image ✓, invert_colors ✓, contrast ✓

function MIcon({ name, size = 28, color = '#212121' }: { name: string; size?: number; color?: string }) {
  return (
    <span
      className="material-icons-outlined select-none"
      style={{ fontSize: size, color, lineHeight: 1, display: 'block' }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

interface TileProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

function Tile({ icon, label, active, onClick }: TileProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? 'rgba(106,62,49,0.12)' : hovered ? 'rgba(106,62,49,0.05)' : '#fff',
        border: active ? '2px solid #6a3e31' : '1.5px solid #e0e0e0',
        borderRadius: 12,
        width: 120,
        height: 108,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'background 150ms, border-color 150ms',
        padding: 0,
      }}
    >
      <MIcon name={icon} size={28} color={active ? '#6a3e31' : '#212121'} />
      <span
        style={{
          ...NS,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '16px',
          letterSpacing: '0.1px',
          color: active ? '#6a3e31' : '#212121',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  );
}

interface StepTileProps {
  icon: string;
  label: string;
  step: number;
  maxStep: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

function StepTile({ icon, label, step, maxStep, onIncrease, onDecrease }: StepTileProps) {
  const active = step > 0;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? 'rgba(106,62,49,0.12)' : hovered ? 'rgba(106,62,49,0.05)' : '#fff',
        border: active ? '2px solid #6a3e31' : '1.5px solid #e0e0e0',
        borderRadius: 12,
        width: 120,
        height: 108,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'background 150ms, border-color 150ms',
      }}
    >
      <MIcon name={icon} size={26} color={active ? '#6a3e31' : '#212121'} />
      <span style={{ ...NS, fontSize: 12, fontWeight: 500, color: active ? '#6a3e31' : '#212121', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={step === 0}
          onClick={e => { e.stopPropagation(); onDecrease(); }}
          style={{
            width: 22, height: 22, borderRadius: 4,
            border: '1px solid #c6c6c6',
            background: step === 0 ? '#f5f5f5' : '#fff',
            cursor: step === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: step === 0 ? 0.4 : 1,
            padding: 0,
          }}
        >
          <span className="material-icons-outlined" style={{ fontSize: 14, lineHeight: 1, color: '#212121' }}>remove</span>
        </button>
        <span style={{ ...NS, fontSize: 11, fontWeight: 500, color: '#212121', minWidth: 24, textAlign: 'center' }}>
          {step}/{maxStep}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={step === maxStep}
          onClick={e => { e.stopPropagation(); onIncrease(); }}
          style={{
            width: 22, height: 22, borderRadius: 4,
            border: '1px solid #c6c6c6',
            background: step === maxStep ? '#f5f5f5' : '#fff',
            cursor: step === maxStep ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: step === maxStep ? 0.4 : 1,
            padding: 0,
          }}
        >
          <span className="material-icons-outlined" style={{ fontSize: 14, lineHeight: 1, color: '#212121' }}>add</span>
        </button>
      </div>
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function AccessibilityPanel({ onClose }: Props) {
  const {
    fontStep, increaseFont, decreaseFont,
    screenReaderMode, toggleScreenReader,
    speak, stopSpeaking,
    lineHeightStep, increaseLineHeight, decreaseLineHeight,
    textSpacingStep, increaseTextSpacing, decreaseTextSpacing,
    highlightLinks, toggleHighlightLinks,
    dyslexiaMode, toggleDyslexia,
    adhdMode, toggleAdhd,
    hideImages, toggleHideImages,
    invertColors, toggleInvertColors,
    darkMode, toggleDarkMode,
    resetAll,
  } = useAccessibility();

  const { pathname } = useLocation();
  const [reading, setReading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(0,0,0,0.28)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Accessibility Options"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 9999,
          width: 420,
          background: '#f3f3f3',
          borderRadius: '16px 0 0 16px',
          boxShadow: '0px 24px 48px -12px rgba(33,33,33,0.24)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Brown header */}
        <div
          style={{
            background: '#6a3e31',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ ...NS, color: '#fff', fontSize: 14, fontWeight: 500, lineHeight: '20px', letterSpacing: '0.1px' }}>
            Accessibility Options
          </span>
          <button
            type="button"
            aria-label="Close accessibility panel"
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 4,
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 20, color: '#fff', lineHeight: 1 }}>close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>

          {/* Tile grid — 3 columns × 120px + 2 × 12px gap = 384px fits in 388px content area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 120px)', gap: 12, justifyContent: 'start' }}>

            <Tile
              icon="graphic_eq"
              label="Screen Reader"
              active={screenReaderMode}
              onClick={toggleScreenReader}
            />

            <StepTile
              icon="text_fields"
              label="Bigger Text"
              step={fontStep}
              maxStep={2}
              onIncrease={increaseFont}
              onDecrease={decreaseFont}
            />

            <StepTile
              icon="format_line_spacing"
              label="Line Height"
              step={lineHeightStep}
              maxStep={4}
              onIncrease={increaseLineHeight}
              onDecrease={decreaseLineHeight}
            />

            <StepTile
              icon="format_size"
              label="Text Spacing"
              step={textSpacingStep}
              maxStep={3}
              onIncrease={increaseTextSpacing}
              onDecrease={decreaseTextSpacing}
            />

            <Tile
              icon="link"
              label="Highlight Links"
              active={highlightLinks}
              onClick={toggleHighlightLinks}
            />

            <Tile
              icon="font_download"
              label="Dyslexia Friendly"
              active={dyslexiaMode}
              onClick={toggleDyslexia}
            />

            <Tile
              icon="psychology"
              label="ADHD Friendly"
              active={adhdMode}
              onClick={toggleAdhd}
            />

            <Tile
              icon="hide_image"
              label="Hide Images"
              active={hideImages}
              onClick={toggleHideImages}
            />

            <Tile
              icon="invert_colors"
              label="Invert Color"
              active={invertColors}
              onClick={toggleInvertColors}
            />

            <Tile
              icon="contrast"
              label="Dark Mode"
              active={darkMode}
              onClick={toggleDarkMode}
            />

          </div>

          {/* Read page summary — visible only when Screen Reader is active */}
          {screenReaderMode && (
            <div style={{ marginTop: 20, padding: '16px', background: '#fff', borderRadius: 12, border: '1.5px solid #e0e0e0' }}>
              <p style={{ ...NS, fontSize: 12, color: '#525c66', lineHeight: '18px', marginBottom: 12 }}>
                Listen to a narrative summary of the current page — data highlights explained in plain language, not table cells.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (reading) {
                      stopSpeaking();
                      setReading(false);
                    } else {
                      setReading(true);
                      speak(getPageSummary(pathname), () => setReading(false));
                    }
                  }}
                  style={{
                    ...NS,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: reading ? '#6a3e31' : 'rgba(106,62,49,0.10)',
                    border: reading ? '2px solid #6a3e31' : '1.5px solid rgba(106,62,49,0.30)',
                    borderRadius: 8,
                    color: reading ? '#fff' : '#6a3e31',
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    transition: 'background 150ms, border-color 150ms',
                  }}
                  aria-pressed={reading}
                  aria-label={reading ? 'Stop reading page summary' : 'Read page summary aloud'}
                >
                  <span
                    className="material-icons-outlined"
                    style={{ fontSize: 16, lineHeight: 1, color: reading ? '#fff' : '#6a3e31' }}
                    aria-hidden="true"
                  >
                    {reading ? 'stop_circle' : 'record_voice_over'}
                  </span>
                  {reading ? 'Stop reading' : 'Read page summary'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer — Reset */}
        <div
          style={{
            background: '#fff',
            boxShadow: '0px -1px 4px 0px rgba(0,0,0,0.10)',
            padding: '12px 16px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={resetAll}
            style={{
              background: '#dfc2b9',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px 7px 10px',
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: 16, color: '#4a2a1e', lineHeight: 1 }}>refresh</span>
            <span style={{ ...NS, fontSize: 12, fontWeight: 500, letterSpacing: '0.5px', color: '#4a2a1e' }}>
              Reset
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
