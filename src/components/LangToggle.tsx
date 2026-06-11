const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type LangToggleSelected = 'eng' | 'kan';

interface LangToggleProps {
  selected?: LangToggleSelected;
  onSelect?: (lang: LangToggleSelected) => void;
  className?: string;
}

export default function LangToggle({
  selected = 'eng',
  onSelect,
  className,
}: LangToggleProps) {
  return (
    <div className={`bg-[#f3f3f3] flex items-center overflow-hidden p-[3px] rounded-[8px] ${className ?? ''}`}>
      {/* Kannada */}
      <button
        type="button"
        onClick={() => onSelect?.('kan')}
        className={`flex items-center justify-center px-[24px] py-[10px] rounded-[8px] text-[14px] font-medium tracking-[0.1px] leading-[20px] whitespace-nowrap border-none cursor-pointer transition-colors
          ${selected === 'kan'
            ? 'bg-white border border-[#c6c6c6] text-[#6a3e31]'
            : 'bg-transparent text-[#727272] hover:text-[#6a3e31]'
          }`}
        style={NS}
      >
        ಕನ್ನಡ
      </button>
      {/* English */}
      <button
        type="button"
        onClick={() => onSelect?.('eng')}
        className={`flex items-center justify-center px-[24px] py-[10px] rounded-[8px] text-[14px] font-medium tracking-[0.1px] leading-[20px] whitespace-nowrap border-none cursor-pointer transition-colors
          ${selected === 'eng'
            ? 'bg-white border border-[#c6c6c6] text-[#6a3e31]'
            : 'bg-transparent text-[#727272] hover:text-[#6a3e31]'
          }`}
        style={NS}
      >
        English
      </button>
    </div>
  );
}
