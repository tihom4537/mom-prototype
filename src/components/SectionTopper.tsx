const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type SectionTopperVariant = 'default' | 'white' | 'variant3';

interface SectionTopperProps {
  variant?: SectionTopperVariant;
  heading?: string;
  subheading?: string;
  illustration?: string;
  className?: string;
}

export default function SectionTopper({
  variant = 'default',
  heading = 'Finance and Accounting',
  subheading = 'The module captures receipt & expenditure details through voucher entries and automatically generates cash book, registers, etc through Double Entry Accounting System',
  illustration,
  className,
}: SectionTopperProps) {
  const isWhite = variant === 'white';
  const isVariant3 = variant === 'variant3';

  const containerClass = isWhite
    ? `bg-white border-b border-[rgba(106,62,49,0.48)] px-[100px] py-[40px] gap-[5px] items-end`
    : isVariant3
    ? `bg-[rgba(106,62,49,0.08)] px-[50px] h-[198px] gap-[50px] items-center`
    : `bg-[rgba(106,62,49,0.08)] px-[100px] h-[198px] gap-[100px] items-center`;

  return (
    <div
      className={`flex overflow-hidden relative w-full ${containerClass} ${className ?? ''}`}
    >
      {/* Text */}
      <div className="flex flex-col gap-[8px] items-start flex-1 min-w-0">
        <p
          className="font-semibold text-[35px] text-[#6a3e31] leading-tight w-full"
          style={NS}
        >
          {heading}
        </p>
        <p
          className="font-light text-[18px] text-[#6a3e31] leading-snug w-full"
          style={NS}
        >
          {subheading}
        </p>
      </div>

      {/* Illustration */}
      {illustration && (
        <div
          className={`shrink-0 flex items-center justify-center ${
            isWhite
              ? 'absolute right-[100px] top-[30px] w-[229px] h-[249px]'
              : 'w-[167px] h-[188px]'
          }`}
        >
          <img
            src={illustration}
            alt=""
            className="w-full h-full object-contain"
            style={{ transform: isWhite ? 'rotate(-9.57deg)' : 'rotate(-4.99deg)' }}
          />
        </div>
      )}
    </div>
  );
}
