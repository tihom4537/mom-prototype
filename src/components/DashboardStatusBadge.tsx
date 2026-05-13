const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type DashboardBadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'brown';

interface DashboardStatusBadgeProps {
  label: string;
  variant: DashboardBadgeVariant;
  className?: string;
}

const STYLES: Record<DashboardBadgeVariant, { wrap: string; dot: string; text: string; dotSize: string }> = {
  green:  { wrap: 'bg-[#e8f5e9] px-[10px] py-[4px]', dot: 'bg-[#2e7d32]', dotSize: 'size-[5px]', text: 'text-[#2e7d32]' },
  yellow: { wrap: 'bg-[#fff8e1] px-[10px] py-[4px]', dot: 'bg-[#f57f17]', dotSize: 'size-[5px]', text: 'text-[#f57f17]' },
  red:    { wrap: 'bg-[#ffebee] px-[8px] py-[3px]',  dot: 'bg-[#c62828]', dotSize: 'size-[6px]', text: 'text-[#c62828]' },
  blue:   { wrap: 'bg-[#e3f2fd] px-[8px] py-[3px]',  dot: 'bg-[#1976d2]', dotSize: 'size-[6px]', text: 'text-[#1976d2]' },
  brown:  { wrap: 'bg-[#f7f0ee] px-[8px] py-[3px]',  dot: '',             dotSize: '',            text: 'text-[#6a3e31]' },
};

export default function DashboardStatusBadge({ label, variant, className }: DashboardStatusBadgeProps) {
  const s = STYLES[variant];
  return (
    <div className={`flex items-center gap-[4px] rounded-full ${s.wrap} ${className ?? ''}`}>
      {variant !== 'brown' && (
        <div className={`shrink-0 rounded-full ${s.dot} ${s.dotSize}`} />
      )}
      <p className={`font-medium text-[12px] leading-[16px] tracking-[0.5px] whitespace-nowrap ${s.text}`} style={NS}>
        {label}
      </p>
    </div>
  );
}
