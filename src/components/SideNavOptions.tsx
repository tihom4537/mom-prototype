import Icon from './Icon';
import DropdownOptionsInSidenav from './DropdownOptionsInSidenav';

export interface SubNavItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface SideNavOptionsProps {
  icon?: string;
  label?: string;
  subItems?: SubNavItem[];
  isOpen?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function SideNavOptions({
  icon = 'people_alt',
  label = 'Meetings',
  subItems = [],
  isOpen = false,
  isActive = false,
  onClick,
  className,
}: SideNavOptionsProps) {
  const hasSubItems = subItems.length > 0;
  const isHighlighted = isOpen || isActive;

  return (
    <div className={className ?? 'flex flex-col items-start w-[188px]'}>
      {/* Main nav row */}
      <button
        onClick={onClick}
        className={`flex gap-3 items-center px-3 py-[9px] rounded-2xl w-full cursor-pointer border-none text-left transition-colors
          ${isHighlighted ? 'bg-[#ff7266]' : 'bg-transparent hover:bg-[#f7f0ee]'}`}
      >
        <div className="flex h-[35px] items-center shrink-0">
          <Icon name={icon} size="medium" color={isHighlighted ? 'white' : '#6a3e31'} />
        </div>

        <div className="flex flex-1 flex-col items-start justify-center min-h-px min-w-px">
          <span
            className={`text-sm font-medium leading-6 tracking-[0px] ${isHighlighted ? 'text-[#f7f0ee]' : 'text-[#6a3e31]'}`}
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {label}
          </span>
        </div>

        {hasSubItems && (
          <div
            className="flex items-center justify-center shrink-0 transition-transform duration-200"
            style={{ transform: isOpen ? 'scaleY(-1)' : 'scaleY(1)' }}
          >
            <Icon name="arrow_drop_down" size="medium" color={isHighlighted ? 'white' : '#6a3e31'} />
          </div>
        )}
      </button>

      {/* Sub-items — animated expand/collapse */}
      {hasSubItems && (
        <div
          className="w-full overflow-hidden transition-all duration-200 ease-in-out"
          style={{ maxHeight: isOpen ? `${subItems.length * 52}px` : '0px' }}
        >
          <div className="flex flex-col gap-2 items-start pl-[22px] w-full pt-2 pb-1">
            {subItems.map((item, i) => (
              <DropdownOptionsInSidenav
                key={i}
                text={item.label}
                state={item.isActive ? 'selected' : 'no-hover'}
                onClick={item.onClick}
                className="flex gap-[5px] items-center shrink-0 w-[166px]"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
