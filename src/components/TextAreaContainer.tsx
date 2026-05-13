import Icon from './Icon';
import MicButton from './MicButton';

export type TextAreaState = 'default' | 'filled' | 'recording';

export interface HighlightSpan {
  text: string;
  type: 'add-missing-details' | 'rephrase';
  cardId: string;
  isActive: boolean;
}

interface Segment {
  text: string;
  highlight?: HighlightSpan;
}

function buildSegments(value: string, highlights: HighlightSpan[]): Segment[] {
  const ranges: Array<{ start: number; end: number; highlight: HighlightSpan }> = [];
  for (const h of highlights) {
    if (!h.text) continue;
    let idx = 0;
    while (true) {
      const pos = value.indexOf(h.text, idx);
      if (pos === -1) break;
      ranges.push({ start: pos, end: pos + h.text.length, highlight: h });
      idx = pos + 1;
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let pos = 0;
  for (const range of ranges) {
    if (range.start < pos) continue;
    if (range.start > pos) {
      segments.push({ text: value.slice(pos, range.start) });
    }
    segments.push({ text: value.slice(range.start, range.end), highlight: range.highlight });
    pos = range.end;
  }
  if (pos < value.length) {
    segments.push({ text: value.slice(pos) });
  }
  return segments;
}

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface TextAreaContainerProps {
  state?: TextAreaState;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Called when mic button clicked (start recording) */
  onMicClick?: () => void;
  /** Called when stop button clicked (stop recording) */
  onStopClick?: () => void;
  onScanPhoto?: () => void;
  onUploadAudio?: () => void;
  scanPhotoLabel?: string;
  uploadAudioLabel?: string;
  /** When provided, renders rich-text view with highlighted spans */
  highlights?: HighlightSpan[];
  onSpanHoverEnter?: (cardId: string) => void;
  onSpanHoverLeave?: (cardId: string) => void;
  onSpanClick?: (cardId: string) => void;
  /** Applies permanent coral border (for MoM Entry feedback screen) */
  highlighted?: boolean;
  /** Removes max-height cap — textarea grows to fill parent flex container */
  fillHeight?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // Legacy props — accepted but unused so existing call-sites don't break
  onStopRecording?: () => void;
  onAcceptRecording?: () => void;
  analyserNode?: AnalyserNode;
  isProcessing?: boolean;
}

export default function TextAreaContainer({
  state = 'default',
  placeholder = 'Type agenda discussion here, or click the mic button to dictate the agenda discussion.....',
  value,
  onChange,
  onMicClick,
  onStopClick,
  onScanPhoto,
  onUploadAudio,
  scanPhotoLabel = 'Scan Photo',
  uploadAudioLabel = 'Upload Audio',
  highlights,
  onSpanHoverEnter,
  onSpanHoverLeave,
  onSpanClick,
  highlighted = false,
  fillHeight = false,
  className,
  style,
  analyserNode,
  isProcessing = false,
}: TextAreaContainerProps) {
  const isFilled    = state === 'filled';
  const isRecording = state === 'recording';
  const hasExplicitHeight = !!(style?.height || style?.maxHeight);

  const useRichText = highlights !== undefined && highlights.length > 0;

  const borderClass = isRecording
    ? 'border border-[#ff7266] bg-[rgba(201,201,201,0.1)]'
    : (highlighted || !isFilled)
      ? 'border border-[#c6c6c6] bg-[rgba(201,201,201,0.1)]'
      : 'border border-[#727272] bg-[rgba(201,201,201,0.2)]';

  return (
    <div className={`flex flex-col rounded-[8px] ${borderClass} ${fillHeight ? 'flex-1 min-h-[100px]' : ''} ${className ?? 'w-full'}`} style={style}>

      {/* Text display area */}
      <div className={`flex items-start px-[8px] pt-[4px] pb-[8px] w-full ${(fillHeight || hasExplicitHeight) ? 'flex-1 min-h-0 overflow-hidden' : ''}`}>
        {useRichText ? (
          <div className={`flex-1 relative ${(fillHeight || hasExplicitHeight) ? 'h-full min-h-0' : 'min-h-[160px] max-h-[300px]'}`}>
            {onChange && (
              <textarea
                className="absolute inset-0 w-full h-full font-normal text-sm leading-[20px] tracking-[0.25px] bg-transparent border-none outline-none resize-none text-transparent caret-[#212121] z-10"
                style={NS}
                value={value}
                onChange={e => onChange(e.target.value)}
              />
            )}
            <div
              className="w-full h-full font-normal text-sm leading-[20px] tracking-[0.25px] text-[#212121] whitespace-pre-wrap break-words overflow-y-auto pointer-events-none"
              style={NS}
            >
              {value
                ? buildSegments(value, highlights ?? []).map((seg, i) =>
                    seg.highlight ? (
                      <span
                        key={i}
                        className="pointer-events-auto"
                        style={{
                          backgroundColor: seg.highlight.isActive
                            ? (seg.highlight.type === 'add-missing-details'
                                ? 'rgba(255,116,104,0.5)'
                                : 'rgba(97,58,245,0.4)')
                            : (seg.highlight.type === 'add-missing-details'
                                ? 'rgba(255,116,104,0.2)'
                                : 'rgba(97,58,245,0.18)'),
                          borderRadius: '3px',
                          cursor: 'pointer',
                          padding: '0 2px',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={() => onSpanHoverEnter?.(seg.highlight!.cardId)}
                        onMouseLeave={() => onSpanHoverLeave?.(seg.highlight!.cardId)}
                        onClick={() => onSpanClick?.(seg.highlight!.cardId)}
                      >
                        {seg.text}
                      </span>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  )
                : <span className="text-[#727272]">{placeholder}</span>
              }
            </div>
          </div>
        ) : onChange ? (
          <textarea
            className={`flex-1 font-normal text-sm leading-[20px] tracking-[0.25px] bg-transparent border-none outline-none resize-none overflow-y-auto text-[#212121] placeholder:text-[#727272] ${(fillHeight || hasExplicitHeight) ? 'h-full min-h-0' : 'min-h-[160px]'}`}
            style={{ ...NS, ...(style?.minHeight ? { minHeight: style.minHeight } : {}), ...(style?.maxHeight ? { maxHeight: style.maxHeight } : {}) }}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        ) : (
          <p
            className={`flex-1 font-normal text-sm leading-[20px] tracking-[0.25px] min-h-px min-w-px
              ${isFilled ? 'text-[#212121]' : 'text-[#727272] overflow-hidden text-ellipsis whitespace-nowrap'}`}
            style={NS}
          >
            {value ?? placeholder}
          </p>
        )}
      </div>

      {/* Bottom action row */}
      <div className="flex items-center justify-between px-[10px] pb-[10px]">
        {/* Left: Scan Photo + Upload Audio */}
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={onScanPhoto}
            className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[10px] py-[6px] border-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Icon name="photo_camera" size="small" color="#6a3e31" />
            <span
              className="text-[#6a3e31] text-[12px] font-medium leading-5"
              style={NS}
            >
              {scanPhotoLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={onUploadAudio}
            className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[10px] py-[6px] border-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Icon name="upload_file" size="small" color="#6a3e31" />
            <span
              className="text-[#6a3e31] text-[12px] font-medium leading-5"
              style={NS}
            >
              {uploadAudioLabel}
            </span>
          </button>
        </div>

        {/* Right: mic / stop / processing */}
        {isProcessing ? (
          <div className="flex items-center gap-[6px] shrink-0">
            <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#ffa199" strokeWidth="2" strokeOpacity="0.3" />
              <path d="M8 2a6 6 0 0 1 6 6" stroke="#ff7468" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[12px] text-[#6a3e31] font-medium whitespace-nowrap" style={NS}>
              Transcribing…
            </span>
          </div>
        ) : (
          <MicButton
            isRecording={isRecording}
            onClick={isRecording ? onStopClick : onMicClick}
            analyserNode={analyserNode}
          />
        )}
      </div>
    </div>
  );
}
