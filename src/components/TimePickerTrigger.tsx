import Icon from './Icon';

interface TimePickerTriggerProps {
  value?: string;
  placeholder?: string;
  hasError?: boolean;
  onOpen?: () => void;
  className?: string;
}

export default function TimePickerTrigger({
  value,
  placeholder = 'Select Time',
  hasError = false,
  onOpen,
  className,
}: TimePickerTriggerProps) {
  const border = hasError
    ? 'border-[#d32f2f]'
    : 'border-[#cccccc] hover:border-[#6a3e31] focus-within:border-[#613af5] focus-within:ring-2 focus-within:ring-[rgba(97,58,245,0.2)]';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex items-center gap-2 bg-white rounded-lg border ${border} transition-all duration-150 cursor-pointer w-full max-w-[390px] px-3 py-[10px] ${className ?? ''}`}
    >
      <span
        className={`flex-1 text-sm text-left leading-[19px] ${value ? 'text-[#212121]' : 'text-[#727272]'}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {value || placeholder}
      </span>
      <div className="flex items-center justify-center size-8 shrink-0">
        <Icon name="schedule" size="small" color="#727272" />
      </div>
    </button>
  );
}
