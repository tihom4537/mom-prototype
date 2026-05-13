import FeedbackCardTags, { FeedbackTagType } from './FeedbackCardTags';
import Button from './Button';
import { useLanguage } from '../i18n/LanguageContext';

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
  segments?: Segment[];
  onSegmentChange?: (index: number, value: string) => void;
  originalText?: string;
  onAccept?: () => void;
  onReject?: () => void;
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
  const { t } = useLanguage();
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
        <FeedbackCardTags type={typeToTagType[type]} />
      </div>

      {/* ── Body ── */}
      <div
        className="bg-white flex flex-col pt-1 px-4 pb-4 shrink-0 w-full gap-3"
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
              if (!isActive) {
                return (
                  <span
                    key={i}
                    className="border-b border-[#bbb] text-[#727272] text-xs italic"
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

        {/* ── Footer buttons ── */}
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <Button
            variant="outlined"
            size="small"
            iconPlacement="none"
            text={t('btn_reject')}
            onClick={() => onReject?.()}
          />
          <button
            type="button"
            onClick={() => (isFillBlanks ? onPushText?.() : onAccept?.())}
            className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[16px] py-[8px] border-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="text-[#6a3e31] text-[12px] font-medium leading-5" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {t('btn_accept')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
