import { useState } from 'react';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface EcosystemAppCardProps {
  appTitle?: string;
  description?: string;
  visitLabel?: string;
  logo?: React.ReactNode;
  onVisit?: () => void;
  className?: string;
}

export default function EcosystemAppCard({
  appTitle = 'App Name',
  description = 'Brief description of what you can find or do on this site.',
  visitLabel = 'Visit site →',
  logo,
  onVisit,
  className,
}: EcosystemAppCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`bg-white border flex flex-col items-start p-[20px] rounded-[14px] w-[220px] cursor-pointer ${className ?? ''}`}
      style={{
        borderColor: '#c6c6c6',
        boxShadow: hovered ? '0px 8px 24px rgba(106,62,49,0.16)' : '0px 1px 4px rgba(106,62,49,0.06)',
        transform: hovered ? 'scale(1.006)' : 'scale(1)',
        transformOrigin: 'bottom center',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onVisit}
    >
      {/* Logo area */}
      <div className="flex items-center justify-center overflow-clip rounded-[10px] shrink-0 size-[88px]">
        {logo ?? (
          <span className="font-bold text-[18px] text-[#6a3e31] whitespace-nowrap leading-normal" style={NS}>
            ◈
          </span>
        )}
      </div>

      <div className="h-[12px] shrink-0 w-full" />

      <p className="font-semibold text-[15px] text-[#6a3e31] tracking-[0.15px] leading-normal w-full" style={NS}>
        {appTitle}
      </p>

      <div className="h-[6px] shrink-0 w-full" />

      <p className="font-normal text-[12px] text-[#3b3b3b] tracking-[0.25px] leading-normal w-full" style={NS}>
        {description}
      </p>

      <div className="h-[25px] shrink-0 w-full" />

      <button
        type="button"
        className="font-medium text-[12px] text-[#6a3e31] tracking-[0.1px] whitespace-nowrap leading-normal bg-transparent border-none p-0 cursor-pointer"
        style={NS}
        onClick={e => { e.stopPropagation(); onVisit?.(); }}
      >
        {visitLabel}
      </button>
    </div>
  );
}
