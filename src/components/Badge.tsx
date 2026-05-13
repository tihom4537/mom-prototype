export type BadgeVariant = 'success' | 'primary' | 'danger' | 'neutral';
export type BadgeSize = 'small' | 'default';

interface BadgeProps {
  label: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const BG: Record<BadgeVariant, string> = {
  success: 'bg-[rgba(60,151,24,0.12)] text-[#3c9718]',
  primary: 'bg-[rgba(106,62,49,0.12)] text-[#6a3e31]',
  danger:  'bg-[rgba(255,116,104,0.12)] text-[#ff7468]',
  neutral: 'bg-[#f0f0f0] text-[#727272]',
};

export default function Badge({ label, variant = 'primary', size = 'default', className }: BadgeProps) {
  const padding = size === 'small' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold leading-none ${padding} ${BG[variant]} ${className ?? ''}`}
      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
    >
      {label}
    </span>
  );
}
