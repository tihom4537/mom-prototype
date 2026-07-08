import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../i18n/LanguageContext';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;
const NO_BIOMETRIC_MAX = 2;

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-[5px]">
      <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{label}:</span>
      <span className="text-[14px] font-semibold" style={{ ...NS, color }}>{value}</span>
    </div>
  );
}

function Marquee({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const span1 = container.querySelector('[data-copy="1"]') as HTMLElement;
    const span2 = container.querySelector('[data-copy="2"]') as HTMLElement;
    if (!span1 || !span2) return;

    let raf = 0;
    let x = 0;
    let last = 0;
    const SPEED = 80; // px/s
    const PAUSE = 1000; // ms before starting

    // Span1 starts at left edge, span2 offscreen
    span1.style.left = '0px';
    span2.style.left = '-9999px';

    raf = requestAnimationFrame(() => {
      const textW = span1.getBoundingClientRect().width;
      const containerW = container.getBoundingClientRect().width;
      // loop width = max of (textWidth + gap) and containerWidth
      // so span2 always enters from right edge of container
      const loopW = Math.max(textW + 60, containerW);
      span2.style.left = `${loopW}px`;

      const pauseEnd = performance.now() + PAUSE;
      last = pauseEnd;

      const tick = (now: number) => {
        if (now < pauseEnd) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const dt = (now - last) / 1000;
        last = now;
        x = (x + SPEED * dt) % loopW;
        span1.style.left = `${-x}px`;
        span2.style.left = `${loopW - x}px`;
        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  }, [text]);

  const spanStyle: React.CSSProperties = {
    ...NS,
    position: 'absolute',
    top: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#2e7d32',
    whiteSpace: 'nowrap',
  };

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', flex: 1, position: 'relative', height: '22px' }}>
      <span style={{ ...spanStyle, left: 0 }} data-copy="1">{text}</span>
      <span style={{ ...spanStyle, left: -9999 }} data-copy="2">{text}</span>
    </div>
  );
}

interface QuorumBarProps {
  total: number;
  present: number;
  absent: number;
  unmarked: number;
  noBiometricCount: number;
  quorumPct: number;
  quorumMet: boolean;
  quorumRequired?: number;
  /** True once this meeting has moved past this attendance step (e.g. stepsCompleted >= 1) —
   *  confetti never fires again after that, even if the user comes back to this screen.
   *  While false, confetti can refire freely each time quorum is (re-)met within the visit
   *  (met → unmet → met again all celebrate). */
  celebrationLocked?: boolean;
}

export default function QuorumBar({
  total, present, absent, unmarked, noBiometricCount, quorumPct, quorumMet, quorumRequired = 51,
  celebrationLocked = false,
}: QuorumBarProps) {
  const { t } = useLanguage();
  const firedRef = useRef(false);

  useEffect(() => {
    if (celebrationLocked) return;
    if (quorumMet && !firedRef.current) {
      firedRef.current = true;
      confetti({ particleCount: 250, spread: 120, origin: { x: 0.5, y: 1 }, startVelocity: 60, ticks: 400, gravity: 0.6, colors: ['#3c9718', '#6a3e31', '#f5c842', '#e05c2d', '#4a90d9'] });
    }
    if (!quorumMet) firedRef.current = false;
  }, [quorumMet, celebrationLocked]);

  const fillColor  = quorumMet ? '#3c9718' : '#c62828';
  const trackColor = quorumMet ? 'rgba(60,151,24,0.15)' : 'rgba(198,40,40,0.12)';
  const fillPct    = Math.min(quorumPct, 100);

  return (
    <div className="flex flex-col gap-[14px] bg-[rgba(106,62,49,0.05)] rounded-[10px] px-[20px] py-[12px] w-full">
      <div className="flex items-center justify-between gap-[24px]">
        <div className="flex items-center gap-[20px] shrink-0">
          <StatChip label={t('quorum_stat_total')}    value={total}    color="#6a3e31" />
          <div className="w-px h-[20px] bg-[rgba(106,62,49,0.2)]" />
          <StatChip label={t('quorum_stat_present')}  value={present}  color="#2e7d32" />
          <StatChip label={t('quorum_stat_absent')}   value={absent}   color="#c62828" />
          <StatChip label={t('quorum_stat_unmarked')} value={unmarked} color="#9e9e9e" />
          <div className="w-px h-[20px] bg-[rgba(106,62,49,0.2)]" />
          <div className="flex items-center gap-[5px]">
            <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{t('quorum_stat_no_biometric')}:</span>
            <span className={`text-[14px] font-semibold ${noBiometricCount >= NO_BIOMETRIC_MAX ? 'text-[#c62828]' : 'text-[#6a3e31]'}`} style={NS}>
              {noBiometricCount}/{NO_BIOMETRIC_MAX}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-[10px] shrink-0">
          <span className="text-[14px] font-medium text-[#6a3e31] whitespace-nowrap" style={NS}>
            {t('quorum_target_label')} ({quorumRequired}%)
          </span>
          <div className="relative w-[120px] h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
            <div className="absolute top-0 bottom-0 w-[2px] bg-[rgba(106,62,49,0.4)] z-10" style={{ left: `${quorumRequired}%` }} />
            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-300" style={{ width: `${fillPct}%`, backgroundColor: fillColor }} />
          </div>
          <span className="text-[14px] font-semibold min-w-[32px] text-right" style={{ ...NS, color: fillColor }}>
            {quorumPct}%
          </span>
        </div>
      </div>

      {quorumMet && (
        <div className="flex items-center gap-[8px] bg-white border border-[#e0e0e0] rounded-[8px] px-[12px] py-[6px] w-full overflow-hidden">
          <span className="text-[16px] leading-none shrink-0">🎉</span>
          <Marquee text={t('quorum_met_message')} />
        </div>
      )}
    </div>
  );
}
