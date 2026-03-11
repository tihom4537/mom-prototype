// Asset URLs from Figma (valid for 7 days)
const imgArrowDropDown = "https://www.figma.com/api/mcp/asset/c8293143-ea55-4e07-8b24-b4fda1004215";
const imgArrowDown = "https://www.figma.com/api/mcp/asset/57710ce0-39fe-43d6-84ae-aca06a028461";
const imgArrowUp = "https://www.figma.com/api/mcp/asset/0911c01d-485b-4345-9c53-a896fa469f32";
const imgFileCopyVec1 = "https://www.figma.com/api/mcp/asset/e8255165-d1bb-4757-b101-6a4c486ccc18";
const imgFileCopyVec2 = "https://www.figma.com/api/mcp/asset/eaa06f8e-ad84-41d1-8ea3-9a3ae0345168";
const imgMenuVec = "https://www.figma.com/api/mcp/asset/c612b431-3463-427e-8eb6-3939538c2c44";
const imgPeopleAlt = "https://www.figma.com/api/mcp/asset/6f256e0e-a211-48a6-82ae-fd302b68c275";
const imgPeopleGroup = "https://www.figma.com/api/mcp/asset/5b52f57f-a36c-4095-9e22-910d88e65e84";

export type IconType = 'arrow_drop_down' | 'arrow_drop_down_up' | 'file_copy' | 'menu' | 'people_alt';

interface IconProps {
  type?: IconType;
  className?: string;
}

export default function Icon({ type = 'arrow_drop_down', className }: IconProps) {
  return (
    <div className={className ?? 'relative size-6'}>
      {/* Base icon background */}
      <img
        alt=""
        className="absolute block max-w-none size-full"
        src={type === 'people_alt' ? imgPeopleAlt : imgArrowDropDown}
      />

      {/* arrow_drop_down */}
      {type === 'arrow_drop_down' && (
        <div className="absolute inset-[41.67%_29.17%_37.5%_29.17%]">
          <img alt="" className="absolute block max-w-none size-full" src={imgArrowDown} />
        </div>
      )}

      {/* arrow_drop_down_up (flipped) */}
      {type === 'arrow_drop_down_up' && (
        <div className="absolute inset-[41.67%_29.17%_37.5%_29.17%] -scale-y-100">
          <img alt="" className="absolute block max-w-none size-full" src={imgArrowUp} />
        </div>
      )}

      {/* file_copy */}
      {type === 'file_copy' && (
        <>
          <div className="absolute inset-[29.17%_20.83%_12.5%_33.33%]">
            <img alt="" className="absolute block max-w-none size-full" src={imgFileCopyVec1} />
          </div>
          <div className="absolute inset-[4.17%_12.5%_4.17%_8.33%]">
            <img alt="" className="absolute block max-w-none size-full" src={imgFileCopyVec2} />
          </div>
        </>
      )}

      {/* menu */}
      {type === 'menu' && (
        <div className="absolute bottom-1/4 left-[12.5%] right-[12.5%] top-1/4">
          <img alt="" className="absolute block max-w-none size-full" src={imgMenuVec} />
        </div>
      )}

      {/* people_alt */}
      {type === 'people_alt' && (
        <div className="absolute inset-[16.67%_4.17%]">
          <img alt="" className="absolute block max-w-none size-full" src={imgPeopleGroup} />
        </div>
      )}
    </div>
  );
}
