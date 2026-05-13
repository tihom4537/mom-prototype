export type RadioButtonState = 'enabled' | 'hover' | 'pressed' | 'focused' | 'disabled';

interface RadioButtonProps {
  selected?: boolean;
  state?: RadioButtonState;
  onChange?: (selected: boolean) => void;
  label?: string;
  className?: string;
}

export default function RadioButton({
  selected = false,
  state = 'enabled',
  onChange,
  label,
  className,
}: RadioButtonProps) {
  const isDisabled = state === 'disabled';

  const outerRing = selected
    ? 'border-2 border-[#6a3e31]'
    : state === 'hover' || state === 'pressed'
    ? 'border-2 border-[rgba(106,62,49,0.6)]'
    : 'border-2 border-[#9e9e9e]';

  const focusRing =
    state === 'focused' ? 'ring-4 ring-[rgba(97,58,245,0.48)]' : '';

  const opacity = isDisabled ? 'opacity-40' : '';

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${isDisabled ? 'cursor-not-allowed' : ''} ${className ?? ''}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={isDisabled}
        onClick={() => !isDisabled && onChange?.(!selected)}
        className={`size-6 rounded-full flex items-center justify-center bg-white ${outerRing} ${focusRing} ${opacity} transition-all duration-150 shrink-0 cursor-pointer border-none p-0`}
      >
        {selected && (
          <div className="size-3 rounded-full bg-[#6a3e31]" />
        )}
      </button>
      {label && (
        <span
          className={`text-sm text-[#212121] leading-5 ${isDisabled ? 'opacity-40' : ''}`}
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
