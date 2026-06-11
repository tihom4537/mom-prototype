import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface AccessibilityBarProps {
  onFontDecrease?: () => void;
  onFontDefault?: () => void;
  onFontIncrease?: () => void;
  onColourToggle?: () => void;
  onSkipToContent?: () => void;
  onGovernmentOfIndia?: () => void;
  onMore?: () => void;
  className?: string;
}

export default function AccessibilityBar({
  onFontDecrease,
  onFontDefault,
  onFontIncrease,
  onColourToggle,
  onSkipToContent,
  onGovernmentOfIndia,
  onMore,
  className,
}: AccessibilityBarProps) {
  return (
    <div className={`bg-[#6a3e31] flex items-center justify-between px-[80px] h-[41px] w-full shrink-0 ${className ?? ''}`}>

      {/* Left: Govt of India */}
      <button
        type="button"
        className="flex items-center gap-[12px] bg-transparent border-none cursor-pointer p-0"
        onClick={onGovernmentOfIndia}
        aria-label="Government of India"
      >
        {/* Indian flag — tricolor blocks */}
        <div className="flex flex-col overflow-hidden rounded-[2px] shrink-0 w-[33px] h-[22px]">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="w-[5px] h-[5px] rounded-full bg-[#000080]" />
          </div>
          <div className="flex-1 bg-[#138808]" />
        </div>
        <div className="flex items-center gap-[2px]">
          <span className="font-medium text-[14px] text-white tracking-[0.1px] leading-[20px] whitespace-nowrap" style={NS}>
            Government of India
          </span>
          <Icon name="open_in_new" size="small" color="white" className="opacity-80 ml-[2px]" />
        </div>
      </button>

      {/* Right: Accessibility controls */}
      <div className="flex items-center gap-[24px]">

        {/* Skip to main content */}
        <button
          type="button"
          className="font-medium text-[14px] text-white tracking-[0.1px] leading-[20px] whitespace-nowrap bg-transparent border-none cursor-pointer p-0"
          style={NS}
          onClick={onSkipToContent}
        >
          Skip to Main Content
        </button>

        <div className="w-px h-[20px] bg-white opacity-30" />

        {/* Font size controls — A (small), A (medium), A (large) */}
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            className="flex items-center justify-center w-[28px] h-[28px] rounded-[4px] bg-transparent border-none cursor-pointer hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
            onClick={onFontDecrease}
            aria-label="Decrease font size"
          >
            <span className="text-white font-medium select-none" style={{ fontSize: 11, lineHeight: 1, ...NS }}>A</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-[28px] h-[28px] rounded-[4px] bg-transparent border-none cursor-pointer hover:bg-white/10 transition-colors"
            onClick={onFontDefault}
            aria-label="Default font size"
          >
            <span className="text-white font-medium select-none" style={{ fontSize: 14, lineHeight: 1, ...NS }}>A</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-[28px] h-[28px] rounded-[4px] bg-white/10 border-none cursor-pointer hover:bg-white/20 transition-colors"
            onClick={onFontIncrease}
            aria-label="Increase font size"
          >
            <span className="text-white font-medium select-none" style={{ fontSize: 17, lineHeight: 1, ...NS }}>A</span>
          </button>
        </div>

        <div className="w-px h-[20px] bg-white opacity-30" />

        {/* Colour/contrast toggle */}
        <button
          type="button"
          className="flex items-center justify-center w-[28px] h-[28px] rounded-[4px] bg-transparent border-none cursor-pointer hover:bg-white/10 transition-colors"
          onClick={onColourToggle}
          aria-label="Toggle colour theme"
        >
          <Icon name="contrast" size="small" color="white" />
        </button>

        <div className="w-px h-[20px] bg-white opacity-30" />

        {/* Accessibility / More */}
        <button
          type="button"
          className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer p-0 hover:opacity-100 opacity-90"
          onClick={onMore}
        >
          <Icon name="accessibility" size="small" color="white" />
          <span className="font-medium text-[12px] text-white leading-normal whitespace-nowrap" style={NS}>
            More
          </span>
        </button>

      </div>
    </div>
  );
}
