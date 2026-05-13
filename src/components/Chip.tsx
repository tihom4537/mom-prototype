const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface ChipProps {
  label: string;
  className?: string;
}

export default function Chip({ label, className }: ChipProps) {
  return (
    <div
      className={`bg-[#dfc2b9] border border-[#bf8573] flex items-center px-[12px] py-[6px] rounded-[6px] ${className ?? ''}`}
    >
      <p className="font-semibold text-[12px] leading-[16px] text-[#693d30] tracking-[0.1px] whitespace-nowrap" style={NS}>
        {label}
      </p>
    </div>
  );
}
