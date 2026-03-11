interface AgendaNoLabelProps {
  text?: string;
  className?: string;
}

export default function AgendaNoLabel({ text = '4 Agendas', className }: AgendaNoLabelProps) {
  return (
    <div className={`bg-[#ff7468] flex items-center justify-center px-2 rounded-[5px] ${className ?? ''}`}>
      <span
        className="font-medium leading-6 text-sm text-white w-[70px]"
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {text}
      </span>
    </div>
  );
}
