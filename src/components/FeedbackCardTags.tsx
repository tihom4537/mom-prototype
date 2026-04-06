export type FeedbackTagType = 'add-missing-details' | 'rephrase' | 'make-concise';

interface FeedbackCardTagsProps {
  type?: FeedbackTagType;
  className?: string;
}

const tagConfig: Record<FeedbackTagType, { label: string; bg: string; text: string }> = {
  'add-missing-details': {
    label: 'Add Missing Details',
    bg: 'bg-[#ffeeda]',
    text: 'text-[#b7131a]',
  },
  rephrase: {
    label: 'Rephrase',
    bg: 'bg-[#faefff]',
    text: 'text-[#613af5]',
  },
  'make-concise': {
    label: 'Make Concise',
    bg: 'bg-[#ffeeda]',
    text: 'text-[#f5633a]',
  },
};

export default function FeedbackCardTags({ type = 'add-missing-details', className }: FeedbackCardTagsProps) {
  const config = tagConfig[type];
  return (
    <div
      className={`flex items-center justify-center px-[5px] py-[3px] rounded-[5px] ${config.bg} ${className ?? ''}`}
    >
      <span
        className={`font-medium text-xs leading-6 tracking-[0.15px] whitespace-nowrap ${config.text}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {config.label}
      </span>
    </div>
  );
}
