import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;
const NO_BIOMETRIC_MAX = 2;

function playClap(): () => void {
  const audio = new Audio('/clap.mp3');
  audio.volume = 1;
  audio.play().then(() => console.log('[clap] playing')).catch(e => console.error('[clap] blocked:', e));
  return () => { audio.pause(); audio.currentTime = 0; };
}

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
    const SPEED = 80;
    const PAUSE = 1000;

    span1.style.left = '0px';
    span2.style.left = '-9999px';

    raf = requestAnimationFrame(() => {
      const textW = span1.getBoundingClientRect().width;
      const containerW = container.getBoundingClientRect().width;
      const loopW = Math.max(textW + 60, containerW);
      span2.style.left = `${loopW}px`;

      const pauseEnd = performance.now() + PAUSE;
      last = pauseEnd;

      const tick = (now: number) => {
        if (now < pauseEnd) { raf = requestAnimationFrame(tick); return; }
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

function QuorumModal({ message, onDone, stopAudio }: { message: string; onDone: () => void; stopAudio: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => { setVisible(false); stopAudio(); }, 2400);
    const t3 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone, stopAudio]);

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          transform: visible ? 'scale(1)' : 'scale(0.88)',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
          maxWidth: '420px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '72px', lineHeight: 1 }}>👏</span>
        <span style={{ ...NS, fontWeight: 600, fontSize: '17px', color: '#6a3e31', lineHeight: 1.4 }}>
          {message}
        </span>
      </div>
    </div>,
    document.body,
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
  celebrationLocked?: boolean;
  celebrationMessage?: string;
  staticQuorumText?: boolean;
}

export default function QuorumBar({
  total, present, absent, unmarked, noBiometricCount, quorumPct, quorumMet, quorumRequired = 51, staticQuorumText = false,
  celebrationLocked = false, celebrationMessage,
}: QuorumBarProps) {
  const { t } = useLanguage();
  const firedRef = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const stopAudioRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (celebrationLocked) return;
    if (quorumMet && !firedRef.current) {
      firedRef.current = true;
      stopAudioRef.current = playClap();
      setShowModal(true);
    }
    if (!quorumMet) firedRef.current = false;
  }, [quorumMet, celebrationLocked]);

  const fillColor  = quorumMet ? '#3c9718' : '#c62828';
  const trackColor = quorumMet ? 'rgba(60,151,24,0.15)' : 'rgba(198,40,40,0.12)';
  const fillPct    = Math.min(quorumPct, 100);

  return (
    <>
      {showModal && (
        <QuorumModal
          message={celebrationMessage ?? t('quorum_met_message')}
          onDone={() => setShowModal(false)}
          stopAudio={stopAudioRef.current}
        />
      )}

      <div className="flex flex-col gap-[14px] bg-[rgba(106,62,49,0.05)] rounded-[10px] px-[20px] py-[12px] w-full">
        <div className="flex items-center flex-wrap justify-between gap-x-[24px] gap-y-[10px]">
          <div className="flex items-center flex-wrap gap-x-[20px] gap-y-[8px]">
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
            {staticQuorumText
              ? <span className="text-[13px] font-medium text-[#6a3e31]" style={NS}>{t('quorum_met_message')}</span>
              : <Marquee text={t('quorum_met_message')} />}
          </div>
        )}
      </div>
    </>
  );
}
