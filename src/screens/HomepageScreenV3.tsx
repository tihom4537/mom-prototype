import AccessibilityFab from '../components/AccessibilityFab';
import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AccessibilityBar,
  Navbar,
  EyebrowPill,
  HomepageSearch,
  Button,
  LiveCounterStrip,
  OrientationStrip,
  PageSectionHeading,
  DashboardMetricCard,
  SectionHolder,
  GuidelinesCard,
  NotificationsCard,
  InitiativesCard,
  EventsCard,
  EcosystemAppCard,
  AppDownloadCTA,
  Footer,
  DropdownField,
  VariantSwitcherPill,
  ModuleCardV3,
  TabOptions,
  Reveal,
  ScaleToFit,
} from '../components';
import { DISTRICTS, KARNATAKA_HIERARCHY, YEAR_BOOK_DATA, MONTH_BOOK_DATA } from '../data/karnatakaData';
import type { IconName } from '../components/Icon';

const STATE_MEETINGS_CONDUCTED_V3 = 244766;
const STATE_TOTAL_GPS_V3          = 5963;
const STATE_YEAR_BOOKS_V3  = YEAR_BOOK_DATA.reduce((s, r) => s + r.completed, 0);
const STATE_MONTH_BOOKS_V3 = MONTH_BOOK_DATA.reduce((s, r) => {
  const { slNo: _s, district: _d, totalGPs: _t, ...months } = r;
  return s + Object.values(months).reduce((a: number, v) => a + (v as number), 0);
}, 0);

function fmtV3(n: number) { return n.toLocaleString('en-IN'); }

function getDistrictMetricsV3(district: string) {
  const yb = YEAR_BOOK_DATA.find(r => r.district === district);
  const mb = MONTH_BOOK_DATA.find(r => r.district === district);
  const gpCount = yb?.totalGPs ?? 0;
  const meetings = gpCount > 0
    ? Math.round((STATE_MEETINGS_CONDUCTED_V3 / STATE_TOTAL_GPS_V3) * gpCount)
    : STATE_MEETINGS_CONDUCTED_V3;
  const yearBooks  = yb?.completed ?? 0;
  const monthBooks = mb
    ? Object.entries(mb).filter(([k]) => !['slNo','district','totalGPs'].includes(k))
        .reduce((s, [, v]) => s + (v as number), 0)
    : 0;
  return { meetings, yearBooks, monthBooks, totalGPs: gpCount };
}

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const KA_EMBLEM = '/karnataka-emblem.png';

const MODULES_V3: Array<{
  titleKey: string;
  descKey: string;
  icon: IconName;
  variant: 'light' | 'dark';
  route: string | null;
}> = [
  { titleKey: 'module_finance_title',     descKey: 'module_finance_desc',     icon: 'account_balance',      variant: 'light', route: '/finance' },
  { titleKey: 'module_revenue_title',     descKey: 'module_revenue_desc',     icon: 'payments',             variant: 'dark',  route: '/revenue' },
  { titleKey: 'module_hrms_title',        descKey: 'module_hrms_desc',        icon: 'badge',                variant: 'light', route: '/hrms' },
  { titleKey: 'module_meetings_title',    descKey: 'module_meetings_desc',    icon: 'groups',               variant: 'dark',  route: '/citizen/meetings' },
  { titleKey: 'module_citizen_title',     descKey: 'module_citizen_desc',     icon: 'people',               variant: 'light', route: '/citizen' },
  { titleKey: 'module_planning_title',    descKey: 'module_planning_desc',    icon: 'analytics',            variant: 'dark',  route: null },
  { titleKey: 'module_panchamitra_title', descKey: 'module_panchamitra_desc', icon: 'chat',                 variant: 'light', route: '/panchamitra' },
  { titleKey: 'module_other_dept_title',  descKey: 'module_other_dept_desc',  icon: 'account_tree',         variant: 'dark',  route: null },
  { titleKey: 'module_learning_title',    descKey: 'module_learning_desc',    icon: 'school',               variant: 'light', route: null },
];

