import Icon from './Icon';

export type InfoBoxType = 'default' | 'outlined';

interface InfoBoxProps {
  type?: InfoBoxType;
  text?: string;
  className?: string;
}

export default function InfoBox({
  type = 'default',
  text = 'You can use dictation, typing, or both together to record the discussion and decisions.',
  className,
}: InfoBoxProps) {
  const isOutlined = type === 'outlined';
  return (
    <div
      className={`flex gap-1 items-center rounded-[10px]
        ${isOutlined ? 'border border-[#dfc2b9]' : 'bg-[#dfc2b9]'}
        ${className ?? 'w-full'}`}
    >
      <div className="flex flex-1 gap-[10px] items-center justify-center min-h-px min-w-px px-[10px] py-[5px]">
        {/* Info icon */}
        <Icon name="info" size="small" color="#6a3e31" />
        {/* Text */}
        <p
          className="flex-1 font-medium text-xs text-[#212121] leading-5 tracking-[0.1px] min-h-px min-w-px"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
