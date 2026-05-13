import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface QuickActionCardProps {
  title: string;
  description: string;
  icon?: string;
  onClick?: () => void;
  className?: string;
}

export default function QuickActionCard({ title, description, icon, onClick, className }: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white border border-[rgba(106,62,49,0.16)] rounded-[10px] p-[20px] flex flex-col items-start text-left cursor-pointer hover:bg-[#fdf8f7] transition-colors ${className ?? 'w-[220px]'}`}
    >
      {/* Icon circle */}
      <div className="bg-[#efe0dc] flex items-center justify-center rounded-[8px] size-[28px] shrink-0">
        {icon
          ? <Icon name={icon} size="small" color="#6a3e31" />
          : <span className="font-normal text-[18px] leading-[20px] text-[#6a3e31]" style={NS}>+</span>
        }
      </div>
      <div className="h-[10px]" />
      <p className="font-semibold text-[14px] leading-[20px] text-[#212121] tracking-[0.1px] w-[180px]" style={NS}>
        {title}
      </p>
      <div className="h-[3px]" />
      <p className="font-normal text-[12px] leading-[16px] text-[#525c66] tracking-[0.3px] w-[180px]" style={NS}>
        {description}
      </p>
    </button>
  );
}
