const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface TabOptionsProps {
  menuOption: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function TabOptions({ menuOption, selected = false, onClick, className }: TabOptionsProps) {
  if (selected) {
    return (
      <div
        className={`flex items-center justify-center p-[5px] border-b-2 border-[#6a3e31] shrink-0 ${className ?? ''}`}
      >
        <span className="font-medium text-[14px] leading-[20px] tracking-[0.1px] text-[#6a3e31] whitespace-nowrap" style={NS}>
          {menuOption}
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center p-[5px] bg-transparent border-none cursor-pointer shrink-0 hover:border-b-2 hover:border-[rgba(106,62,49,0.3)] transition-all ${className ?? ''}`}
    >
      <span className="font-medium text-[14px] leading-[20px] tracking-[0.1px] text-[#6a3e31] whitespace-nowrap" style={NS}>
        {menuOption}
      </span>
    </button>
  );
}
