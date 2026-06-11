import Icon, { IconName } from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type MetricCardTrend = 'up' | 'down' | 'none';

interface DashboardMetricCardProps {
  icon?: IconName;
  primaryValue?: string;
  label?: string;
  trend?: MetricCardTrend;
  changeValue?: string;
  changeLabel?: string;
  className?: string;
}

export default function DashboardMetricCard({
  icon = 'analytics',
  primaryValue = '1,24,500',
  label = 'Total GP Meetings',
  trend = 'up',
  changeValue = '+12.4%',
  changeLabel = 'vs last month',
  className,
}: DashboardMetricCardProps) {
  const isUp   = trend === 'up';
  const isDown = trend === 'down';
  const hasTrend = isUp || isDown;

  const trendBg      = isDown ? 'bg-[#ffebee]' : 'bg-[#e8f5e9]';
  const trendText    = isDown ? 'text-[#c62828]' : 'text-[#2e7d32]';
  const trendArrow   = isDown ? '↓' : '↑';
  const changeArrow  = isDown ? '▼' : '▲';

  return (
    <div
      className={`bg-white border border-[#dddddd] flex flex-col items-start p-[15px] rounded-[14px] w-[220px] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] ${className ?? ''}`}
    >
      {/* Top row: icon box + trend badge */}
      <div className="flex items-center justify-between overflow-hidden shrink-0 w-full">
        <div className="bg-[#f7f0ee] flex items-center justify-center overflow-hidden p-[10px] rounded-[10px] shrink-0 size-[40px]">
          <Icon name={icon} size="medium" color="#6a3e31" />
        </div>

        {hasTrend && (
          <div className={`${trendBg} ${trendText} flex gap-[3px] items-center overflow-hidden px-[8px] py-[4px] rounded-[100px] shrink-0 text-[11px] whitespace-nowrap`}>
            <span className="font-bold" style={NS}>{trendArrow}</span>
            <span className="font-medium tracking-[0.3px]" style={NS}>{changeValue}</span>
          </div>
        )}
      </div>

      <div className="h-[12px] shrink-0 w-full" />

      {/* Value + label + divider + change row */}
      <div className="flex flex-col gap-[8px] items-start shrink-0 w-full">
        <div className="flex flex-col gap-[2px] items-start w-full leading-normal">
          <p className="font-bold text-[24px] text-[#6a3e31] tracking-[-0.5px] w-full" style={NS}>
            {primaryValue}
          </p>
          <p className="font-normal text-[12px] text-[#525c66] tracking-[0.2px] w-full" style={NS}>
            {label}
          </p>
        </div>

        <div className="bg-[#e0e0e0] h-px shrink-0 w-full" />

        {changeLabel && (
          <div className="flex gap-[4px] items-center overflow-hidden shrink-0 whitespace-nowrap leading-normal">
            {hasTrend && <span className={`font-normal text-[9px] ${trendText}`} style={NS}>{changeArrow}</span>}
            <span className="font-normal text-[11px] text-[#525c66] tracking-[0.2px]" style={NS}>{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
