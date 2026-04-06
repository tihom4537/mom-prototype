import { useRef, useEffect } from 'react';
import FeedbackCardTags, { FeedbackTagType } from './FeedbackCardTags';
import Icon from './Icon';

export type FeedbackCardType = 'add-details' | 'rephrase' | 'make-concise';

const typeToTagType: Record<FeedbackCardType, FeedbackTagType> = {
  'add-details':  'add-missing-details',
  rephrase:       'rephrase',
  'make-concise': 'make-concise',
};

export interface FeedbackCardProps {
  type?: FeedbackCardType;
  originalText?: string;
  onAccept?: () => void;
  onReject?: () => void;
  /** Switches the card between default (collapsed) and clicked (expanded) state */
  isActive?: boolean;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onClick?: () => void;
  /** The text filled into the inline blank by typing or STT */
  addedText?: string;
  onAddedTextChange?: (text: string) => void;
  /** Push addedText to main TextAreaContainer — called by ✓ button */
  onPushText?: () => void;
  addPlaceholder?: string;
  /** Recording state within the card */
  isMicRecording?: boolean;
  isMicProcessing?: boolean;
  onMicClick?: () => void;
  onCancelRecording?: () => void;
  onConfirmRecording?: () => void;
  micAnalyserNode?: AnalyserNode;
  micError?: string | null;
  className?: string;
}

/** Strip a trailing " —" or "—" and report whether one was present. */
function splitAtDash(text: string): [string, boolean] {
  const cleaned = text.replace(/\s*—\s*$/, '');
  return [cleaned, cleaned.length < text.length];
}

