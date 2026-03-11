const imgInfo = "https://www.figma.com/api/mcp/asset/395564cc-25a3-464a-8cb9-0f385bd31d4a";
const imgInfoVec1 = "https://www.figma.com/api/mcp/asset/9ccaf128-dd4a-4a39-b898-37cef1118186";
const imgInfoVec2 = "https://www.figma.com/api/mcp/asset/5857c5ab-479d-472c-a7a9-9d5b635b6d71";

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
        <div className="overflow-clip relative shrink-0 size-5">
          <img alt="" className="absolute block max-w-none size-full" src={imgInfo} />
          <div className="absolute inset-[16.67%]">
            <img alt="" className="absolute block max-w-none size-full" src={imgInfoVec1} />
          </div>
          <div className="absolute inset-[8.33%]">
            <img alt="" className="absolute block max-w-none size-full" src={imgInfoVec2} />
          </div>
        </div>
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
