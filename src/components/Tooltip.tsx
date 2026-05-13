import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

export type TooltipDirection = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  text: string;
  direction?: TooltipDirection;
  autoWidth?: boolean;
  children: React.ReactNode;
}

export default function Tooltip({ text, direction = 'top', autoWidth = false, children }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

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

  const BG = '#f3f3f3';

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
    if (direction === 'top')    return { ...base, flexDirection: 'column', alignItems: 'center', left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' };
    if (direction === 'bottom') return { ...base, flexDirection: 'column', alignItems: 'center', left: pos.x, top: pos.y, transform: 'translateX(-50%)' };
    if (direction === 'left')   return { ...base, flexDirection: 'row',    alignItems: 'center', left: pos.x, top: pos.y, transform: 'translate(-100%, -50%)' };
    return                             { ...base, flexDirection: 'row',    alignItems: 'center', left: pos.x, top: pos.y, transform: 'translateY(-50%)' };
  };

  return (
    <div ref={anchorRef} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && createPortal(
        <div style={tooltipStyle()}>
          {direction === 'bottom' && arrow(direction)}
          {direction === 'right'  && arrow(direction)}
          <div
            style={{ ...NS, borderRadius, letterSpacing: '0.4px' }}
            className={`bg-[#f3f3f3] text-[#212121] text-[12px] leading-[20px] px-[8px] py-[4px] pointer-events-none max-w-[160px] text-center${autoWidth ? ' w-auto whitespace-nowrap' : ''}`}
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
