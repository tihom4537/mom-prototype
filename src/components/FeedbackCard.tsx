import { useRef, useEffect } from 'react';
import FeedbackCardTags, { FeedbackTagType } from './FeedbackCardTags';

// Recording control assets
const imgIconBase = "https://www.figma.com/api/mcp/asset/1752d8dc-e842-4f52-9aba-6410f66e82be";
const imgCloseVec = "https://www.figma.com/api/mcp/asset/3604a723-50e4-461e-b7eb-17f1c801523e";
const imgCheckVec = "https://www.figma.com/api/mcp/asset/faadd345-05a2-4359-ac39-16e650cb75a4";
const imgMicFloat = "https://www.figma.com/api/mcp/asset/ad7b6587-ba59-4a34-b438-aff05e8d913a";

export type FeedbackCardType = 'add-details' | 'rephrase';

const typeToTagType: Record<FeedbackCardType, FeedbackTagType> = {
  'add-details': 'add-missing-details',
  rephrase:      'rephrase',
};

export interface FeedbackCardProps {
  type?: FeedbackCardType;
  originalText?: string;
  onAccept?: () => void;
  onReject?: () => void;
  /** Visually elevate card (bidirectional linking) */
  isActive?: boolean;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  onClick?: () => void;
  /** Add-details: current edited text (pre-populated with suggestion) */
  addedText?: string;
  onAddedTextChange?: (text: string) => void;
  /** Push addedText to main textarea — called by ✓ button for add-details */
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
  addPlaceholder = 'Type your notes here, or use the mic to dictate...',
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
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the inline textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [addedText]);

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
        borderColor: type === 'add-details' ? '#ff7468' : '#613af5',
        boxShadow:   type === 'add-details'
          ? '0 0 0 2px rgba(255,116,104,0.25)'
          : '0 0 0 2px rgba(97,58,245,0.2)',
      }
    : {};

  return (
    <div
      className={`border border-[#ddd] flex flex-col items-start overflow-clip rounded-lg transition-all duration-200 cursor-pointer ${className ?? ''}`}
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
            {/* Accept (✓) — green */}
            <button
              onClick={e => {
                e.stopPropagation();
                if (isAddDetails) { onPushText?.(); } else { onAccept?.(); }
              }}
              className="bg-[#3c9718] flex items-center justify-center rounded-lg shrink-0 size-7 cursor-pointer border-none hover:opacity-85 transition-opacity"
              title="Accept"
            >
              <div className="overflow-clip relative size-5 shrink-0">
                <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
                <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]">
                  <img alt="" className="absolute block max-w-none size-full" src={imgCheckVec} />
                </div>
              </div>
            </button>
            {/* Reject (✕) — red */}
            <button
              onClick={e => { e.stopPropagation(); onReject?.(); }}
              className="bg-[#b7131a] flex items-center justify-center overflow-clip rounded-lg shrink-0 size-7 cursor-pointer border-none hover:opacity-85 transition-opacity"
              title="Dismiss"
            >
              <div className="overflow-clip relative size-5 shrink-0">
                <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
                <div className="absolute inset-[20.83%]">
                  <img alt="" className="absolute block max-w-none size-full" src={imgCloseVec} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        className="bg-white flex flex-col pt-3 px-4 shrink-0 w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Add-details: full-width editable field, mic centered at bottom edge ── */}
        {isAddDetails && (
          <div className="flex flex-col gap-2 w-full pb-3">

            {micError && (
              <p className="text-xs text-[#b7131a] w-full" style={{ fontFamily: 'Noto Sans' }}>
                {micError}
              </p>
            )}

            {/* When recording: waveform + controls */}
            {isRecOrProc ? (
              <div className="bg-[#f3f3f3] flex items-center px-3 py-2 rounded-[15px] w-full mb-3">
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
                        onClick={onCancelRecording}
                        className="bg-[#b7131a] flex items-center justify-center overflow-clip p-2 rounded-lg size-[28px] cursor-pointer border-none"
                      >
                        <div className="overflow-clip relative size-5 shrink-0">
                          <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
                          <div className="absolute inset-[20.83%]">
                            <img alt="" className="absolute block max-w-none size-full" src={imgCloseVec} />
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={onConfirmRecording}
                        className="bg-[#3c9718] flex items-center justify-center overflow-clip p-2 rounded-lg size-[28px] cursor-pointer border-none"
                      >
                        <div className="overflow-clip relative size-5 shrink-0">
                          <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
                          <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]">
                            <img alt="" className="absolute block max-w-none size-full" src={imgCheckVec} />
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Full-width textarea + compact mic button centred below */
              <div className="flex flex-col items-center gap-[10px] w-full">
                <div className="border border-[#c6c6c6] rounded-lg bg-[rgba(201,201,201,0.08)] px-3 py-2 w-full">
                  <textarea
                    ref={textareaRef}
                    className="w-full font-normal text-sm leading-5 tracking-[0.25px] bg-transparent border-none outline-none resize-none overflow-hidden min-h-[60px] text-[#212121] placeholder-[#727272]"
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    placeholder={addPlaceholder}
                    value={addedText}
                    onChange={e => onAddedTextChange?.(e.target.value)}
                  />
                </div>
                {/* Compact coral mic button — secondary inline action */}
                <button
                  onClick={onMicClick}
                  className="bg-[#ff7468] flex items-center justify-center rounded-full shadow-[0_1px_8px_0_rgba(255,116,104,0.55)] size-8 border-none cursor-pointer hover:opacity-85 active:scale-95 transition-all shrink-0"
                  title="Dictate"
                >
                  <div className="h-[15px] relative w-[11px]">
                    <img alt="mic" className="absolute block max-w-none size-full" src={imgMicFloat} />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Rephrase: static suggestion text ── */}
        {!isAddDetails && (
          <div className="pb-4">
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
