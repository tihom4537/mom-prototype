interface SectionHeadingProps {
  text?: string;
  className?: string;
}

export default function SectionHeading({ text = '2nd GP General Body Meeting 2026', className }: SectionHeadingProps) {
  return (
    <div className={`flex items-center justify-start ${className ?? ''}`}>
      <p
        className="font-semibold leading-6 text-[#6a3e31] text-xl whitespace-nowrap shrink-0"
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {text}
      </p>
    </div>
  );
}
