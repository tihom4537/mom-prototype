import Icon from './Icon';

export type ButtonVariant = 'filled' | 'outlined' | 'save';
export type ButtonState = 'default' | 'hover' | 'pressed' | 'focused' | 'disabled';
export type ButtonIconPlacement = 'none' | 'left' | 'right';

interface ButtonProps {
  variant?: ButtonVariant;
  state?: ButtonState;
  iconPlacement?: ButtonIconPlacement;
  /** Override the icon used for iconPlacement. Defaults: left→"add", right→"arrow_drop_down" */
  iconName?: string;
  text?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  variant = 'filled',
  state = 'default',
  iconPlacement = 'none',
  iconName,
  text = 'Button',
  onClick,
  className,
  type = 'button',
}: ButtonProps) {
  const isFilled = variant === 'filled';
  const isSave = variant === 'save';
  const isDisabled = state === 'disabled';
  const isHover = state === 'hover';
  const isPressed = state === 'pressed';
  const isFocused = state === 'focused';

  // Base classes
  const base = 'flex items-center justify-center overflow-clip py-[10px] rounded-lg transition-all duration-150';

  // Padding based on icon placement
  const padding =
    iconPlacement === 'left'
      ? 'pl-4 pr-6 gap-2'
      : iconPlacement === 'right'
      ? 'pl-6 pr-4 gap-2'
      : 'px-6';

  // Background / border
  let colorClasses = '';
  if (isSave) {
    colorClasses = isDisabled ? 'bg-[#3c9718] opacity-50' : 'bg-[#3c9718]';
  } else if (isFilled) {
    colorClasses = isDisabled
      ? 'bg-[#6a3e31] opacity-50'
      : isHover
      ? 'bg-[#6a3e31] shadow-[0px_2px_3px_1px_rgba(33,33,33,0.12)]'
      : isPressed
      ? 'bg-[#6a3e31] opacity-90'
      : isFocused
      ? 'bg-[#6a3e31] shadow-[0px_0px_0px_4px_rgba(97,58,245,0.48)]'
      : 'bg-[#6a3e31]';
  } else {
    colorClasses = isDisabled
      ? 'border border-[#ff7468] opacity-50'
      : isHover
      ? 'border border-[#ff7468] bg-[rgba(255,116,104,0.08)] cursor-pointer'
      : isPressed
      ? 'border border-[#ff7468] bg-[rgba(255,116,104,0.16)]'
      : isFocused
      ? 'border border-[#ff7468] bg-[rgba(255,116,104,0.08)] shadow-[0px_0px_0px_4px_rgba(97,58,245,0.48)]'
      : 'border border-[#ff7468]';
  }

  const textColor = (isFilled || isSave) ? 'text-white' : 'text-[#ff7468]';
  const iconColor = (isFilled || isSave) ? 'white' : '#ff7468';

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${base} ${padding} ${colorClasses} ${className ?? ''}`}
    >
      {/* Left icon */}
      {iconPlacement === 'left' && (
        <Icon name={iconName ?? 'add'} size="small" color={iconColor} />
      )}

      {/* Label */}
      <span
        className={`font-medium text-sm text-center leading-5 tracking-[0.1px] whitespace-nowrap ${textColor}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {text}
      </span>

      {/* Right icon */}
      {iconPlacement === 'right' && (
        <Icon name={iconName ?? 'arrow_drop_down'} size="small" color={iconColor} />
      )}
    </button>
  );
}
