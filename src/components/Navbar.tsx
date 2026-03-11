import { useNavigate } from 'react-router-dom';

// Figma asset URLs
const imgLogo           = "https://www.figma.com/api/mcp/asset/566277a8-39a2-4add-8299-0e455fda30e5";
const imgAccountCircle  = "https://www.figma.com/api/mcp/asset/386b84fa-111d-436d-a3e1-259e8c7aa80b";
const imgProfileVec1    = "https://www.figma.com/api/mcp/asset/76b8e93b-7180-4156-aa1c-cd6a72368ad2";
const imgProfileVec2    = "https://www.figma.com/api/mcp/asset/0320df26-878a-4ed8-8160-a439fa270065";
const imgSettings       = "https://www.figma.com/api/mcp/asset/a7eae9e0-6a51-4753-abe9-b8714d458bcc";
const imgSettingsVec1   = "https://www.figma.com/api/mcp/asset/95a3ea03-5fa4-4396-99aa-e95e9fc851c0";
const imgSettingsVec2   = "https://www.figma.com/api/mcp/asset/3e05d1d7-d894-4082-841b-320b36f42ad0";

export type NavbarVersion = 'default-with-welcome' | 'no-welcome';

interface NavbarProps {
  version?: NavbarVersion;
  userName?: string;
  userRole?: string;
  gpInfo?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export default function Navbar({
  version = 'default-with-welcome',
  userName = 'MANOJ MANDYA MANDYA',
  userRole = 'PDO',
  gpInfo = 'Gram Panchayat, kakanur (1501001003)',
  onProfileClick,
  onSettingsClick,
  className,
}: NavbarProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-white border border-[rgba(204,204,204,0.15)] flex items-center justify-between px-[26px] w-full
        ${version === 'no-welcome' ? 'py-[15px]' : 'py-[18px]'}
        ${className ?? ''}`}
    >
      {/* Left: Logo + Org name */}
      <div className="flex gap-[15px] items-center shrink-0">
        {/* Logo — object-contain preserves aspect ratio without cropping */}
        <div className="relative h-[57px] w-[66px] shrink-0">
          <img
            alt="Karnataka Logo"
            className="absolute inset-0 max-w-none object-contain size-full"
            src={imgLogo}
          />
        </div>
        {/* Org name block — gap-[4px] between lines, subtitle uses leading-[18px] */}
        <div className="flex flex-col gap-[4px] items-start shrink-0 text-[#212121] w-[354px]">
          <p
            className="font-medium text-sm leading-7 w-full"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            Rural Development and Panchayati Raj Department
          </p>
          <p
            className="font-light text-xs leading-[18px] w-full"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            Government of Karnataka
          </p>
        </div>
      </div>

      {/* Right: Profile pill + Home + Settings */}
      <div className="flex gap-[26px] items-center justify-end shrink-0">

        {/* Profile pill */}
        <div className="flex flex-col items-center justify-center shrink-0 w-[293px]">
          <button
            onClick={onProfileClick}
            className="bg-[#f7f0ee] flex gap-[11px] items-center p-[10px] rounded-xl w-full cursor-pointer border-none text-left"
          >
            {/* Avatar */}
            <div className="overflow-clip relative shrink-0 size-[38px]">
              <img alt="" className="absolute block max-w-none size-full" src={imgAccountCircle} />
              <div className="absolute inset-[16.67%_16.67%_29.88%_16.67%]">
                <img alt="" className="absolute block max-w-none size-full" src={imgProfileVec1} />
              </div>
              <div className="absolute inset-[8.33%]">
                <img alt="" className="absolute block max-w-none size-full" src={imgProfileVec2} />
              </div>
            </div>
            {/* User info — leading-[18px] keeps pill height ≈ 58px → navbar ≈ 95px */}
            <div className="flex flex-1 flex-col gap-[3px] items-start min-h-px min-w-px text-[#212121]">
              <p
                className="font-medium text-sm leading-[18px] w-full truncate"
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {userName}{' '}
                <span className="font-light" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
                  ({userRole})
                </span>
              </p>
              <p
                className="font-light text-xs leading-[18px] w-full truncate"
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {gpInfo}
              </p>
            </div>
          </button>
        </div>

        {/* Home icon — inline SVG, navigates to modules list page */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0"
          aria-label="Home"
          style={{ width: 34, height: 33 }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6a3e31"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </button>

        {/* Settings icon */}
        <button
          onClick={onSettingsClick}
          className="h-[33px] overflow-clip relative shrink-0 w-[34px] cursor-pointer bg-transparent border-none p-0"
        >
          <img alt="" className="absolute block max-w-none size-full" src={imgSettings} />
          <div className="absolute inset-[16.67%_19.67%]">
            <img alt="" className="absolute block max-w-none size-full" src={imgSettingsVec1} />
          </div>
          <div className="absolute inset-[8.33%_9.48%_8.33%_9.46%]">
            <img alt="" className="absolute block max-w-none size-full" src={imgSettingsVec2} />
          </div>
        </button>

      </div>
    </div>
  );
}
