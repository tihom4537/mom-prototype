const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type AgendaNoLabelType = 'default' | 'pending-small' | 'completed-small' | 'new-grey';

interface AgendaNoLabelProps {
  text?: string;
  type?: AgendaNoLabelType;
  className?: string;
}

const STYLES: Record<AgendaNoLabelType, { wrap: string; text: string }> = {
  'default':         { wrap: 'bg-[#ff7468]',                   text: 'text-white'      },
  'pending-small':   { wrap: 'bg-[#ffe8e5]',                   text: 'text-[#ae6651]' },
  'completed-small': { wrap: 'bg-[rgba(60,151,24,0.16)]',      text: 'text-[#3c9718]' },
  'new-grey':        { wrap: 'bg-[rgba(106,62,49,0.08)]',      text: 'text-[#868686]' },
};

export default function AgendaNoLabel({ text = '4 Agendas', type = 'default', className }: AgendaNoLabelProps) {
  const s = STYLES[type];
  return (
    <div className={`flex items-center justify-center px-[8px] rounded-[5px] ${s.wrap} ${className ?? ''}`}>
      <span
        className={`font-medium text-[14px] leading-[24px] whitespace-nowrap ${s.text}`}
        style={NS}
      >
        {text}
      </span>
    </div>
  );
}
