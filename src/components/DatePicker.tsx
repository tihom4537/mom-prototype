import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface DatePickerProps {
  value: string; // DD/MM/YYYY or ''
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  hasError?: boolean;
  errorText?: string;
  minDate?: Date;
  className?: string;
  opensUp?: boolean;
}

type CalendarView = 'day' | 'month' | 'decade';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function parseDate(str: string): { y: number; m: number; d: number } | null {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split('/').map(Number);
  if (!dd || !mm || !yyyy) return null;
  return { y: yyyy, m: mm - 1, d: dd };
}
function fmt(y: number, m: number, d: number) {
  return `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
}

export default function DatePicker({
  value, onChange, label, required = false,
  placeholder = 'Select Date', hasError = false, errorText, minDate, className, opensUp = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>('day');
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date(2026, 4, 9); // mock today: May 9 2026
  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? today.getMonth());

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setView('day');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function blocked(date: Date) {
    if (!minDate) return false;
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const m = new Date(minDate); m.setHours(0, 0, 0, 0);
    return d < m;
  }

  function selectDay(y: number, m: number, d: number) {
    if (blocked(new Date(y, m, d))) return;
    onChange(fmt(y, m, d));
    setOpen(false); setView('day');
  }

  // Build day grid cells
  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDow(viewYear, viewMonth);
  const prevTotal = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  type Cell = { y: number; m: number; d: number; other: boolean };
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    cells.push({ y: viewMonth === 0 ? viewYear - 1 : viewYear, m, d: prevTotal - i, other: true });
  }
  for (let d = 1; d <= totalDays; d++) cells.push({ y: viewYear, m: viewMonth, d, other: false });
  while (cells.length % 7 !== 0) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    cells.push({ y: viewMonth === 11 ? viewYear + 1 : viewYear, m, d: cells.length - totalDays - firstDow + 1, other: true });
  }

  const decadeStart = Math.floor(viewYear / 10) * 10;
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
          onClick={() => { setOpen(o => !o); setView('day'); }}
          className={`flex items-center w-full bg-white rounded-lg border ${border} py-[10px] pl-3 pr-3 transition-all duration-150 cursor-pointer`}
        >
          <span className={`flex-1 text-sm text-left ${value ? 'text-[#212121]' : 'text-[#727272]'}`} style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            {value || placeholder}
          </span>
          <Icon name="calendar_today" size="small" color="#727272" />
        </button>

        {open && (
          <div className={`absolute left-0 bg-white rounded-lg shadow-[0px_8px_8px_rgba(0,0,0,0.15)] z-50 overflow-hidden w-[300px] ${opensUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
            {/* Header */}
            <div className="flex items-center h-[40px] bg-white border-b border-[#ddd] px-2">
              <button type="button" onClick={() => view === 'decade' ? setViewYear(y => y - 10) : setViewYear(y => y - 1)} className="flex items-center justify-center w-[22px] h-full text-xs text-[#727272] hover:text-[#212121] cursor-pointer bg-transparent border-none">«</button>
              {view === 'day' && (
                <button type="button" onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)} className="flex items-center justify-center w-[22px] h-full cursor-pointer bg-transparent border-none text-[#727272] hover:text-[#212121]">
                  <Icon name="chevron_left" size="small" color="#727272" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setView(v => v === 'day' ? 'month' : v === 'month' ? 'decade' : 'decade')}
                className="flex-1 text-center text-sm font-medium text-[#212121] cursor-pointer bg-transparent border-none hover:text-[#6a3e31] leading-5"
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {view === 'day' ? `${MONTHS_FULL[viewMonth]} ${viewYear}` : view === 'month' ? `${viewYear}` : `${decadeStart}–${decadeStart + 9}`}
              </button>
              {view === 'day' && (
                <button type="button" onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)} className="flex items-center justify-center w-[22px] h-full cursor-pointer bg-transparent border-none text-[#727272] hover:text-[#212121]">
                  <Icon name="chevron_right" size="small" color="#727272" />
                </button>
              )}
              <button type="button" onClick={() => view === 'decade' ? setViewYear(y => y + 10) : setViewYear(y => y + 1)} className="flex items-center justify-center w-[22px] h-full text-xs text-[#727272] hover:text-[#212121] cursor-pointer bg-transparent border-none">»</button>
            </div>

            {/* Day view */}
            {view === 'day' && (
              <div className="px-[6px] py-2">
                <div className="grid grid-cols-7">
                  {DAYS.map(d => (
                    <div key={d} className="flex items-center justify-center h-[30px] text-[10px] font-semibold text-[#727272] uppercase" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-[3px]">
                  {cells.map((cell, i) => {
                    const isToday = today.getFullYear() === cell.y && today.getMonth() === cell.m && today.getDate() === cell.d;
                    const isSel = parsed && parsed.y === cell.y && parsed.m === cell.m && parsed.d === cell.d;
                    const isBlocked = blocked(new Date(cell.y, cell.m, cell.d));
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => !cell.other && !isBlocked && selectDay(cell.y, cell.m, cell.d)}
                        className={`flex items-center justify-center size-6 mx-auto rounded-[4px] text-sm font-medium transition-colors border-none
                          ${isSel ? 'bg-[#6a3e31] text-white border border-[#6a3e31] cursor-pointer' :
                            cell.other || isBlocked ? 'text-[#c6c6c6] cursor-default bg-transparent' :
                            isToday ? 'bg-[#f7f0ee] text-[#6a3e31] border border-[#6a3e31] cursor-pointer hover:bg-[#efe0dc]' :
                            'text-[#212121] hover:bg-[#f7f0ee] cursor-pointer bg-transparent'}`}
                        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                      >
                        {cell.d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Month view */}
            {view === 'month' && (
              <div className="grid grid-cols-3 gap-2 p-3">
                {MONTHS_SHORT.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setViewMonth(i); setView('day'); }}
                    className={`py-2 text-sm font-medium rounded-[4px] text-center cursor-pointer border-none transition-colors
                      ${i === viewMonth ? 'bg-[#6a3e31] text-white' : 'text-[#212121] hover:bg-[#f7f0ee] bg-transparent'}`}
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* Decade view */}
            {view === 'decade' && (
              <div className="grid grid-cols-3 gap-2 p-3">
                {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewYear(y); setView('month'); }}
                    className={`py-2 text-sm font-medium rounded-[4px] text-center cursor-pointer border-none transition-colors
                      ${y < decadeStart || y > decadeStart + 9 ? 'text-[#c6c6c6] bg-transparent' :
                        y === viewYear ? 'bg-[#6a3e31] text-white' : 'text-[#212121] hover:bg-[#f7f0ee] bg-transparent'}`}
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
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
