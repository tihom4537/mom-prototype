import Icon from './Icon';

export type CloseButtonVariant = 'default' | 'outlined' | 'tonal';
export type CloseButtonSize = 'small' | 'default' | 'large';

interface CloseButtonProps {
  onClick?: () => void;
  variant?: CloseButtonVariant;
  size?: CloseButtonSize;
  disabled?: boolean;
  className?: string;
}

export default function CloseButton({
  onClick,
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
}: CloseButtonProps) {
  const sizeClass = size === 'small' ? 'w-6 h-6 rounded-[4px]' : size === 'large' ? 'w-10 h-10 rounded-[8px]' : 'w-8 h-8 rounded-[6px]';

  const variantClass =
    variant === 'outlined'
      ? 'border border-[rgba(106,62,49,0.32)] bg-white hover:bg-[#f5ede9]'
      : variant === 'tonal'
      ? 'bg-[#efe0dc] hover:bg-[#e6cec8]'
      : 'bg-transparent hover:bg-[rgba(106,62,49,0.08)]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center ${sizeClass} ${variantClass} transition-colors shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className ?? ''}`}
    >
      <Icon name="close" size="small" color="#6a3e31" />
    </button>
  );
}
