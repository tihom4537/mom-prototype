import { useState } from 'react';
import Icon from './Icon';

const imgChevron = "https://www.figma.com/api/mcp/asset/6ae6d4dc-859c-4cc6-8de2-afef5388681e";

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
            <div className="relative size-5 flex items-center justify-center -scale-y-100">
              <img alt="" className="absolute block max-w-none size-full" src={imgChevron} />
            </div>
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
