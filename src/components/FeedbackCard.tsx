import FeedbackCardTags, { FeedbackTagType } from './FeedbackCardTags';
import Icon from './Icon';

export type FeedbackCardType = 'fill-blanks' | 'rephrase';

export type Segment =
  | { kind: 'text'; content: string }
  | { kind: 'blank'; hint: string; value: string };

const typeToTagType: Record<FeedbackCardType, FeedbackTagType> = {
  'fill-blanks': 'fill-blanks',
  rephrase:      'rephrase',
};

export interface FeedbackCardProps {
  type?: FeedbackCardType;
  /** fill-blanks: parsed sentence segments with blanks */
  segments?: Segment[];
  onSegmentChange?: (index: number, value: string) => void;
  /** rephrase: the complete improved sentence */
  originalText?: string;
  onAccept?: () => void;
  onReject?: () => void;
  /** fill-blanks: assemble filled sentence and push to discussion */
  onPushText?: () => void;
  isActive?: boolean;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function FeedbackCard({
  type = 'fill-blanks',
  segments = [],
  onSegmentChange,
  originalText = '',
  onAccept,
  onReject,
  onPushText,
  isActive = false,
  onHoverEnter,
  onHoverLeave,
  onClick,
  className,
}: FeedbackCardProps) {
  const isFillBlanks = type === 'fill-blanks';

  const activeStyle = isActive
    ? {
        borderColor: isFillBlanks ? '#ff7468' : '#613af5',
        boxShadow:   isFillBlanks
          ? '0 0 0 2px rgba(255,116,104,0.25)'
          : '0 0 0 2px rgba(97,58,245,0.2)',
      }
    : {};

  return (
    <div
      className={`border border-[#ddd] flex flex-col items-start overflow-hidden rounded-lg transition-all duration-200 cursor-pointer ${className ?? ''}`}
      style={activeStyle}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      onClick={onClick}
    >
      {/* ── Header ── */}
      <div className="bg-white flex items-center pb-[10px] pt-3 px-4 rounded-tl-lg rounded-tr-lg shrink-0 w-full">
        <div className="flex flex-1 items-center justify-between min-h-px min-w-px">
          <FeedbackCardTags type={typeToTagType[type]} />
          <div className="flex gap-[9px] items-center shrink-0">
            {/* Accept / Push (✓) */}
            <button
              onClick={e => {
                e.stopPropagation();
                isFillBlanks ? onPushText?.() : onAccept?.();
              }}
              className="border border-[#ddd] flex items-center justify-center rounded-lg shrink-0 size-6 cursor-pointer bg-white hover:bg-[#f5f5f5] transition-colors"
              title={isFillBlanks ? 'Add to Discussion' : 'Accept'}
            >
              <Icon name="check" size="small" color="#3c9718" />
            </button>
            {/* Reject (✕) */}
            <button
              onClick={e => { e.stopPropagation(); onReject?.(); }}
              className="border border-[#ddd] flex items-center justify-center rounded-lg shrink-0 size-6 cursor-pointer bg-white hover:bg-[#f5f5f5] transition-colors"
              title="Dismiss"
            >
              <Icon name="close" size="small" color="#b7131a" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        className="bg-white flex flex-col pt-1 px-4 pb-4 shrink-0 w-full"
        onClick={isActive ? e => e.stopPropagation() : undefined}
      >

        {/* Fill-blanks: inline sentence with editable blanks */}
        {isFillBlanks && (
          <p
            className="text-sm text-[#212121] leading-8 w-full"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {segments.map((seg, i) => {
              if (seg.kind === 'text') {
                return <span key={i}>{seg.content}</span>;
              }
              // Blank — inactive: static underlined hint; active: editable input
              if (!isActive) {
                return (
                  <span
                    key={i}
                    className="border-b border-[#bbb] text-[#aaa] text-xs italic"
                    style={{ minWidth: '3em', display: 'inline-block', paddingBottom: '1px' }}
                  >
                    {seg.hint}
                  </span>
                );
              }
              return (
                <input
                  key={i}
                  type="text"
                  className="border-0 border-b-2 border-[#ff7468] bg-transparent outline-none text-sm text-[#212121] placeholder-[#bbb] align-baseline"
                  style={{
                    fontFamily: 'Noto Sans',
                    fontVariationSettings: "'CTGR' 0, 'wdth' 100",
                    width: `${Math.max(3, seg.hint.length * 0.65 + 0.5)}em`,
                    minWidth: '3em',
                  }}
                  value={seg.value}
                  onChange={e => onSegmentChange?.(i, e.target.value)}
                  placeholder={seg.hint}
                  onClick={e => e.stopPropagation()}
                />
              );
            })}
          </p>
        )}

        {/* Rephrase: static improved sentence in a box */}
        {!isFillBlanks && (
          <div className="border border-[#ddd] flex items-start rounded-[5px] w-full p-[10px]">
            <p
              className="flex-1 font-normal text-sm text-[#212121] leading-5 tracking-[0.25px] min-h-px min-w-px"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {originalText}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
