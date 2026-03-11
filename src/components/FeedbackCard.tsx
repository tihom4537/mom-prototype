import FeedbackCardTags, { FeedbackTagType } from './FeedbackCardTags';

const imgCheckIcon = "https://www.figma.com/api/mcp/asset/038d3f6b-79b3-4a00-8a4c-2f13ed0806e6";
const imgCheckVec = "https://www.figma.com/api/mcp/asset/dbcc5e7e-55c6-4ffd-a655-364014701a6a";
const imgCloseIcon = "https://www.figma.com/api/mcp/asset/038d3f6b-79b3-4a00-8a4c-2f13ed0806e6";
const imgCloseVec = "https://www.figma.com/api/mcp/asset/dbcc5e7e-55c6-4ffd-a655-364014701a6a";
const imgTickIcon = "https://www.figma.com/api/mcp/asset/61889445-d792-46e0-abe9-66d89b24195b";
const imgMicFloat = "https://www.figma.com/api/mcp/asset/a117ef7c-a15e-4b27-8fc0-a5076411b670";

export type FeedbackCardType = 'add-details' | 'make-concise' | 'rephrase';

interface FeedbackCardProps {
  type?: FeedbackCardType;
  originalText?: string;
  suggestedText?: string;
  onAccept?: () => void;
  onReject?: () => void;
  className?: string;
}

const typeToTagType: Record<FeedbackCardType, FeedbackTagType> = {
  'add-details': 'add-missing-details',
  'make-concise': 'make-concise',
  rephrase: 'rephrase',
};

export default function FeedbackCard({
  type = 'add-details',
  originalText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor',
  suggestedText,
  onAccept,
  onReject,
  className,
}: FeedbackCardProps) {
  const isAddDetails = type === 'add-details';

  return (
    <div className={`border border-[#ddd] flex flex-col items-start overflow-clip rounded-lg w-[389px] ${className ?? ''}`}>
      {/* Header */}
      <div className="bg-white flex items-center overflow-clip pb-[10px] pt-3 px-4 rounded-tl-lg rounded-tr-lg shrink-0 w-full">
        <div className="flex flex-1 items-center justify-between min-h-px min-w-px">
          {/* Tag */}
          <FeedbackCardTags type={typeToTagType[type]} />
          {/* Accept / Reject buttons */}
          <div className="flex gap-[9px] items-center shrink-0">
            {/* Accept (tick) */}
            <div className="flex flex-col items-start shrink-0">
              <button
                onClick={onAccept}
                className="border border-[#ddd] flex flex-col gap-0 items-center justify-center p-[6px] rounded-lg shrink-0 cursor-pointer bg-white"
              >
                <div className="relative size-3 shrink-0">
                  <img alt="✓" className="absolute block max-w-none size-full" src={imgTickIcon} />
                </div>
              </button>
            </div>
            {/* Reject (X) */}
            <div className="flex items-center shrink-0">
              <button
                onClick={onReject}
                className="border border-[#ddd] flex gap-0 items-center justify-center overflow-clip p-[6px] rounded-lg shrink-0 size-6 cursor-pointer bg-white"
              >
                <div className="overflow-clip relative size-5 shrink-0">
                  <img alt="" className="absolute block max-w-none size-full" src={imgCloseIcon} />
                  <div className="absolute inset-[20.83%]">
                    <img alt="" className="absolute block max-w-none size-full" src={imgCloseVec} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className={`bg-white flex flex-col pt-3 px-4 shrink-0 w-full relative
          ${isAddDetails ? 'items-center pb-[30px]' : 'items-start pb-[15px]'}`}
      >
        <div className="border border-[#ddd] flex items-center justify-center rounded-[5px] shrink-0 w-full p-[10px]">
          <p
            className="flex-1 font-normal text-sm text-[#212121] leading-5 tracking-[0.25px] min-h-px min-w-px"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {originalText}
          </p>
        </div>

        {/* Floating mic for add-details */}
        {isAddDetails && (
          <div className="flex h-[3px] items-center justify-center py-1 shrink-0 w-full">
            <div className="bg-[#ff7468] flex gap-2 items-center justify-center overflow-clip p-2 rounded-full shadow-[0px_1px_10.3px_0px_#ff7468] size-9">
              <div className="h-[19px] relative shrink-0 w-[14px]">
                <img alt="" className="absolute block max-w-none size-full" src={imgMicFloat} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
