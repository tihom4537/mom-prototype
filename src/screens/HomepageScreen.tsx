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
  Card,
  SectionHolder,
  GuidelinesCard,
  NotificationsCard,
  InitiativesCard,
  EventsCard,
  EcosystemAppCard,
  AppDownloadCTA,
  Footer,
  KarnatakaLeafletMap,
  DropdownField,
  VariantSwitcherPill,
  Reveal,
} from '../components';
import MapLegend from '../components/MapLegend';
import { DISTRICTS, KARNATAKA_HIERARCHY, YEAR_BOOK_DATA, MONTH_BOOK_DATA } from '../data/karnatakaData';

// State-level totals (real data)
const STATE_MEETINGS_CONDUCTED = 244766;
const STATE_TOTAL_GPS          = 5963;
const STATE_YEAR_BOOKS         = YEAR_BOOK_DATA.reduce((s, r) => s + r.completed, 0);
const STATE_MONTH_BOOKS        = MONTH_BOOK_DATA.reduce((s, r) => {
  const { slNo: _s, district: _d, totalGPs: _t, ...months } = r;
  return s + Object.values(months).reduce((a: number, v) => a + (v as number), 0);
}, 0);

function fmt(n: number) { return n.toLocaleString('en-IN'); }

function getDistrictMetrics(district: string) {
  const yb   = YEAR_BOOK_DATA.find(r => r.district === district);
  const mb   = MONTH_BOOK_DATA.find(r => r.district === district);
  const gpCount = yb?.totalGPs ?? 0;
  const meetings = gpCount > 0
    ? Math.round((STATE_MEETINGS_CONDUCTED / STATE_TOTAL_GPS) * gpCount)
    : STATE_MEETINGS_CONDUCTED;
  const yearBooks  = yb?.completed ?? 0;
  const monthBooks = mb
    ? Object.entries(mb).filter(([k]) => !['slNo','district','totalGPs'].includes(k))
        .reduce((s, [, v]) => s + (v as number), 0)
    : 0;
  return { meetings, yearBooks, monthBooks, totalGPs: gpCount };
}

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

// Karnataka map — vectorized illustration from Figma node 333:24849
const MAP_ILLUS = 'https://www.figma.com/api/mcp/asset/7218745d-e6e5-48bc-a01a-a2740bb69711';

// Illustration URLs fetched directly from Figma
const ILLUS = {
  finance:     '/Illustrations/finance.svg',
  revenue:     '/Illustrations/revenue.svg',
  hrms:        '/Illustrations/hrms.svg',
  meetings:    '/Illustrations/meetings.svg',
  citizen:     '/Illustrations/citizen.svg',
  planning:    '/Illustrations/finance.svg',
  panchamitra: '/Illustrations/panchamitra.svg',
  otherDept:   '/Illustrations/learning.svg',
  learning:    '/Illustrations/learning.svg',
};

// ── Module cards data ────────────────────────────────────────────────────────

const MODULES = [
  { titleKey: 'module_finance_title',    descKey: 'module_finance_desc',    illustration: ILLUS.finance,    route: '/finance' },
  { titleKey: 'module_revenue_title',    descKey: 'module_revenue_desc',    illustration: ILLUS.revenue,    route: '/revenue' },
  { titleKey: 'module_hrms_title',       descKey: 'module_hrms_desc',       illustration: ILLUS.hrms,       route: '/hrms' },
  { titleKey: 'module_meetings_title',   descKey: 'module_meetings_desc',   illustration: ILLUS.meetings,   route: '/citizen/meetings' },
  { titleKey: 'module_citizen_title',    descKey: 'module_citizen_desc',    illustration: ILLUS.citizen,    route: '/citizen' },
  { titleKey: 'module_planning_title',   descKey: 'module_planning_desc',   illustration: ILLUS.finance,    route: null },
  { titleKey: 'module_panchamitra_title',descKey: 'module_panchamitra_desc',illustration: ILLUS.panchamitra,route: '/panchamitra' },
  { titleKey: 'module_other_dept_title', descKey: 'module_other_dept_desc', illustration: ILLUS.hrms,       route: null },
  { titleKey: 'module_learning_title',   descKey: 'module_learning_desc',   illustration: ILLUS.learning,   route: null },
];

