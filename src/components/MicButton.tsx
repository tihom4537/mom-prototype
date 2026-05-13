import { useEffect, useRef } from 'react';
import Icon from './Icon';
import Tooltip from './Tooltip';
import { useLanguage } from '../i18n/LanguageContext';

interface MicButtonProps {
  onClick?: () => void;
  isRecording?: boolean;
  disabled?: boolean;
  className?: string;
  analyserNode?: AnalyserNode | null;
  /** @deprecated unused */
  pulse?: boolean;
}

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

function WaveformCanvas({ analyserNode }: { analyserNode?: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // CSS display size
  const CSS_W = 72;
  const CSS_H = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for retina — eliminates pixelation
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CSS_W * dpr;
    canvas.height = CSS_H * dpr;
    ctx.scale(dpr, dpr);

    const BAR_COUNT = 13;
    const BAR_W     = 2.5;
    const GAP       = 2;
    const MAX_H     = CSS_H - 2;
    const MIN_H     = 3;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, CSS_W, CSS_H);

      const heights: number[] = [];

      if (analyserNode) {
        const buf = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(buf);
        const step = Math.floor(buf.length / BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          const val = buf[i * step] / 255;
          heights.push(MIN_H + val * (MAX_H - MIN_H));
        }
      } else {
        // Smooth sine fallback — looks like active recording
        const t = Date.now() / 220;
        for (let i = 0; i < BAR_COUNT; i++) {
          const v = 0.35 + 0.65 * Math.abs(Math.sin(t + i * 0.55));
          heights.push(MIN_H + v * (MAX_H - MIN_H));
        }
      }

      const totalW = BAR_COUNT * BAR_W + (BAR_COUNT - 1) * GAP;
      let x = (CSS_W - totalW) / 2;

      ctx.fillStyle = 'white';
      for (let i = 0; i < BAR_COUNT; i++) {
        const h = heights[i];
        const y = (CSS_H - h) / 2;
        const r = BAR_W / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_W, h, r);
        ctx.fill();
        x += BAR_W + GAP;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: CSS_W, height: CSS_H, display: 'block', flexShrink: 0 }}
    />
  );
}

export default function MicButton({
  onClick,
  isRecording = false,
  disabled = false,
  className,
  analyserNode,
}: MicButtonProps) {
  const { t } = useLanguage();

  if (isRecording) {
    return (
      <div className="relative inline-flex items-center justify-center">

        {/* Pulsing pill silhouettes — negative y-inset makes ripple taller so top/bottom bleed matches left/right */}
        <span
          className="absolute inset-x-0 pointer-events-none rounded-[50px] animate-[pillPulse_2.2s_ease-out_infinite]"
          style={{ top: '-6px', bottom: '-6px', background: '#ffeae9' }}
        />
        <span
          className="absolute inset-x-0 pointer-events-none rounded-[50px] animate-[pillPulse_2.2s_ease-out_0.7s_infinite]"
          style={{ top: '-6px', bottom: '-6px', background: '#ffeae9' }}
        />
        <span
          className="absolute inset-x-0 pointer-events-none rounded-[50px] animate-[pillPulse_2.2s_ease-out_1.4s_infinite]"
          style={{ top: '-6px', bottom: '-6px', background: '#ffeae9' }}
        />

        <button
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          className={`relative z-10 flex gap-[10px] items-center justify-center px-[14px] py-[8px] rounded-[50px] border-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${className ?? ''}`}
          style={{
            background: '#ffa199',
            boxShadow: '0px 1px 20px 0px #ff7468',
          }}
          aria-label="Stop recording"
        >
          <WaveformCanvas analyserNode={analyserNode} />
          <span className="text-[#6a3e31] text-[12px] font-medium leading-4 tracking-[0.5px] shrink-0" style={NS}>
            {t('mic_stop')}
          </span>
        </button>
      </div>
    );
  }

  return (
    <Tooltip text={t('mic_tooltip')} direction="top" autoWidth>
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`bg-[#ff7468] flex items-center justify-center rounded-full border-none relative
          shadow-[0px_1px_10.3px_0px_#ff7468] size-[36px] transition-transform hover:scale-105
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className ?? ''}`}
        aria-label="Start recording"
      >
        <Icon name="mic" size="small" color="white" />
      </button>
    </Tooltip>
  );
}
