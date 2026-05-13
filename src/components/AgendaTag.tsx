const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface AgendaTagProps {
  text: string;
  className?: string;
}

export default function AgendaTag({ text, className }: AgendaTagProps) {
  return (
    <div
      className={`bg-[#f7f0ee] border border-[#efe0dc] flex items-center px-[12px] py-[6px] rounded-full ${className ?? ''}`}
    >
      <p className="font-normal text-[12px] leading-[20px] text-[#6a3e31] tracking-[0.3px] whitespace-nowrap" style={NS}>
        {text}
      </p>
    </div>
  );
}
