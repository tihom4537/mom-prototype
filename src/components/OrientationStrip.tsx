import EyebrowPill from './EyebrowPill';
import AboutStakeholdersCard from './AboutStakeholdersCard';
import type { AboutStakeholdersCardProps } from './AboutStakeholdersCard';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface OrientationStripProps {
  heading?: React.ReactNode;
  body?: string;
  cards?: AboutStakeholdersCardProps[];
  personasHeading?: string;
  className?: string;
}

const DEFAULT_CARDS: AboutStakeholdersCardProps[] = [
  {
    stakeholderName: 'Citizens & Residents',
    descpp: "Look up your GP's meeting records, check which schemes are active in your area, and find out what services are available at your local panchayat — without visiting any office.",
    cta: 'Browse your GP →',
    icon: 'people',
  },
  {
    stakeholderName: 'Researchers & Journalists',
    descpp: "Access financial records, proceedings, and performance data across all of Karnataka's 5,963 GPs. Publicly available and filterable by district, taluk, and module.",
    cta: 'Explore the data →',
    icon: 'analytics',
  },
  {
    stakeholderName: 'Government & Department Officials',
    descpp: 'Monitor GP activity, track compliance, and access field-level data across the state. Your full dashboard is one login away.',
    cta: 'Log in →',
    icon: 'admin_panel_settings',
  },
];

export default function OrientationStrip({
  heading = (
    <>
      Karnataka&apos;s panchayats,
      <br />
      all in one place.
    </>
  ),
  body = "Panchatantra is Karnataka's platform for Gram Panchayat administration. From meeting records and finances to citizen services and scheme delivery — all data is publicly accessible, updated in real time, across all 5,963 GPs in the state.",
  cards = DEFAULT_CARDS,
  personasHeading = 'Who uses Panchatantra?',
  className,
}: OrientationStripProps) {
  return (
    <div className={`relative overflow-hidden bg-[#f7f0ee] flex items-center justify-center px-[80px] py-[90px] w-full ${className ?? ''}`}>

      {/* Dot grids */}
      {(['top-left', 'bottom-right'] as const).map(pos => (
        <div key={pos} className={`absolute ${pos === 'top-left' ? 'left-0 top-[40px]' : 'right-0 bottom-[40px]'} pointer-events-none select-none`} style={{ opacity: 0.10 }} aria-hidden>
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="flex gap-[26px] mb-[26px]">
              {Array.from({ length: 5 }).map((_, col) => (
                <div key={col} className="w-[14px] h-[14px] rounded-full bg-[rgba(106,62,49,1)]" />
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* Left col */}
      <div className="flex flex-col items-start overflow-clip shrink-0 w-[500px]">
        <EyebrowPill text="About The Platform" />
        <div className="h-[12px] shrink-0 w-full" />
        <h2 className="font-semibold text-[32px] leading-[40px] text-[#6a3e31] w-full" style={NS}>
          {heading}
        </h2>
        <div className="h-[16px] shrink-0 w-full" />
        <p className="font-medium text-[14px] leading-[20px] text-[#525c66] tracking-[0.1px] w-full" style={NS}>
          {body}
        </p>
        <div className="h-[24px] shrink-0 w-full" />
      </div>

      {/* Vertical divider */}
      <div className="flex flex-row items-center self-stretch shrink-0 w-[80px] justify-center">
        <div className="bg-[rgba(106,62,49,0.15)] h-[240px] shrink-0 w-px" />
      </div>

      {/* Right col */}
      <div className="flex flex-col items-start shrink-0 w-[700px]">
        <p className="font-semibold text-[24px] leading-[28px] text-[#6a3e31] whitespace-nowrap" style={NS}>
          {personasHeading}
        </p>
        <div className="h-[20px] shrink-0 w-full" />
        <div className="flex flex-col gap-[15px] w-full">
          {cards.map((card, i) => (
            <AboutStakeholdersCard key={i} {...card} />
          ))}
        </div>
      </div>

    </div>
  );
}
