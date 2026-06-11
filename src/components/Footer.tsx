const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type FooterVariant = 'light' | 'dark' | 'simple' | 'simple-dark';

interface QuickLink {
  label: string;
  onClick?: () => void;
}

interface FooterProps {
  variant?: FooterVariant;
  visitorCount?: string;
  quickLinks?: QuickLink[];
  className?: string;
}

const DEFAULT_LINKS: QuickLink[] = [
  { label: 'Site Map' },
  { label: 'Home' },
  { label: 'About Us' },
  { label: 'Contact Us' },
  { label: 'Terms and Condition' },
];

const SIMPLE_NAV_LINKS = ['About', 'Contact Us', 'Privacy Policy', 'Terms of Use', 'Accessibility', 'Help'];

export default function Footer({
  variant = 'light',
  visitorCount = '0,00,000',
  quickLinks = DEFAULT_LINKS,
  className,
}: FooterProps) {
  // ── Simple bar variants (used in login / module screens) ──
  if (variant === 'simple-dark') {
    return (
      <footer className={`w-full bg-[#6a3e31] flex items-center justify-between px-10 h-[52px] ${className ?? ''}`}>
        <span className="text-xs text-white opacity-80 leading-5" style={NS}>
          © {new Date().getFullYear()} Rural Development and Panchayati Raj Department, Government of Karnataka. All rights reserved.
        </span>
        <div className="flex items-center gap-6">
          {SIMPLE_NAV_LINKS.map(link => (
            <button key={link} type="button" className="text-xs text-white opacity-80 hover:opacity-100 leading-5 cursor-pointer bg-transparent border-none transition-opacity" style={NS}>
              {link}
            </button>
          ))}
        </div>
      </footer>
    );
  }

  if (variant === 'simple') {
    return (
      <footer className={`w-full bg-white border-t border-[rgba(204,204,204,0.3)] flex items-center justify-between px-10 h-[52px] ${className ?? ''}`}>
        <span className="text-xs text-[#727272] leading-5" style={NS}>
          © {new Date().getFullYear()} Rural Development and Panchayati Raj Department, Government of Karnataka.
        </span>
        <div className="flex items-center gap-6">
          {SIMPLE_NAV_LINKS.map(link => (
            <button key={link} type="button" className="text-xs text-[#6a3e31] hover:underline leading-5 cursor-pointer bg-transparent border-none" style={NS}>
              {link}
            </button>
          ))}
        </div>
      </footer>
    );
  }

  // ── Full homepage footer variants ──
  const isDark = variant === 'dark';

  const bodyBg = isDark ? 'bg-[#6a3e31]' : 'bg-white';
  const stripBg = isDark ? 'bg-[#bf8573]' : 'bg-[#6a3e31]';

  const headingColor = isDark ? 'text-white' : 'text-[#343f4a]';
  const dividerColor = isDark ? 'bg-white' : 'bg-[#e0e0e0]';
  const bodyText = isDark ? 'text-white' : 'text-[#525c66]';
  const mutedText = isDark ? 'text-[rgba(255,255,255,0.7)]' : 'text-[rgba(82,92,102,0.7)]';
  const devByMuted = isDark ? 'text-[rgba(255,255,255,0.65)]' : 'text-[rgba(82,92,102,0.65)]';
  const helpLabelColor = isDark ? 'text-[rgba(255,255,255,0.85)]' : 'text-[rgba(106,62,49,0.85)]';
  const linkColor = isDark ? 'text-white' : 'text-[#525c66]';
  const deptBoxBg = isDark ? 'bg-[rgba(255,116,104,0.16)]' : 'bg-[#efe0dc]';
  const deptBoxText = isDark ? 'text-white' : 'text-[#6a3e31]';

  return (
    <footer className={`flex flex-col w-full ${className ?? ''}`}>

      {/* ── Body ── */}
      <div className={`${bodyBg} flex items-start justify-between overflow-clip px-[200px] py-[48px] w-full`}>

        {/* Col 1 — Dept Info */}
        <div className="flex flex-col gap-[14px] items-start overflow-clip shrink-0 w-[260px]">
          <div className={`${deptBoxBg} flex flex-col items-start overflow-clip px-[12px] py-[10px] rounded-[8px] w-full`}>
            <p className={`font-semibold text-[15px] leading-normal w-full ${deptBoxText}`} style={NS}>
              Rural Development and
              <br />
              Panchayat Raj Department
            </p>
          </div>

          <div className="flex flex-col gap-[4px] items-start overflow-clip w-full">
            <span className={`font-medium text-[11px] tracking-[0.5px] whitespace-nowrap leading-normal ${mutedText}`} style={NS}>
              Address
            </span>
            <p className={`font-normal text-[13px] leading-normal ${bodyText}`} style={NS}>
              3rd Gate, 3rd Floor MS Building
              <br />
              Bangalore - 560001
            </p>
          </div>

          <div className={`h-px w-full ${dividerColor}`} />

          <div className="flex flex-col gap-[3px] items-start overflow-clip w-full">
            <span className={`font-normal text-[11px] leading-normal ${devByMuted}`} style={NS}>
              Designed &amp; Developed by
            </span>
            <span className={`font-medium text-[13px] leading-normal ${isDark ? 'text-white' : 'text-[#343f4a]'}`} style={NS}>
              ICT Infracon
            </span>
          </div>
        </div>

        {/* Col 2 — Helplines */}
        <div className="flex flex-col items-start overflow-clip shrink-0 w-[260px]">
          <p className={`font-medium text-[16px] tracking-[0.15px] leading-normal w-full ${headingColor}`} style={NS}>
            Helplines
          </p>
          <div className={`h-px w-full ${dividerColor}`} />
          <div className="flex flex-col gap-[16px] items-start overflow-clip pt-[16px] w-full">
            {[
              { label: 'Integrated Call Centre', value: '8277506000' },
              { label: 'Helpdesk Number', value: '080-22032238  /  080-22032650' },
              { label: 'P2 Helpdesk Email', value: 'p2rdprhelpdesk@gmail.com' },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-[3px] items-start overflow-clip w-full">
                <span className={`font-medium text-[11px] tracking-[0.5px] whitespace-nowrap leading-normal ${helpLabelColor}`} style={NS}>
                  {item.label}
                </span>
                <span className={`font-normal text-[13px] leading-normal ${bodyText}`} style={NS}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3 — Quick Links */}
        <div className="flex flex-col items-start overflow-clip shrink-0 w-[160px]">
          <p className={`font-medium text-[16px] tracking-[0.15px] leading-normal w-full ${headingColor}`} style={NS}>
            Quick Links
          </p>
          <div className={`h-px w-full ${dividerColor}`} />
          <div className="flex flex-col gap-[10px] items-start overflow-clip pt-[16px] w-full">
            {quickLinks.map(link => (
              <button
                key={link.label}
                type="button"
                className={`font-normal text-[14px] tracking-[0.25px] leading-normal bg-transparent border-none p-0 cursor-pointer text-left w-full ${linkColor}`}
                style={NS}
                onClick={link.onClick}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Col 4 — Visitor Count */}
        <div className="flex flex-col items-start overflow-clip shrink-0 w-[160px]">
          <p className={`font-medium text-[16px] tracking-[0.15px] leading-normal w-full ${headingColor}`} style={NS}>
            Visitor Count
          </p>
          <div className="bg-[#e0e0e0] h-px w-full" />
          <div className="flex flex-col items-start overflow-clip pt-[16px] w-full">
            <div className="bg-[#efe0dc] flex flex-col gap-[6px] items-start overflow-clip p-[16px] rounded-[10px] tracking-[0.5px] w-full">
              <span className="font-medium text-[11px] text-[rgba(106,62,49,0.7)] leading-normal w-[75px]" style={NS}>
                Total Visitors
              </span>
              <span className="font-bold text-[22px] text-[#6a3e31] whitespace-nowrap leading-normal" style={NS}>
                {visitorCount}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Bottom strip ── */}
      <div className={`${stripBg} flex items-center justify-between overflow-clip px-[200px] py-[16px] h-[52px] w-full whitespace-nowrap`}>
        <span className="font-normal text-[13px] text-[rgba(255,255,255,0.9)] tracking-[0.1px] leading-normal" style={NS}>
          © 2024 Rural Development and Panchayat Raj Department. Government of Karnataka.
        </span>
        <span className="font-medium text-[13px] text-[rgba(255,255,255,0.85)] tracking-[0.1px] leading-normal" style={NS}>
          Designed &amp; Developed by ICT Infracon
        </span>
      </div>

    </footer>
  );
}
