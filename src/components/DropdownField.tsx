import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface DropdownFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  errorText?: string;
  hasError?: boolean;
  className?: string;
  disabled?: boolean;
  opensUp?: boolean;
  showAll?: boolean;
  allLabel?: string;
}

export default function DropdownField({
  label,
  placeholder = 'Placeholder',
  value,
  onChange,
  options,
  required = false,
  errorText,
  hasError = false,
  className,
  disabled = false,
  opensUp = false,
  showAll = false,
  allLabel = 'All',
}: DropdownFieldProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [listPos, setListPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [actuallyOpensUp, setActuallyOpensUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const allOptions = showAll ? ['', ...options] : options;
  const optionLabel = (opt: string) => (opt === '' ? allLabel : opt);

  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const shouldOpenUp = opensUp || spaceBelow < 200;
    if (shouldOpenUp) {
      setListPos({ top: r.top - 4, left: r.left, width: r.width });
    } else {
      setListPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setActuallyOpensUp(shouldOpenUp);
  }

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(calcPos);
    const update = () => calcPos();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openList() {
    if (disabled) return;
    const currentIndex = Math.max(0, allOptions.indexOf(value));
    setHighlightedIndex(currentIndex);
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function commitHighlighted() {
    const opt = allOptions[highlightedIndex];
    if (opt !== undefined) onChange(opt);
    closeList();
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) openList();
        else commitHighlighted();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          openList();
        } else {
          setHighlightedIndex(i => Math.min(i + 1, allOptions.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          openList();
        } else {
          setHighlightedIndex(i => Math.max(i - 1, 0));
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      default:
        break;
    }
  }

  const borderColor = hasError
    ? 'border-[#d32f2f]'
    : open
    ? 'border-[#ae6651]'
    : 'border-[#cccccc]';

  const ring = open && !hasError ? 'shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' : '';

  const listbox = open && listPos
    ? createPortal(
        <div
          id={listId}
          ref={listRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: actuallyOpensUp ? undefined : listPos.top,
            bottom: actuallyOpensUp ? window.innerHeight - listPos.top : undefined,
            left: listPos.left,
            width: listPos.width,
            zIndex: 9999,
            maxHeight: '240px',
            overflowY: 'auto',
          }}
          className="bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        >
          {allOptions.map((option, index) => (
            <button
              key={option || '__all__'}
              id={`${listId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={value === option}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => { onChange(option); closeList(); }}
              className={`w-full text-left px-4 py-[10px] text-sm transition-colors
                ${option === '' && showAll ? 'border-b border-[#f0f0f0]' : ''}
                ${index === highlightedIndex ? 'bg-[#f5f5f5]' : 'hover:bg-[#f5f5f5]'}
                ${value === option ? 'bg-[#f0ece9] text-[#6a3e31] font-medium' : option === '' ? 'text-[#525c66] italic' : 'text-[#212121]'}`}
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {optionLabel(option)}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`flex flex-col gap-[6px] ${className ?? ''}`} ref={ref}>
      {label && (
        <label
          className="text-sm font-medium text-[#3b3b3b] leading-5 tracking-[0.1px]"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {label}
          {required && <span className="text-[#d32f2f] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open ? `${listId}-option-${highlightedIndex}` : undefined}
          disabled={disabled}
          onClick={() => !disabled && (open ? closeList() : openList())}
          onKeyDown={handleTriggerKeyDown}
          className={`flex items-center w-full bg-white rounded-lg border ${borderColor} ${ring} py-[10px] pl-3 pr-3 transition-all duration-150 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`flex-1 text-sm text-left truncate ${value || (showAll && !disabled && value === '') ? 'text-[#212121]' : 'text-[#727272]'}`}
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {value || (showAll && !disabled ? allLabel : placeholder)}
          </span>
          <Icon name={open ? 'arrow_drop_up' : 'arrow_drop_down'} size="small" color="#727272" />
        </button>

        {listbox}
      </div>

      {hasError && errorText && (
        <div className="flex items-center gap-1 text-[#d32f2f]">
          <Icon name="error" size="small" color="#d32f2f" />
          <span
            className="text-xs leading-4"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {errorText}
          </span>
        </div>
      )}
    </div>
  );
}
