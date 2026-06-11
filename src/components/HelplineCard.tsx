import { useState } from 'react';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface HelplineCardProps {
  platformName: string;
  description: string;
  ctaLabel?: string;
  logo?: React.ReactNode;
  onCta?: () => void;
  className?: string;
}

export default function HelplineCard({
  platformName,
  description,
  ctaLabel = 'View helplines',
  logo,
  onCta,
  className,
}: HelplineCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`bg-white flex flex-col cursor-pointer ${className ?? 'w-[300px]'}`}
      style={{
        border: '1px solid #c6c6c6',
        borderRadius: '16px',
        boxShadow: hovered ? '0px 8px 24px rgba(106,62,49,0.16)' : '0px 1px 4px rgba(106,62,49,0.06)',
        transform: hovered ? 'scale(1.006)' : 'scale(1)',
        transformOrigin: 'bottom center',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onCta}
    >
      <div className="flex flex-col items-start pt-[18px] px-[20px]">
        {/* Logo */}
        <div className="flex items-center justify-center overflow-clip rounded-[10px] size-[60px] shrink-0">
          {logo ?? <span className="font-normal text-[18px] text-[rgba(106,62,49,0.3)]" style={NS}>◈</span>}
        </div>

        <div className="h-[20px]" />

        <p className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
          {platformName}
        </p>

        <div className="h-[6px]" />

        <p className="font-medium text-[14px] leading-[20px] text-[#4b4b4b] tracking-[0.1px]" style={NS}>
          {description}
        </p>

        <div className="h-[20px]" />

        <button
          type="button"
          onClick={onCta}
          className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0"
        >
          <p className="font-medium text-[14px] leading-[20px] text-[#6a3e31] tracking-[0.1px] whitespace-nowrap" style={NS}>
            {ctaLabel}
          </p>
          <p className="font-normal text-[13px] leading-[20px] text-[#6a3e31]" style={NS}>→</p>
        </button>

        <div className="h-[18px]" />
      </div>
    </div>
  );
}