const METRIC_CARDS: Array<{ labelKey: string; trend: 'up' | 'down' | 'none'; icon: IconName; primaryValue: string; changeValue: string }> = [
  { labelKey: 'metric_gp_meetings',      trend: 'up',   icon: 'event',               primaryValue: '2,44,766',     changeValue: '+8.2%'  },
  { labelKey: 'metric_proceedings',      trend: 'up',   icon: 'description',         primaryValue: '2,31,408',     changeValue: '+5.7%'  },
  { labelKey: 'metric_revenue',          trend: 'up',   icon: 'bar_chart',           primaryValue: '₹2,14,38,000', changeValue: '+11.3%' },
  { labelKey: 'metric_month_books',      trend: 'down', icon: 'calendar_month',      primaryValue: '842',          changeValue: '-3.1%'  },
  { labelKey: 'metric_year_books',       trend: 'down', icon: 'summarize',           primaryValue: '2,935',        changeValue: '-49.2%' },
  { labelKey: 'metric_attendance',       trend: 'up',   icon: 'badge',               primaryValue: '24,318',       changeValue: '+2.9%'  },
  { labelKey: 'metric_citizen_services', trend: 'down', icon: 'people',              primaryValue: '1,06,542',     changeValue: '-1.8%'  },
  { labelKey: 'metric_sbm',              trend: 'up',   icon: 'assignment_turned_in',primaryValue: '5,741',        changeValue: '+14.6%' },
  { labelKey: 'metric_planning',         trend: 'down', icon: 'analytics',           primaryValue: '3,284',        changeValue: '-4.2%'  },
];

// ── Guidelines / Notifications / Initiatives / Events preview data ───────────
const GUIDELINES_PREVIEW = [
  { date: '14/07/2025', month: 7,  year: 2025, title: 'Operational guidelines for the implementation of the 15th Finance Commission', description: 'Recommendations on rural local bodies grants during the period 2021–2026' },
  { date: '02/09/2025', month: 9,  year: 2025, title: 'Guidelines on Swachh Bharat Mission (Gramin) Phase II',                          description: 'Revised norms for solid and liquid waste management at the GP level' },
  { date: '18/03/2025', month: 3,  year: 2025, title: 'GP Annual Action Plan preparation guidelines 2025–26',                            description: 'Step-by-step process for drafting and submitting the GPDP' },
  { date: '05/12/2024', month: 12, year: 2024, title: '15th Finance Commission grant utilisation circular',                              description: 'Mandatory reporting format for tied and untied grants' },
];

const NOTIFICATIONS_PREVIEW = [
  { date: '14/07/2025', month: 7,  year: 2025, title: 'Panchatantra 2.0 Updates - 05.10.2025', description: 'New module rollout and bug fixes' },
  { date: '22/08/2025', month: 8,  year: 2025, title: 'Scheduled maintenance window notice',    description: 'Portal will be unavailable for 2 hours' },
  { date: '10/04/2025', month: 4,  year: 2025, title: 'New biometric attendance rule notice',    description: 'Effective from the next financial quarter' },
  { date: '28/01/2025', month: 1,  year: 2025, title: 'Year-end data reconciliation notice',     description: 'All GPs to complete reconciliation by month end' },
];

const INITIATIVES_PREVIEW = [
  { startDate: '30-Mar-2026', endDate: '30-Mar-2026', month: 3,  year: 2026, title: 'NCORD AWARENESS MEETING',        region: 'KOLALA (1525003023)',  posted: '1 Day ago' },
  { startDate: '15-Feb-2026', endDate: '16-Feb-2026', month: 2,  year: 2026, title: 'SWACHH SURVEKSHAN PREPARATION',  region: 'HOSAKOTE (1525004011)', posted: '5 Days ago' },
  { startDate: '20-Dec-2025', endDate: '20-Dec-2025', month: 12, year: 2025, title: 'GRAMA SABHA MOBILISATION DRIVE', region: 'KAKANUR (1501001003)',  posted: '2 Weeks ago' },
  { startDate: '08-Oct-2025', endDate: '09-Oct-2025', month: 10, year: 2025, title: 'DIGITAL LITERACY CAMPAIGN',      region: 'ANEKAL (1525002007)',   posted: '1 Month ago' },
];

