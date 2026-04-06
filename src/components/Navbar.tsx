import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useLanguage } from '../i18n/LanguageContext';

// Karnataka government logo — saved locally in /public to avoid broken remote URLs
const imgLogo = "/karnataka-emblem.png";

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

const LANG_OPTIONS: Array<{ code: 'en' | 'kn'; label: string; short: string }> = [
  { code: 'en', label: 'English',  short: 'EN'     },
  { code: 'kn', label: 'ಕನ್ನಡ',    short: 'ಕನ್ನಡ' },
];

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
  const { lang, setLang } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  const currentOption = LANG_OPTIONS.find(o => o.code === lang)!;

  return (
    <div
      className={`bg-white border border-[rgba(204,204,204,0.15)] flex items-center justify-between px-[26px] w-full
        ${version === 'no-welcome' ? 'py-[15px]' : 'py-[18px]'}
        ${className ?? ''}`}
    >
      {/* Left: Logo + Org name */}
      <div className="flex gap-[15px] items-center shrink-0">
        {/* Logo — branding asset, kept as img */}
        <div className="relative h-[57px] w-[66px] shrink-0">
          <img
            alt="Karnataka Logo"
            className="absolute inset-0 max-w-none object-contain size-full"
            src={imgLogo}
          />
        </div>
        {/* Org name block */}
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

      {/* Right: Profile pill → Language → Settings → Home */}
      <div className="flex gap-[26px] items-center justify-end shrink-0">

        {/* Profile pill */}
        <div className="flex flex-col items-center justify-center shrink-0 w-[293px]">
          <button
            onClick={onProfileClick}
            className="bg-[#f7f0ee] flex gap-[11px] items-center p-[10px] rounded-xl w-full cursor-pointer border-none text-left"
          >
            {/* Avatar */}
            <div className="flex items-center justify-center shrink-0 size-[38px]">
              <Icon name="account_circle" size="large" color="#6a3e31" />
            </div>
            {/* User info */}
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

        {/* Language dropdown */}
        <div className="relative shrink-0">
          {/* Outside-click overlay */}
          {langOpen && (
            <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
          )}

          {/* Trigger button — shows current lang short name */}
          <button
            onClick={() => setLangOpen(o => !o)}
            className="relative z-20 flex items-center gap-[2px] border border-[#6a3e31] rounded-lg px-3 py-[6px] bg-transparent cursor-pointer hover:bg-[#f7f0ee] transition-colors"
            aria-label="Select language"
          >
            <span
              className="font-medium text-sm text-[#6a3e31] leading-5 whitespace-nowrap"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {currentOption.short}
            </span>
            <Icon name="arrow_drop_down" size="small" color="#6a3e31" />
          </button>

          {/* Dropdown panel */}
          {langOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-md overflow-hidden z-20 min-w-[140px]">
              {LANG_OPTIONS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setLangOpen(false); }}
                  className="flex items-center justify-between w-full px-4 py-[10px] bg-white hover:bg-[#f7f0ee] transition-colors border-none cursor-pointer"
                >
                  <span
                    className={`text-sm text-[#212121] leading-5 ${lang === code ? 'font-semibold' : 'font-normal'}`}
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                  >
                    {label}
                  </span>
                  {lang === code && (
                    <Icon name="check" size="small" color="#6a3e31" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings icon */}
        <button
          onClick={onSettingsClick}
          className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0"
          aria-label="Settings"
        >
          <Icon name="settings" size="medium" color="#6a3e31" />
        </button>

        {/* Home icon */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0"
          aria-label="Home"
        >
          <Icon name="home" size="medium" color="#6a3e31" />
        </button>

      </div>
    </div>
  );
}
