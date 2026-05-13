const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type DashboardMenuBarItemState = 'default' | 'selected';

type BadgeVariant = 'neutral' | 'green' | 'yellow' | 'red';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  neutral: { bg: 'bg-[#e1e1e1]', text: 'text-[#6f6f6f]' },
  green:   { bg: 'bg-[#e3f2d9]', text: 'text-[#2e7d32]' },
  yellow:  { bg: 'bg-[#fff8e1]', text: 'text-[#f57f17]' },
  red:     { bg: 'bg-[#ffebee]', text: 'text-[#c62828]' },
};

interface DashboardMenuBarItemProps {
  text: string;
  count: number;
  state?: DashboardMenuBarItemState;
  badgeVariant?: BadgeVariant;
  onClick?: () => void;
  className?: string;
}

export default function DashboardMenuBarItem({
  text,
  count,
  state = 'default',
  badgeVariant = 'neutral',
  onClick,
  className,
}: DashboardMenuBarItemProps) {
  const isSelected = state === 'selected';
  const badge = BADGE_STYLES[badgeVariant];

  const BadgeEl = (
    <div className={`${badge.bg} flex items-center px-[8px] py-[3px] rounded-[5px]`}>
      <p className={`font-semibold text-[13px] leading-[20px] ${badge.text} whitespace-nowrap`} style={NS}>
        {count}
      </p>
    </div>
  );

  if (isSelected) {
    return (
      <div
        className={`border-b border-[#6a3e31] flex items-center gap-[5px] pb-[3px] ${className ?? ''}`}
      >
        <p className="font-medium text-[12px] leading-[20px] text-[#6a3e31] tracking-[0.1px] whitespace-nowrap" style={NS}>
          {text}
        </p>
        {BadgeEl}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-[5px] pb-[3px] bg-transparent border-none cursor-pointer ${className ?? ''}`}
    >
      <p className="font-medium text-[12px] leading-[20px] text-[#6a3e31] tracking-[0.1px] whitespace-nowrap" style={NS}>
        {text}
      </p>
      {BadgeEl}
    </button>
  );
}
