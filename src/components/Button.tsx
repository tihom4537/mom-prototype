import Icon from './Icon';

export type ButtonVariant = 'filled' | 'outlined' | 'tonal' | 'text' | 'save' | 'grey-outlined' | 'small-grey' | 'biiig-grey';
export type ButtonState = 'default' | 'hover' | 'pressed' | 'focused' | 'disabled';
export type ButtonIconPlacement = 'none' | 'left' | 'right';
export type ButtonSize = 'default' | 'large' | 'small';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface ButtonProps {
  variant?: ButtonVariant;
  state?: ButtonState;
  iconPlacement?: ButtonIconPlacement;
  iconName?: string;
  text?: string;
  size?: ButtonSize;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  selected?: boolean;
}

// Shared state classes for all three grey-outlined sizes
function greyStateClasses(isDisabled: boolean, selected: boolean): string {
  if (selected) return 'bg-[rgba(106,62,49,0.16)] border border-[#6a3e31] cursor-pointer';
  if (isDisabled) return 'border border-[#b0b0b0] opacity-50 cursor-not-allowed';
  return 'border border-[#b0b0b0] hover:bg-[rgba(106,62,49,0.08)] active:bg-[rgba(106,62,49,0.16)] cursor-pointer focus:shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)] focus:outline-none';
}

