import Chip from './Chip';
import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface TimelineRowProps {
  text: string;
  deadlineLabel: string;
  onRemove?: () => void;
  className?: string;
}

export default function TimelineRow({ text, deadlineLabel, onRemove, className }: TimelineRowProps) {
  return (
    <div
      className={`bg-[#f7f0ee] border border-[rgba(106,62,49,0.24)] flex items-center justify-between gap-[50px] pl-[16px] pr-[12px] py-[12px] rounded-[8px] ${className ?? 'w-full'}`}
    >
      {/* Left */}
      <div className="flex items-center gap-[8px] shrink-0">
        <p className="font-medium text-[14px] leading-[20px] text-[#212121] tracking-[0.1px] whitespace-nowrap" style={NS}>
          {text}
        </p>
        <span className="font-normal text-[18px] leading-[20px] text-[#693d30]" style={NS}>→</span>
        <Chip label={deadlineLabel} />
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 border border-[#ddd] flex items-center justify-center rounded-[8px] size-[24px] bg-transparent cursor-pointer hover:bg-[#f0f0f0] transition-colors"
      >
        <Icon name="close" size="small" color="#525c66" />
      </button>
    </div>
  );
}
