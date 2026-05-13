import Chip from './Chip';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface TaskRowProps {
  text: string;
  assigneeLabel: string;
  deadlineLabel?: string;
  className?: string;
}

export default function TaskRow({ text, assigneeLabel, deadlineLabel, className }: TaskRowProps) {
  return (
    <div
      className={`bg-[#f7f0ee] border border-[rgba(106,62,49,0.24)] inline-flex items-center gap-[12px] px-[16px] py-[12px] rounded-[8px] ${className ?? ''}`}
    >
      <p className="font-medium text-[14px] leading-[20px] text-[#212121] tracking-[0.1px] whitespace-nowrap" style={NS}>
        {text}
      </p>
      <span className="font-normal text-[18px] leading-[20px] text-[#693d30]" style={NS}>→</span>
      <Chip label={assigneeLabel} />
      {deadlineLabel && (
        <>
          <span className="font-normal text-[18px] leading-[20px] text-[#693d30]" style={NS}>·</span>
          <Chip label={deadlineLabel} />
        </>
      )}
    </div>
  );
}
