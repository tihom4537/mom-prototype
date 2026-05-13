import Icon from './Icon';
import { useLanguage } from '../i18n/LanguageContext';

export type CompletionState = 'pending' | 'completed';

interface CompletionTagProps {
  state?: CompletionState;
  className?: string;
  label?: string;
}

export default function CompletionTag({ state = 'pending', className, label }: CompletionTagProps) {
  const { t } = useLanguage();
  const isCompleted = state === 'completed';
  const displayLabel = label ?? (isCompleted ? t('tag_completed') : t('tag_pending'));
  return (
    <div
      className={`flex gap-2 items-center justify-center overflow-clip px-[10px] py-[5px] rounded-lg
        ${isCompleted ? 'bg-[#e3f2d9] w-[127px]' : 'bg-[#faeded] w-[108px]'}
        ${className ?? ''}`}
    >
      {/* Icon */}
      {state === 'pending' ? (
        <Icon name="warning_amber" size="small" color="#b7131a" />
      ) : (
        <Icon name="check_circle" size="small" color="#3c9718" />
      )}

      {/* Label */}
      <span
        className={`font-medium text-sm text-center leading-5 tracking-[0.1px] whitespace-nowrap
          ${isCompleted ? 'text-[#212121]' : 'text-[#b7131a]'}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {displayLabel}
      </span>
    </div>
  );
}