// ── GP Lookup metric cards ────────────────────────────────────────────────────

const METRIC_CARDS: Array<{ labelKey: string; trend: 'up' | 'down' | 'none'; icon: import('../components/Icon').IconName; primaryValue: string; changeValue: string }> = [
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

// ── Ecosystem apps ────────────────────────────────────────────────────────────

const KA_EMBLEM = '/karnataka-emblem.png';

const ECOSYSTEM_APPS = [
  { titleKey: 'ecosystem_bhoomi_title',    descKey: 'ecosystem_bhoomi_desc',    logo: KA_EMBLEM },
  { titleKey: 'ecosystem_kaveri_title',    descKey: 'ecosystem_kaveri_desc',    logo: KA_EMBLEM },
  { titleKey: 'ecosystem_sakala_title',    descKey: 'ecosystem_sakala_desc',    logo: '/logo-sakala.jpg' },
  { titleKey: 'ecosystem_dpar_title',      descKey: 'ecosystem_dpar_desc',      logo: '/logo-dpar.jpg' },
  { titleKey: 'ecosystem_nemmadi_title',   descKey: 'ecosystem_nemmadi_desc',   logo: '/logo-nemmadi.png' },
  { titleKey: 'ecosystem_eswathu_title',   descKey: 'ecosystem_eswathu_desc',   logo: '/logo-eswathu.jpg' },
  { titleKey: 'ecosystem_aarogyasri_title',descKey: 'ecosystem_aarogyasri_desc',logo: KA_EMBLEM },
  { titleKey: 'ecosystem_pmayg_title',     descKey: 'ecosystem_pmayg_desc',     logo: '/logo-pmayg.png' },
  { titleKey: 'ecosystem_nregasoft_title', descKey: 'ecosystem_nregasoft_desc', logo: KA_EMBLEM },
  { titleKey: 'ecosystem_esankhya_title',  descKey: 'ecosystem_esankhya_desc',  logo: KA_EMBLEM },
];

// ── Search suggestion chips ───────────────────────────────────────────────────

const SUGGESTIONS = [
  "Search for Anekal GP's meeting records",
  'Shivamogga district revenue 2024',
  'Revenue collection',
  'All citizen services',
  'Planning in Gram panchayats',
  'Department services',
];

// ── Dropdown options ──────────────────────────────────────────────────────────

const YEAR_OPTIONS = ['2024-25', '2023-24', '2022-23', '2021-22'];

// Maps KARNATAKA_HIERARCHY district key → GeoJSON NAME_2 key used by DEFAULT_GP_DATA
const HIERARCHY_TO_GEO: Record<string, string> = {
  'Ballari':           'Bellary',
  'Dakshina Kannada':  'Dakshin Kannad',
  'Bagalkote':         'Bagalkot',
  'Uttara Kannada':    'Uttar Kannand',
  'Bengaluru':         'Bangalore Urban',
  'Vijayapura':        'Bijapur',
  'Shivamogga':        'Shimoga',
  'Bengaluru South':   'Bangalore Rural',
  'Belagavi':          'Belgaum',
  'Chamarajanagara':   'Chamrajnagar',
  'Chikkamagaluru':    'Chikmagalur',
  'Mysuru':            'Mysore',
  'Dharwar':           'Dharwad',
  'Kalaburagi':        'Gulbarga',
  'Tumakuru':          'Tumkur',
};

// Taluk count per GeoJSON district name, derived from KARNATAKA_HIERARCHY
const MAP_TALUK_DATA: Record<string, number> = Object.fromEntries(
  Object.entries(KARNATAKA_HIERARCHY).map(([hierarchyKey, taluks]) => {
    const geoKey = HIERARCHY_TO_GEO[hierarchyKey] ?? hierarchyKey;
    return [geoKey, Object.keys(taluks).length];
  })
);

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

export default function HomepageScreen({ heroVariant = 'centered', showVariantSwitcher = true }: { heroVariant?: 'centered' | 'map'; showVariantSwitcher?: boolean }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState('');
  const [year, setYear] = useState('2024-25');
  const [zilla, setZilla] = useState('');
  const [taluka, setTaluka] = useState('');
  const [gp, setGp] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeZilla, setActiveZilla] = useState('');
  const modulesRef = useRef<HTMLElement>(null);

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

  const summaryLabel = [activeZilla || 'Zilla', taluka || 'Taluk', gp || 'GP', 'All Categories', year].join('  |  ');

  const distMetrics = useMemo(() => activeZilla ? getDistrictMetrics(activeZilla) : null, [activeZilla]);
  const liveMetrics = useMemo(() => ({
    meetings:   distMetrics ? fmt(distMetrics.meetings)   : fmt(STATE_MEETINGS_CONDUCTED),
    yearBooks:  distMetrics ? fmt(distMetrics.yearBooks)  : fmt(STATE_YEAR_BOOKS),
    monthBooks: distMetrics ? fmt(distMetrics.monthBooks) : fmt(STATE_MONTH_BOOKS),
    yearBookPct: distMetrics && distMetrics.totalGPs > 0
      ? `${((distMetrics.yearBooks / distMetrics.totalGPs) * 100).toFixed(1)}%`
      : `${((STATE_YEAR_BOOKS / STATE_TOTAL_GPS) * 100).toFixed(1)}%`,
  }), [distMetrics]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">

      {/* Login modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => { setShowLoginModal(false); navigate('/official-home'); }}
        />
      )}

      {/* ── Accessibility Bar ─────────────────────────────────────────────── */}
      <AccessibilityBar />

      {/* ── Identity Navbar ───────────────────────────────────────────────── */}
      <Navbar version="home-page-identity" />

      {/* ── Nav Menu Bar ─────────────────────────────────────────────────── */}
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

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      {heroVariant === 'centered' ? (
        <section className="bg-[rgba(106,62,49,0.08)] relative flex flex-col gap-[45px] items-center justify-center overflow-hidden pb-[80px] pt-[80px] px-[200px] rounded-bl-[100px] rounded-br-[100px] w-full">
          {/* Dot grid — left */}
          <div className="absolute left-0 top-[93px] pointer-events-none select-none" aria-hidden>
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="flex gap-[26px] mb-[26px]">
                {Array.from({ length: 5 }).map((_, col) => (
                  <div key={col} className="w-[14px] h-[14px] rounded-full bg-[rgba(106,62,49,0.18)]" />
                ))}
              </div>
            ))}
          </div>
          {/* Dot grid — right */}
          <div className="absolute right-0 bottom-[60px] pointer-events-none select-none" aria-hidden>
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="flex gap-[26px] mb-[26px]">
                {Array.from({ length: 5 }).map((_, col) => (
                  <div key={col} className="w-[14px] h-[14px] rounded-full bg-[rgba(106,62,49,0.18)]" />
                ))}
              </div>
            ))}
          </div>
          <Reveal threshold={0} className="flex flex-col gap-[20px] items-center max-w-[952px] w-full">
            <EyebrowPill />
            <h1 className="font-bold text-[40px] text-[#6a3e31] text-center leading-[52px] w-full" style={NS}>
              {t('homepage_hero_heading').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h1>
            <p className="font-light text-[25px] text-[#6a3e31] text-center leading-normal w-full" style={NS}>
              {t('homepage_hero_subtitle')}
            </p>
          </Reveal>
          <Reveal threshold={0} delay={1} className="flex gap-[20px] items-center justify-center">
            <HomepageSearch value={searchValue} onChange={setSearchValue} onSearch={() => {}} className="w-[358px]" />
            <Button variant="filled" text={t('btn_search')} onClick={() => {}} />
          </Reveal>
          <Reveal threshold={0} delay={2} className="flex gap-[10px] items-start max-w-[752px] w-full">
            <div className="flex items-center justify-center pt-[8px] shrink-0">
              <span className="font-medium text-[12px] text-black tracking-[0.5px] leading-[16px]" style={NS}>{t('homepage_try_label')}</span>
            </div>
            <div className="flex flex-wrap gap-[10px] items-start justify-center">
              {SUGGESTIONS.map(s => (
                <Button key={s} variant="tonal" size="small" text={s} onClick={() => setSearchValue(s)} />
              ))}
            </div>
          </Reveal>
          {/* Variant toggle */}
        </section>
      ) : (
        <section className="bg-[rgba(106,62,49,0.08)] relative flex gap-[60px] items-start justify-center pt-[75px] pb-[75px] pl-[200px] pr-[200px] rounded-bl-[100px] rounded-br-[100px] w-full overflow-hidden">
          {/* Left col */}
          <div className="flex flex-col gap-[45px] items-start flex-1 min-w-0">
            <Reveal threshold={0} className="flex flex-col gap-[20px] items-start w-full">
              <EyebrowPill />
              <h1 className="font-bold text-[40px] text-[#6a3e31] leading-[52px] w-full" style={NS}>
                {t('homepage_hero_heading').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </h1>
              <p className="font-light text-[25px] text-[#6a3e31] leading-normal w-full" style={NS}>
                {t('homepage_hero_subtitle')}
              </p>
            </Reveal>
            <Reveal threshold={0} delay={1} className="flex flex-col gap-[25px] items-start w-full">
              <div className="flex gap-[20px] items-center">
                <HomepageSearch value={searchValue} onChange={setSearchValue} onSearch={() => {}} className="w-[358px]" />
                <Button variant="filled" text={t('btn_search')} onClick={() => {}} />
              </div>
              <div className="flex gap-[10px] items-start w-full">
                <div className="flex items-start pt-[6px] shrink-0">
                  <span className="font-medium text-[12px] text-black tracking-[0.5px] leading-[16px]" style={NS}>{t('homepage_try_label')}</span>
                </div>
                <div className="flex flex-wrap gap-[10px] items-start">
                  {SUGGESTIONS.map(s => (
                    <Button key={s} variant="tonal" size="small" text={s} onClick={() => setSearchValue(s)} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
          {/* Right col — Karnataka interactive map */}
          <Reveal threshold={0} delay={2} className="shrink-0 flex flex-col items-center gap-[16px] pr-[80px]">
            <KarnatakaLeafletMap width={330} height={435} talukData={MAP_TALUK_DATA} static />
          </Reveal>
          {/* Variant toggle */}
        </section>
      )}

      {/* ── Live Counter Strip ───────────────────────────────────────────── */}
      <LiveCounterStrip />

      {/* ── Orientation Strip ────────────────────────────────────────────── */}
      <Reveal className="w-full">
        <OrientationStrip cards={orientationCards} />
      </Reveal>

      {/* ── All Modules Section ──────────────────────────────────────────── */}
      <section ref={modulesRef} className={`relative overflow-hidden flex flex-col gap-[45px] items-center justify-center pb-[80px] pt-[80px] ${heroVariant === 'map' ? 'px-[200px]' : 'px-[250px]'} w-full`}>
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
        <Reveal delay={1} className="w-full">
          {heroVariant === 'map' ? (
            <div className="flex flex-col gap-[20px] w-full items-center">
              {[0, 3, 6].map(start => (
                <div key={start} className={`flex gap-[34px] justify-center w-full ${start === 6 ? 'items-stretch mt-[30px]' : 'items-end'}`}>
                  {MODULES.slice(start, start + 3).map(mod => (
                    <Card
                      key={mod.titleKey}
                      variant={start === 6 ? 'illustration-v3' : 'illustration-v2'}
                      title={t(mod.titleKey)}
                      subtitle={t(mod.descKey)}
                      text={t('homepage_module_cta')}
                      illustration={<img src={mod.illustration} alt={t(mod.titleKey)} style={{ height: '110px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
                      onClick={mod.route ? () => navigate(mod.route!) : undefined}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-[34px] w-full justify-center">
              {MODULES.map(mod => (
                <div key={mod.titleKey} className="w-[calc(33.333%-23px)] min-w-[260px]">
                  <Card
                    variant="illustration"
                    title={t(mod.titleKey)}
                    subtitle={t(mod.descKey)}
                    text={t('homepage_module_cta')}
                    illustration={<img src={mod.illustration} alt={t(mod.titleKey)} style={{ height: '88px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
                    onClick={mod.route ? () => navigate(mod.route!) : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </section>

      {/* ── GP Lookup + Metrics Section ──────────────────────────────────── */}
      <section className={`relative overflow-hidden bg-[#6a3e31] flex flex-col gap-[55px] items-center pb-[80px] pt-[70px] ${heroVariant === 'map' ? 'px-[200px]' : 'px-[250px]'} w-full`}>
        <DotGrid position="top-right" opacity={0.18} color="#f7f0ee" />
        <DotGrid position="bottom-left" opacity={0.18} color="#f7f0ee" />
        <Reveal className="flex flex-col items-center gap-[12px] w-full">
          <EyebrowPill text={t('homepage_eyebrow_gp_lookup')} />
          <PageSectionHeading
            heading={t('homepage_gp_lookup_heading')}
            subtitle={t('homepage_gp_lookup_subtitle')}
            align="center"
            className="text-white [&_p]:text-white"
          />
        </Reveal>

        <Reveal delay={1} className="flex gap-[15px] items-stretch w-full">
          {/* Left: filter form */}
          <div className="flex flex-col shrink-0 w-[463px]">
            <SectionHolder title={t('homepage_gp_lookup_form_title')} className="h-full">
              <div className="flex flex-col gap-[30px] w-full px-[30px] pt-[25px] pb-[35px]">
                <DropdownField label={t('homepage_gp_lookup_duration')} placeholder="" value={year} onChange={setYear} options={YEAR_OPTIONS} />
                <DropdownField label={t('homepage_gp_lookup_zilla')} placeholder={t('homepage_gp_lookup_zilla_placeholder')} value={zilla} onChange={v => { setZilla(v); setTaluka(''); setGp(''); }} options={DISTRICTS} />
                <DropdownField label={t('homepage_gp_lookup_taluka')} placeholder={t('homepage_gp_lookup_taluka_placeholder')} value={taluka} onChange={v => { setTaluka(v); setGp(''); }} options={talukaOptions} />
                <DropdownField label={t('homepage_gp_lookup_gp')} placeholder={t('homepage_gp_lookup_gp_placeholder')} value={gp} onChange={setGp} options={gpOptions} />
                <Button variant="filled" size="small" text={t('btn_see_data')} onClick={() => setActiveZilla(zilla)} />
              </div>
            </SectionHolder>
          </div>

          {/* Right: metric cards grid */}
          <div className="flex-1 bg-white rounded-[20px] flex flex-col gap-[20px] pb-[40px] pt-[25px] px-[40px]">
            <p className="font-semibold text-[20px] text-[#6a3e31] leading-[24px] text-center w-full" style={NS}>
              {summaryLabel}
            </p>
            {[0, 3, 6].map(start => (
              <div key={start} className="flex gap-[20px] items-stretch w-full">
                {METRIC_CARDS.slice(start, start + 3).map(card => {
                  const liveValue =
                    card.labelKey === 'metric_gp_meetings'  ? liveMetrics.meetings  :
                    card.labelKey === 'metric_proceedings'   ? liveMetrics.meetings  :
                    card.labelKey === 'metric_year_books'    ? liveMetrics.yearBooks  :
                    card.labelKey === 'metric_month_books'   ? liveMetrics.monthBooks :
                    null;
                  const liveChange =
                    card.labelKey === 'metric_year_books' ? liveMetrics.yearBookPct :
                    null;
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
      <section className={`relative overflow-hidden flex flex-col gap-[45px] items-center pb-[80px] pt-[100px] ${heroVariant === 'map' ? 'px-[200px]' : 'px-[250px]'} w-full bg-[#f9f5f5]`}>
        <DotGrid position="top-right" opacity={0.10} />
        <DotGrid position="bottom-left" opacity={0.10} />
        <Reveal className="flex flex-col items-center gap-[12px] w-full">
          <EyebrowPill text={t('homepage_eyebrow_guidelines')} />
          <PageSectionHeading
            heading={t('homepage_guidelines_heading')}
            subtitle={t('homepage_guidelines_subtitle')}
            align="center"
          />
        </Reveal>
        <Reveal delay={1} className="flex gap-[30px] items-start w-full">
          <SectionHolder title={t('section_guidelines')} className="flex-1">
            <div className="flex flex-col gap-[20px] w-full px-[20px] pt-[20px] pb-[25px] max-h-[420px] overflow-y-auto">
              {[1, 2, 3, 4].map(i => (
                <GuidelinesCard
                  key={i}
                  date="14/07/2021"
                  title="Operational guidelines for the implementation of the 15th Finance Commission"
                  description="Recommendations on rural local bodies grants during the period 2021–2026"
                  className="w-full"
                />
              ))}
            </div>
          </SectionHolder>
          <SectionHolder title={t('section_notifications')} className="flex-1">
            <div className="flex flex-col gap-[20px] w-full px-[20px] pt-[20px] pb-[25px] max-h-[420px] overflow-y-auto">
              {[1, 2, 3, 4].map(i => (
                <NotificationsCard
                  key={i}
                  date="14/07/2021"
                  title="Panchatantra 2.0 Updates - 05.10.2023"
                  description="Description content here"
                  className="w-full"
                />
              ))}
            </div>
          </SectionHolder>
        </Reveal>
        <Reveal delay={2}><Button variant="filled" text={t('btn_view_all')} onClick={() => navigate('/documents', { state: { tab: 'guidelines' } })} /></Reveal>
      </section>

      {/* ── Events and Initiatives ───────────────────────────────────────── */}
      <section className={`relative overflow-hidden flex flex-col gap-[45px] items-center pb-[80px] pt-[100px] ${heroVariant === 'map' ? 'px-[200px]' : 'px-[250px]'} w-full bg-[#efe0dc]`}>
        <DotGrid position="top-left" opacity={0.12} />
        <DotGrid position="bottom-right" opacity={0.12} />
        <Reveal className="flex flex-col items-center gap-[12px] w-full">
          <EyebrowPill text={t('homepage_eyebrow_events')} />
          <PageSectionHeading
            heading={t('homepage_events_heading')}
            subtitle={t('homepage_events_subtitle')}
            align="center"
          />
        </Reveal>
        <Reveal delay={1} className="flex gap-[30px] items-start w-full">
          <SectionHolder title={t('section_initiatives')} className="flex-1">
            <div className="flex flex-col gap-[20px] w-full px-[20px] pt-[20px] pb-[25px] max-h-[420px] overflow-y-auto">
              {[1, 2, 3, 4].map(i => (
                <InitiativesCard
                  key={i}
                  status="PUBLISHED"
                  title="NCORD AWARENESS MEETING"
                  startDate="30-Mar-2026"
                  endDate="30-Mar-2026"
                  region="KOLALA (1525003023)"
                  posted="1 Day ago"
                  className="w-full"
                />
              ))}
            </div>
          </SectionHolder>
          <SectionHolder title={t('section_events')} className="flex-1">
            <div className="flex flex-col gap-[20px] w-full px-[20px] pt-[20px] pb-[25px] max-h-[420px] overflow-y-auto">
              {[1, 2, 3, 4].map(i => (
                <EventsCard
                  key={i}
                  status="PUBLISHED"
                  title="NCORD AWARENESS MEETING"
                  startDate="30-Mar-2026"
                  endDate="30-Mar-2026"
                  totalAssignGp="1"
                  posted="1 Day ago"
                  className="w-full"
                />
              ))}
            </div>
          </SectionHolder>
        </Reveal>
        <Reveal delay={2}><Button variant="filled" text={t('btn_view_all')} onClick={() => navigate('/documents', { state: { tab: 'events' } })} /></Reveal>
      </section>

      {/* ── Ecosystem Apps ───────────────────────────────────────────────── */}
      <section className={`relative overflow-hidden flex flex-col gap-[45px] items-center pb-[80px] pt-[100px] ${heroVariant === 'map' ? 'px-[200px]' : 'px-[250px]'} w-full`}>
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

      {/* ── App Download CTA ─────────────────────────────────────────────── */}
      <AppDownloadCTA />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <Footer variant="dark" />

      {showVariantSwitcher && <VariantSwitcherPill />}
    </div>
  );
}
