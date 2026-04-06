import { useState } from 'react';
import Icon from './Icon';

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
          <div className="flex items-center justify-center shrink-0 size-[38px]">
            <Icon name="account_circle" size="large" color="#6a3e31" />
          </div>
          <div className="flex flex-1 flex-col gap-[3px] items-start min-h-px min-w-px text-[#212121]">
            <p className="font-medium text-sm leading-[18px] w-full truncate" style={{ fontFamily: 'Noto Sans' }}>
              {userName} <span className="font-light">({userRole})</span>
            </p>
            <p className="font-light text-xs leading-[18px] w-full truncate" style={{ fontFamily: 'Noto Sans' }}>
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
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleY(-1)' }}>
              <path d="M1 1l6 6 6-6" />
            </svg>
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