const EVENTS_PREVIEW = [
  { startDate: '30-Mar-2026', endDate: '30-Mar-2026', month: 3,  year: 2026, title: 'NCORD AWARENESS MEETING',     totalAssignGp: '1',  posted: '1 Day ago' },
  { startDate: '12-Jan-2026', endDate: '12-Jan-2026', month: 1,  year: 2026, title: 'REPUBLIC DAY PREPARATION',    totalAssignGp: '12', posted: '1 Week ago' },
  { startDate: '25-Nov-2025', endDate: '26-Nov-2025', month: 11, year: 2025, title: 'CONSTITUTION DAY OBSERVANCE', totalAssignGp: '6',  posted: '3 Weeks ago' },
  { startDate: '14-Sep-2025', endDate: '14-Sep-2025', month: 9,  year: 2025, title: 'HINDI DIWAS CELEBRATION',     totalAssignGp: '3',  posted: '2 Months ago' },
];

const MONTH_KEYS = ['calendar_month_jan','calendar_month_feb','calendar_month_mar','calendar_month_apr','calendar_month_may','calendar_month_jun','calendar_month_jul','calendar_month_aug','calendar_month_sep','calendar_month_oct','calendar_month_nov','calendar_month_dec'];

const ECOSYSTEM_APPS = [
  { titleKey: 'ecosystem_bhoomi_title',     descKey: 'ecosystem_bhoomi_desc',     logo: KA_EMBLEM },
  { titleKey: 'ecosystem_kaveri_title',     descKey: 'ecosystem_kaveri_desc',     logo: KA_EMBLEM },
  { titleKey: 'ecosystem_sakala_title',     descKey: 'ecosystem_sakala_desc',     logo: '/logo-sakala.jpg' },
  { titleKey: 'ecosystem_dpar_title',       descKey: 'ecosystem_dpar_desc',       logo: '/logo-dpar.jpg' },
  { titleKey: 'ecosystem_nemmadi_title',    descKey: 'ecosystem_nemmadi_desc',    logo: '/logo-nemmadi.png' },
  { titleKey: 'ecosystem_eswathu_title',    descKey: 'ecosystem_eswathu_desc',    logo: '/logo-eswathu.jpg' },
  { titleKey: 'ecosystem_aarogyasri_title', descKey: 'ecosystem_aarogyasri_desc', logo: KA_EMBLEM },
  { titleKey: 'ecosystem_pmayg_title',      descKey: 'ecosystem_pmayg_desc',      logo: '/logo-pmayg.png' },
  { titleKey: 'ecosystem_nregasoft_title',  descKey: 'ecosystem_nregasoft_desc',  logo: KA_EMBLEM },
  { titleKey: 'ecosystem_esankhya_title',   descKey: 'ecosystem_esankhya_desc',   logo: KA_EMBLEM },
];

const SUGGESTIONS = [
  "Search for Anekal GP's meeting records",
  'Shivamogga district revenue 2024',
  'Revenue collection',
  'All citizen services',
  'Planning in Gram panchayats',
  'Department services',
];

const YEAR_OPTIONS = ['2024-25', '2023-24', '2022-23', '2021-22'];

