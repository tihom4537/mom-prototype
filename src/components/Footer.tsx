export type FooterVariant = 'type1' | 'type2';

interface FooterProps {
  variant?: FooterVariant;
  className?: string;
}

const NAV_LINKS = [
  'About',
  'Contact Us',
  'Privacy Policy',
  'Terms of Use',
  'Accessibility',
  'Help',
];

export default function Footer({ variant = 'type1', className }: FooterProps) {
  if (variant === 'type2') {
    return (
      <footer
        className={`w-full bg-[#6a3e31] flex items-center justify-between px-10 h-[52px] ${className ?? ''}`}
      >
        <span
          className="text-xs text-white opacity-80 leading-5"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          © {new Date().getFullYear()} Rural Development and Panchayati Raj Department, Government of Karnataka. All rights reserved.
        </span>
        <div className="flex items-center gap-6">
          {NAV_LINKS.map(link => (
            <button
              key={link}
              type="button"
              className="text-xs text-white opacity-80 hover:opacity-100 leading-5 cursor-pointer bg-transparent border-none transition-opacity"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {link}
            </button>
          ))}
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`w-full bg-white border-t border-[rgba(204,204,204,0.3)] flex items-center justify-between px-10 h-[52px] ${className ?? ''}`}
    >
      <span
        className="text-xs text-[#727272] leading-5"
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        © {new Date().getFullYear()} Rural Development and Panchayati Raj Department, Government of Karnataka.
      </span>
      <div className="flex items-center gap-6">
        {NAV_LINKS.map(link => (
          <button
            key={link}
            type="button"
            className="text-xs text-[#6a3e31] hover:underline leading-5 cursor-pointer bg-transparent border-none"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {link}
          </button>
        ))}
      </div>
    </footer>
  );
}
