import React from 'react';

export type TableCellAlign = 'left' | 'center' | 'right';

export type TableCellType = 'header' | 'default' | 'checkbox' | 'input' | 'input-with-attachment';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface TableCellProps {
  children?: React.ReactNode;
  cellType?: TableCellType;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
  // input / input-with-attachment props
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  onAttach?: () => void;
}

export default function TableCell({
  children,
  cellType = 'default',
  className = '',
  selected = false,
  onClick,
  value,
  onChange,
  placeholder,
  onAttach,
}: TableCellProps) {
  if (cellType === 'header') {
    return (
      <div className={`flex items-start pt-[13px] pb-[13px] px-[20px] min-h-[43px] bg-[#ddd] shrink-0 ${className}`}>
        <span className="text-[14px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] whitespace-nowrap" style={NS}>
          {children}
        </span>
      </div>
    );
  }

  if (cellType === 'checkbox') {
    return (
      <div
        className={`flex items-center gap-[20px] px-[20px] py-0 h-[50px] shrink-0 transition-colors cursor-pointer
          ${selected ? 'bg-[#e8f5e9]' : 'bg-white group-hover:bg-[#eeeeee]'} ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  // Cell Type9 — plain input field, rounded border
  if (cellType === 'input') {
    return (
      <div className={`flex items-center px-[8px] py-[6px] h-[50px] shrink-0 ${selected ? 'bg-[#e8f5e9]' : 'bg-white group-hover:bg-[#eeeeee]'} ${className}`}>
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-[#b0b0b0] rounded-[8px] px-[8px] py-[5px] text-[14px] text-[#212121] placeholder-[#868686] outline-none focus:border-[#ae6651] focus:shadow-[0_0_0_2px_rgba(106,62,49,0.12)] transition-all"
          style={NS}
        />
      </div>
    );
  }

  // Fill cell — input + attachment icon button on the right
  if (cellType === 'input-with-attachment') {
    return (
      <div className={`flex items-center px-[8px] py-[6px] h-[50px] shrink-0 ${selected ? 'bg-[#e8f5e9]' : 'bg-white group-hover:bg-[#eeeeee]'} ${className}`}>
        <div className="flex items-center w-full border border-[#b0b0b0] rounded-[8px] px-[8px] py-[5px] gap-[6px] focus-within:border-[#ae6651] focus-within:shadow-[0_0_0_2px_rgba(106,62,49,0.12)] transition-all">
          <input
            type="text"
            value={value ?? ''}
            onChange={e => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 text-[14px] text-[#212121] placeholder-[#868686] outline-none bg-transparent"
            style={NS}
          />
          <button
            type="button"
            onClick={onAttach}
            className="shrink-0 flex items-center justify-center size-[24px] rounded-full bg-[rgba(255,116,104,0.16)] hover:bg-[rgba(255,116,104,0.28)] transition-colors"
            title="Attach file"
          >
            <span className="material-icons text-[#ff7468]" style={{ fontSize: 14 }}>attach_file</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center p-[10px] h-[50px] transition-colors cursor-pointer
        ${selected ? 'bg-[#e8f5e9]' : 'bg-white group-hover:bg-[#eeeeee]'} ${className}`}
      onClick={onClick}
    >
      <span className="text-[14px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] truncate w-full" style={NS}>
        {children}
      </span>
    </div>
  );
}
