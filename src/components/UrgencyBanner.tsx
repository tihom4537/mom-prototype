import Button from './Button';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type UrgencyBannerStatus = 'in-progress' | 'scheduled-today' | 'overdue-unsigned';

interface UrgencyBannerProps {
  status: UrgencyBannerStatus;
  meetingName: string;
  meta?: string;
  stagePill?: string;
  labelText?: string;
  ctaText?: string;
  onAction?: () => void;
  className?: string;
}

const CONFIG: Record<UrgencyBannerStatus, {
  borderColor: string;
  dotColor: string;
  labelText: string;
  labelColor: string;
  nameColor: string;
  ctaText: string;
}> = {
  'in-progress': {
    borderColor: 'border-[#b7131a]',
    dotColor:    'bg-[#c62828]',
    labelText:   'MEETING IN PROGRESS',
    labelColor:  'text-[#6a3e31]',
    nameColor:   'text-[#6a3e31]',
    ctaText:     'Continue meeting',
  },
  'scheduled-today': {
    borderColor: 'border-[#2e7d32]',
    dotColor:    'bg-[#2e7d32]',
    labelText:   'SCHEDULED TODAY',
    labelColor:  'text-[#2e7d32]',
    nameColor:   'text-[#2e7d32]',
    ctaText:     'Start Meeting',
  },
  'overdue-unsigned': {
    borderColor: 'border-[#f57f17]',
    dotColor:    'bg-[#f57f17]',
    labelText:   'ACTION REQUIRED',
    labelColor:  'text-[#f57f17]',
    nameColor:   'text-[#f57f17]',
    ctaText:     'Complete Now',
  },
};

export default function UrgencyBanner({
  status,
  meetingName,
  meta,
  stagePill,
  labelText,
  ctaText,
  onAction,
  className,
}: UrgencyBannerProps) {
  const cfg = CONFIG[status];
  const resolvedLabel = labelText ?? cfg.labelText;
  const resolvedCta   = ctaText   ?? cfg.ctaText;

  return (
    <div
      className={`bg-white border ${cfg.borderColor} flex items-center justify-between px-[20px] h-[64px] rounded-[10px] ${className ?? 'w-full'}`}
    >
      {/* Left */}
      <div className="flex items-center gap-[12px]">
        <div className={`shrink-0 size-[10px] rounded-[5px] ${cfg.dotColor}`} />
        <div className="flex flex-col gap-[2px]">
          <p className={`font-medium text-[12px] leading-[16px] tracking-[1.5px] ${cfg.labelColor}`} style={NS}>
            {resolvedLabel}
          </p>
          <div className="flex items-center gap-[8px]">
            <p className={`font-semibold text-[14px] leading-[20px] tracking-[0.1px] ${cfg.nameColor}`} style={NS}>
              {meetingName}
            </p>
            {stagePill && (
              <div className="bg-[#dfc2b9] flex items-center px-[10px] py-[3px] rounded-full">
                <p className="font-medium text-[12px] leading-[16px] text-[#6a3e31] tracking-[0.3px] whitespace-nowrap" style={NS}>
                  {stagePill}
                </p>
              </div>
            )}
            {meta && (
              <p className="font-normal text-[12px] leading-[20px] text-[#6a3e31] tracking-[0.25px] whitespace-nowrap" style={NS}>
                {meta}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        variant="filled"
        size="small"
        iconPlacement="none"
        text={resolvedCta}
        onClick={onAction}
      />
    </div>
  );
}
