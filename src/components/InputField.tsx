import { useState } from 'react';
import Icon from './Icon';

export type InputFieldState = 'default' | 'error' | 'success' | 'warning';

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  errorText?: string;
  fieldState?: InputFieldState;
  required?: boolean;
  className?: string;
  type?: string;
  disabled?: boolean;
}

export default function InputField({
  label,
  placeholder = 'Placeholder',
  value,
  onChange,
  helperText,
  errorText,
  fieldState = 'default',
  required = false,
  className,
  type = 'text',
  disabled = false,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor =
    fieldState === 'error'
      ? 'border-[#d32f2f]'
      : fieldState === 'success'
      ? 'border-[#3c9718]'
      : fieldState === 'warning'
      ? 'border-[#f59e0b]'
      : focused
      ? 'border-[#ae6651]'
      : 'border-[#cccccc]';

  const ring =
    focused && fieldState === 'default'
      ? 'shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]'
      : '';

  const helperColor =
    fieldState === 'error'
      ? 'text-[#d32f2f]'
      : fieldState === 'success'
      ? 'text-[#3c9718]'
      : fieldState === 'warning'
      ? 'text-[#f59e0b]'
      : 'text-[#727272]';

  const helperIcon =
    fieldState === 'error'
      ? 'error'
      : fieldState === 'success'
      ? 'check_circle'
      : fieldState === 'warning'
      ? 'warning'
      : 'info';

  const displayHelper = fieldState === 'error' ? errorText : helperText;

  return (
    <div className={`flex flex-col gap-[6px] ${className ?? ''}`}>
      {label && (
        <label
          className="text-sm font-medium text-[#3b3b3b] leading-5 tracking-[0.1px]"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {label}
          {required && <span className="text-[#d32f2f] ml-0.5">*</span>}
        </label>
      )}

      <div className={`input-field-wrapper flex items-center rounded-lg border ${disabled ? 'bg-[#F3F3F3] border-[#e0e0e0]' : `bg-white ${borderColor}`} ${disabled ? '' : ring} transition-all duration-150`}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => !disabled && setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent py-[10px] pl-3 pr-2 text-sm text-[#212121] placeholder-[#9e9e9e] outline-none"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center justify-center p-2 text-[#727272] hover:text-[#212121] shrink-0"
          >
            <Icon name="close" size="small" color="#727272" />
          </button>
        )}
      </div>

      {displayHelper && (
        <div className={`flex items-center gap-1 ${helperColor}`}>
          <Icon name={helperIcon} size="small" color="currentColor" />
          <span
            className="text-xs leading-4"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {displayHelper}
          </span>
        </div>
      )}
    </div>
  );
}
