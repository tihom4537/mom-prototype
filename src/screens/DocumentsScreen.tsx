import AccessibilityFab from '../components/AccessibilityFab';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AccessibilityBar,
  Navbar,
  DocumentCard,
  AppDownloadCTA,
  Footer,
  DropdownField,
  Button,
  EyebrowPill,
  ScaleToFit,
} from '../components';
import TabOptions from '../components/TabOptions';
import DatePicker from '../components/DatePicker';
import SearchInput from '../components/SearchInput';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

// ── Tab definitions ────────────────────────────────────────────────────────────

type TabId = 'guidelines' | 'notifications' | 'events' | 'initiatives' | 'other' | 'questionnaires';

interface Tab {
  id: TabId;
  labelKey: string;
}

const TABS: Tab[] = [
  { id: 'guidelines',     labelKey: 'docs_tab_guidelines' },
  { id: 'notifications',  labelKey: 'docs_tab_notifications' },
  { id: 'events',         labelKey: 'docs_tab_events' },
  { id: 'initiatives',    labelKey: 'docs_tab_initiatives' },
  { id: 'other',          labelKey: 'docs_tab_other' },
  { id: 'questionnaires', labelKey: 'docs_tab_questionnaires' },
];

// ── Mock document data per tab ─────────────────────────────────────────────────

const DOCUMENTS: Record<TabId, string[]> = {
  guidelines: [
    'GP Administration Guidelines 2024',
    'Panchayat Raj Act — Operational Manual',
    'Financial Management Guidelines for GPs',
    'Sanitation and Health Guidelines',
    'Gram Sabha Conduct Guidelines',
    'Infrastructure Development Manual',
  ],
  notifications: [
    'Circular: Monthly Meeting Schedule — May 2025',
    'Alert: Year Book Closure Deadline Extended',
    'Notification: New HRMS Module Rollout',
    'Circular: SFC Questionnaire Submission',
  ],
  events: [
    'Gram Sabha — June 2025 Schedule',
    'District Level Training — Belagavi',
    'State Convention: Panchayat Raj Day',
  ],
  initiatives: [
    'Digital GP Initiative — Phase 2',
    'Swachh Bharat Mission — GP Tracker',
    'PMAY-G Implementation Guide',
    'Jal Jeevan Mission — Progress Report',
  ],
  other: [
    'GP Property Tax Assessment Report 2024',
    'Annual Audit Report Template',
    'Inter-departmental MOU — Template',
  ],
  questionnaires: [
    '5th State Finance Commission Questionnaires Gram Panchayat',
    '5th State Finance Commission Questionnaires Gram Panchayat',
    '5th State Finance Commission Questionnaires Gram Panchayat',
    '5th State Finance Commission Questionnaires Gram Panchayat',
    '5th State Finance Commission Questionnaires Gram Panchayat',
    '5th State Finance Commission Questionnaires Gram Panchayat',
    '5th State Finance Commission Questionnaires Gram Panchayat',
    '5th State Finance Commission Questionnaires Gram Panchayat',
  ],
};

