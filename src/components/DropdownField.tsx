import { useState, useRef, useEffect } from 'react';
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
}: DropdownFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const borderColor = hasError
    ? 'border-[#d32f2f]'
    : open
    ? 'border-[#ae6651]'
    : 'border-[#cccccc]';

  const ring = open && !hasError ? 'shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' : '';

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
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className={`flex items-center w-full bg-white rounded-lg border ${borderColor} ${ring} py-[10px] pl-3 pr-3 transition-all duration-150 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`flex-1 text-sm text-left truncate ${value ? 'text-[#212121]' : 'text-[#727272]'}`}
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {value || placeholder}
          </span>
          <Icon name={open ? 'arrow_drop_up' : 'arrow_drop_down'} size="small" color="#727272" />
        </button>

        {open && (
          <div className={`absolute left-0 right-0 bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.12)] z-50 overflow-hidden ${opensUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
            {options.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => { onChange(option); setOpen(false); }}
                className={`w-full text-left px-4 py-[10px] text-sm hover:bg-[#f5f5f5] transition-colors
                  ${value === option ? 'bg-[#f0ece9] text-[#6a3e31] font-medium' : 'text-[#212121]'}`}
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
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
