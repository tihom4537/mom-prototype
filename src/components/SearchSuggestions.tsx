const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface SearchSuggestionsProps {
  label?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

const DEFAULT_SUGGESTIONS = [
  'GP Meeting proceedings from 2024',
  'Finance reports for Mandya district',
  'Attendance records Mysuru',
  'NCORD awareness meetings',
  'Scheme implementation status',
  'Gram Sabha resolutions',
];

export default function SearchSuggestions({
  label = 'Try:',
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionClick,
  className,
}: SearchSuggestionsProps) {
  return (
    <div className={`flex items-start gap-[10px] ${className ?? ''}`}>
      <span className="font-normal text-[13px] text-[rgba(33,33,33,0.6)] leading-[32px] whitespace-nowrap shrink-0" style={NS}>
        {label}
      </span>
      <div className="flex flex-wrap gap-x-[10px] gap-y-[10px]">
        {suggestions.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestionClick?.(s)}
            className="border border-[#b0b0b0] flex items-center justify-center px-[10px] py-[5px] rounded-[8px] text-[12px] font-medium text-[#727272] tracking-[0.5px] leading-[20px] whitespace-nowrap bg-transparent cursor-pointer hover:bg-[rgba(106,62,49,0.08)] hover:border-[#6a3e31] hover:text-[#6a3e31] transition-colors"
            style={NS}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
