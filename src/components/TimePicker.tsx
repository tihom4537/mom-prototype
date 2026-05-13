import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface TimePickerProps {
  value: string; // "HH:MM" or ''
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  hasError?: boolean;
  errorText?: string;
  className?: string;
  opensUp?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parseTime(str: string): { h: number | null; m: number | null } {
  if (!str) return { h: null, m: null };
  const [h, m] = str.split(':').map(Number);
  return { h: isNaN(h) ? null : h, m: isNaN(m) ? null : m };
}

export default function TimePicker({
  value, onChange, label, required = false,
  placeholder = 'Select Time', hasError = false, errorText, className, opensUp = false,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const initial = parseTime(value);
  const [tempH, setTempH] = useState<number | null>(initial.h);
  const [tempM, setTempM] = useState<number | null>(initial.m);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll selected item into view when dropdown opens (only if value already set)
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const hEl = hourRef.current;
      const mEl = minRef.current;
      if (hEl && tempH !== null) {
        const item = hEl.children[tempH] as HTMLElement | undefined;
        if (item) hEl.scrollTop = item.offsetTop - hEl.clientHeight / 2 + item.clientHeight / 2;
      }
      if (mEl && tempM !== null) {
        const item = mEl.children[tempM] as HTMLElement | undefined;
        if (item) mEl.scrollTop = item.offsetTop - mEl.clientHeight / 2 + item.clientHeight / 2;
      }
    });
  }, [open]);

  function handleOpen() {
    const t = parseTime(value);
    setTempH(t.h); setTempM(t.m);
    setOpen(o => !o);
  }

  function handleNow() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    setTempH(h); setTempM(m);
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    setOpen(false);
  }

  function handleSelectH(i: number) {
    setTempH(i);
    if (tempM !== null) {
      onChange(`${String(i).padStart(2, '0')}:${String(tempM).padStart(2, '0')}`);
      setOpen(false);
    }
  }

  function handleSelectM(i: number) {
    setTempM(i);
    if (tempH !== null) {
      onChange(`${String(tempH).padStart(2, '0')}:${String(i).padStart(2, '0')}`);
      setOpen(false);
    }
  }

  const hDisplay = tempH !== null ? String(tempH).padStart(2, '0') : '--';
  const mDisplay = tempM !== null ? String(tempM).padStart(2, '0') : '--';
  const header = `${hDisplay}:${mDisplay}`;
  const border = hasError ? 'border-[#d32f2f]' : open ? 'border-[#ae6651] shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' : 'border-[#cccccc]';

  return (
    <div className={`flex flex-col gap-1 w-full ${className ?? ''}`} ref={ref}>
      {label && (
        <div className="flex items-center gap-1">
          <p className="font-medium text-sm text-[#212121] leading-5 tracking-[0.1px] whitespace-nowrap" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>{label}</p>
          {required && <p className="font-medium text-sm text-[#b7131a] leading-5" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>*</p>}
        </div>
      )}

      <div className="relative w-full">
        <button
          type="button"
          onClick={handleOpen}
          className={`flex items-center w-full bg-white rounded-lg border ${border} py-[10px] pl-3 pr-3 transition-all duration-150 cursor-pointer`}
        >
          <span className={`flex-1 text-sm text-left ${value ? 'text-[#212121]' : 'text-[#727272]'}`} style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            {value || placeholder}
          </span>
          <Icon name="schedule" size="small" color="#727272" />
        </button>

        {open && (
          <div className={`absolute left-0 bg-white rounded-lg shadow-[0px_8px_8px_rgba(0,0,0,0.15)] z-50 overflow-hidden w-[120px] ${opensUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
            {/* HH:MM header */}
            <div className="flex items-center justify-center border-b border-[#ddd] py-[6px]">
              <p className="text-sm font-medium text-[#212121] tracking-[0.1px]" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
                {header}
              </p>
            </div>

            {/* Scroll columns */}
            <div className="flex h-[196px]">
              {/* Hours */}
              <div ref={hourRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {HOURS.map((h, i) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectH(i)}
                    className={`flex items-center w-full h-[28px] pl-[14px] text-sm font-medium text-[#212121] tracking-[0.1px] cursor-pointer border-none transition-colors
                      ${i === tempH ? 'bg-[#efe0dc]' : 'bg-transparent hover:bg-[#f7f0ee]'}`}
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                  >
                    {h}
                  </button>
                ))}
              </div>

              {/* Minutes — clicking commits both values */}
              <div ref={minRef} className="flex-1 overflow-y-auto border-l border-[#ddd]" style={{ scrollbarWidth: 'none' }}>
                {MINUTES.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectM(i)}
                    className={`flex items-center w-full h-[28px] pl-[14px] text-sm font-medium text-[#212121] tracking-[0.1px] cursor-pointer border-none transition-colors
                      ${i === tempM ? 'bg-[#efe0dc]' : 'bg-transparent hover:bg-[#f7f0ee]'}`}
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Now footer */}
            <div className="flex items-center justify-center border-t border-[#ddd] px-2 py-[6px]">
              <button
                type="button"
                onClick={handleNow}
                className="text-xs font-medium text-[#6a3e31] cursor-pointer bg-transparent border-none hover:underline"
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                Now
              </button>
            </div>
          </div>
        )}

        {hasError && errorText && (
          <div className="flex items-center gap-1 mt-1.5">
            <Icon name="error" size="small" color="#d32f2f" />
            <span className="text-xs leading-4 text-[#d32f2f]" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>{errorText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
