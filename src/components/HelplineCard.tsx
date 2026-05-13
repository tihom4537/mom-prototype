const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface HelplineCardProps {
  platformName: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export default function HelplineCard({
  platformName,
  description,
  ctaLabel = 'View helplines',
  onCta,
  className,
}: HelplineCardProps) {
  return (
    <div
      className={`bg-white border border-[rgba(106,62,49,0.16)] rounded-[16px] overflow-hidden flex flex-col ${className ?? 'w-[300px]'}`}
    >
      <div className="flex flex-col items-start pt-[18px] px-[20px]">
        {/* Logo placeholder */}
        <div className="bg-white border border-[rgba(106,62,49,0.15)] flex items-center justify-center rounded-[10px] size-[48px] shrink-0">
          <span className="font-normal text-[18px] text-[rgba(106,62,49,0.3)]" style={NS}>◈</span>
        </div>

        <div className="h-[20px]" />

        <p className="font-semibold text-[15px] leading-[22px] text-[#6a3e31]" style={NS}>
          {platformName}
        </p>

        <div className="h-[6px]" />

        <p className="font-normal text-[12px] leading-[20px] text-[#525c66]" style={NS}>
          {description}
        </p>

        <div className="h-[20px]" />

        <button
          type="button"
          onClick={onCta}
          className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0"
        >
          <p className="font-medium text-[13px] leading-[20px] text-[#6a3e31] whitespace-nowrap" style={NS}>
            {ctaLabel}
          </p>
          <p className="font-normal text-[13px] leading-[20px] text-[rgba(106,62,49,0.6)]" style={NS}>→</p>
        </button>

        <div className="h-[18px]" />
      </div>
    </div>
  );
}
