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

  const lastSpace = text.lastIndexOf(' ');
  const head = lastSpace >= 0 ? text.slice(0, lastSpace) : '';
  const tail = lastSpace >= 0 ? text.slice(lastSpace + 1) : text;

  const Badge = (
    <span className={`${badge.bg} inline-block px-[6px] py-[2px] rounded-[5px] align-bottom ml-[5px]`}>
      <span className={`font-semibold text-[13px] leading-[20px] ${badge.text}`} style={NS}>
        {count}
      </span>
    </span>
  );

  const content = (
    <span className="font-medium text-[14px] leading-[20px] text-[#6a3e31] tracking-[0.1px]" style={NS}>
      {head ? <>{head} </> : null}
      <span className="whitespace-nowrap">{tail}{Badge}</span>
    </span>
  );

  if (isSelected) {
    return (
      <div className={`border-b border-[#6a3e31] inline-block pb-[3px] ${className ?? ''}`}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-block pb-[3px] bg-transparent border-none cursor-pointer text-left ${className ?? ''}`}
    >
      {content}
    </button>
  );
}
