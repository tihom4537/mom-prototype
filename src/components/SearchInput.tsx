import { useState } from 'react';
import Icon from './Icon';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showMic?: boolean;
  onMicClick?: () => void;
}

export default function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search',
  className,
  disabled = false,
  showMic = false,
  onMicClick,
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);

  const border = focused ? 'border-[#ae6651] shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' : 'border-[#cccccc]';

  return (
    <div
      className={`flex items-center bg-white rounded-lg border ${border} transition-all duration-150 ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
    >
      <div className="pl-3 shrink-0">
        <Icon name="search" size="small" color="#727272" />
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch?.()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent py-[10px] px-2 text-sm text-[#212121] placeholder-[#9e9e9e] outline-none"
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100", outline: 'none' }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex items-center justify-center p-2 shrink-0"
        >
          <Icon name="close" size="small" color="#727272" />
        </button>
      )}
      {showMic && !value && (
        <button
          type="button"
          onClick={onMicClick}
          className="flex items-center justify-center px-3 shrink-0 bg-transparent border-none cursor-pointer"
        >
          <Icon name="mic" size="small" color="#727272" />
        </button>
      )}
    </div>
  );
}