function DotGrid({ position, opacity = 0.10, color = 'rgba(106,62,49,1)' }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; opacity?: number; color?: string }) {
  const posClass = {
    'top-left':     'left-0 top-[40px]',
    'top-right':    'right-0 top-[40px]',
    'bottom-left':  'left-0 bottom-[40px]',
    'bottom-right': 'right-0 bottom-[40px]',
  }[position];
  return (
    <div className={`absolute ${posClass} pointer-events-none select-none`} style={{ opacity }} aria-hidden>
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="flex gap-[26px] mb-[26px]">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function HomepageScreenV3() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState('');
  const [year, setYear] = useState('2024-25');
  const [zilla, setZilla] = useState('');
  const [taluka, setTaluka] = useState('');
  const [gp, setGp] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeZilla, setActiveZilla] = useState('');
  const [guidelinesTab, setGuidelinesTab] = useState<'guidelines' | 'notifications'>('guidelines');
  const [eventsTab, setEventsTab] = useState<'events' | 'initiatives'>('events');
  const modulesRef = useRef<HTMLElement>(null);

  // Guidelines/Events preview filters — lightweight month+year, applies within each section
  const [guidelinesMonth, setGuidelinesMonth] = useState('');
  const [guidelinesYear, setGuidelinesYear] = useState('');
  const [eventsMonth, setEventsMonth] = useState('');
  const [eventsYear, setEventsYear] = useState('');

  const monthOptions = useMemo(() => MONTH_KEYS.map(k => t(k)), [t]);
  const guidelinesYearOptions = useMemo(() => Array.from(new Set([...GUIDELINES_PREVIEW, ...NOTIFICATIONS_PREVIEW].map(x => x.year))).sort((a, b) => b - a).map(String), []);
  const eventsYearOptions = useMemo(() => Array.from(new Set([...INITIATIVES_PREVIEW, ...EVENTS_PREVIEW].map(x => x.year))).sort((a, b) => b - a).map(String), []);

  function monthKeyToIndex(label: string) { return monthOptions.indexOf(label) + 1; }

  const filteredGuidelines = useMemo(() => GUIDELINES_PREVIEW.filter(g =>
    (!guidelinesMonth || g.month === monthKeyToIndex(guidelinesMonth)) &&
    (!guidelinesYear || g.year === Number(guidelinesYear))
  ), [guidelinesMonth, guidelinesYear, monthOptions]);

  const filteredNotifications = useMemo(() => NOTIFICATIONS_PREVIEW.filter(n =>
    (!guidelinesMonth || n.month === monthKeyToIndex(guidelinesMonth)) &&
    (!guidelinesYear || n.year === Number(guidelinesYear))
  ), [guidelinesMonth, guidelinesYear, monthOptions]);

  const filteredInitiatives = useMemo(() => INITIATIVES_PREVIEW.filter(i =>
    (!eventsMonth || i.month === monthKeyToIndex(eventsMonth)) &&
    (!eventsYear || i.year === Number(eventsYear))
  ), [eventsMonth, eventsYear, monthOptions]);

  const filteredEvents = useMemo(() => EVENTS_PREVIEW.filter(e =>
    (!eventsMonth || e.month === monthKeyToIndex(eventsMonth)) &&
    (!eventsYear || e.year === Number(eventsYear))
  ), [eventsMonth, eventsYear, monthOptions]);

  const orientationCards = useMemo(() => [
    {
      stakeholderName: 'Citizens & Residents',
      descpp: "Look up your GP's meeting records, check which schemes are active in your area, and find out what services are available at your local panchayat — without visiting any office.",
      cta: 'Browse your GP →',
      icon: 'people' as const,
      onCta: () => navigate('/panchamitra'),
    },
    {
      stakeholderName: 'Researchers & Journalists',
      descpp: "Access financial records, proceedings, and performance data across all of Karnataka's 5,963 GPs. Publicly available and filterable by district, taluk, and module.",
      cta: 'Explore the data →',
      icon: 'analytics' as const,
      onCta: () => modulesRef.current?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      stakeholderName: 'Government & Department Officials',
      descpp: 'Monitor GP activity, track compliance, and access field-level data across the state. Your full dashboard is one login away.',
      cta: 'Log in →',
      icon: 'admin_panel_settings' as const,
      onCta: () => setShowLoginModal(true),
    },
  ], [navigate]);

  const talukaOptions = useMemo(() => zilla ? Object.keys(KARNATAKA_HIERARCHY[zilla] ?? {}) : [], [zilla]);
  const gpOptions     = useMemo(() => (zilla && taluka) ? (KARNATAKA_HIERARCHY[zilla]?.[taluka] ?? []) : [], [zilla, taluka]);

  const distMetricsV3 = useMemo(() => activeZilla ? getDistrictMetricsV3(activeZilla) : null, [activeZilla]);
  const liveMetricsV3 = useMemo(() => ({
    meetings:    distMetricsV3 ? fmtV3(distMetricsV3.meetings)   : fmtV3(STATE_MEETINGS_CONDUCTED_V3),
    yearBooks:   distMetricsV3 ? fmtV3(distMetricsV3.yearBooks)  : fmtV3(STATE_YEAR_BOOKS_V3),
    monthBooks:  distMetricsV3 ? fmtV3(distMetricsV3.monthBooks) : fmtV3(STATE_MONTH_BOOKS_V3),
    yearBookPct: distMetricsV3 && distMetricsV3.totalGPs > 0
      ? `${((distMetricsV3.yearBooks / distMetricsV3.totalGPs) * 100).toFixed(1)}%`
      : `${((STATE_YEAR_BOOKS_V3 / STATE_TOTAL_GPS_V3) * 100).toFixed(1)}%`,
  }), [distMetricsV3]);

  const summaryLabel = [activeZilla || 'Zilla', taluka || 'Taluk', gp || 'GP', 'All Categories', year].join('  |  ');

  return (
    <ScaleToFit>
    <div className="flex flex-col w-full min-h-screen bg-white">

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => { setShowLoginModal(false); navigate('/official-home'); }}
        />
      )}

      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar
        version="home-page-nav-menu"
        navLinks={[
          { label: 'Home',                  onClick: () => navigate('/homepage') },
          { label: 'About Us' },
          { label: 'Attendance',            onClick: () => navigate('/attendance-public') },
          { label: 'Documents and Notices', onClick: () => navigate('/documents') },
          { label: 'Helplines',             onClick: () => navigate('/helplines') },
          { label: 'Contact Directory',     onClick: () => navigate('/contact-directory') },
          { label: 'Feedback' },
        ]}
        onLoginClick={() => setShowLoginModal(true)}
      />

      {/* ── Hero — dark photo bg ─────────────────────────────────────────── */}
      <section
        className="relative flex flex-col gap-[45px] items-start justify-center overflow-hidden pb-[80px] pt-[100px] px-[200px] rounded-bl-[100px] rounded-br-[100px] w-full"
        style={{ backgroundColor: '#6a3e31', minHeight: '609px' }}
      >
        {/* Photo layer — right 70% of hero */}
        <div
          className="absolute inset-y-0 right-0 pointer-events-none"
          style={{
            width: '70%',
            backgroundImage: 'url(/alternate%20panchayat%20pic.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
          }}
        />
        {/* Gradient overlay — fades photo into bg color from left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(106,62,49,1) 35%, rgba(106,62,49,0.85) 62%, rgba(106,62,49,0.5) 82%, rgba(106,62,49,0.2) 100%)',
          }}
        />

        {/* Content */}
        <Reveal threshold={0} className="relative z-10 flex flex-col gap-[20px] items-start max-w-[952px]">
          <EyebrowPill />
          <h1 className="font-bold text-[40px] leading-[52px] text-[#f7f0ee] w-full" style={NS}>
            Every panchayat in Karnataka.
            <br />
            Open to everyone.
          </h1>
          <p className="font-light text-[28px] leading-normal text-[#f7f0ee] w-full" style={NS}>
            5,963 Gram Panchayats · 31 Districts · 236 Taluks · Data all in one place
          </p>
        </Reveal>

        <Reveal threshold={0} delay={1} className="relative z-10 flex gap-[20px] items-center">
          <HomepageSearch value={searchValue} onChange={setSearchValue} onSearch={() => {}} className="w-[358px]" />
          <Button variant="tonal" text={t('btn_search')} onClick={() => {}} />
        </Reveal>

        <Reveal threshold={0} delay={2} className="relative z-10 flex gap-[10px] items-start max-w-[752px]">
          <div className="flex items-center pt-[8px] shrink-0">
            <span className="font-medium text-[12px] text-white tracking-[0.5px] leading-[16px]" style={NS}>{t('homepage_try_label')}</span>
          </div>
          <div className="flex flex-wrap gap-[10px] items-start">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSearchValue(s)}
                className="flex items-center justify-center overflow-clip rounded-[8px] transition-all duration-150 px-[16px] py-[8px] bg-white hover:bg-[rgba(255,255,255,0.88)] active:bg-[rgba(255,255,255,0.75)] cursor-pointer"
              >
                <span className="font-medium text-center whitespace-nowrap text-[12px] tracking-[0.5px] leading-[16px] text-[#6a3e31]" style={NS}>{s}</span>
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Live Counter Strip ───────────────────────────────────────────── */}
      <LiveCounterStrip />

      {/* ── All Modules Section ──────────────────────────────────────────── */}
      <section ref={modulesRef} id="main-content" tabIndex={-1} className="relative overflow-hidden flex flex-col gap-[60px] items-center justify-center pb-[80px] pt-[80px] px-[100px] w-full">
        <DotGrid position="top-left" opacity={0.08} />
        <DotGrid position="bottom-right" opacity={0.08} />
        <Reveal className="flex flex-col items-center gap-[12px] w-full">
          <EyebrowPill text={t('homepage_eyebrow_modules')} variant="filled" />
          <PageSectionHeading
            heading={t('homepage_modules_heading')}
            subtitle={t('homepage_modules_subtitle')}
            align="center"
          />
        </Reveal>
        <Reveal delay={1} className="flex flex-col gap-[60px] w-full items-center">
          {[0, 3, 6].map(start => (
            <div key={start} className="flex gap-[80px] justify-center w-full">
              {MODULES_V3.slice(start, start + 3).map(mod => (
                <ModuleCardV3
                  key={mod.titleKey}
                  title={t(mod.titleKey)}
                  description={t(mod.descKey)}
                  icon={mod.icon}
                  variant={mod.variant}
                  onClick={mod.route ? () => navigate(mod.route!) : undefined}
                />
              ))}
            </div>
          ))}
        </Reveal>
      </section>

      {/* ── Orientation Strip ────────────────────────────────────────────── */}
      <OrientationStrip cards={orientationCards} />

      {/* ── GP Lookup + Metrics Section ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#dfc2b9] flex flex-col gap-[55px] items-center pb-[80px] pt-[70px] px-[200px] w-full">
        <DotGrid position="top-right" opacity={0.12} />
        <DotGrid position="bottom-left" opacity={0.12} />
        <Reveal className="flex flex-col gap-[12px] items-center w-full">
          <EyebrowPill text={t('homepage_eyebrow_gp_lookup')} />
          <div className="flex flex-col gap-[5px] items-center w-full">
            <p className="font-semibold text-[32px] leading-normal text-[#6a3e31] text-center w-[952px]" style={NS}>
              {t('homepage_gp_lookup_heading')}
            </p>
            <p className="font-light text-[24px] leading-normal text-[#6a3e31] text-center w-[952px]" style={NS}>
              {t('homepage_gp_lookup_subtitle')}
            </p>
          </div>
        </Reveal>
        <Reveal delay={1} className="flex gap-[15px] items-stretch w-full">
          {/* Left form panel */}
          <div className="flex flex-col shrink-0 w-[463px]">
            <div className="bg-white rounded-tl-[20px] rounded-tr-[20px] px-[25px] pt-[20px] pb-[15px] shrink-0">
              <p className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                {t('homepage_gp_lookup_form_title')}
              </p>
            </div>
            <div className="bg-white rounded-bl-[20px] rounded-br-[20px] flex flex-col gap-[30px] px-[30px] pt-[25px] pb-[35px] flex-1">
              <DropdownField label={t('homepage_gp_lookup_duration')} placeholder="" value={year} onChange={setYear} options={YEAR_OPTIONS} />
              <DropdownField label={t('homepage_gp_lookup_zilla')} placeholder={t('homepage_gp_lookup_zilla_placeholder')} value={zilla} onChange={v => { setZilla(v); setTaluka(''); setGp(''); }} options={DISTRICTS} />
              <DropdownField label={t('homepage_gp_lookup_taluka')} placeholder={t('homepage_gp_lookup_taluka_placeholder')} value={taluka} onChange={v => { setTaluka(v); setGp(''); }} options={talukaOptions} />
              <DropdownField label={t('homepage_gp_lookup_gp')} placeholder={t('homepage_gp_lookup_gp_placeholder')} value={gp} onChange={setGp} options={gpOptions} />
              <DropdownField label={t('homepage_gp_lookup_category')} placeholder={t('homepage_gp_lookup_category_placeholder')} value="" onChange={() => {}} options={[]} />
              <Button variant="filled" size="small" text={t('btn_see_data')} onClick={() => setActiveZilla(zilla)} />
            </div>
          </div>
          {/* Right metrics panel */}
          <div className="flex-1 bg-white rounded-[20px] flex flex-col gap-[20px] pb-[40px] pt-[25px] px-[40px]">
            <p className="font-semibold text-[20px] text-[#6a3e31] leading-[24px] w-full" style={NS}>
              {summaryLabel}
            </p>
            {[0, 3, 6].map(start => (
              <div key={start} className="flex gap-[20px] items-stretch w-full">
                {METRIC_CARDS.slice(start, start + 3).map(card => {
                  const liveValue =
                    card.labelKey === 'metric_gp_meetings'  ? liveMetricsV3.meetings   :
                    card.labelKey === 'metric_proceedings'   ? liveMetricsV3.meetings   :
                    card.labelKey === 'metric_year_books'    ? liveMetricsV3.yearBooks   :
                    card.labelKey === 'metric_month_books'   ? liveMetricsV3.monthBooks  :
                    null;
                  const liveChange =
                    card.labelKey === 'metric_year_books' ? liveMetricsV3.yearBookPct : null;
                  return (
                    <DashboardMetricCard
                      key={card.labelKey}
                      icon={card.icon}
                      label={t(card.labelKey)}
                      trend={card.trend}
                      primaryValue={liveValue ?? card.primaryValue}
                      changeValue={liveChange ?? card.changeValue}
                      className="flex-1 w-auto"
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex justify-center mt-[4px]">
              <Button variant="filled" size="small" text={t('btn_view_all_data')} onClick={() => navigate('/panchamitra')} />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Guidelines and Notifications ─────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col gap-[45px] items-center pb-[60px] pt-[70px] px-[200px] w-full bg-[#f9f5f5]">
        <DotGrid position="top-right" opacity={0.10} />
        <DotGrid position="bottom-left" opacity={0.10} />
        <Reveal className="flex flex-col gap-[12px] items-center w-full">
          <EyebrowPill text={t('homepage_eyebrow_guidelines')} />
          <div className="flex flex-col gap-[5px] items-center w-full">
            <p className="font-semibold text-[32px] leading-normal text-[#6a3e31] text-center w-[952px]" style={NS}>
              {t('homepage_guidelines_heading')}
            </p>
            <p className="font-light text-[24px] leading-normal text-[#6a3e31] text-center w-[952px]" style={NS}>
              {t('homepage_guidelines_subtitle')}
            </p>
          </div>
        </Reveal>
        <Reveal delay={1} className="flex flex-col gap-[30px] items-center w-full">
          <div className="flex gap-[20px] items-center">
            <TabOptions
              menuOption={t('section_guidelines')}
              selected={guidelinesTab === 'guidelines'}
              onClick={() => setGuidelinesTab('guidelines')}
            />
            <TabOptions
              menuOption={t('section_notifications')}
              selected={guidelinesTab === 'notifications'}
              onClick={() => setGuidelinesTab('notifications')}
            />
          </div>
          <div className="flex gap-[15px] items-center justify-center w-full">
            <DropdownField
              value={guidelinesMonth}
              onChange={setGuidelinesMonth}
              options={monthOptions}
              placeholder={t('homepage_filter_month')}
              showAll
              allLabel={t('homepage_filter_all_months')}
              className="w-[180px]"
            />
            <DropdownField
              value={guidelinesYear}
              onChange={setGuidelinesYear}
              options={guidelinesYearOptions}
              placeholder={t('homepage_filter_year')}
              showAll
              allLabel={t('homepage_filter_all_years')}
              className="w-[160px]"
            />
          </div>
          <SectionHolder
            title={guidelinesTab === 'guidelines' ? t('section_guidelines') : t('section_notifications')}
            className="w-full"
          >
            {(guidelinesTab === 'guidelines' ? filteredGuidelines.length : filteredNotifications.length) === 0 ? (
              <p className="text-[13px] text-[#727272] text-center py-[30px] w-full" style={NS}>{t('homepage_filter_no_results')}</p>
            ) : (
              <div className="flex flex-wrap gap-[15px] items-start w-full px-[30px] pt-[25px] pb-[35px]">
                {guidelinesTab === 'guidelines'
                  ? filteredGuidelines.map((g, i) => (
                      <GuidelinesCard
                        key={i}
                        date={g.date}
                        title={g.title}
                        description={g.description}
                        className="w-[calc(33.333%-10px)] min-w-[280px]"
                      />
                    ))
                  : filteredNotifications.map((n, i) => (
                      <NotificationsCard
                        key={i}
                        date={n.date}
                        title={n.title}
                        description={n.description}
                        className="w-[calc(33.333%-10px)] min-w-[280px]"
                      />
                    ))}
              </div>
            )}
          </SectionHolder>
        </Reveal>
        <Reveal delay={2}><Button variant="filled" text={t('btn_view_all')} onClick={() => navigate('/documents', { state: { tab: 'guidelines' } })} /></Reveal>
      </section>

      {/* ── Events and Initiatives ───────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col gap-[45px] items-center pb-[60px] pt-[70px] px-[200px] w-full bg-[#efe0dc]">
        <DotGrid position="top-left" opacity={0.12} />
        <DotGrid position="bottom-right" opacity={0.12} />
        <Reveal className="flex flex-col gap-[12px] items-center w-full">
          <EyebrowPill text={t('homepage_eyebrow_events')} />
          <div className="flex flex-col gap-[5px] items-center w-full">
            <p className="font-semibold text-[32px] leading-normal text-[#6a3e31] text-center w-[952px]" style={NS}>
              {t('homepage_events_heading')}
            </p>
            <p className="font-light text-[24px] leading-normal text-[#6a3e31] text-center w-[952px]" style={NS}>
              {t('homepage_events_subtitle')}
            </p>
          </div>
        </Reveal>
        <Reveal delay={1} className="flex flex-col gap-[30px] items-center w-full">
          <div className="flex gap-[20px] items-center">
            <TabOptions
              menuOption={t('section_events')}
              selected={eventsTab === 'events'}
              onClick={() => setEventsTab('events')}
            />
            <TabOptions
              menuOption={t('section_initiatives')}
              selected={eventsTab === 'initiatives'}
              onClick={() => setEventsTab('initiatives')}
            />
          </div>
          <div className="flex gap-[15px] items-center justify-center w-full">
            <DropdownField
              value={eventsMonth}
              onChange={setEventsMonth}
              options={monthOptions}
              placeholder={t('homepage_filter_month')}
              showAll
              allLabel={t('homepage_filter_all_months')}
              className="w-[180px]"
            />
            <DropdownField
              value={eventsYear}
              onChange={setEventsYear}
              options={eventsYearOptions}
              placeholder={t('homepage_filter_year')}
              showAll
              allLabel={t('homepage_filter_all_years')}
              className="w-[160px]"
            />
          </div>
          <SectionHolder
            title={eventsTab === 'events' ? t('section_events') : t('section_initiatives')}
            className="w-full"
          >
            {(eventsTab === 'events' ? filteredEvents.length : filteredInitiatives.length) === 0 ? (
              <p className="text-[13px] text-[#727272] text-center py-[30px] w-full" style={NS}>{t('homepage_filter_no_results')}</p>
            ) : (
              <div className="flex flex-wrap gap-[15px] items-start w-full px-[30px] pt-[25px] pb-[35px]">
                {eventsTab === 'events'
                  ? filteredEvents.map((ev, i) => (
                      <EventsCard
                        key={i}
                        status="PUBLISHED"
                        title={ev.title}
                        startDate={ev.startDate}
                        endDate={ev.endDate}
                        totalAssignGp={ev.totalAssignGp}
                        posted={ev.posted}
                        className="w-[calc(33.333%-10px)] min-w-[280px]"
                      />
                    ))
                  : filteredInitiatives.map((init, i) => (
                      <InitiativesCard
                        key={i}
                        status="PUBLISHED"
                        title={init.title}
                        startDate={init.startDate}
                        endDate={init.endDate}
                        region={init.region}
                        posted={init.posted}
                        className="w-[calc(33.333%-10px)] min-w-[280px]"
                      />
                    ))}
              </div>
            )}
          </SectionHolder>
        </Reveal>
        <Reveal delay={2}><Button variant="filled" text={t('btn_view_more')} onClick={() => navigate('/documents', { state: { tab: 'events' } })} /></Reveal>
      </section>

      {/* ── Ecosystem Apps ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col gap-[45px] items-center pb-[80px] pt-[100px] px-[200px] w-full">
        <DotGrid position="top-right" opacity={0.08} />
        <DotGrid position="bottom-left" opacity={0.08} />
        <Reveal className="flex flex-col items-center gap-[12px] w-full">
          <EyebrowPill text={t('homepage_eyebrow_ecosystem')} variant="filled" />
          <PageSectionHeading
            heading={t('homepage_ecosystem_heading')}
            subtitle={t('homepage_ecosystem_subtitle')}
            align="center"
          />
        </Reveal>
        <Reveal delay={1} className="flex flex-col gap-[33px] w-full">
          {[0, 5].map(start => (
            <div key={start} className="flex gap-[30px] w-full">
              {ECOSYSTEM_APPS.slice(start, start + 5).map(app => (
                <EcosystemAppCard
                  key={app.titleKey}
                  appTitle={t(app.titleKey)}
                  description={t(app.descKey)}
                  logo={<img src={app.logo} alt={t(app.titleKey)} className="w-full h-full object-contain" />}
                  className="flex-1"
                />
              ))}
            </div>
          ))}
        </Reveal>
      </section>

      <AppDownloadCTA />
      <Footer variant="dark" />
      <VariantSwitcherPill />      <AccessibilityFab />
    </div>
    </ScaleToFit>
  );
}
