import { useState } from 'react';
import Icon from './Icon';

interface DropdownBoxOfIconProps {
  menuLabel?: string;
  items?: string[];
  isOpen?: boolean;
  onToggle?: () => void;
  triggerIcon?: React.ReactNode;
  className?: string;
}

export default function DropdownBoxOfIcon({
  menuLabel = 'Menu Label',
  items = ['Label1', 'Label2', 'Label3', 'Label4', 'Label5'],
  isOpen,
  onToggle,
  triggerIcon,
  className,
}: DropdownBoxOfIconProps) {
  const [open, setOpen] = useState(isOpen ?? false);
  const toggle = onToggle ?? (() => setOpen(o => !o));
  const isExpanded = onToggle !== undefined ? isOpen : open;

  return (
    <div className={`flex flex-col items-start relative ${className ?? ''}`}>
      {/* Trigger icon (closed state) */}
      {!isExpanded && (
        <button
          className="flex items-center justify-center size-[38px] cursor-pointer"
          onClick={toggle}
          aria-label="Open dropdown"
        >
          {triggerIcon ?? <Icon type="arrow_drop_down" className="relative overflow-clip size-6" />}
        </button>
      )}

      {/* Open state: header + items */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-[260px]">
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
          {/* Items */}
          <div className="bg-white flex flex-col rounded-bl-lg rounded-br-lg overflow-hidden">
            {items.map((item, i) => (
              <button
                key={i}
                className="bg-white flex items-center px-6 py-[11px] w-full hover:bg-[#f7f0ee] transition-colors text-sm text-left"
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
