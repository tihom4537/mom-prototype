import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useLanguage } from '../i18n/LanguageContext';
import DropdownBoxOfProfile from './DropdownBoxOfProfile';
import DropdownBoxOfIcon from './DropdownBoxOfIcon';

// Karnataka government logo — saved locally in /public to avoid broken remote URLs
const imgLogo = "/karnataka-emblem.png";
const imgZillaLogo = "/Grama Panchayat Final Logo Feb 28-03.png";

export type NavbarVersion = 'default-with-welcome' | 'no-welcome' | 'home-page-nav' | 'version4' | 'home-page-identity' | 'home-page-nav-menu';

interface NavbarNavLink {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface NavbarProps {
  version?: NavbarVersion;
  userName?: string;
  userRole?: string;
  gpInfo?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLoginClick?: () => void;
  navLinks?: NavbarNavLink[];
  showHome?: boolean;
  className?: string;
}

const DEFAULT_NAV_LINKS: NavbarNavLink[] = [
  { label: 'Home' },
  { label: 'About Us' },
  { label: 'Attendance' },
  { label: 'Documents and Notices' },
  { label: 'Helplines' },
  { label: 'Contact Us' },
  { label: 'Feedback' },
];

const LANG_OPTIONS: Array<{ code: 'en' | 'kn'; label: string; short: string }> = [
  { code: 'kn', label: 'ಕನ್ನಡ',    short: 'ಕನ್ನಡ' },
  { code: 'en', label: 'English',  short: 'EN'     },
];

function LangDropdown({
  lang,
  setLang,
  langOpen,
  setLangOpen,
  currentOption,
}: {
  lang: 'en' | 'kn';
  setLang: (code: 'en' | 'kn') => void;
  langOpen: boolean;
  setLangOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentOption: { code: 'en' | 'kn'; label: string; short: string };
}) {
  return (
    <div className="relative shrink-0">
      {langOpen && <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />}
      <button
        onClick={() => setLangOpen(o => !o)}
        className="relative z-20 flex items-center gap-[2px] border border-[#6a3e31] rounded-lg px-3 py-[6px] bg-transparent cursor-pointer hover:bg-[#f7f0ee] transition-colors"
        aria-label="Select language"
      >
        <span className="font-medium text-sm text-[#6a3e31] leading-5 whitespace-nowrap" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          {currentOption.short}
        </span>
        <Icon name="arrow_drop_down" size="small" color="#6a3e31" />
      </button>
      {langOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-md overflow-hidden z-20 min-w-[140px]">
          {LANG_OPTIONS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => { setLang(code); setLangOpen(false); }}
              className="flex items-center justify-between w-full px-4 py-[10px] bg-white hover:bg-[#f7f0ee] transition-colors border-none cursor-pointer"
            >
              <span className={`text-sm text-[#212121] leading-5 ${lang === code ? 'font-semibold' : 'font-normal'}`} style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
                {label}
              </span>
              {lang === code && <Icon name="check" size="small" color="#6a3e31" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({
  version = 'default-with-welcome',
  userName = 'MANOJ MANDYA MANDYA',
  userRole = 'PDO',
  gpInfo = 'Gram Panchayat, kakanur (1501001003)',
  onProfileClick,
  onSettingsClick,
  onLoginClick,
  navLinks = DEFAULT_NAV_LINKS,
  showHome = true,
  className,
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);

  const currentOption = LANG_OPTIONS.find(o => o.code === lang)!;

  // home-page-identity: top identity bar — RDPR left, Panchatantra 2.0 right
  if (version === 'home-page-identity') {
    return (
      <div className={`bg-white border border-[rgba(204,204,204,0.15)] flex items-center justify-between px-[50px] py-[12px] w-full ${className ?? ''}`}>
        {/* Left: Logo + RDPR */}
        <div className="flex gap-[15px] items-center shrink-0">
          <div className="relative h-[45px] w-[52px] shrink-0">
            <img alt="Karnataka Logo" className="absolute inset-0 max-w-none object-contain size-full" src={imgLogo} />
          </div>
          <div className="flex flex-col gap-[8px] items-start text-[#212121]">
            <p className="font-semibold text-sm leading-none whitespace-nowrap" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {t('navbar_rdpr')}
            </p>
            <p className="font-normal text-sm leading-none" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {t('navbar_govt_karnataka')}
            </p>
          </div>
        </div>
        {/* Right: Panchatantra 2.0 */}
        <div className="flex flex-col gap-[8px] items-start shrink-0 text-[#212121]">
          <p className="font-semibold text-sm leading-none whitespace-nowrap" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            {t('navbar_panchatantra')}
          </p>
          <p className="font-normal text-sm leading-none whitespace-nowrap" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            {t('navbar_panchatantra_sub')}
          </p>
        </div>
      </div>
    );
  }

  // home-page-nav-menu: #efe0dc bar — nav links + LangToggle pill + Login button
  if (version === 'home-page-nav-menu') {
    const NAV_ROUTES: Record<string, string> = {
      'Home':                   '/homepage',
      'Attendance':             '/attendance-public',
      'Documents and Notices':  '/documents',
      'Helplines':              '/helplines',
      'Contact Us':             '/contact-directory',
    };
    const resolvedLinks = navLinks.map(link => ({
      ...link,
      onClick: NAV_ROUTES[link.label] ? () => navigate(NAV_ROUTES[link.label]) : link.onClick,
      active:  link.active ?? (NAV_ROUTES[link.label] === location.pathname),
    }));

    return (
      <div className={`bg-[#efe0dc] border border-[rgba(204,204,204,0.15)] flex items-center justify-between px-[50px] py-[12px] w-full ${className ?? ''}`}>
        {/* Nav links */}
        <div className="flex items-center gap-[60px] shrink-0">
          {resolvedLinks.map(link => (
            <button
              key={link.label}
              type="button"
              className={`font-medium text-[14px] leading-7 bg-transparent border-none p-0 cursor-pointer whitespace-nowrap ${link.active ? 'text-[#6a3e31] underline underline-offset-4' : 'text-[#212121] hover:text-[#6a3e31]'}`}
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              onClick={link.onClick}
            >
              {link.label}
            </button>
          ))}
        </div>
        {/* Right: LangToggle + Login */}
        <div className="flex items-center gap-[25px] shrink-0">
          {/* LangToggle pill */}
          <div className="bg-[#f3f3f3] flex items-center overflow-hidden p-[3px] rounded-[8px] shrink-0">
            {LANG_OPTIONS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`flex items-center justify-center px-[24px] py-[10px] rounded-[8px] text-[14px] font-medium tracking-[0.1px] leading-[20px] whitespace-nowrap bg-transparent border-none cursor-pointer transition-colors
                  ${lang === code
                    ? 'bg-white border border-[#c6c6c6] text-[#6a3e31]'
                    : 'text-[#727272] hover:text-[#6a3e31]'
                  }`}
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Login button */}
          <button
            type="button"
            className="bg-[#6a3e31] flex items-center justify-center px-[24px] py-[10px] rounded-[8px] text-white text-[14px] font-medium tracking-[0.1px] leading-[20px] whitespace-nowrap border-none cursor-pointer hover:shadow-[0px_2px_3px_1px_rgba(33,33,33,0.12)] transition-all"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            onClick={onLoginClick}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // home-page-nav: compact, no profile pill — just logo + lang + settings + home
  if (version === 'home-page-nav') {
    return (
      <div
        className={`bg-white border border-[rgba(204,204,204,0.15)] flex items-center justify-between px-[26px] w-full py-[10px] ${className ?? ''}`}
      >
        {/* Left: Logo + Org name */}
        <div className="flex gap-[15px] items-center shrink-0">
          <div className="relative h-[57px] w-[66px] shrink-0">
            <img alt="Karnataka Logo" className="absolute inset-0 max-w-none object-contain size-full" src={imgLogo} />
          </div>
          <div className="flex flex-col gap-[8px] items-start text-[#212121] max-w-[354px]">
            <p className="font-semibold text-sm leading-none" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {t('navbar_rdpr')}
            </p>
            <p className="font-normal text-sm leading-none" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {t('navbar_govt_karnataka')}
            </p>
          </div>
        </div>

        {/* Right: Lang + Settings + Home only */}
        <div className="flex gap-[26px] items-center justify-end shrink-0">
          <LangDropdown lang={lang} setLang={setLang} langOpen={langOpen} setLangOpen={setLangOpen} currentOption={currentOption} />
          <button onClick={onSettingsClick} className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0" aria-label="Settings">
            <Icon name="settings" size="medium" color="#6a3e31" />
          </button>
          <button onClick={() => navigate('/')} className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0" aria-label="Home">
            <Icon name="home" size="medium" color="#6a3e31" />
          </button>
        </div>
      </div>
    );
  }

  // version4: compact with profile avatar only (no full pill), 82px height
  if (version === 'version4') {
    return (
      <div
        className={`bg-white border border-[rgba(204,204,204,0.15)] flex items-center justify-between px-[26px] w-full py-[11px] ${className ?? ''}`}
      >
        {/* Left: Logo + Org name */}
        <div className="flex gap-[15px] items-center shrink-0">
          <div className="relative h-[57px] w-[66px] shrink-0">
            <img alt="Karnataka Logo" className="absolute inset-0 max-w-none object-contain size-full" src={imgLogo} />
          </div>
          <div className="flex flex-col gap-[8px] items-start text-[#212121] max-w-[354px]">
            <p className="font-semibold text-sm leading-none" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {t('navbar_rdpr')}
            </p>
            <p className="font-normal text-sm leading-none" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {t('navbar_govt_karnataka')}
            </p>
          </div>
        </div>

        {/* Right: Avatar icon + Lang + Settings + Home */}
        <div className="flex gap-[26px] items-center justify-end shrink-0">
          <button
            onClick={onProfileClick}
            className="flex items-center justify-center size-[38px] rounded-full bg-[#f7f0ee] cursor-pointer border-none"
            aria-label="Profile"
          >
            <Icon name="account_circle" size="large" color="#6a3e31" />
          </button>
          <LangDropdown lang={lang} setLang={setLang} langOpen={langOpen} setLangOpen={setLangOpen} currentOption={currentOption} />
          <button onClick={onSettingsClick} className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0" aria-label="Settings">
            <Icon name="settings" size="medium" color="#6a3e31" />
          </button>
          <button onClick={() => navigate('/')} className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0" aria-label="Home">
            <Icon name="home" size="medium" color="#6a3e31" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[rgba(204,204,204,0.15)] flex items-center justify-between px-[26px] w-full
        ${version === 'no-welcome' ? 'py-[9px]' : 'py-[9px]'}
        ${className ?? ''}`}
    >
      {/* Left: GP logo + divider + Karnataka emblem + RDPR */}
      <div className="flex gap-[15px] items-center shrink-0">
        {/* Grama Panchayat logo */}
        <div className="relative h-[62px] w-[62px] shrink-0">
          <img
            alt="Grama Panchayat Logo"
            className="absolute inset-0 max-w-none object-contain size-full"
            src={imgZillaLogo}
          />
        </div>
        {/* Divider */}
        <div className="w-px h-[40px] bg-[rgba(106,62,49,0.2)] mx-[4px] shrink-0" />
        {/* Karnataka emblem */}
        <div className="relative h-[52px] w-[60px] shrink-0">
          <img
            alt="Karnataka Logo"
            className="absolute inset-0 max-w-none object-contain size-full"
            src={imgLogo}
          />
        </div>
        {/* RDPR block */}
        <div className="flex flex-col gap-[8px] items-start shrink-0 text-[#212121]">
          <p
            className="font-semibold text-[13px] leading-none"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {t('navbar_rdpr')}
          </p>
          <p
            className="font-normal text-[13px] leading-none"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {t('navbar_govt_karnataka')}
          </p>
        </div>
      </div>

      {/* Right: Profile pill → Language → Settings → Home */}
      <div className="flex gap-[26px] items-center justify-end shrink-0 relative">

        {/* Profile pill — click to toggle dropdown */}
        <div className="relative shrink-0 w-[293px]">
          <button
            ref={profileTriggerRef}
            onClick={() => { setProfileOpen(o => !o); setSettingsOpen(false); }}
            onKeyDown={e => { if (e.key === 'Escape' && profileOpen) { e.preventDefault(); setProfileOpen(false); } }}
            className="bg-[#f7f0ee] flex gap-[11px] items-center p-[10px] rounded-xl w-full cursor-pointer border-none text-left"
            aria-haspopup="listbox"
            aria-expanded={profileOpen}
          >
            <div className="flex items-center justify-center shrink-0 size-[38px]">
              <Icon name="account_circle" size="large" color="#6a3e31" />
            </div>
            <div className="flex flex-1 flex-col gap-[3px] items-start min-h-px min-w-px text-[#212121]">
              <p className="font-medium text-sm leading-[18px] w-full truncate" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
                {userName}{' '}<span className="font-light">({userRole})</span>
              </p>
              <p className="font-light text-xs leading-[18px] w-full truncate" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
                {gpInfo}
              </p>
            </div>
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-1 shadow-lg z-50"
              onMouseLeave={() => setProfileOpen(false)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setProfileOpen(false); profileTriggerRef.current?.focus(); return; }
                if (e.key === 'Tab') {
                  const el = e.currentTarget;
                  const focusable = Array.from(el.querySelectorAll<HTMLElement>('button,a,[tabindex]:not([tabindex="-1"])'));
                  if (!focusable.length) return;
                  const first = focusable[0];
                  const last = focusable[focusable.length - 1];
                  if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
                  else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
                }
              }}
            >
              <DropdownBoxOfProfile
                isOpen
                onToggle={() => { setProfileOpen(false); profileTriggerRef.current?.focus(); }}
                menuLabel="Switch Profile"
                items={['PDO — kakanur GP', 'Secretary — Hosakote GP', 'Log out']}
                onItemClick={item => { setProfileOpen(false); if (item === 'Log out') navigate('/homepage'); }}
                className="w-[293px]"
              />
            </div>
          )}
        </div>

        {/* Language dropdown */}
        <LangDropdown lang={lang} setLang={setLang} langOpen={langOpen} setLangOpen={setLangOpen} currentOption={currentOption} />

        {/* Settings icon + dropdown */}
        <div className="relative shrink-0">
          <button
            ref={settingsTriggerRef}
            onClick={() => { setSettingsOpen(o => !o); setProfileOpen(false); }}
            onKeyDown={e => { if (e.key === 'Escape' && settingsOpen) { e.preventDefault(); setSettingsOpen(false); } }}
            className="flex items-center justify-center cursor-pointer bg-transparent border-none p-0"
            aria-label="Settings"
            aria-haspopup="listbox"
            aria-expanded={settingsOpen}
          >
            <Icon name="settings" size="medium" color="#6a3e31" />
          </button>
          {settingsOpen && (
            <div
              className="absolute right-0 top-full mt-1 shadow-lg z-50"
              onMouseLeave={() => setSettingsOpen(false)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setSettingsOpen(false); settingsTriggerRef.current?.focus(); return; }
                if (e.key === 'Tab') {
                  const el = e.currentTarget;
                  const focusable = Array.from(el.querySelectorAll<HTMLElement>('button,a,[tabindex]:not([tabindex="-1"])'));
                  if (!focusable.length) return;
                  const first = focusable[0];
                  const last = focusable[focusable.length - 1];
                  if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
                  else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
                }
              }}
            >
              <DropdownBoxOfIcon
                isOpen
                onToggle={() => { setSettingsOpen(false); settingsTriggerRef.current?.focus(); }}
                items={['Help & Support', 'Log out']}
                onItemClick={item => { setSettingsOpen(false); if (item === 'Log out') navigate('/homepage'); }}
              />
            </div>
          )}
        </div>

        {/* Home icon */}
        {showHome && (
          <button
            onClick={() => navigate('/official-home')}
            className="flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0"
            aria-label="Home"
          >
            <Icon name="home" size="medium" color="#6a3e31" />
          </button>
        )}

      </div>
    </div>
  );
}
