import Icon from './Icon';
import SideNavOptions from './SideNavOptions';

export type SidebarState = 'full' | 'shortened';

interface SidebarProps {
  state?: SidebarState;
  onMenuClick?: () => void;
  className?: string;
}

const imgPeopleAlt = "https://www.figma.com/api/mcp/asset/6f256e0e-a211-48a6-82ae-fd302b68c275";
const imgPeopleGroup1 = "https://www.figma.com/api/mcp/asset/29ea822e-a024-4bab-91ce-bdbf4661d4dd";
const imgPeopleGroup2 = "https://www.figma.com/api/mcp/asset/dbb4537a-4a0b-4192-9775-0532f6f72b67";

export default function Sidebar({ state = 'full', onMenuClick, className }: SidebarProps) {
  const isFull = state === 'full';

  return (
    <div
      className={`bg-white border border-[rgba(204,204,204,0.15)] flex flex-col justify-between pb-4 pt-[15px] px-4 rounded-br-[15px] rounded-tr-[15px]
        ${isFull ? 'w-[220px] items-start' : 'w-20 items-center'}
        ${className ?? 'h-[969px]'}`}
    >
      {/* Top section */}
      <div className={`flex flex-col gap-[15px] items-${isFull ? 'start' : 'center'} w-full shrink-0`}>
        {/* Menu toggle */}
        <div className={`flex h-[29px] items-center w-full ${isFull ? 'justify-end' : 'justify-center'}`}>
          <button onClick={onMenuClick} className="bg-transparent border-none p-0 cursor-pointer flex items-center">
            <Icon type="menu" className="block overflow-clip relative shrink-0 size-6" />
          </button>
        </div>

        {/* Nav items */}
        <div className={`flex flex-col gap-2 items-${isFull ? 'start' : 'center'} w-full`}>
          {isFull ? (
            <>
              <SideNavOptions state="clicked-open" className="flex flex-col gap-2 items-start shrink-0 w-[188px]" />
              <SideNavOptions text="Reports" className="flex flex-col gap-2 items-start shrink-0 w-[188px]" />
              <SideNavOptions text="Committee mapping" className="flex flex-col gap-2 items-start shrink-0 w-[188px]" />
            </>
          ) : (
            <>
              {/* Active icon */}
              <div className="flex flex-col items-start shrink-0">
                <div className="bg-[#ff7266] flex flex-wrap gap-3 items-center px-3 py-[9px] rounded-2xl shrink-0">
                  <div className="flex h-[35px] items-center overflow-clip shrink-0">
                    <div className="relative overflow-clip size-6">
                      <img alt="" className="absolute block max-w-none size-full" src={imgPeopleAlt} />
                      <div className="absolute inset-[16.67%_4.17%]">
                        <img alt="" className="absolute block max-w-none size-full" src={imgPeopleGroup1} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* File copy icon */}
              <div className="flex flex-col gap-2 items-start shrink-0">
                <div className="flex flex-wrap gap-3 items-center px-3 py-[9px] rounded-2xl shrink-0">
                  <div className="flex h-[35px] items-center overflow-clip shrink-0">
                    <Icon type="file_copy" className="relative overflow-clip shrink-0 size-6" />
                  </div>
                </div>
              </div>
              {/* People alt icon 2 */}
              <div className="bg-white flex flex-col gap-2 items-start shrink-0">
                <div className="flex flex-wrap gap-3 items-start px-3 py-[9px] rounded-2xl shrink-0">
                  <div className="flex h-[35px] items-start overflow-clip shrink-0">
                    <div className="relative overflow-clip size-6">
                      <img alt="" className="absolute block max-w-none size-full" src={imgPeopleAlt} />
                      <div className="absolute inset-[16.67%_4.17%]">
                        <img alt="" className="absolute block max-w-none size-full" src={imgPeopleGroup2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
