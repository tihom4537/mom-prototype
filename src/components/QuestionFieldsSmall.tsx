export type QuestionFieldType = 'mandatory' | 'not-mandatory';

interface QuestionFieldsSmallProps {
  type?: QuestionFieldType;
  questionText?: string;
  className?: string;
}

export default function QuestionFieldsSmall({
  type = 'not-mandatory',
  questionText = 'Enter the Agenda discussion points',
  className,
}: QuestionFieldsSmallProps) {
  const isMandatory = type === 'mandatory';
  return (
    <div
      className={`flex ${isMandatory ? 'gap-1 items-center' : 'flex-col items-start'} ${className ?? ''}`}
    >
      <div className="flex gap-1 items-center justify-center shrink-0">
        <span
          className="font-medium text-sm text-[#212121] leading-5 tracking-[0.1px] whitespace-nowrap"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {questionText}
        </span>
      </div>
      {isMandatory && (
        <span
          className="font-medium text-sm text-[#cc1000] leading-5 tracking-[0.1px] whitespace-nowrap"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          *
        </span>
      )}
    </div>
  );
}