// ── Nav links ─────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Home',                  route: '/homepage' },
  { label: 'About Us',              route: null },
  { label: 'Attendance',            route: '/attendance-public' },
  { label: 'Documents and Notices', route: '/documents', active: true },
  { label: 'Helplines',             route: '/helplines' },
  { label: 'Contact Directory',      route: '/contact-directory' },
  { label: 'Feedback',              route: null },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DocumentsScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const initialTab = (location.state as { tab?: TabId } | null)?.tab ?? 'questionnaires';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Date-range + search filters (guidelines, notifications, questionnaires, other)
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [search, setSearch]       = useState('');

  // Location filters (events, initiatives)
  const [locState, setLocState]   = useState('');
  const [locZilla, setLocZilla]   = useState('');
  const [locTaluk, setLocTaluk]   = useState('');
  const [locGp, setLocGp]         = useState('');

  const docs = DOCUMENTS[activeTab];
  const countLabel = docs.length === 1
    ? `1 ${t('docs_count_singular')}`
    : `${docs.length} ${t('docs_count_plural')}`;

  // Split docs into two equal columns
  const mid = Math.ceil(docs.length / 2);
  const leftCol = docs.slice(0, mid);
  const rightCol = docs.slice(mid);

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
        onLoginClick={() => {}}
      />

      {/* Main content */}
      <main id="main-content" tabIndex={-1} className="flex flex-col gap-[50px] items-start pb-[80px] pt-[60px] px-[200px] w-full">

        {/* Section heading */}
        <div className="flex flex-col gap-[8px] items-center w-full">
          <EyebrowPill text={t('docs_eyebrow')} variant="filled" />
          <p className="font-bold text-[28px] leading-[38px] text-[#6a3e31] text-center w-full" style={NS}>
            {t('docs_heading')}
          </p>
          <p className="font-normal text-[14px] leading-[22px] text-[#525c66] text-center w-full" style={NS}>
            {t('docs_subheading')}
          </p>
        </div>

        {/* Tab bar + content */}
        <div className="flex flex-col gap-[50px] w-full">

          {/* Tab bar */}
          <div className="flex flex-col items-center w-full">
            <div className="flex gap-[30px] items-center justify-center w-full">
              {TABS.map(tab => (
                <TabOptions
                  key={tab.id}
                  menuOption={t(tab.labelKey)}
                  selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
            {/* Full-width underline divider */}
            <div className="bg-[#c6c6c6] h-px w-full" />
          </div>

          {/* Per-tab filters */}
          {(activeTab === 'guidelines' || activeTab === 'notifications') && (
            <div className="flex items-end justify-between w-full">
              {/* Left: date range + apply */}
              <div className="flex items-end gap-[10px]">
                <div className="w-[200px] shrink-0">
                  <DatePicker
                    label={t('docs_filter_date_from')}
                    placeholder={t('docs_filter_date_from')}
                    value={dateFrom}
                    onChange={setDateFrom}
                  />
                </div>
                <div className="w-[200px] shrink-0">
                  <DatePicker
                    label={t('docs_filter_date_to')}
                    placeholder={t('docs_filter_date_to')}
                    value={dateTo}
                    onChange={setDateTo}
                  />
                </div>
                <Button variant="filled" text={t('docs_filter_search')} />
              </div>
              {/* Right: search bar + button */}
              <div className="flex items-end gap-[10px]">
                <div className="w-[280px]">
                  <div className="h-[20px] shrink-0" />
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder={t('docs_filter_search_placeholder')}
                  />
                </div>
                <Button variant="filled" text={t('docs_filter_search')} />
              </div>
            </div>
          )}

          {(activeTab === 'events' || activeTab === 'initiatives') && (
            <div className="flex items-end gap-[16px] w-full">
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('docs_filter_state')}
                  placeholder={t('docs_filter_state')}
                  value={locState}
                  onChange={setLocState}
                  options={['Karnataka']}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('docs_filter_zilla')}
                  placeholder={t('docs_filter_zilla')}
                  value={locZilla}
                  onChange={setLocZilla}
                  options={['Bengaluru Urban', 'Mysuru', 'Belagavi', 'Dharwad']}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('docs_filter_taluk')}
                  placeholder={t('docs_filter_taluk')}
                  value={locTaluk}
                  onChange={setLocTaluk}
                  options={['Anekal', 'Bengaluru South', 'Bengaluru North']}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('docs_filter_gp')}
                  placeholder={t('docs_filter_gp')}
                  value={locGp}
                  onChange={setLocGp}
                  options={['Anekal GP', 'Jigani GP', 'Huskur GP']}
                />
              </div>
              <Button variant="filled" text={t('docs_filter_search')} />
            </div>
          )}

          {(activeTab === 'questionnaires' || activeTab === 'other') && (
            <div className="flex items-end justify-between w-full">
              {/* Left: date range + apply */}
              <div className="flex items-end gap-[10px]">
                <div className="w-[200px] shrink-0">
                  <DatePicker
                    label={t('docs_filter_date_from')}
                    placeholder={t('docs_filter_date_from')}
                    value={dateFrom}
                    onChange={setDateFrom}
                  />
                </div>
                <div className="w-[200px] shrink-0">
                  <DatePicker
                    label={t('docs_filter_date_to')}
                    placeholder={t('docs_filter_date_to')}
                    value={dateTo}
                    onChange={setDateTo}
                  />
                </div>
                <Button variant="filled" text={t('docs_filter_search')} />
              </div>
              {/* Right: search bar + button */}
              <div className="flex items-end gap-[10px]">
                <div className="w-[280px]">
                  <div className="h-[20px] shrink-0" />
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder={t('docs_filter_search_placeholder')}
                  />
                </div>
                <Button variant="filled" text={t('docs_filter_search')} />
              </div>
            </div>
          )}

          {/* Documents list */}
          <div className="flex flex-col gap-[18px] w-full">

            {/* Category label + count badge */}
            <div className="flex items-center gap-[10px]">
              <span className="font-semibold text-[16px] leading-normal text-[#6a3e31] tracking-[0.2px] whitespace-nowrap" style={NS}>
                {t(TABS.find(t => t.id === activeTab)!.labelKey)}
              </span>
              <div className="bg-[#f7f0ee] flex items-start overflow-hidden px-[10px] py-[4px] rounded-full shrink-0">
                <span className="font-medium text-[11px] leading-normal text-[#6a3e31] whitespace-nowrap" style={NS}>
                  {countLabel}
                </span>
              </div>
            </div>

            {/* Two-column card grid */}
            <div className="flex gap-[18px] items-start w-full">
              {/* Left column */}
              <div className="flex flex-col gap-[20px] flex-1 min-w-0">
                {leftCol.map((name, i) => (
                  <DocumentCard key={i} documentName={name} />
                ))}
              </div>
              {/* Right column */}
              {rightCol.length > 0 && (
                <div className="flex flex-col gap-[20px] flex-1 min-w-0">
                  {rightCol.map((name, i) => (
                    <DocumentCard key={i} documentName={name} />
                  ))}
                </div>
              )}
            </div>

          </div>
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
