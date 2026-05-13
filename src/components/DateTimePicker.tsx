import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface DateTimePickerProps {
  dateValue: string; // DD/MM/YYYY or ''
  timeValue: string; // HH:MM or ''
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  hasError?: boolean;
  errorText?: string;
  minDate?: Date;
  className?: string;
}

type CalendarView = 'day' | 'month' | 'decade';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function parseDate(str: string) {
  const [dd, mm, yyyy] = str.split('/').map(Number);
  if (!dd || !mm || !yyyy) return null;
  return { y: yyyy, m: mm - 1, d: dd };
}
function fmtDate(y: number, m: number, d: number) {
  return `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
}
function parseTime(str: string) {
  const [h, m] = str.split(':').map(Number);
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
}

export default function DateTimePicker({
  dateValue, timeValue, onDateChange, onTimeChange,
  label, required = false, placeholder = 'Select date & time',
  hasError = false, errorText, minDate, className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>('day');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const parsedDate = parseDate(dateValue);
  const [viewYear, setViewYear] = useState(parsedDate?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate?.m ?? today.getMonth());

  const initTime = parseTime(timeValue);
  const [tempH, setTempH] = useState(initTime.h);
  const [tempM, setTempM] = useState(initTime.m);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      const inTrigger = ref.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inTrigger && !inDropdown) {
        setOpen(false); setView('day');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  const openPicker = useCallback(() => {
    if (open) { setOpen(false); return; }
    updatePos();
    setOpen(true);
    setView('day');
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const hEl = hourRef.current;
      const mEl = minRef.current;
      if (hEl) { const item = hEl.children[tempH] as HTMLElement | undefined; if (item) hEl.scrollTop = item.offsetTop - hEl.clientHeight / 2 + item.clientHeight / 2; }
      if (mEl) { const item = mEl.children[tempM] as HTMLElement | undefined; if (item) mEl.scrollTop = item.offsetTop - mEl.clientHeight / 2 + item.clientHeight / 2; }
    });
  }, [open]);

  function blocked(date: Date) {
    if (!minDate) return false;
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const m = new Date(minDate); m.setHours(0, 0, 0, 0);
    return d < m;
  }

  function selectDay(y: number, m: number, d: number) {
    if (blocked(new Date(y, m, d))) return;
    onDateChange(fmtDate(y, m, d));
  }

  function handleOk() {
    onTimeChange(`${String(tempH).padStart(2, '0')}:${String(tempM).padStart(2, '0')}`);
    setOpen(false); setView('day');
  }

  function handleNow() {
    const now = new Date();
    setTempH(now.getHours()); setTempM(now.getMinutes());
  }

  function handleToday() {
    const t = new Date();
    onDateChange(fmtDate(t.getFullYear(), t.getMonth(), t.getDate()));
    setViewYear(t.getFullYear()); setViewMonth(t.getMonth());
  }

  // Calendar grid
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
  const displayValue = dateValue && timeValue ? `${dateValue}  ${timeValue}` : dateValue || timeValue || '';
  const timeHeader = `${String(tempH).padStart(2, '0')}:${String(tempM).padStart(2, '0')}`;
  const border = hasError ? 'border-[#d32f2f]' : open ? 'border-[#613af5] ring-2 ring-[rgba(97,58,245,0.2)]' : 'border-[#cccccc]';

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
          ref={triggerRef}
          type="button"
          onClick={openPicker}
          className={`flex items-center w-full bg-white rounded-lg border ${border} py-[10px] pl-3 pr-3 transition-all duration-150 cursor-pointer`}
        >
          <span className={`flex-1 text-sm text-left ${displayValue ? 'text-[#212121]' : 'text-[#727272]'}`} style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            {displayValue || placeholder}
          </span>
          <Icon name="calendar_today" size="small" color="#727272" />
        </button>

        {open && createPortal(
          <div
            ref={dropdownRef}
            className="bg-white rounded-lg shadow-[0px_8px_8px_rgba(0,0,0,0.15)] overflow-hidden flex w-[469px]"
            style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          >
            {/* Left: Calendar (300px) */}
            <div className="flex flex-col shrink-0 w-[300px] border-r border-[#ddd]">
              {/* Calendar header */}
              <div className="flex items-center h-[40px] bg-white border-b border-[#ddd] px-2 shrink-0">
                <button type="button" onClick={() => view === 'decade' ? setViewYear(y => y - 10) : setViewYear(y => y - 1)} className="flex items-center justify-center w-[22px] h-full text-xs text-[#727272] hover:text-[#212121] cursor-pointer bg-transparent border-none">«</button>
                {view === 'day' && (
                  <button type="button" onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)} className="flex items-center justify-center w-[22px] h-full cursor-pointer bg-transparent border-none text-[#727272]">
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
                  <button type="button" onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)} className="flex items-center justify-center w-[22px] h-full cursor-pointer bg-transparent border-none text-[#727272]">
                    <Icon name="chevron_right" size="small" color="#727272" />
                  </button>
                )}
                <button type="button" onClick={() => view === 'decade' ? setViewYear(y => y + 10) : setViewYear(y => y + 1)} className="flex items-center justify-center w-[22px] h-full text-xs text-[#727272] hover:text-[#212121] cursor-pointer bg-transparent border-none">»</button>
              </div>

              {/* Day view */}
              {view === 'day' && (
                <div className="px-[6px] py-2 flex-1">
                  <div className="grid grid-cols-7">
                    {DAYS.map(d => (
                      <div key={d} className="flex items-center justify-center h-[30px] text-[10px] font-semibold text-[#727272] uppercase" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-[3px]">
                    {cells.map((cell, i) => {
                      const isToday = today.getFullYear() === cell.y && today.getMonth() === cell.m && today.getDate() === cell.d;
                      const isSel = parsedDate && parsedDate.y === cell.y && parsedDate.m === cell.m && parsedDate.d === cell.d;
                      const isBlocked = blocked(new Date(cell.y, cell.m, cell.d));
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => !cell.other && !isBlocked && selectDay(cell.y, cell.m, cell.d)}
                          className={`flex items-center justify-center size-6 mx-auto rounded-[4px] text-sm font-medium transition-colors border-none
                            ${isSel ? 'bg-[#6a3e31] text-white cursor-pointer' :
                              cell.other || isBlocked ? 'text-[#c6c6c6] cursor-default bg-transparent' :
                              isToday ? 'bg-[#f7f0ee] text-[#6a3e31] cursor-pointer' :
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
                <div className="grid grid-cols-3 gap-2 p-3 flex-1">
                  {MONTHS_SHORT.map((m, i) => (
                    <button key={m} type="button" onClick={() => { setViewMonth(i); setView('day'); }}
                      className={`py-2 text-sm font-medium rounded-[4px] cursor-pointer border-none transition-colors ${i === viewMonth ? 'bg-[#6a3e31] text-white' : 'text-[#212121] hover:bg-[#f7f0ee] bg-transparent'}`}
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >{m}</button>
                  ))}
                </div>
              )}

              {/* Decade view */}
              {view === 'decade' && (
                <div className="grid grid-cols-3 gap-2 p-3 flex-1">
                  {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map(y => (
                    <button key={y} type="button" onClick={() => { setViewYear(y); setView('month'); }}
                      className={`py-2 text-sm font-medium rounded-[4px] cursor-pointer border-none transition-colors ${y < decadeStart || y > decadeStart + 9 ? 'text-[#c6c6c6] bg-transparent' : y === viewYear ? 'bg-[#6a3e31] text-white' : 'text-[#212121] hover:bg-[#f7f0ee] bg-transparent'}`}
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >{y}</button>
                  ))}
                </div>
              )}

              {/* Today footer */}
              <div className="border-t border-[#ddd] flex items-center justify-center py-[10px] shrink-0">
                <button type="button" onClick={handleToday}
                  className="text-sm font-medium text-[#6a3e31] cursor-pointer bg-transparent border-none hover:underline"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Right: Time picker */}
            <div className="flex flex-col flex-1">
              {/* HH:MM header */}
              <div className="flex items-center justify-center h-[40px] border-b border-[#ddd] shrink-0">
                <p className="text-sm font-medium text-[#212121] tracking-[0.1px]" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
                  {timeHeader}
                </p>
              </div>

              {/* Scroll columns */}
              <div className="flex flex-1 overflow-hidden">
                <div ref={hourRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {HOURS.map((h, i) => (
                    <button key={h} type="button" onClick={() => setTempH(i)}
                      className={`flex items-center w-full h-[28px] pl-[14px] text-sm font-medium text-[#212121] tracking-[0.1px] cursor-pointer border-none transition-colors ${i === tempH ? 'bg-[#efe0dc]' : 'bg-transparent hover:bg-[#f7f0ee]'}`}
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >{h}</button>
                  ))}
                </div>
                <div ref={minRef} className="flex-1 overflow-y-auto border-l border-[#ddd]" style={{ scrollbarWidth: 'none' }}>
                  {MINUTES.map((m, i) => (
                    <button key={m} type="button" onClick={() => setTempM(i)}
                      className={`flex items-center w-full h-[28px] pl-[14px] text-sm font-medium text-[#212121] tracking-[0.1px] cursor-pointer border-none transition-colors ${i === tempM ? 'bg-[#efe0dc]' : 'bg-transparent hover:bg-[#f7f0ee]'}`}
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {/* Now / Ok footer */}
              <div className="flex items-center justify-between border-t border-[#ddd] px-2 py-[10px] shrink-0">
                <button type="button" onClick={handleNow}
                  className="text-sm font-medium text-[#6a3e31] cursor-pointer bg-transparent border-none hover:underline"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >Now</button>
                <button type="button" onClick={handleOk}
                  className="bg-[#6a3e31] text-white text-xs font-medium px-3 py-1 rounded-md cursor-pointer border-none hover:opacity-90"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >Ok</button>
              </div>
            </div>
          </div>,
          document.body
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
