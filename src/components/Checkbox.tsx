import Icon from './Icon';

export type CheckboxColor = 'green' | 'red';
export type CheckboxChecked = boolean | 'intermediate';

interface CheckboxProps {
  checked: CheckboxChecked;
  onChange?: (checked: boolean) => void;
  color?: CheckboxColor;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  color = 'green',
  disabled = false,
  label,
  className,
}: CheckboxProps) {
  const isChecked = checked === true;
  const isIntermediate = checked === 'intermediate';
  const isActive = isChecked || isIntermediate;

  const activeBg = color === 'green' ? 'bg-[#3c9718]' : 'bg-[#d32f2f]';
  const activeBorder = color === 'green' ? 'border-[#3c9718]' : 'border-[#d32f2f]';
  const hoverBg = color === 'green' ? 'hover:bg-[rgba(60,151,24,0.08)]' : 'hover:bg-[rgba(211,47,47,0.08)]';

  return (
    <label
      className={`inline-flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className ?? ''}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isIntermediate ? 'mixed' : isChecked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!isChecked)}
        className={`flex items-center justify-center w-5 h-5 rounded-[4px] border-2 shrink-0 transition-colors duration-150
          ${isActive ? `${activeBg} ${activeBorder}` : `border-[#757575] bg-white ${hoverBg}`}
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isChecked && <Icon name="check" size="small" color="white" />}
        {isIntermediate && <Icon name="remove" size="small" color="white" />}
      </button>
      {label && (
        <span
          className="text-sm text-[#212121] leading-5"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
