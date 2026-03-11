// Icon asset URLs
const imgIconBase = "https://www.figma.com/api/mcp/asset/d6ffc2b5-0ecb-4fb2-80d4-600939b833f3";
const imgPlusWhite = "https://www.figma.com/api/mcp/asset/2cdf1fd2-b86a-476d-a23c-f524cd1f2de3";
const imgPlusOrange = "https://www.figma.com/api/mcp/asset/6e4b385b-f73e-4bb7-a021-24b17cb992a5";
const imgChevronDown = "https://www.figma.com/api/mcp/asset/446744b9-d62c-44e9-9bfa-423ce004b4bd";
const imgChevronDownOrange = "https://www.figma.com/api/mcp/asset/e460d4e9-2eac-4184-9f70-5a53b3be01c1";

export type ButtonVariant = 'filled' | 'outlined' | 'save';
export type ButtonState = 'default' | 'hover' | 'pressed' | 'focused' | 'disabled';
export type ButtonIconPlacement = 'none' | 'left' | 'right';

interface ButtonProps {
  variant?: ButtonVariant;
  state?: ButtonState;
  iconPlacement?: ButtonIconPlacement;
  text?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  variant = 'filled',
  state = 'default',
  iconPlacement = 'none',
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
  const iconSrc = isFilled ? imgPlusWhite : imgPlusOrange;
  const chevronSrc = isFilled ? imgChevronDown : imgChevronDownOrange;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${base} ${padding} ${colorClasses} ${className ?? ''}`}
    >
      {/* Left icon */}
      {iconPlacement === 'left' && (
        <div className="overflow-clip relative shrink-0 size-[18px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
          <div className="absolute inset-[20.83%]">
            <img alt="" className="absolute block max-w-none size-full" src={iconSrc} />
          </div>
        </div>
      )}

      {/* Label */}
      <span
        className={`font-medium text-sm text-center leading-5 tracking-[0.1px] whitespace-nowrap ${textColor}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {text}
      </span>

      {/* Right icon (chevron down) */}
      {iconPlacement === 'right' && (
        <div className="overflow-clip relative shrink-0 size-[18px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
          <div className="absolute inset-[41.67%_29.17%_37.5%_29.17%]">
            <img alt="" className="absolute block max-w-none size-full" src={chevronSrc} />
          </div>
        </div>
      )}
    </button>
  );
}
