import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePageScale } from './ScaleToFit';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

export type TooltipDirection = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  text: string;
  direction?: TooltipDirection;
  autoWidth?: boolean;
  dark?: boolean;
  children: React.ReactNode;
}

export default function Tooltip({ text, direction = 'top', autoWidth = false, dark = false, children }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const pageScale = usePageScale();

  const show = useCallback(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const GAP = 8;
    let x = 0, y = 0;
    if (direction === 'top')    { x = r.left + r.width / 2; y = r.top - GAP; }
    if (direction === 'bottom') { x = r.left + r.width / 2; y = r.bottom + GAP; }
    if (direction === 'left')   { x = r.left - GAP; y = r.top + r.height / 2; }
    if (direction === 'right')  { x = r.right + GAP; y = r.top + r.height / 2; }
    setPos({ x, y });
  }, [direction]);

  const hide = useCallback(() => setPos(null), []);

  const BG = dark ? '#5e5e5e' : '#f3f3f3';
  const FG = dark ? '#ffffff' : '#212121';

  const arrow = (dir: TooltipDirection) => {
    if (dir === 'top')    return <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${BG}`, alignSelf: 'center' }} />;
    if (dir === 'bottom') return <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `5px solid ${BG}`, alignSelf: 'center' }} />;
    if (dir === 'left')   return <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `5px solid ${BG}`, alignSelf: 'center' }} />;
    return                       <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: `5px solid ${BG}`, alignSelf: 'center' }} />;
  };

  const borderRadius = (direction === 'top' && autoWidth) ? '4px' : '6px';

  const tooltipStyle = (): React.CSSProperties => {
    if (!pos) return { display: 'none' };
    const base: React.CSSProperties = { position: 'fixed', zIndex: 9999, pointerEvents: 'none', display: 'flex' };
    const s = pageScale;
    if (direction === 'top')    return { ...base, flexDirection: 'column', alignItems: 'center', left: pos.x, top: pos.y, transform: `translate(-50%, -100%) scale(${s})`, transformOrigin: 'bottom center' };
    if (direction === 'bottom') return { ...base, flexDirection: 'column', alignItems: 'center', left: pos.x, top: pos.y, transform: `translateX(-50%) scale(${s})`, transformOrigin: 'top center' };
    if (direction === 'left')   return { ...base, flexDirection: 'row',    alignItems: 'center', left: pos.x, top: pos.y, transform: `translate(-100%, -50%) scale(${s})`, transformOrigin: 'right center' };
    return                             { ...base, flexDirection: 'row',    alignItems: 'center', left: pos.x, top: pos.y, transform: `translateY(-50%) scale(${s})`, transformOrigin: 'left center' };
  };

  return (
    <div ref={anchorRef} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && createPortal(
        <div style={tooltipStyle()}>
          {direction === 'bottom' && arrow(direction)}
          {direction === 'right'  && arrow(direction)}
          <div
            style={{ ...NS, borderRadius, letterSpacing: '0.4px', background: BG, color: FG }}
            className={`text-[12px] leading-[20px] px-[8px] py-[4px] pointer-events-none max-w-[200px] text-left${autoWidth ? ' w-auto whitespace-nowrap' : ''}`}
          >
            {text}
          </div>
          {direction === 'top'  && arrow(direction)}
          {direction === 'left' && arrow(direction)}
        </div>,
        document.body
      )}
    </div>
  );
}
