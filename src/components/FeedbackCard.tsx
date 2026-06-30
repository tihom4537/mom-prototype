import { useEffect, useRef } from 'react';
import FeedbackCardTags, { FeedbackTagType } from './FeedbackCardTags';
import Button from './Button';
import Icon from './Icon';
import Tooltip from './Tooltip';
import { useLanguage } from '../i18n/LanguageContext';

export type FeedbackCardType = 'fill-blanks' | 'rephrase';

export type Segment =
  | { kind: 'text'; content: string }
  | { kind: 'blank'; hint: string; value: string };

const typeToTagType: Record<FeedbackCardType, FeedbackTagType> = {
  'fill-blanks': 'fill-blanks',
  rephrase:      'rephrase',
};

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

export interface FeedbackCardProps {
  type?: FeedbackCardType;
  tagOverride?: import('./FeedbackCardTags').FeedbackTagType;
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
  // Card mic props (fill-blanks only)
  isMicRecording?: boolean;
  isMicProcessing?: boolean;
  onMicClick?: () => void;
  onMicCancel?: () => void;
  onMicConfirm?: () => void;
  micAnalyserNode?: AnalyserNode;
  micError?: string | null;
  className?: string;
  hideFooter?: boolean;
  confirmedMessage?: string;
}

export default function FeedbackCard({
  type = 'fill-blanks',
  tagOverride,
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
  isMicRecording = false,
  isMicProcessing = false,
  onMicClick,
  onMicCancel,
  onMicConfirm,
  micAnalyserNode,
  micError,
  className,
  hideFooter = false,
  confirmedMessage,
}: FeedbackCardProps) {
  const { t } = useLanguage();
  const isFillBlanks = type === 'fill-blanks';

  // Waveform canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !micAnalyserNode || !isMicRecording) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const buf = new Uint8Array(micAnalyserNode.frequencyBinCount);
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      micAnalyserNode.getByteFrequencyData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / buf.length * 2.5;
      let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const h = (buf[i] / 255) * canvas.height;
        ctx.fillStyle = '#ff7468';
        ctx.fillRect(x, canvas.height - h, barW - 1, h);
        x += barW;
      }
    };
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [micAnalyserNode, isMicRecording]);

  const isSuggestedRewrite = tagOverride === 'suggested-rewrite';
  const activeStyle = isActive && !isSuggestedRewrite
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
      <div className="bg-white flex items-center pb-[10px] pt-[14px] px-4 rounded-tl-lg rounded-tr-lg shrink-0 w-full">
        <FeedbackCardTags type={tagOverride ?? typeToTagType[type]} />
      </div>

      {/* ── Body ── */}
      <div
        className="bg-white flex flex-col pt-1 px-4 pb-4 shrink-0 w-full gap-3"
        onClick={isActive ? e => e.stopPropagation() : undefined}
      >
        {/* Fill-blanks: inline sentence with editable blanks */}
        {isFillBlanks && (
          <div className={`border border-[#ddd] rounded-[5px] w-full p-[10px] ${isActive ? 'relative pb-[28px]' : ''}`}>
            <p className="text-sm text-[#212121] leading-8 w-full" style={NS}>
              {segments.map((seg, i) => {
                if (seg.kind === 'text') return <span key={i}>{seg.content}</span>;
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

            {/* ── Card mic — anchored to bottom-center of container ── */}
            {isActive && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10"
                onClick={e => e.stopPropagation()}
              >
                {micError && (
                  <p className="text-[11px] text-[#b7131a] text-center mb-1" style={NS}>{micError}</p>
                )}
                {isMicProcessing ? (
                  <div className="flex items-center gap-[6px] bg-white rounded-full px-3 py-1 shadow-md">
                    <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#ffa199" strokeWidth="2" strokeOpacity="0.3" />
                      <path d="M8 2a6 6 0 0 1 6 6" stroke="#ff7468" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-[11px] text-[#6a3e31] whitespace-nowrap" style={NS}>Transcribing…</span>
                  </div>
                ) : isMicRecording ? (
                  <div className="flex items-center gap-[8px] bg-white rounded-full px-3 py-1 shadow-md">
                    <canvas ref={canvasRef} width={80} height={24} className="rounded" />
                    <button
                      type="button"
                      onClick={onMicCancel}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ffeeee] border-none cursor-pointer hover:opacity-80"
                    >
                      <Icon name="close" size="small" color="#b7131a" />
                    </button>
                    <button
                      type="button"
                      onClick={onMicConfirm}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-[#e8f5e9] border-none cursor-pointer hover:opacity-80"
                    >
                      <Icon name="check" size="small" color="#2e7d32" />
                    </button>
                  </div>
                ) : (
                  <Tooltip text={t('feedback_card_mic_tooltip')} direction="top" autoWidth>
                    <button
                      type="button"
                      onClick={onMicClick}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ff7468] border-none cursor-pointer hover:opacity-80 transition-opacity shadow-md"
                    >
                      <Icon name="mic" size="small" color="#fff" />
                    </button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rephrase: static improved sentence */}
        {!isFillBlanks && (
          <p className="font-normal text-sm text-[#212121] leading-5 tracking-[0.25px] w-full" style={NS}>
            {originalText}
          </p>
        )}

        {/* ── Footer ── */}
        {hideFooter ? (
          confirmedMessage ? (
            <div className="flex items-center gap-[6px] pt-[10px]">
              <span className="material-icons text-[16px] text-[#2e7d32]">check_circle</span>
              <span className="text-[12px] text-[#2e7d32] font-medium" style={NS}>{confirmedMessage}</span>
            </div>
          ) : null
        ) : (
          <div className={`flex gap-2 justify-end pt-[10px] ${isFillBlanks && isActive ? 'mt-[20px]' : ''}`} onClick={e => e.stopPropagation()}>
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
              <span className="text-[#6a3e31] text-[12px] font-medium leading-5" style={NS}>
                {t('btn_accept')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
