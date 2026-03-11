const imgReport = "https://www.figma.com/api/mcp/asset/eb1bfe87-f117-4c7e-b28e-893bb7671315";
const imgReportFill = "https://www.figma.com/api/mcp/asset/f52d4b2d-7ead-48d1-bd53-b02d97718b46";
const imgCheckCircle = "https://www.figma.com/api/mcp/asset/f28cfd19-f0d8-4eee-aae7-09ca06449744";

export type CompletionState = 'pending' | 'completed';

interface CompletionTagProps {
  state?: CompletionState;
  className?: string;
}

export default function CompletionTag({ state = 'pending', className }: CompletionTagProps) {
  const isCompleted = state === 'completed';
  return (
    <div
      className={`flex gap-2 items-center justify-center overflow-clip px-[10px] py-[5px] rounded-lg
        ${isCompleted ? 'bg-[#e3f2d9] w-[127px]' : 'bg-[#faeded] w-[108px]'}
        ${className ?? ''}`}
    >
      {/* Icon */}
      <div className="relative shrink-0 size-6">
        {state === 'pending' ? (
          <div
            className="absolute inset-[12.5%]"
            style={{
              maskImage: `url('${imgReport}')`,
              maskSize: '24px 24px',
              maskPosition: '-3px -3px',
              maskRepeat: 'no-repeat',
              WebkitMaskImage: `url('${imgReport}')`,
              WebkitMaskSize: '24px 24px',
              WebkitMaskPosition: '-3px -3px',
              WebkitMaskRepeat: 'no-repeat',
            }}
          >
            <img alt="" className="absolute block max-w-none size-full" src={imgReportFill} />
          </div>
        ) : (
          <div
            className="absolute inset-[8.33%]"
            style={{
              maskImage: `url('${imgReport}')`,
              maskSize: '24px 24px',
              maskPosition: '-2px -2px',
              maskRepeat: 'no-repeat',
              WebkitMaskImage: `url('${imgReport}')`,
              WebkitMaskSize: '24px 24px',
              WebkitMaskPosition: '-2px -2px',
              WebkitMaskRepeat: 'no-repeat',
            }}
          >
            <img alt="" className="absolute block max-w-none size-full" src={imgCheckCircle} />
          </div>
        )}
      </div>

      {/* Label */}
      <span
        className={`font-medium text-sm text-center leading-5 tracking-[0.1px] whitespace-nowrap
          ${isCompleted ? 'text-[#212121]' : 'text-[#b7131a]'}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {isCompleted ? 'Completed' : 'Pending'}
      </span>
    </div>
  );
}
