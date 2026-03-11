export type SidenavDropdownState = 'no-hover' | 'hover' | 'selected';

interface DropdownOptionsInSidenavProps {
  state?: SidenavDropdownState;
  text?: string;
  className?: string;
}

export default function DropdownOptionsInSidenav({
  state = 'no-hover',
  text = 'Meeting List',
  className,
}: DropdownOptionsInSidenavProps) {
  const borderColor =
    state === 'selected'
      ? 'bg-[#6a3e31]'
      : state === 'hover'
      ? 'bg-[rgba(106,62,49,0.32)]'
      : 'bg-[#d9d9d9]';

  const contentBg =
    state === 'selected'
      ? 'bg-[#efe0dc]'
      : state === 'hover'
      ? 'bg-[#f7f0ee]'
      : '';

  return (
    <div className={className ?? 'flex gap-[5px] items-center w-[166px]'}>
      {/* Left vertical bar */}
      <div className={`self-stretch shrink-0 w-[1.667px] ${borderColor}`} />
      {/* Content */}
      <div
        className={`flex flex-1 flex-wrap gap-y-3 items-center min-h-px min-w-px px-3 py-2 rounded-xl ${contentBg}`}
      >
        <div className="flex flex-1 flex-col items-start justify-center min-h-px min-w-px rounded-xl">
          <span
            className="text-xs font-medium text-black leading-6 tracking-[0px] whitespace-nowrap"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
