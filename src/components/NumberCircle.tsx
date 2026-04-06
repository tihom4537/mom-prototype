import Icon from './Icon';

export type NumberCircleType = 'agenda' | 'proceedings' | 'subpage' | 'small-card' | 'greyed-out' | 'current';

interface NumberCircleProps {
  type?: NumberCircleType;
  number?: string | number;
  /** When set, renders this Material Icon name instead of the number */
  icon?: string;
  className?: string;
}

export default function NumberCircle({ type = 'agenda', number = '1', icon, className }: NumberCircleProps) {
  if (type === 'agenda') {
    return (
      <div className={`flex flex-col items-center justify-center px-1 py-[6px] rounded-full border shrink-0 bg-[#ff7468] border-[#ff7468] w-8 ${className ?? ''}`}>
        <span className="font-extrabold text-sm text-center leading-5 tracking-[0.1px] w-full text-white" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          {number}
        </span>
      </div>
    );
  }

  if (type === 'proceedings') {
    return (
      <div className={`flex flex-col items-center justify-center px-1 py-[6px] rounded-full border shrink-0 bg-[#efe0dc] border-[#6a3e31] size-8 ${className ?? ''}`}>
        <span className="font-medium text-sm text-center leading-5 tracking-[0.1px] w-full text-[#6a3e31]" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          {number}
        </span>
      </div>
    );
  }

  // subpage — Figma type5: #efe0dc fill, no border, 32px
  if (type === 'subpage') {
    return (
      <div className={`flex flex-col items-center justify-center rounded-full shrink-0 bg-[#efe0dc] size-8 ${className ?? ''}`}>
        <span className="font-medium text-sm text-center leading-5 tracking-[0.1px] w-full text-[#6a3e31]" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          {number}
        </span>
      </div>
    );
  }

  // small-card (completed, green) | greyed-out (not started, gray) | current (in-progress, primary)
  const styles = {
    'small-card':  { bg: 'bg-[rgba(60,151,24,0.16)] border-[#3c9718]', text: 'text-[#6a3e31]',  iconColor: '#3c9718'  },
    'greyed-out':  { bg: 'bg-[#ddd] border-[#c6c6c6]',                  text: 'text-[#4b4b4b]',  iconColor: '#4b4b4b'  },
    'current':     { bg: 'bg-[#6a3e31] border-[#6a3e31]',               text: 'text-white',       iconColor: 'white'    },
  } as const;

  const { bg, text, iconColor } = styles[type];

  return (
    <div className={`flex items-center justify-center rounded-full border shrink-0 size-[28px] ${bg} ${className ?? ''}`}>
      {icon ? (
        <Icon name={icon} size="small" color={iconColor} />
      ) : (
        <span className={`font-medium text-sm text-center leading-5 tracking-[0.1px] w-full ${text}`} style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          {number}
        </span>
      )}
    </div>
  );
}
