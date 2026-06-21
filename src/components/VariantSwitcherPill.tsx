import { useNavigate, useLocation } from 'react-router-dom';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const VARIANTS = [
  { label: 'V1', route: '/homepage' },
  { label: 'V2', route: '/homepage-v2' },
  { label: 'V3', route: '/homepage-v3' },
];

export default function VariantSwitcherPill() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-[24px] left-[24px] z-50 flex items-center gap-[2px] bg-[#212121] rounded-full px-[4px] py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.24)]">
      {VARIANTS.map(v => {
        const active = pathname === v.route;
        return (
          <button
            key={v.route}
            type="button"
            onClick={() => navigate(v.route)}
            className={`flex items-center justify-center rounded-full px-[14px] py-[6px] text-[12px] font-medium leading-[18px] border-none cursor-pointer transition-colors whitespace-nowrap
              ${active ? 'bg-white text-[#212121]' : 'bg-transparent text-[rgba(255,255,255,0.6)] hover:text-white'}`}
            style={NS}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
