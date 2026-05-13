import { useLanguage } from '../i18n/LanguageContext';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;
const NO_BIOMETRIC_MAX = 2;

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-[5px]">
      <span className="text-[12px] font-medium text-[#6a3e31]" style={NS}>{label}:</span>
      <span className="text-[13px] font-semibold" style={{ ...NS, color }}>{value}</span>
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
}

export default function QuorumBar({
  total,
  present,
  absent,
  unmarked,
  noBiometricCount,
  quorumPct,
  quorumMet,
  quorumRequired = 51,
}: QuorumBarProps) {
  const { t } = useLanguage();
  const fillColor  = quorumMet ? '#3c9718' : '#c62828';
  const trackColor = quorumMet ? 'rgba(60,151,24,0.15)' : 'rgba(198,40,40,0.12)';
  const fillPct    = Math.min(quorumPct, 100);

  return (
    <div className="flex items-center justify-between bg-[rgba(106,62,49,0.05)] rounded-[10px] px-[20px] py-[12px] w-full gap-[24px]">
      {/* Left — counts */}
      <div className="flex items-center gap-[20px] shrink-0">
        <StatChip label={t('quorum_stat_total')}    value={total}    color="#6a3e31" />
        <div className="w-px h-[20px] bg-[rgba(106,62,49,0.2)]" />
        <StatChip label={t('quorum_stat_present')}  value={present}  color="#2e7d32" />
        <StatChip label={t('quorum_stat_absent')}   value={absent}   color="#c62828" />
        <StatChip label={t('quorum_stat_unmarked')} value={unmarked} color="#9e9e9e" />
        <div className="w-px h-[20px] bg-[rgba(106,62,49,0.2)]" />
        <div className="flex items-center gap-[5px]">
          <span className="text-[12px] font-medium text-[#6a3e31]" style={NS}>{t('quorum_stat_no_biometric')}:</span>
          <span
            className={`text-[13px] font-semibold ${noBiometricCount >= NO_BIOMETRIC_MAX ? 'text-[#c62828]' : 'text-[#6a3e31]'}`}
            style={NS}
          >
            {noBiometricCount}/{NO_BIOMETRIC_MAX}
          </span>
        </div>
      </div>

      {/* Right — quorum progress */}
      <div className="flex items-center gap-[10px] shrink-0">
        <span className="text-[11px] font-medium text-[#6a3e31] whitespace-nowrap" style={NS}>
          {t('quorum_target_label')} ({quorumRequired}%)
        </span>
        {/* Track */}
        <div className="relative w-[120px] h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
          {/* Target marker */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[rgba(106,62,49,0.4)] z-10"
            style={{ left: `${quorumRequired}%` }}
          />
          {/* Fill */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
            style={{ width: `${fillPct}%`, backgroundColor: fillColor }}
          />
        </div>
        <span className="text-[12px] font-semibold min-w-[32px] text-right" style={{ ...NS, color: fillColor }}>
          {quorumPct}%
        </span>
      </div>
    </div>
  );
}
