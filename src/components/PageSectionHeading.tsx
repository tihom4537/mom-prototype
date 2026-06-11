const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface PageSectionHeadingProps {
  heading?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function PageSectionHeading({
  heading = 'Section Heading',
  subtitle,
  align = 'center',
  className,
}: PageSectionHeadingProps) {
  const textAlign = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`flex flex-col gap-[5px] items-start leading-normal text-[#6a3e31] w-full ${className ?? ''}`}>
      <p className={`font-semibold text-[32px] w-full ${textAlign}`} style={NS}>
        {heading}
      </p>
      {subtitle && (
        <p className={`font-light text-[24px] w-full ${textAlign}`} style={NS}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
