import DashboardStatusBadge from './DashboardStatusBadge';
import Button from './Button';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type NoticeBadgeVariant = 'green' | 'yellow';

interface UpcomingMeetingRowProps {
  daysLabel: string;
  meetingName: string;
  meetingMeta: string;
  noticeBadge?: NoticeBadgeVariant;
  noticeBadgeLabel?: string;
  viewDetailsLabel?: string;
  onViewDetails?: () => void;
  isLast?: boolean;
  className?: string;
}

export default function UpcomingMeetingRow({
  daysLabel,
  meetingName,
  meetingMeta,
  noticeBadge = 'yellow',
  noticeBadgeLabel = 'Notice sent',
  viewDetailsLabel = 'View details',
  onViewDetails,
  isLast = false,
  className,
}: UpcomingMeetingRowProps) {
  return (
    <div
      className={`bg-white flex items-center justify-between py-[10px]
        ${isLast ? '' : 'border-b border-[rgba(106,62,49,0.24)]'}
        ${className ?? 'w-full'}`}
    >
      {/* Left: day pill + name/meta + notice badge */}
      <div className="flex items-start gap-[14px]">
        {/* Day pill */}
        <div className="bg-[#f7f0ee] flex items-center px-[10px] py-[4px] rounded-full shrink-0">
          <p className="font-semibold text-[12px] leading-[16px] text-[#6a3e31] tracking-[0.3px] whitespace-nowrap" style={NS}>
            {daysLabel}
          </p>
        </div>
        {/* Name + meta */}
        <div className="flex flex-col gap-[3px]">
          {/* Title row + badge inline */}
          <div className="flex items-center gap-[8px]">
            <p className="font-semibold text-[14px] leading-[20px] text-[#212121] tracking-[0.1px] whitespace-nowrap" style={NS}>
              {meetingName}
            </p>
            {noticeBadge && (
              <DashboardStatusBadge label={noticeBadgeLabel} variant={noticeBadge} />
            )}
          </div>
          <p className="font-normal text-[12px] leading-[16px] text-[#525c66] tracking-[0.25px] whitespace-nowrap" style={NS}>
            {meetingMeta}
          </p>
        </div>
      </div>

      {/* Right: View details icon button */}
      <Button
        variant="filled"
        size="small"
        text={viewDetailsLabel}
        iconName="chevron_right"
        iconPlacement="right"
        onClick={onViewDetails}
      />
    </div>
  );
}
