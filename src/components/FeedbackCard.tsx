import { useState, useRef, useEffect } from 'react';
import FeedbackCardTags, { FeedbackTagType } from './FeedbackCardTags';
import Button from './Button';
import Icon from './Icon';
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
  // Recording props (for fill-blanks cards)
  inputText?: string;
  onInputChange?: (text: string) => void;
  recordingState?: 'idle' | 'recording' | 'processing';
  onMicClick?: () => void;
  onCancelRecording?: () => void;
  onConfirmRecording?: () => void;
  micAnalyserNode?: AnalyserNode;
  micError?: string | null;
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
  inputText = '',
  onInputChange,
  recordingState = 'idle',
  onMicClick,
  onCancelRecording,
  onConfirmRecording,
  micAnalyserNode,
  micError,
}: FeedbackCardProps) {
  const { t } = useLanguage();
  const isFillBlanks = type === 'fill-blanks';
  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Waveform animation for recording state
  useEffect(() => {
    if (!isRecording || !canvasRef.current || !micAnalyserNode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(micAnalyserNode.frequencyBinCount);
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      micAnalyserNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f1f2f2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff7468';
      const barWidth = canvas.width / dataArray.length;
      const barHeight = canvas.height / 256;

      for (let i = 0; i < dataArray.length; i++) {
        const height = dataArray[i] * barHeight;
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
      }
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording, micAnalyserNode]);

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
        {/* Fill-blanks: sentence template (not editable, for reference) */}
        {isFillBlanks && (
          <div className="border border-[#ddd] flex items-start rounded-[5px] w-full p-[10px]">
            <p
              className="flex-1 font-normal text-sm text-[#212121] leading-5 tracking-[0.25px] min-h-px min-w-px"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {originalText}
            </p>
          </div>
        )}

        {/* Fill-blanks: user input (typing or transcribed) */}
        {isFillBlanks && isActive && (
          <div className="w-full flex flex-col gap-[8px]">
            {/* Input or recording canvas */}
            {isRecording ? (
              <canvas
                ref={canvasRef}
                width={300}
                height={60}
                className="w-full rounded-[5px] bg-[#f1f2f2] border border-[#ddd]"
                style={{ minHeight: '60px' }}
              />
            ) : isProcessing ? (
              <div className="flex items-center justify-center py-[15px] bg-[#f1f2f2] rounded-[5px] border border-[#ddd]">
                <span className="text-[12px] text-[#727272]" style={{ fontFamily: 'Noto Sans' }}>
                  Transcribing…
                </span>
              </div>
            ) : (
              <textarea
                value={inputText}
                onChange={e => onInputChange?.(e.target.value)}
                placeholder="Type or record details..."
                className="w-full border border-[#ddd] rounded-[5px] px-[12px] py-[10px] text-sm text-[#212121] placeholder-[#bbb] outline-none focus:border-[#ff7468] focus:ring-1 focus:ring-[#ff7468] resize-none"
                style={{ fontFamily: 'Noto Sans', minHeight: '60px' }}
                onClick={e => e.stopPropagation()}
              />
            )}

            {/* Mic button */}
            {!isProcessing && (
              <div className="flex gap-[8px] items-center">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onMicClick?.();
                  }}
                  className={`flex items-center justify-center w-[36px] h-[36px] rounded-full transition-colors ${
                    isRecording
                      ? 'bg-[#ff7468] hover:bg-[#ff6a5d]'
                      : 'bg-[#ff7468] hover:bg-[#ff6a5d]'
                  }`}
                  title="Record"
                >
                  <Icon name="mic" color="white" size="medium" />
                </button>

                {/* Recording controls */}
                {isRecording && (
                  <>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onCancelRecording?.();
                      }}
                      className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-[#b7131a] hover:bg-[#a00000] transition-colors"
                      title="Cancel"
                    >
                      <Icon name="close" color="white" size="medium" />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onConfirmRecording?.();
                      }}
                      className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-[#2e7d32] hover:bg-[#237d2c] transition-colors"
                      title="Confirm"
                    >
                      <Icon name="check" color="white" size="medium" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Error message */}
            {micError && (
              <p className="text-[12px] text-[#b7131a]" style={{ fontFamily: 'Noto Sans' }}>
                {micError}
              </p>
            )}
          </div>
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
            className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[16px] py-[8px] border-none cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
            disabled={isFillBlanks && !inputText?.trim()}
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
