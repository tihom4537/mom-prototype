import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface StepNavBarProps {
  onBack?: () => void;
  backLabel?: string;
  /** Hide back link on step 1 — nothing to go back to */
  showBack?: boolean;
}

export default function StepNavBar({ onBack, backLabel = 'Previous step', showBack = true }: StepNavBarProps) {
  if (!showBack || !onBack) return null;

  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-[6px] text-[#6a3e31] hover:text-[#ae6651] transition-colors self-start"
      style={NS}
    >
      <Icon name="arrow_back" size="small" color="currentColor" />
      <span className="text-[13px] font-medium leading-5 tracking-[0.1px]">{backLabel}</span>
    </button>
  );
}
