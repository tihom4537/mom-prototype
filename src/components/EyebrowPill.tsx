const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface EyebrowPillProps {
  text?: string;
  variant?: 'default' | 'filled';
  className?: string;
}

export default function EyebrowPill({
  text = 'Panchatantra 2.0  ·  Karnataka Panchayat e-Governance',
  variant = 'default',
  className,
}: EyebrowPillProps) {
  const bg = variant === 'filled' ? 'bg-[#f7f0ee]' : 'bg-white';
  return (
    <div
      className={`${bg} border border-[rgba(106,62,49,0.15)] flex items-center overflow-hidden px-[14px] py-[6px] rounded-[100px] ${className ?? ''}`}
    >
      <p
        className="font-medium text-[11px] text-[#693d30] leading-normal whitespace-pre shrink-0"
        style={NS}
      >
        {text}
      </p>
    </div>
  );
}