export default function Button({
  variant = 'filled',
  state = 'default',
  iconPlacement = 'none',
  iconName,
  text = 'Button',
  size = 'default',
  onClick,
  className,
  type = 'button',
  selected = false,
}: ButtonProps) {
  const isDisabled = state === 'disabled';
  const isHover    = state === 'hover';
  const isPressed  = state === 'pressed';
  const isFocused  = state === 'focused';

  // ── Padding & gap by size + icon placement ──────────────────────────────────
  let py = 'py-[10px]';
  let px = iconPlacement === 'none' ? 'px-[24px]' : '';
  let pl = '';
  let pr = '';
  let gap = 'gap-[8px]';

  if (size === 'large') {
    py = 'py-[12px]';
    px = iconPlacement === 'none' ? 'px-[24px]' : '';
  } else if (size === 'small') {
    py = 'py-[8px]';
    px = iconPlacement === 'none' ? 'px-[16px]' : '';
  }

  if (iconPlacement === 'left') {
    pl = size === 'small' ? 'pl-[12px]' : 'pl-[16px]';
    pr = size === 'small' ? 'pr-[16px]' : 'pr-[24px]';
  } else if (iconPlacement === 'right') {
    pl = size === 'small' ? 'pl-[16px]' : 'pl-[24px]';
    pr = size === 'small' ? 'pr-[12px]' : 'pr-[16px]';
  }

  const paddingClasses = iconPlacement === 'none' ? `${px} ${py}` : `${pl} ${pr} ${py} ${gap}`;

  // ── Text style by size ───────────────────────────────────────────────────────
  let textSize    = 'text-[14px]';
  let tracking    = 'tracking-[0.1px]';
  let lineHeight  = 'leading-[20px]';

  if (size === 'large') {
    textSize   = 'text-[16px]';
    tracking   = 'tracking-[0.15px]';
    lineHeight = 'leading-[24px]';
  } else if (size === 'small') {
    textSize   = 'text-[12px]';
    tracking   = 'tracking-[0.5px]';
    lineHeight = 'leading-[16px]';
  }

  // ── Variant styles ───────────────────────────────────────────────────────────
  let containerClasses = '';
  let textColor = '';
  let iconColor = '';
  let finalPadding = paddingClasses;
  let finalTextSize = textSize;
  let finalTracking = tracking;
  let finalLineHeight = lineHeight;

  if (variant === 'save') {
    textColor  = 'text-white';
    iconColor  = 'white';
    containerClasses =
      isDisabled ? 'bg-[#3c9718] opacity-50' :
      isHover    ? 'bg-[#3c9718] shadow-[0px_2px_3px_1px_rgba(33,33,33,0.12)] cursor-pointer' :
      isPressed  ? 'bg-[#317c14]' :
      isFocused  ? 'bg-[#3c9718] shadow-[0px_0px_0px_4px_rgba(60,151,24,0.32)]' :
                   'bg-[#3c9718]';

  } else if (variant === 'filled') {
    textColor  = 'text-white';
    iconColor  = 'white';
    containerClasses =
      isDisabled ? 'bg-[#6a3e31] opacity-50 cursor-not-allowed' :
      isHover    ? 'bg-[#6a3e31] shadow-[0px_2px_3px_1px_rgba(33,33,33,0.12)] cursor-pointer' :
      isPressed  ? 'bg-[#5a3428]' :
      isFocused  ? 'bg-[#6a3e31] shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' :
                   'bg-[#6a3e31] hover:shadow-[0px_2px_3px_1px_rgba(33,33,33,0.12)] active:bg-[#5a3428] focus:shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)] focus:outline-none cursor-pointer';

  } else if (variant === 'outlined') {
    textColor  = 'text-[#6a3e31]';
    iconColor  = '#6a3e31';
    containerClasses =
      isDisabled ? 'border border-[#6a3e31] opacity-50 cursor-not-allowed' :
      isHover    ? 'border border-[#6a3e31] bg-[rgba(106,62,49,0.08)] cursor-pointer' :
      isPressed  ? 'border border-[#6a3e31] bg-[rgba(106,62,49,0.16)]' :
      isFocused  ? 'border border-[#6a3e31] bg-[rgba(106,62,49,0.08)] shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' :
                   'border border-[#6a3e31] hover:bg-[rgba(106,62,49,0.08)] active:bg-[rgba(106,62,49,0.16)] focus:shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)] focus:outline-none cursor-pointer';

  } else if (variant === 'tonal') {
    textColor  = 'text-[#212121]';
    iconColor  = '#212121';
    containerClasses =
      isDisabled ? 'bg-[#dfc2b9] opacity-50 cursor-not-allowed' :
      isHover    ? 'bg-[#d4b0a5] cursor-pointer' :
      isPressed  ? 'bg-[#c9a090]' :
      isFocused  ? 'bg-[#dfc2b9] shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' :
                   'bg-[#dfc2b9] hover:bg-[#d4b0a5] active:bg-[#c9a090] focus:shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)] focus:outline-none cursor-pointer';

  } else if (variant === 'grey-outlined') {
    // big grey — px-15 py-8, 14px text
    textColor       = selected ? 'text-[#6a3e31]' : 'text-[#727272]';
    iconColor       = selected ? '#6a3e31' : '#727272';
    containerClasses = greyStateClasses(isDisabled, selected);
    finalPadding    = iconPlacement === 'none' ? 'px-[15px] py-[8px]' : 'pl-[15px] pr-[15px] py-[8px] gap-[8px]';
    finalTextSize   = 'text-[14px]';
    finalTracking   = 'tracking-[0.1px]';
    finalLineHeight = 'leading-[20px]';

  } else if (variant === 'small-grey') {
    // small grey — px-10 py-5, 12px text
    textColor       = selected ? 'text-[#6a3e31]' : 'text-[#727272]';
    iconColor       = selected ? '#6a3e31' : '#727272';
    containerClasses = greyStateClasses(isDisabled, selected);
    finalPadding    = iconPlacement === 'none' ? 'px-[10px] py-[5px]' : 'pl-[10px] pr-[10px] py-[5px] gap-[8px]';
    finalTextSize   = 'text-[12px]';
    finalTracking   = 'tracking-[0.5px]';
    finalLineHeight = 'leading-[20px]';

  } else if (variant === 'biiig-grey') {
    // Biiig grey — px-18 py-10, 16px text
    textColor       = selected ? 'text-[#6a3e31]' : 'text-[#727272]';
    iconColor       = selected ? '#6a3e31' : '#727272';
    containerClasses = greyStateClasses(isDisabled, selected);
    finalPadding    = iconPlacement === 'none' ? 'px-[18px] py-[10px]' : 'pl-[18px] pr-[18px] py-[10px] gap-[8px]';
    finalTextSize   = 'text-[16px]';
    finalTracking   = 'tracking-[0.15px]';
    finalLineHeight = 'leading-[24px]';

  } else {
    // text
    textColor  = 'text-[#6a3e31]';
    iconColor  = '#6a3e31';
    containerClasses =
      isDisabled ? 'opacity-50' :
      isHover    ? 'bg-[rgba(106,62,49,0.08)] cursor-pointer' :
      isPressed  ? 'bg-[rgba(106,62,49,0.16)]' :
      isFocused  ? 'shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]' :
                   '';
  }

  const iconSize = size === 'large' ? 'medium' : 'small';

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`flex items-center justify-center overflow-clip rounded-[8px] transition-all duration-150
        ${finalPadding} ${containerClasses} ${className ?? ''}`}
    >
      {iconPlacement === 'left' && (
        <Icon name={iconName ?? 'add'} size={iconSize} color={iconColor} />
      )}

      <span
        className={`font-medium text-center whitespace-nowrap ${finalTextSize} ${finalTracking} ${finalLineHeight} ${textColor}`}
        style={NS}
      >
        {text}
      </span>

      {iconPlacement === 'right' && (
        <Icon name={iconName ?? 'arrow_drop_down'} size={iconSize} color={iconColor} />
      )}
    </button>
  );
}
