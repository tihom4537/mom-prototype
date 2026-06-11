import { useState } from 'react';
import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type CardVariant =
  | 'illustration'
  | 'illustration-v2'
  | 'illustration-v3'
  | 'illustration-alt'
  | 'illustration-compact'
  | 'illustration-compact-bordered'
  | 'icon'
  | 'icon-yellow'
  | 'icon-purple'
  | 'stat'
  | 'finance';

interface CardProps {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  text?: string;
  statValue?: string;
  statLabel?: string;
  statSuffix?: string;
  illustration?: React.ReactNode;
  icon?: React.ReactNode;
  iconBgColor?: string;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  variant = 'illustration',
  title = 'Human Resource Management System',
  subtitle = 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.',
  text = 'See reports',
  statValue = '10000',
  statLabel = 'Services delivered',
  statSuffix = '+31 more',
  illustration,
  icon,
  iconBgColor,
  className,
  onClick,
}: CardProps) {
  // ── Illustration card ──
  if (variant === 'illustration') {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        className={`bg-white border border-[#c6c6c6] rounded-[10px] flex flex-col justify-between items-start p-[20px] h-full cursor-pointer ${className ?? ''}`}
        style={{
          transform: hovered ? 'scale(1.006)' : 'scale(1)',
          transformOrigin: 'bottom center',
          boxShadow: hovered ? '0px 8px 24px rgba(0,0,0,0.10)' : 'none',
          transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex flex-col gap-[20px] items-start w-full">
          {/* Illustration slot — fixed 96×88, image fits inside at natural ratio */}
          <div className="max-w-[96px] max-h-[88px] shrink-0 flex items-start justify-start">
            {illustration ?? null}
          </div>
          <div className="flex flex-col gap-[14px] items-start w-full">
            <p className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] w-full" style={NS}>{title}</p>
            <p className="font-normal text-[14px] leading-[21px] text-[#3b3b3b] w-full" style={NS}>{subtitle}</p>
          </div>
        </div>
        <div className="flex gap-[5px] items-center mt-[30px]">
          <span className="font-normal text-[14px] text-black" style={NS}>{text}</span>
          <Icon name="chevron_right" size="small" color="#000000" />
        </div>
      </div>
    );
  }

  // ── Illustration-v2 ──
  if (variant === 'illustration-v2') {
    const [hovered, setHovered] = useState(false);
    return (
      // Outer card: white, border, padding 20px
      <div
        className="bg-white border border-[#c6c6c6] rounded-[14px] px-[20px] pb-[20px] pt-0 cursor-pointer w-[358px] shrink-0"
        style={{
          transform: hovered ? 'scale(1.006)' : 'scale(1)',
          transformOrigin: 'bottom center',
          boxShadow: hovered ? '0px 8px 24px rgba(0,0,0,0.10)' : 'none',
          transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Illustration — normal flow, right-aligned, own top padding */}
        <div className="flex justify-end pt-[20px]">
          {illustration ?? null}
        </div>
        {/* Folder — mt creates gap below illustration */}
        <div className="rounded-tl-[10px] rounded-br-[10px] rounded-bl-[10px] overflow-hidden -mt-[40px]">
          {/* Tab header */}
          <div className="relative h-[47px] w-full">
            <div className="absolute inset-y-0 left-0 w-[154px] bg-[#f7f0ee] rounded-tl-[10px] rounded-tr-[10px] flex items-center px-[13px]">
              <p className="font-semibold text-[12px] text-[#6a3e31] leading-normal" style={NS}>{title}</p>
            </div>
            <div className="absolute bottom-0 left-[154px] right-0 h-[19px] bg-[#f7f0ee] rounded-tr-[10px]" />
          </div>
          {/* Divider */}
          <div className="bg-[#f7f0ee] px-[13px]">
            <div className="bg-[#bf8573] h-px w-full" />
          </div>
          {/* Body */}
          <div className="bg-[#f7f0ee] px-[13px] pt-[18px] pb-[24px] min-h-[140px]">
            <p className="font-normal text-[12px] text-[#3b3b3b] leading-normal" style={NS}>{subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Illustration-v3: no border, drop-shadow, #efe0dc body, CTA inside ──
  if (variant === 'illustration-v3') {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        className="relative cursor-pointer w-[340px] shrink-0 flex flex-col"
        style={{
          transform: hovered ? 'scale(1.006)' : 'scale(1)',
          transformOrigin: 'bottom center',
          transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Illustration — fixed height container, image anchored to bottom, overflow visible */}
        <div className="relative z-10 flex justify-end items-end px-[20px] h-[100px] shrink-0" style={{ overflow: 'visible' }}>
          {illustration ?? null}
        </div>
        {/* White card behind everything */}
        <div
          className="absolute left-0 right-0 bottom-0 top-[35px] bg-white rounded-[14px]"
          style={{
            boxShadow: hovered ? '0px 8px 24px rgba(106,62,49,0.18)' : '0px 2px 8px rgba(106,62,49,0.10)',
            transition: 'box-shadow 0.3s ease-out',
          }}
        />
        {/* Folder */}
        <div
          className="relative z-10 rounded-tl-[10px] rounded-br-[10px] rounded-bl-[10px] overflow-hidden -mt-[40px] flex flex-col flex-1"
        >
          {/* Tab header */}
          <div className="flex w-full">
            <div className="bg-[#f7f0ee] rounded-tl-[10px] rounded-tr-[10px] w-[184px] shrink-0 flex items-center px-[13px] py-[12px]">
              <p className="font-semibold text-[16px] text-[#6a3e31] leading-snug" style={NS}>{title}</p>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <div className="bg-[#f7f0ee] rounded-tr-[10px] h-[19px] w-full" />
            </div>
          </div>
          {/* Body */}
          <div className="bg-[#efe0dc] px-[13px] pt-[18px] pb-[24px] flex-1 flex flex-col gap-[16px]">
            <p className="font-normal text-[14px] text-[#3b3b3b] leading-normal flex-1" style={NS}>{subtitle}</p>
            <div className="flex gap-[5px] items-center">
              <span className="font-normal text-[14px] text-black leading-[21px]" style={NS}>{text}</span>
              <Icon name="chevron_right" size="small" color="#000000" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Illustration-alt: bordered primary, with illustration top-right ──
  if (variant === 'illustration-alt') {
    return (
      <div
        className={`bg-white border border-[rgba(106,62,49,0.4)] rounded-[10px] flex flex-col items-end justify-end p-[20px] w-[358px] h-[285px] relative ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="absolute top-0 left-0 right-0 flex flex-col items-start">
          <div className="flex items-center w-[174px] h-[28px] bg-[#f7f0ee] relative">
            <p className="font-semibold text-[12px] text-[#6a3e31] ml-[11px]" style={NS}>{title}</p>
          </div>
          <div className="bg-[#f7f0ee] h-[19px] w-full rounded-tr-[12px]" />
        </div>
        <div className="absolute top-[-49px] right-[20px] h-[88px] w-[96px]">
          {illustration}
        </div>
        <div className="w-full bg-[#f7f0ee] rounded-bl-[12px] rounded-br-[12px] h-[140px] relative">
          <div className="absolute left-[13px] top-[18px] w-[200px] flex items-center justify-center">
            <p className="font-normal text-[12px] text-[#3b3b3b] flex-1" style={NS}>{subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Illustration-compact: bordered neutral, smaller ──
  if (variant === 'illustration-compact') {
    return (
      <div
        className={`bg-white border border-[rgba(106,62,49,0.4)] rounded-[10px] flex flex-col gap-[10px] items-end justify-end p-[20px] w-[358px] h-[245px] ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="flex flex-col gap-[2px] items-start w-full">
          <div className="relative w-full">
            <div className="h-[28px] w-[174px] bg-[#f7f0ee]" />
            <div className="bg-[#f7f0ee] h-[19px] w-full rounded-tr-[12px]" />
            <div className="absolute left-[11px] top-[7px] w-[138px]">
              <p className="font-semibold text-[12px] text-[#6a3e31]" style={NS}>{title}</p>
            </div>
          </div>
          <div className="bg-[#f7f0ee] w-full h-[101px] rounded-bl-[12px] rounded-br-[12px] relative">
            <div className="absolute left-[13px] top-[18px] w-[200px]">
              <p className="font-normal text-[12px] text-[#3b3b3b]" style={NS}>{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="absolute right-[20px] top-[16px] h-[89px] w-[110px]">
          {illustration}
        </div>
      </div>
    );
  }

  // ── Illustration-compact-bordered: neutral border ──
  if (variant === 'illustration-compact-bordered') {
    return (
      <div
        className={`bg-white border border-[#ddd] rounded-[10px] flex flex-col gap-[10px] items-end justify-end p-[20px] w-[358px] h-[245px] relative ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="flex flex-col gap-[2px] items-start w-full">
          <div className="relative w-full">
            <div className="h-[28px] w-[174px] bg-[#f7f0ee]" />
            <div className="bg-[#f7f0ee] h-[19px] w-full rounded-tr-[12px]" />
            <div className="absolute left-[11px] top-[7px] w-[138px]">
              <p className="font-semibold text-[12px] text-[#6a3e31]" style={NS}>{title}</p>
            </div>
          </div>
          <div className="bg-[#f7f0ee] w-full h-[101px] rounded-bl-[12px] rounded-br-[12px] relative">
            <div className="absolute left-[13px] top-[18px] w-[200px]">
              <p className="font-normal text-[12px] text-[#3b3b3b]" style={NS}>{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="absolute right-[20px] top-[16px] h-[89px] w-[110px]">
          {illustration}
        </div>
      </div>
    );
  }

  // ── Icon card (green bg icon) ──
  if (variant === 'icon') {
    return (
      <div
        className={`bg-white border border-[rgba(106,62,49,0.4)] rounded-[10px] flex flex-col gap-[20px] items-start p-[20px] w-[358px] ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="bg-[#d5faf0] flex items-center justify-center p-[10px] rounded-[8px] size-[60px] shrink-0">
          {icon ?? <span className="material-icons text-[#6a3e31] text-[40px]">add</span>}
        </div>
        <div className="flex flex-col gap-[14px] items-start w-full">
          <p className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] w-full" style={NS}>{title}</p>
          <p className="font-normal text-[14px] leading-[21px] text-[#3b3b3b] w-full" style={NS}>{subtitle}</p>
        </div>
      </div>
    );
  }

  // ── Icon-yellow ──
  if (variant === 'icon-yellow') {
    return (
      <div
        className={`bg-white border border-[rgba(106,62,49,0.4)] rounded-[10px] flex flex-col gap-[20px] items-start p-[20px] w-[358px] ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="bg-[#fdf7c9] flex items-center justify-center p-[10px] rounded-[8px] size-[60px] shrink-0">
          {icon ?? <span className="material-icons text-[#6a3e31] text-[40px]">add</span>}
        </div>
        <div className="flex flex-col gap-[14px] items-start w-full">
          <p className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] w-full" style={NS}>{title}</p>
          <p className="font-normal text-[14px] leading-[21px] text-[#3b3b3b] w-full" style={NS}>{subtitle}</p>
        </div>
      </div>
    );
  }

  // ── Icon-purple ──
  if (variant === 'icon-purple') {
    return (
      <div
        className={`bg-white border border-[rgba(106,62,49,0.4)] rounded-[10px] flex flex-col gap-[20px] items-start p-[20px] w-[358px] ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="bg-[#f8e9fe] flex items-center justify-center p-[10px] rounded-[8px] size-[60px] shrink-0">
          {icon ?? <span className="material-icons text-[#6a3e31] text-[40px]">add</span>}
        </div>
        <div className="flex flex-col gap-[14px] items-start w-full">
          <p className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] w-full" style={NS}>{title}</p>
          <p className="font-normal text-[14px] leading-[21px] text-[#3b3b3b] w-full" style={NS}>{subtitle}</p>
        </div>
      </div>
    );
  }

  // ── Stat card ──
  if (variant === 'stat') {
    return (
      <div
        className={`bg-white border border-[#ddd] rounded-[10px] flex gap-[30px] items-start p-[20px] w-[358px] ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="bg-[#f7f0ee] flex items-center justify-center p-[10px] rounded-[8px] size-[39px] shrink-0">
          {icon ?? <span className="material-icons text-[#6a3e31] text-[25px]">add</span>}
        </div>
        <div className="flex items-end gap-[42px] w-full">
          <div className="flex flex-col gap-[5px] items-start flex-1 min-w-0">
            <p className="font-semibold text-[18px] leading-[24px] text-[#6a3e31]" style={NS}>{statValue}</p>
            <p className="font-normal text-[12px] leading-[21px] text-[#3b3b3b]" style={NS}>{statLabel}</p>
          </div>
          <p className="font-normal text-[10px] text-[#3b3b3b] whitespace-nowrap shrink-0" style={NS}>{statSuffix}</p>
        </div>
      </div>
    );
  }

  // ── Finance card ──
  if (variant === 'finance') {
    return (
      <div
        className={`bg-white border border-[#c6c6c6] rounded-[10px] flex flex-col gap-[30px] items-start p-[20px] w-[358px] ${className ?? ''}`}
        onClick={onClick}
      >
        <div className="flex flex-col gap-[30px] items-start w-full">
          <div className="h-[101px] w-[90px] bg-[#f7f0ee] rounded-[8px] flex items-center justify-center shrink-0">
            {illustration ?? <span className="material-icons text-[#6a3e31] text-[40px]">account_balance</span>}
          </div>
          <div className="flex flex-col gap-[14px] items-start w-full">
            <p className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] w-full" style={NS}>{title}</p>
            <p className="font-normal text-[14px] leading-[21px] text-[#3b3b3b] w-full" style={NS}>{subtitle}</p>
          </div>
        </div>
        <div className="flex gap-[5px] items-center">
          <span className="font-normal text-[14px] text-black" style={NS}>See reports</span>
          <Icon name="chevron_right" size="small" color="#000000" />
        </div>
      </div>
    );
  }

  return null;
}
