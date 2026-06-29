import AccessibilityFab from '../components/AccessibilityFab';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AccessibilityBar,
  Navbar,
  HelplineCard,
  AppDownloadCTA,
  Footer,
  EyebrowPill,
  ScaleToFit,
} from '../components';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

const KA_EMBLEM = '/karnataka-emblem.png';

const LOGO: Record<string, string> = {
  eswathu: '/logo-eswathu.jpg',
  sakkala: '/logo-sakala.jpg',
};

function cardLogo(id: string, name: string) {
  const src = LOGO[id] ?? KA_EMBLEM;
  return <img src={src} alt={name} className="w-full h-full object-contain" />;
}

interface HelplineEntry {
  id: string;
  nameKey: string;
  descKey: string;
}

const HELPLINES: HelplineEntry[][] = [
  [
    { id: 'p2',          nameKey: 'helpline_p2_name',           descKey: 'helpline_p2_desc' },
    { id: 'p1',          nameKey: 'helpline_p1_name',           descKey: 'helpline_p1_desc' },
    { id: 'bsk',         nameKey: 'helpline_bsk_name',          descKey: 'helpline_bsk_desc' },
    { id: 'panchamitra', nameKey: 'helpline_panchamitra_name',  descKey: 'helpline_panchamitra_desc' },
  ],
  [
    { id: 'ngsk',        nameKey: 'helpline_ngsk_name',         descKey: 'helpline_ngsk_desc' },
    { id: 'eswathu',     nameKey: 'helpline_eswathu_name',      descKey: 'helpline_eswathu_desc' },
    { id: 'mgnrega',     nameKey: 'helpline_mgnrega_name',      descKey: 'helpline_mgnrega_desc' },
    { id: 'sakkala',     nameKey: 'helpline_sakkala_name',      descKey: 'helpline_sakkala_desc' },
  ],
  [
    { id: 'karnataka',   nameKey: 'helpline_karnataka_gov_name',descKey: 'helpline_karnataka_gov_desc' },
    { id: 'rtc',         nameKey: 'helpline_rtc_name',          descKey: 'helpline_rtc_desc' },
    { id: 'eshram',      nameKey: 'helpline_eshram_name',       descKey: 'helpline_eshram_desc' },
    { id: 'datagov',     nameKey: 'helpline_data_gov_name',     descKey: 'helpline_data_gov_desc' },
  ],
];

const NAV_LINKS = [
  { label: 'Home',                    route: '/homepage' },
  { label: 'About Us',                route: null },
  { label: 'Attendance',              route: '/attendance-public' },
  { label: 'Documents and Notices',   route: '/documents' },
  { label: 'Helplines',               route: '/helplines', active: true },
  { label: 'Contact Directory',        route: '/contact-directory' },
  { label: 'Feedback',                route: null },
];

export default function HelplinesScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <ScaleToFit>
    <div className="flex flex-col w-full min-h-screen bg-white">

      {/* Accessibility bar */}
      <AccessibilityBar />

      {/* Identity bar */}
      <Navbar version="home-page-identity" />

      {/* Nav menu bar */}
      <Navbar
        version="home-page-nav-menu"
        navLinks={NAV_LINKS.map(l => ({
          label: l.label,
          active: l.active,
          onClick: l.route ? () => navigate(l.route!) : undefined,
        }))}
        onLoginClick={() => setShowLoginModal(true)}
      />

      {/* Main content */}
      <main id="main-content" tabIndex={-1} className="flex flex-col gap-[50px] items-start pb-[80px] pt-[60px] px-[200px] w-full">
        <h1 className="sr-only">Helplines and Support</h1>

        {/* Section heading */}
        <div className="flex flex-col gap-[8px] items-center w-full">
          <EyebrowPill text={t('helplines_eyebrow')} variant="filled" />
          <p
            className="font-bold text-[28px] leading-[38px] text-[#6a3e31] text-center w-full"
            style={NS}
          >
            {t('helplines_heading')}
          </p>
          <p
            className="font-normal text-[14px] leading-[22px] text-[#525c66] text-center w-full"
            style={NS}
          >
            {t('helplines_subheading')}
          </p>
        </div>

        {/* Card grid — 3 rows × 4 columns */}
        <div className="flex flex-col gap-[20px] w-full">
          {HELPLINES.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-[20px] items-stretch w-full">
              {row.map(card => (
                <HelplineCard
                  key={card.id}
                  platformName={t(card.nameKey)}
                  description={t(card.descKey)}
                  ctaLabel={t('helplines_cta')}
                  logo={cardLogo(card.id, t(card.nameKey))}
                  className="flex flex-1 flex-col items-start min-w-0"
                />
              ))}
            </div>
          ))}
        </div>

      </main>

      {/* App download CTA */}
      <AppDownloadCTA />

      {/* Footer */}
      <Footer />
      <AccessibilityFab />
    </div>
    </ScaleToFit>
  );
}
