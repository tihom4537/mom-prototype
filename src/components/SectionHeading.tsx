export type SectionHeadingVariant = 'default' | 'mandatory' | 'with-box';

interface SectionHeadingProps {
  text?: string;
  variant?: SectionHeadingVariant;
  className?: string;
  fullWidth?: boolean;
  as?: 'h2' | 'h3' | 'p';
}

export default function SectionHeading({
  text = '2nd GP General Body Meeting 2026',
  variant = 'default',
  className,
  fullWidth = false,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  const label = (
    <Tag
      className="font-semibold leading-6 text-[#6a3e31] text-xl whitespace-nowrap shrink-0"
      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
    >
      {text}
    </Tag>
  );

  if (variant === 'with-box') {
    if (fullWidth) {
      return (
        <div className={`w-full bg-[#f7f0ee] px-5 py-[10px] flex items-center justify-center rounded-t-[10px] ${className ?? ''}`}>
          {label}
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-start ${className ?? ''}`}>
        <div className="bg-[#f7f0ee] px-5 py-[10px] rounded-[10px]">
          {label}
        </div>
      </div>
    );
  }

  if (variant === 'mandatory') {
    return (
      <div className={`flex items-center gap-[5px] justify-start ${className ?? ''}`}>
        {label}
        <div className="flex flex-col justify-center h-full shrink-0 w-2">
          <p
            className="font-medium text-sm text-[#b7131a] leading-5 tracking-[0.1px]"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            *
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-start ${className ?? ''}`}>
      {label}
    </div>
  );
}
