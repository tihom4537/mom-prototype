import { useState } from 'react';
import Icon from './Icon';
import type { IconName } from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export interface AboutStakeholdersCardProps {
  stakeholderName?: string;
  descpp?: string;
  cta?: string;
  icon?: IconName;
  onCta?: () => void;
  className?: string;
}

export default function AboutStakeholdersCard({
  stakeholderName = 'Citizens & Residents',
  descpp = "Look up your GP's meeting records, check which schemes are active in your area, and find out what services are available at your local panchayat — without visiting any office.",
  cta = 'Browse your GP →',
  icon = 'people',
  onCta,
  className,
}: AboutStakeholdersCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`bg-white border flex flex-col items-start px-[20px] py-[18px] rounded-[12px] w-full cursor-pointer ${className ?? ''}`}
      style={{
        borderColor: '#c6c6c6',
        boxShadow: hovered ? '0px 8px 24px rgba(106,62,49,0.16)' : '0px 1px 4px rgba(106,62,49,0.06)',
        transform: hovered ? 'scale(1.006)' : 'scale(1)',
        transformOrigin: 'bottom center',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onCta}
    >
      <div className="flex gap-[10px] items-center overflow-clip shrink-0">
        <div className="bg-[#f7f0ee] flex items-center justify-center overflow-clip p-[8px] rounded-[8px] shrink-0 size-[36px]">
          <Icon name={icon} size="medium" color="#6a3e31" />
        </div>
        <span className="font-semibold text-[20px] leading-[24px] text-[#212121] whitespace-nowrap" style={NS}>
          {stakeholderName}
        </span>
      </div>
      <div className="h-[10px] shrink-0 w-full" />
      <p className="font-normal text-[14px] leading-[20px] text-[#4b4b4b] tracking-[0.25px] w-full" style={NS}>
        {descpp}
      </p>
      <div className="h-[38px] shrink-0 w-full" />
      <button
        type="button"
        className="font-medium text-[14px] text-[#6a3e31] tracking-[0.1px] whitespace-nowrap leading-[20px] bg-transparent border-none p-0 cursor-pointer"
        style={NS}
        onClick={onCta}
      >
        {cta}
      </button>
    </div>
  );
}
