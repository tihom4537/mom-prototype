import Icon from './Icon';

interface GoBackToPreviousPageProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

export default function GoBackToPreviousPage({
  label = 'Go back to agenda list',
  onClick,
  className,
}: GoBackToPreviousPageProps) {
  return (
    <button
      onClick={onClick}
      className={`flex gap-2 items-center cursor-pointer bg-transparent border-none p-0 ${className ?? ''}`}
    >
      {/* Back arrow */}
      <Icon name="chevron_left" size="small" color="#212121" />
      <span
        className="font-medium text-sm text-[#212121] leading-5 tracking-[0.1px] whitespace-nowrap"
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {label}
      </span>
    </button>
  );
}
