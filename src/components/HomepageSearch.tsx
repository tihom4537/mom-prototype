import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type HomepageSearchState = 'default' | 'hover' | 'focused' | 'filled' | 'disabled';

interface HomepageSearchProps {
  state?: HomepageSearchState;
  value?: string;
  placeholder?: string;
  voiceSearch?: boolean;
  onChange?: (value: string) => void;
  onSearch?: () => void;
  onVoiceClick?: () => void;
  className?: string;
}

export default function HomepageSearch({
  state = 'default',
  value = '',
  placeholder = 'Search for ',
  voiceSearch = true,
  onChange,
  onSearch,
  onVoiceClick,
  className,
}: HomepageSearchProps) {
  const isDisabled = state === 'disabled';
  const isFocused = state === 'focused';
  const isHover = state === 'hover';

  let borderClass = 'border-[#ddd]';
  let shadowClass = '';
  let opacityClass = '';
  let bgClass = 'bg-white';

  if (isDisabled) {
    opacityClass = 'opacity-50';
    borderClass = 'border-[#ddd]';
  } else if (isFocused) {
    borderClass = 'border-[#ddd]';
    shadowClass = 'shadow-[0px_0px_0px_4px_rgba(106,62,49,0.48)]';
  } else if (isHover) {
    borderClass = 'border-[#6a3e31]';
  } else if (state === 'filled') {
    borderClass = 'border-[#c6c6c6]';
    opacityClass = 'opacity-80';
  }

  const textColor = (state === 'default' || state === 'hover' || isDisabled)
    ? 'text-[rgba(33,33,33,0.48)]'
    : 'text-[#212121]';

  return (
    <div
      className={`${bgClass} border ${borderClass} ${shadowClass} ${opacityClass} flex items-center gap-0 h-[56px] overflow-hidden rounded-[8px] w-full ${className ?? ''}`}
    >
      {/* Search icon */}
      <div className="flex flex-col h-[56px] items-center justify-center px-[4px] shrink-0">
        <button
          type="button"
          className="flex items-center justify-center p-[8px] rounded-[8px] bg-transparent border-none cursor-pointer"
          onClick={onSearch}
          disabled={isDisabled}
          aria-label="Search"
        >
          <Icon name="search" size="medium" color="#525c66" />
        </button>
      </div>

      {/* Text input */}
      <div className="flex flex-1 h-full items-center min-w-0 pr-[8px]">
        <input
          type="text"
          className={`flex-1 font-normal text-[16px] ${textColor} tracking-[0.5px] leading-[24px] bg-transparent border-none outline-none w-full overflow-hidden text-ellipsis whitespace-nowrap`}
          style={NS}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={isDisabled}
          onKeyDown={e => e.key === 'Enter' && onSearch?.()}
        />
      </div>

      {/* Mic icon */}
      {voiceSearch && (
        <div className="flex flex-col h-[56px] items-center justify-center px-[4px] shrink-0">
          <button
            type="button"
            className="flex items-center justify-center p-[8px] rounded-[8px] bg-transparent border-none cursor-pointer"
            onClick={onVoiceClick}
            disabled={isDisabled}
            aria-label="Voice search"
          >
            <Icon name="mic" size="medium" color="#525c66" />
          </button>
        </div>
      )}
    </div>
  );
}
