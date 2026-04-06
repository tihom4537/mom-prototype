import Icon from './Icon';

export type CompletionState = 'pending' | 'completed';

interface CompletionTagProps {
  state?: CompletionState;
  className?: string;
}

export default function CompletionTag({ state = 'pending', className }: CompletionTagProps) {
  const isCompleted = state === 'completed';
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
        {isCompleted ? 'Completed' : 'Pending'}
      </span>
    </div>
  );
}
