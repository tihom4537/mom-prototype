export type StatusBadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'brown';

interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
}

const STYLES: Record<StatusBadgeVariant, { bg: string; dot: string; text: string; hasDot: boolean }> = {
  green:  { bg: 'bg-[#e8f5e9]',  dot: 'bg-[#2e7d32]', text: 'text-[#2e7d32]', hasDot: true  },
  yellow: { bg: 'bg-[#fff8e1]',  dot: 'bg-[#f57f17]', text: 'text-[#f57f17]', hasDot: true  },
  red:    { bg: 'bg-[#ffebee]',  dot: 'bg-[#c62828]', text: 'text-[#c62828]', hasDot: true  },
  blue:   { bg: 'bg-[#e3f2fd]',  dot: 'bg-[#1976d2]', text: 'text-[#1976d2]', hasDot: true  },
  brown:  { bg: 'bg-[#f7f0ee]',  dot: '',             text: 'text-[#6a3e31]', hasDot: false },
};

export default function StatusBadge({ label, variant = 'green', className }: StatusBadgeProps) {
  const s = STYLES[variant];
  return (
    <div
      className={`inline-flex items-center gap-[4px] rounded-[100px] px-[8px] py-[3px] ${s.bg} ${className ?? ''}`}
    >
      {s.hasDot && <div className={`shrink-0 size-[6px] rounded-full ${s.dot}`} />}
      <span
        className={`font-medium text-[12px] leading-[16px] tracking-[0.5px] whitespace-nowrap ${s.text}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {label}
      </span>
    </div>
  );
}
