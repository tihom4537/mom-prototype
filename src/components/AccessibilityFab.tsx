import { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityPanel from './AccessibilityPanel';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export default function AccessibilityFab() {
  const { panelOpen, openPanel, closePanel } = useAccessibility();
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open Accessibility Options"
        aria-expanded={panelOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={openPanel}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9997,
          width: hovered ? 210 : 52,
          height: 52,
          borderRadius: 26,
          background: '#6a3e31',
          border: 'none',
          cursor: 'pointer',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
          transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Icon — always centered in the 52×52 circle */}
        <span
          className="material-icons-outlined"
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 24,
            color: '#fff',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          accessibility_new
        </span>
        {/* Label — slides in from left, only visible when expanded */}
        <span
          style={{
            ...NS,
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.1px',
            whiteSpace: 'nowrap',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 180ms ease',
            pointerEvents: 'none',
          }}
        >
          Accessibility Options
        </span>
      </button>

      {panelOpen && <AccessibilityPanel onClose={closePanel} />}
    </>
  );
}
