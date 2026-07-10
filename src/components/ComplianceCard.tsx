import DashboardStatusBadge from './DashboardStatusBadge';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type ComplianceStatus =
  | 'on-track'
  | 'due-soon'
  | 'overdue'
  | 'circle-on-track'
  | 'circle-due-soon'
  | 'circle-overdue';

interface ComplianceCardProps {
  meetingType: string;
  completed: number;
  total: number;
  nextDueText: string;
  status?: ComplianceStatus;
  completedYearLabel?: string;
  badgeLabelOnTrack?: string;
  badgeLabelDueSoon?: string;
  badgeLabelOverdue?: string;
  className?: string;
}

// Badge for the circle variants — uses inline dot, slightly different from DashboardStatusBadge
function CircleBadge({ variant, label }: { variant: 'green' | 'yellow' | 'red'; label: string }) {
  const cfg = {
    green:  { bg: 'bg-[#e8f5e9]', dot: 'bg-[#2e7d32]',  text: 'text-[#2e7d32]' },
    yellow: { bg: 'bg-[#fff8e1]', dot: 'bg-[#f57f17]',   text: 'text-[#f57f17]' },
    red:    { bg: 'bg-[#ffebee]', dot: 'bg-[#b7131a]',   text: 'text-[#b7131a]' },
  }[variant];
  return (
    <div className={`flex gap-[4px] items-center px-[8px] py-[3px] rounded-[100px] ${cfg.bg}`}>
      <div className={`size-[5px] rounded-full shrink-0 ${cfg.dot}`} />
      <p className={`font-medium text-[12px] leading-[16px] tracking-[0.3px] whitespace-nowrap ${cfg.text}`} style={NS}>
        {label}
      </p>
    </div>
  );
}

export default function ComplianceCard({
  meetingType,
  completed,
  total,
  nextDueText,
  status = 'circle-on-track',
  completedYearLabel = 'completed this year',
  badgeLabelOnTrack = 'On track',
  badgeLabelDueSoon = 'Due soon',
  badgeLabelOverdue = 'Overdue',
  className,
}: ComplianceCardProps) {
  const isCircle = status.startsWith('circle-');
  const indicators = Array.from({ length: total }, (_, i) => i < completed);

  const badgeLabels = { onTrack: badgeLabelOnTrack, dueSoon: badgeLabelDueSoon, overdue: badgeLabelOverdue };

  // Per-status config
  const cfg = {
    'on-track':        { badgeVariant: 'green'  as const, badgeLabel: badgeLabels.onTrack, numColor: 'text-[#2e7d32]', filledColor: 'bg-[#2e7d32]', dotColor: 'bg-[#2e7d32]' },
    'due-soon':        { badgeVariant: 'yellow' as const, badgeLabel: badgeLabels.dueSoon, numColor: 'text-[#f57f17]', filledColor: 'bg-[#f57f17]', dotColor: 'bg-[#f57f17]' },
    'overdue':         { badgeVariant: 'red'    as const, badgeLabel: badgeLabels.overdue, numColor: 'text-[#c62828]', filledColor: 'bg-[#c62828]', dotColor: 'bg-[#c62828]' },
    'circle-on-track': { badgeVariant: 'green'  as const, badgeLabel: badgeLabels.onTrack, numColor: 'text-[#6a3e31]', filledColor: 'bg-[var(--success-500)]', dotColor: 'bg-[#2e7d32]' },
    'circle-due-soon': { badgeVariant: 'yellow' as const, badgeLabel: badgeLabels.dueSoon, numColor: 'text-[#6a3e31]', filledColor: 'bg-[var(--success-500)]', dotColor: 'bg-[#f57f17]' },
    'circle-overdue':  { badgeVariant: 'red'    as const, badgeLabel: badgeLabels.overdue, numColor: 'text-[#c62828]', filledColor: 'bg-[var(--success-500)]', dotColor: 'bg-[#b7131a]' },
  }[status];

  const cardBorder = isCircle ? 'border-[#ddd]' : 'border-[rgba(106,62,49,0.16)]';

  return (
    <div className={`bg-white border ${cardBorder} rounded-[10px] p-[16px] flex flex-col items-start drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] ${className ?? 'w-[280px]'}`}>

      {/* Title row — circle variants: title left, badge right on same row */}
      {isCircle ? (
        <div className="flex items-start justify-between w-full gap-[8px]">
          <p className="font-semibold text-[13px] leading-[18px] text-[#212121] tracking-[0.1px] flex-1 min-w-0" style={NS}>
            {meetingType}
          </p>
          <CircleBadge variant={cfg.badgeVariant} label={cfg.badgeLabel} />
        </div>
      ) : (
        <p className="font-semibold text-[13px] leading-[18px] text-[#212121] tracking-[0.1px] w-full" style={NS}>
          {meetingType}
        </p>
      )}

      <div className="h-[10px]" />

      {/* Count row */}
      {isCircle ? (
        // circle: count + "completed this year" on same row, badge already in title row
        <div className="flex items-baseline gap-[10px] w-full">
          <div className="flex items-baseline gap-[2px] leading-[36px]">
            <p className={`font-semibold text-[32px] ${cfg.numColor}`} style={NS}>{completed}</p>
            <p className="font-normal text-[16px] text-[#5e5e5e]" style={NS}>/{total}</p>
          </div>
          <p className="font-normal text-[12px] leading-[16px] text-[#5e5e5e] tracking-[0.2px]" style={NS}>
            {completedYearLabel}
          </p>
        </div>
      ) : (
        // box variants: count + badge side by side, "completed this year" below
        <>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-baseline gap-[2px] leading-[36px]">
              <p className={`font-semibold text-[32px] ${cfg.numColor}`} style={NS}>{completed}</p>
              <p className="font-normal text-[16px] text-[#5e5e5e]" style={NS}>/{total}</p>
            </div>
            <DashboardStatusBadge label={cfg.badgeLabel} variant={cfg.badgeVariant} />
          </div>
          <p className="font-normal text-[12px] leading-[16px] text-[#5e5e5e] tracking-[0.2px]" style={NS}>
            {completedYearLabel}
          </p>
        </>
      )}

      <div className="h-[12px]" />

      {/* Progress indicators */}
      <div className={`flex flex-wrap ${isCircle ? 'gap-[4px]' : 'gap-[3px]'}`}>
        {indicators.map((filled, i) =>
          isCircle ? (
            <div
              key={i}
              className={`size-[12px] rounded-full shrink-0 ${filled ? cfg.filledColor : 'bg-[#f3f3f3] border-[1.5px] border-[rgba(176,176,176,0.5)]'}`}
            />
          ) : (
            <div
              key={i}
              className={`size-[14px] rounded-[3px] shrink-0 ${
                filled
                  ? `${cfg.filledColor} flex items-center justify-center`
                  : 'bg-[#f3f3f3] border-[1.5px] border-[rgba(106,62,49,0.4)]'
              }`}
            >
              {filled && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )
        )}
      </div>

      <div className="h-[20px]" />

      {/* Due row */}
      <div className="flex items-center gap-[5px]">
        <div className={`shrink-0 size-[5px] rounded-full ${cfg.dotColor}`} />
        <p className="font-normal text-[12px] leading-[16px] text-[#5e5e5e] tracking-[0.2px]" style={NS}>
          {nextDueText}
        </p>
      </div>
    </div>
  );
}
