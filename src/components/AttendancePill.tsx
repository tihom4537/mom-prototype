import Icon from './Icon';
import { useLanguage } from '../i18n/LanguageContext';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

export type AttendanceStatus = 'unmarked' | 'present' | 'absent';

interface AttendancePillProps {
  status: AttendanceStatus;
  onMark: (s: 'present' | 'absent') => void;
  onUnmark?: () => void;
  presentLabel?: string;
  absentLabel?: string;
}

export default function AttendancePill({ status, onMark, onUnmark, presentLabel, absentLabel }: AttendancePillProps) {
  const { t } = useLanguage();
  const pLabel = presentLabel ?? t('attendance_pill_present');
  const aLabel = absentLabel  ?? t('attendance_pill_absent');
  return (
    <div className="flex gap-[6px]">
      <button
        type="button"
        onClick={() => status === 'present' && onUnmark ? onUnmark() : onMark('present')}
        className={`flex items-center gap-[4px] px-[10px] py-[4px] rounded-[6px] border text-[12px] font-medium transition-colors
          ${status === 'present'
            ? 'bg-white border-[#388e3c] text-[#388e3c]'
            : 'bg-white border-[#c6c6c6] text-[#727272] hover:border-[#388e3c] hover:text-[#388e3c]'}`}
        style={NS}
      >
        <Icon name="check" size="small" color={status === 'present' ? '#388e3c' : '#c6c6c6'} />
        {pLabel}
      </button>
      <button
        type="button"
        onClick={() => status === 'absent' && onUnmark ? onUnmark() : onMark('absent')}
        className={`flex items-center gap-[4px] px-[10px] py-[4px] rounded-[6px] border text-[12px] font-medium transition-colors
          ${status === 'absent'
            ? 'bg-white border-[#c62828] text-[#c62828]'
            : 'bg-white border-[#c6c6c6] text-[#727272] hover:border-[#c62828] hover:text-[#c62828]'}`}
        style={NS}
      >
        <Icon name="close" size="small" color={status === 'absent' ? '#c62828' : '#c6c6c6'} />
        {aLabel}
      </button>
    </div>
  );
}