export default function FeedbackCard({
  type = 'add-details',
  originalText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  onAccept,
  onReject,
  isActive = false,
  onHoverEnter,
  onHoverLeave,
  onClick,
  addedText = '',
  onAddedTextChange,
  onPushText,
  addPlaceholder = '________',
  isMicRecording = false,
  isMicProcessing = false,
  onMicClick,
  onCancelRecording,
  onConfirmRecording,
  micAnalyserNode,
  micError,
  className,
}: FeedbackCardProps) {
  const isAddDetails = type === 'add-details';
  const isStaticBody = type === 'rephrase' || type === 'make-concise';

  // For add-details: strip trailing "—" so the blank replaces it visually
  const [cleanText] = isAddDetails ? splitAtDash(originalText) : [originalText];

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const blankInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the inline blank when card becomes active
  useEffect(() => {
    if (isActive && isAddDetails && !isMicRecording && !isMicProcessing) {
      blankInputRef.current?.focus();
    }
  }, [isActive, isAddDetails, isMicRecording, isMicProcessing]);

  // Live waveform animation when recording inside card
  useEffect(() => {
    if (!micAnalyserNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d')!;
    let animId: number;

    micAnalyserNode.fftSize = 256;
    const bufferLength = micAnalyserNode.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);

    canvas.width  = canvas.offsetWidth  || 180;
    canvas.height = canvas.offsetHeight || 36;
    const W = canvas.width;
    const H = canvas.height;

    const barW     = 3;
    const barCount = Math.floor(W / 6);
    const gap      = barCount > 1 ? (W - barCount * barW) / (barCount - 1) : 0;
    const step     = Math.max(1, Math.floor(bufferLength / barCount));

    const draw = () => {
      animId = requestAnimationFrame(draw);
      micAnalyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < barCount; i++) {
        const idx  = Math.min(i * step, bufferLength - 1);
        const val  = dataArray[idx] / 255;
        const barH = Math.max(2, val * H * 0.85);
        const x    = Math.round(i * (barW + gap));
        const y    = (H - barH) / 2;
        ctx.fillStyle   = val > 0.45 ? '#ff7468' : '#ff9a6c';
        ctx.globalAlpha = 0.55 + val * 0.45;
        ctx.fillRect(x, y, barW, barH);
      }
      ctx.globalAlpha = 1;
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [micAnalyserNode]);

  const isRecOrProc = isMicRecording || isMicProcessing;

  const activeStyle = isActive
    ? {
        borderColor: isAddDetails ? '#ff7468' : '#613af5',
        boxShadow:   isAddDetails
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
      <div className="bg-white flex items-center overflow-clip pb-[10px] pt-3 px-4 rounded-tl-lg rounded-tr-lg shrink-0 w-full">
        <div className="flex flex-1 items-center justify-between min-h-px min-w-px">
          <FeedbackCardTags type={typeToTagType[type]} />
          <div className="flex gap-[9px] items-center shrink-0">
            {/* Accept (✓) — outlined */}
            <button
              onClick={e => {
                e.stopPropagation();
                if (isAddDetails) { onPushText?.(); } else { onAccept?.(); }
              }}
              className="border border-[#ddd] flex items-center justify-center rounded-lg shrink-0 size-6 cursor-pointer bg-white hover:bg-[#f5f5f5] transition-colors"
              title="Accept"
            >
              <Icon name="check" size="small" color="#3c9718" />
            </button>
            {/* Reject (✕) — outlined */}
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

      {/* ── Body ──
          Stop propagation only when active so that clicking the body in
          default state bubbles up to the card's onClick and activates it,
          but clicking while already active doesn't toggle it off. */}
      <div
        className="bg-white flex flex-col pt-3 px-4 shrink-0 w-full"
        onClick={isActive ? e => e.stopPropagation() : undefined}
      >

        {/* ── Add-details ── */}
        {isAddDetails && (
          <>
            {/* Suggestion text + blank — one unified block, always visible.
                The blank is a static underline in default state and becomes
                an editable input when active. No repeated text ever. */}
            <div
              className="flex flex-wrap items-baseline font-normal text-sm text-[#212121] leading-5 tracking-[0.25px] pb-3 w-full"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              <span className="mr-1">{cleanText}</span>

              {/* DEFAULT: static underlined blank — not editable, full card width */}
              {!isActive && (
                <span
                  className="inline-block border-b-2 border-[#bbb] align-middle w-full"
                  style={{ height: '1em' }}
                />
              )}

              {/* ACTIVE: same blank becomes an editable input */}
              {isActive && (
                <input
                  ref={blankInputRef}
                  className="border-0 border-b-2 border-[#bbb] bg-transparent outline-none text-sm text-[#212121] placeholder-[#bbb] w-full"
                  style={{
                    fontFamily: 'Noto Sans',
                    fontVariationSettings: "'CTGR' 0, 'wdth' 100",
                  }}
                  value={addedText}
                  onChange={e => onAddedTextChange?.(e.target.value)}
                  placeholder={addPlaceholder}
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>

            {/* ACTIVE only: mic error + recording UI + mic button */}
            {isActive && (
              <div className="flex flex-col items-center w-full pb-[30px] gap-2">

                {micError && (
                  <p className="text-xs text-[#b7131a] w-full" style={{ fontFamily: 'Noto Sans' }}>
                    {micError}
                  </p>
                )}

                {/* Recording: waveform + cancel/confirm */}
                {isRecOrProc && (
                  <div className="bg-[#f3f3f3] flex items-center px-3 py-2 rounded-[15px] w-full">
                    <div className="flex flex-1 items-center justify-between min-h-px min-w-px">
                      {isMicProcessing ? (
                        <span className="flex-1 text-xs text-[#727272]" style={{ fontFamily: 'Noto Sans' }}>
                          Transcribing…
                        </span>
                      ) : (
                        <canvas ref={canvasRef} className="h-9 flex-1 min-w-0" />
                      )}
                      {!isMicProcessing && (
                        <div className="flex gap-2 items-center shrink-0 ml-2">
                          <button
                            onClick={e => { e.stopPropagation(); onCancelRecording?.(); }}
                            className="bg-[#b7131a] flex items-center justify-center overflow-clip p-2 rounded-lg size-[28px] cursor-pointer border-none"
                          >
                            <Icon name="close" size="small" color="white" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); onConfirmRecording?.(); }}
                            className="bg-[#3c9718] flex items-center justify-center overflow-clip p-2 rounded-lg size-[28px] cursor-pointer border-none"
                          >
                            <Icon name="check" size="small" color="white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Idle: mic button */}
                {!isRecOrProc && (
                  <button
                    onClick={e => { e.stopPropagation(); onMicClick?.(); }}
                    className="bg-[#ff7468] flex items-center justify-center rounded-full shadow-[0px_1px_10.3px_0px_#ff7468] size-9 border-none cursor-pointer hover:opacity-85 active:scale-95 transition-all shrink-0"
                    title="Dictate"
                  >
                    <Icon name="mic" size="small" color="white" />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Rephrase / Make Concise: static suggestion text (always shown) ── */}
        {isStaticBody && (
          <div className="pb-[15px]">
            <div className="border border-[#ddd] flex items-start rounded-[5px] w-full p-[10px]">
              <p
                className="flex-1 font-normal text-sm text-[#212121] leading-5 tracking-[0.25px] min-h-px min-w-px"
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {originalText}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
