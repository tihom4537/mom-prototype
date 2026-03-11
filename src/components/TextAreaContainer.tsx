import { useRef, useEffect } from 'react';

const imgIconBase = "https://www.figma.com/api/mcp/asset/1752d8dc-e842-4f52-9aba-6410f66e82be";
const imgCloseVec = "https://www.figma.com/api/mcp/asset/3604a723-50e4-461e-b7eb-17f1c801523e";
const imgCheckVec = "https://www.figma.com/api/mcp/asset/faadd345-05a2-4359-ac39-16e650cb75a4";

export type TextAreaState = 'default' | 'filled' | 'recording';

interface TextAreaContainerProps {
  state?: TextAreaState;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onStopRecording?: () => void;
  onAcceptRecording?: () => void;
  analyserNode?: AnalyserNode;
  className?: string;
}

export default function TextAreaContainer({
  state = 'default',
  placeholder = 'Type agenda discussion here, or click the mic button to dictate the agenda discussion.....',
  value,
  onChange,
  onStopRecording,
  onAcceptRecording,
  analyserNode,
  className,
}: TextAreaContainerProps) {
  const isFilled = state === 'filled';
  const isRecording = state === 'recording';
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content — no internal scrollbar ever
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    analyserNode.fftSize = 256;
    const bufferLength = analyserNode.frequencyBinCount; // 128
    const dataArray = new Uint8Array(bufferLength);

    // Sync canvas pixel dimensions to its CSS display size once
    canvas.width = canvas.offsetWidth || 240;
    canvas.height = canvas.offsetHeight || 45;
    const W = canvas.width;
    const H = canvas.height;

    const barW = 3;
    const barCount = Math.floor(W / 6);
    const gap = barCount > 1 ? (W - barCount * barW) / (barCount - 1) : 0;
    const step = Math.max(1, Math.floor(bufferLength / barCount));

    const draw = () => {
      animId = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < barCount; i++) {
        const idx = Math.min(i * step, bufferLength - 1);
        const value = dataArray[idx] / 255;
        const barH = Math.max(2, value * H * 0.85);
        const x = Math.round(i * (barW + gap));
        const y = (H - barH) / 2;
        ctx.fillStyle = value > 0.45 ? '#ff7468' : '#ff9a6c';
        ctx.globalAlpha = 0.55 + value * 0.45;
        ctx.fillRect(x, y, barW, barH);
      }
      ctx.globalAlpha = 1;
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [analyserNode]);

  return (
    <div
      className={`border border-[#c6c6c6] flex flex-col items-center pl-1 pr-[10px] pt-1 rounded-lg
        ${isRecording ? 'bg-[rgba(201,201,201,0.08)] gap-[49px] pb-[10px]' : 'bg-[rgba(201,201,201,0.08)] justify-center pb-[30px]'}
        ${isFilled ? 'bg-[rgba(201,201,201,0.2)]' : ''}
        ${className ?? 'w-full'}`}
    >
      {/* Text input area */}
      <div className="flex items-start px-2 py-1 shrink-0 w-full">
        {onChange ? (
          <textarea
            ref={textareaRef}
            className={`flex-1 font-normal text-sm leading-5 tracking-[0.25px] bg-transparent border-none outline-none resize-none overflow-hidden min-h-[60px]
              ${isFilled ? 'text-[#212121]' : 'text-[#727272]'}`}
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        ) : (
          <p
            className={`flex-1 font-normal text-sm leading-5 tracking-[0.25px] overflow-hidden text-ellipsis whitespace-nowrap min-h-px min-w-px
              ${isFilled ? 'text-[#212121]' : 'text-[#727272]'}`}
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {value ?? placeholder}
          </p>
        )}
      </div>

      {/* Recording waveform + controls */}
      {isRecording && (
        <div className="bg-[#f3f3f3] flex items-center px-[15px] py-2 rounded-[15px] shrink-0 w-full">
          <div className="flex flex-1 items-center justify-between min-h-px min-w-px">
            {/* Live waveform canvas */}
            <canvas
              ref={canvasRef}
              className="h-[45px] flex-1 min-w-0"
            />
            {/* Controls */}
            <div className="flex gap-3 items-center shrink-0">
              {/* Cancel */}
              <button
                onClick={onStopRecording}
                className="bg-[#b7131a] flex gap-2 items-center justify-center overflow-clip p-2 rounded-lg size-[33px] cursor-pointer border-none"
              >
                <div className="overflow-clip relative size-6 shrink-0">
                  <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
                  <div className="absolute inset-[20.83%]">
                    <img alt="" className="absolute block max-w-none size-full" src={imgCloseVec} />
                  </div>
                </div>
              </button>
              {/* Accept */}
              <button
                onClick={onAcceptRecording}
                className="bg-[#3c9718] flex gap-2 items-center justify-center overflow-clip p-2 rounded-lg size-[33px] cursor-pointer border-none"
              >
                <div className="overflow-clip relative size-6 shrink-0">
                  <img alt="" className="absolute block max-w-none size-full" src={imgIconBase} />
                  <div className="absolute inset-[23.29%_12.5%_20.83%_14.21%]">
                    <img alt="" className="absolute block max-w-none size-full" src={imgCheckVec} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
