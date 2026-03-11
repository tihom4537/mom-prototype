import { useState } from 'react';

const imgChevron = "https://www.figma.com/api/mcp/asset/6ae6d4dc-859c-4cc6-8de2-afef5388681e";
const imgAccountCircle = "https://www.figma.com/api/mcp/asset/386b84fa-111d-436d-a3e1-259e8c7aa80b";
const imgProfileVec1 = "https://www.figma.com/api/mcp/asset/76b8e93b-7180-4156-aa1c-cd6a72368ad2";
const imgProfileVec2 = "https://www.figma.com/api/mcp/asset/0320df26-878a-4ed8-8160-a439fa270065";

export type DropdownLevel = 0 | 1 | 2 | 3 | 4 | 5;

interface DropdownBoxOfProfileProps {
  menuLabel?: string;
  items?: string[];
  isOpen?: boolean;
  onToggle?: () => void;
  userName?: string;
  userRole?: string;
  gpInfo?: string;
  className?: string;
}

export default function DropdownBoxOfProfile({
  menuLabel = 'Menu Label',
  items = ['Label1', 'Label2', 'Label3', 'Label4', 'Label5'],
  isOpen = false,
  onToggle,
  userName = 'MANOJ MANDYA MANDYA',
  userRole = 'PDO',
  gpInfo = 'Gram Panchayat, kakanur (1501001003)',
  className,
}: DropdownBoxOfProfileProps) {
  const [open, setOpen] = useState(isOpen);
  const toggle = onToggle ?? (() => setOpen(o => !o));
  const isExpanded = onToggle ? isOpen : open;

  return (
    <div className={`flex flex-col items-center justify-center relative ${className ?? 'w-[260px]'}`}>
      {/* Closed state - shows profile pill */}
      {!isExpanded && (
        <div className="bg-[#f7f0ee] flex gap-[11px] items-center p-[10px] rounded-xl w-full cursor-pointer" onClick={toggle}>
          <div className="overflow-clip relative shrink-0 size-[38px]">
            <img alt="" className="absolute block max-w-none size-full" src={imgAccountCircle} />
            <div className="absolute inset-[16.67%_16.67%_29.88%_16.67%]">
              <img alt="" className="absolute block max-w-none size-full" src={imgProfileVec1} />
            </div>
            <div className="absolute inset-[8.33%]">
              <img alt="" className="absolute block max-w-none size-full" src={imgProfileVec2} />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-[3px] items-start min-h-px min-w-px text-[#212121]">
            <p className="font-medium text-sm leading-7 w-full truncate" style={{ fontFamily: 'Noto Sans' }}>
              {userName} <span className="font-light">({userRole})</span>
            </p>
            <p className="font-light text-xs leading-7 w-full truncate" style={{ fontFamily: 'Noto Sans' }}>
              {gpInfo}
            </p>
          </div>
        </div>
      )}

      {/* Opened state - shows menu header + items */}
      {isExpanded && (
        <div className="flex flex-col w-full rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <button
            className="bg-white flex items-center justify-between px-6 py-[11px] rounded-tl-lg rounded-tr-lg w-full"
            onClick={toggle}
          >
            <span className="font-normal text-sm text-[#999] tracking-[0.25px]" style={{ fontFamily: 'Noto Sans' }}>
              {menuLabel}
            </span>
            <div className="relative size-5 flex items-center justify-center">
              <div className="flex inset-[29.17%_20.83%_37.5%_20.83%] items-center justify-center -scale-y-100">
                <div className="relative h-[8px] w-[14px]">
                  <img alt="" className="absolute block max-w-none size-full" src={imgChevron} />
                </div>
              </div>
            </div>
          </button>
          {/* Items list */}
          <div className="bg-white flex flex-col rounded-bl-lg rounded-br-lg overflow-hidden">
            {items.map((item, i) => (
              <button
                key={i}
                className="bg-white flex items-center justify-between px-6 py-[11px] w-full hover:bg-[#f7f0ee] transition-colors"
              >
                <span className="font-normal text-sm text-[#212121] tracking-[0.25px]" style={{ fontFamily: 'Noto Sans' }}>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
