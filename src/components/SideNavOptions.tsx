import Icon from './Icon';
import DropdownOptionsInSidenav from './DropdownOptionsInSidenav';

export type SideNavState = 'default' | 'hover' | 'clicked-open';

interface SideNavOptionsProps {
  state?: SideNavState;
  text?: string;
  subItems?: string[];
  className?: string;
}

const imgPeopleAlt = "https://www.figma.com/api/mcp/asset/6f256e0e-a211-48a6-82ae-fd302b68c275";
const imgPeopleGroup = "https://www.figma.com/api/mcp/asset/5b52f57f-a36c-4095-9e22-910d88e65e84";

export default function SideNavOptions({
  state = 'default',
  text = 'Reports',
  subItems = ['Create Meeting', 'Meeting List', 'Start Meeting'],
  className,
}: SideNavOptionsProps) {
  const isClickedOpen = state === 'clicked-open';
  const isHover = state === 'hover';

  return (
    <div className={className ?? 'flex flex-col gap-2 items-start w-[188px]'}>
      {/* Main nav item */}
      <div
        className={`flex flex-wrap gap-3 items-center px-3 py-[9px] rounded-2xl w-full
          ${isClickedOpen ? 'bg-[#ff7266]' : isHover ? 'bg-[#f7f0ee]' : ''}`}
      >
        {/* Icon */}
        <div className="flex h-[35px] items-center overflow-clip shrink-0">
          {isClickedOpen ? (
            <div className="relative overflow-clip size-6">
              <img alt="" className="absolute block max-w-none size-full" src={imgPeopleAlt} />
              <div className="absolute inset-[16.67%_4.17%]">
                <img alt="" className="absolute block max-w-none size-full" src={imgPeopleGroup} />
              </div>
            </div>
          ) : (
            <Icon type="file_copy" className="relative overflow-clip size-6" />
          )}
        </div>

        {/* Label */}
        <div className="flex flex-1 flex-col items-start justify-center min-h-px min-w-px rounded-xl">
          <span
            className={`text-sm font-medium leading-6 tracking-[0px] whitespace-nowrap
              ${isClickedOpen ? 'text-[#f7f0ee]' : 'text-[#6a3e31]'}`}
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {isClickedOpen ? 'Meetings' : text}
          </span>
        </div>

        {/* Chevron */}
        <div className={`flex items-center justify-center shrink-0 ${isClickedOpen ? '-scale-y-100' : ''}`}>
          <Icon type="arrow_drop_down" className="relative overflow-clip size-6" />
        </div>
      </div>

      {/* Dropdown sub-items (shown when clicked open) */}
      {isClickedOpen && (
        <div className="flex flex-col gap-2 items-start pl-[22px] w-full">
          {subItems.map((item, i) => (
            <DropdownOptionsInSidenav
              key={i}
              text={item}
              state={i === subItems.length - 1 ? 'hover' : 'no-hover'}
              className="flex gap-[5px] items-center shrink-0 w-[166px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
