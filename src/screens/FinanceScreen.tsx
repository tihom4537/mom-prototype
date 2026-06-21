import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ResponsiveBar } from '@nivo/bar';
import AccessibilityBar from '../components/AccessibilityBar';
import AccessibilityFab from '../components/AccessibilityFab';
import Navbar from '../components/Navbar';
import ScaleToFit from '../components/ScaleToFit';
import SectionTopper from '../components/SectionTopper';
import DropdownField from '../components/DropdownField';
import SectionHeading from '../components/SectionHeading';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import Table from '../components/Table';
import KarnatakaLeafletMap from '../components/KarnatakaLeafletMap';
import DistrictShape from '../components/DistrictShape';
import MapLegend from '../components/MapLegend';
import Pagination from '../components/Pagination';
import Card from '../components/Card';
import AppDownloadCTA from '../components/AppDownloadCTA';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import GoBackToPreviousPage from '../components/GoBackToPreviousPage';
import Breadcrumb from '../components/Breadcrumb';
import { YEAR_BOOK_DATA, MONTH_BOOK_DATA, DISTRICTS, KARNATAKA_HIERARCHY } from '../data/karnatakaData';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const FINANCE_ILLUS = '/Illustrations/finance.svg';

// ── Module data (shared across all module pages) ─────────────────────────────
const ALL_MODULES = [
  {
    id: 'finance',
    title: 'Finance and Accounting',
    description: 'Access income, expenditure, budget allocations, and fund utilisation records for any Gram Panchayat.',
    illustration: '/Illustrations/finance.svg',
    route: '/finance',
  },
  {
    id: 'revenue',
    title: 'Revenue Collection',
    description: 'View tax, fee, and levy collection records — what was collected, when, and against what demand.',
    illustration: '/Illustrations/revenue.svg',
    route: '/revenue',
  },
  {
    id: 'hrms',
    title: 'Human Resource Management System',
    description: 'Browse staff records, attendance logs, and service history for GP employees across the state.',
    illustration: '/Illustrations/hrms.svg',
    route: '/hrms',
  },
  {
    id: 'meetings',
    title: 'Meeting Management',
    description: 'Access meeting agendas, proceedings, resolutions, and attendance records for any GP.',
    illustration: '/Illustrations/meetings.svg',
    route: '/meetings/overview',
  },
  {
    id: 'citizen',
    title: 'Citizen Services',
    description: 'See applications submitted, entitlements accessed, and grievances filed through the GP.',
    illustration: '/Illustrations/citizen.svg',
    route: '/citizen',
  },
  {
    id: 'planning',
    title: 'Planning',
    description: 'Browse development plans, scheme allocations, and capital works records across Karnataka GPs.',
    illustration: '/Illustrations/finance.svg',
    route: null,
  },
];


// GeoJSON NAME_2 → YEAR_BOOK_DATA district name mapping
const GEO_TO_DISTRICT: Record<string, string> = {
  'Bagalkot':        'Bagalkote',
  'Bangalore Rural': 'Bengaluru Rural',
  'Bangalore Urban': 'Bengaluru',
  'Belgaum':         'Belagavi',
  'Bellary':         'Ballari',
  'Bijapur':         'Vijayapura',
  'Chamrajnagar':    'Chamarajanagara',
  'Chikmagalur':     'Chikkamagaluru',
  'Chitradurga':     'Chitradurga',
  'Coorg':           'Kodagu',
  'Dakshin Kannad':  'Dakshina Kannada',
  'Davanagere':      'Davanagere',
  'Dharwad':         'Dharwar',
  'Gadag':           'Gadag',
  'Gulbarga':        'Kalaburagi',
  'Hassan':          'Hassan',
  'Haveri':          'Haveri',
  'Kodagu':          'Kodagu',
  'Kolar':           'Kolar',
  'Koppal':          'Koppal',
  'Mandya':          'Mandya',
  'Mysore':          'Mysuru',
  'Raichur':         'Raichur',
  'Shimoga':         'Shivamogga',
  'Tumkur':          'Tumakuru',
  'Udupi':           'Udupi',
  'Uttar Kannand':   'Uttara Kannada',
};

const REPORT_TYPES = ['Year Book Closure', 'Month Book Closure'];
const FIN_YEARS = ['2025-26', '2024-25', '2023-24', '2022-23'];

const MONTH_KEYS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'] as const;
type MonthKey = typeof MONTH_KEYS[number];

function generateYearBookTableData(district: string, taluk: string) {
  const districtData = district
    ? YEAR_BOOK_DATA.filter(r => r.district === district)
    : YEAR_BOOK_DATA;

  return districtData.map((r, i) => {
    const taluks = Object.keys(KARNATAKA_HIERARCHY[r.district] ?? {});
    const numTaluks = taluks.length || 1;

    if (taluk && district && r.district === district) {
      const gpList = KARNATAKA_HIERARCHY[district]?.[taluk] ?? [];
      const talukTotal = Math.round(r.totalGPs / numTaluks);
      const talukCompleted = Math.round(r.completed / numTaluks);
      return {
        slNo: i + 1,
        district: `${r.district} / ${taluk}`,
        totalGPs: talukTotal,
        completed: talukCompleted,
        pending: talukTotal - talukCompleted,
        completionPct: talukTotal > 0 ? `${((talukCompleted / talukTotal) * 100).toFixed(1)}%` : '0%',
        gpCount: gpList.length,
      };
    }

    return {
      slNo: r.slNo,
      district: r.district,
      totalGPs: r.totalGPs,
      completed: r.completed,
      pending: r.totalGPs - r.completed,
      completionPct: `${((r.completed / r.totalGPs) * 100).toFixed(1)}%`,
      gpCount: Object.values(KARNATAKA_HIERARCHY[r.district] ?? {}).flat().length,
    };
  });
}

function generateMonthBookTableData(district: string) {
  const districtData = district
    ? MONTH_BOOK_DATA.filter(r => r.district === district)
    : MONTH_BOOK_DATA;

  return districtData.map(r => ({
    slNo: r.slNo,
    district: r.district,
    totalGPs: r.totalGPs,
    apr: r.apr, may: r.may, jun: r.jun, jul: r.jul,
    aug: r.aug, sep: r.sep, oct: r.oct, nov: r.nov,
    dec: r.dec, jan: r.jan, feb: r.feb, mar: r.mar,
  }));
}

function generateChartData(tableData: { district: string; totalGPs: number; completed?: number }[]) {
  return tableData.map(row => {
    const completed = row.completed ?? 0;
    const pending   = row.totalGPs - completed;
    return {
      district:  row.district.length > 10 ? row.district.slice(0, 10) + '…' : row.district,
      'Completed': completed,
      'Pending':   pending < 0 ? 0 : pending,
    };
  });
}

function generateDistrictTooltipData(): Record<string, { total: number; completed: number }> {
  const out: Record<string, { total: number; completed: number }> = {};
  Object.entries(GEO_TO_DISTRICT).forEach(([geoName, distName]) => {
    const row = YEAR_BOOK_DATA.find(r => r.district === distName);
    if (row) out[geoName] = { total: row.totalGPs, completed: row.completed };
  });
  return out;
}

function generateMapData(tableData: { district: string; totalGPs: number; completed: number }[], selectedDistrict: string) {
  // Build GeoJSON-keyed map: geoName → completed count
  // When a district is selected, dim all others (value 0)
  const districtToCompleted: Record<string, number> = {};
  YEAR_BOOK_DATA.forEach(r => {
    districtToCompleted[r.district] = r.completed;
  });

  const out: Record<string, number> = {};
  Object.entries(GEO_TO_DISTRICT).forEach(([geoName, distName]) => {
    if (selectedDistrict && distName !== selectedDistrict) {
      out[geoName] = -1; // sentinel: greyed out
    } else {
      out[geoName] = districtToCompleted[distName] ?? 0;
    }
  });
  return out;
}

type ViewMode = 'table' | 'chart' | 'map';

// ── Taluk Grid — shown in map panel when a district is selected ───────────────
interface TalukGridProps {
  district: string;
  selectedTaluk: string;
  selectedGp: string;
  districtRow?: { totalGPs: number; completed: number };
  hierarchy: Record<string, string[]>;
  onTalukClick: (taluk: string) => void;
  onGpClick: (taluk: string, gp: string) => void;
  onBack: () => void;
  hideBack?: boolean;
}

function TalukGrid({ district, selectedTaluk, selectedGp, districtRow, hierarchy, onTalukClick, onGpClick, onBack, hideBack }: TalukGridProps) {
  const { t } = useLanguage();
  const taluks = Object.keys(hierarchy);
  const numTaluks = taluks.length || 1;
  const totalGPs = districtRow?.totalGPs ?? 0;
  const completed = districtRow?.completed ?? 0;
  const distPct = totalGPs > 0 ? ((completed / totalGPs) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col gap-[16px] w-full">
      {/* District header + back */}
      {!hideBack && (
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-[4px] text-[#6a3e31] text-[12px] font-medium cursor-pointer bg-transparent border-none p-0"
            style={NS}
          >
            <Icon name="chevron_left" size="small" color="#6a3e31" />
            {t('finance_taluk_all_districts')}
          </button>
          <span className="text-[#c6c6c6] text-[14px]">/</span>
          <span className="font-semibold text-[15px] text-[#212121]" style={NS}>{district}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-[16px]">
          <span className="text-[12px] text-[#525c66]" style={NS}>
            {t('finance_taluk_total_gps')} <strong>{totalGPs}</strong>
          </span>
          <span className="text-[12px] text-[#525c66]" style={NS}>
            {t('finance_taluk_completed')} <strong>{completed}</strong>
          </span>
          <span className="text-[12px] font-semibold text-[#6a3e31]" style={NS}>
            {distPct}% {t('finance_taluk_complete')}
          </span>
        </div>
      </div>

      {/* Taluk cards grid */}
      <div className="grid grid-cols-3 gap-[12px] w-full">
        {taluks.map(talukName => {
          const gpList = hierarchy[talukName] ?? [];
          const talukTotal = Math.round(totalGPs / numTaluks);
          const talukCompleted = Math.round(completed / numTaluks);
          const talukPct = talukTotal > 0 ? ((talukCompleted / talukTotal) * 100).toFixed(0) : '0';
          const isSelectedTaluk = talukName === selectedTaluk;

          return (
            <div
              key={talukName}
              onClick={() => onTalukClick(talukName)}
              className={`flex flex-col gap-[8px] rounded-[10px] p-[14px] border cursor-pointer transition-all
                ${isSelectedTaluk
                  ? 'border-[#6a3e31] bg-[rgba(106,62,49,0.06)] shadow-[0_0_0_2px_rgba(106,62,49,0.15)]'
                  : 'border-[#c6c6c6] bg-white hover:border-[#c99080] hover:bg-[rgba(106,62,49,0.03)]'
                }`}
            >
              {/* Taluk name + completion badge */}
              <div className="flex items-start justify-between gap-[6px]">
                <span className="font-semibold text-[13px] text-[#212121] leading-snug" style={NS}>{talukName}</span>
                <span
                  className={`shrink-0 text-[11px] font-semibold px-[6px] py-[2px] rounded-full
                    ${parseInt(talukPct) > 50 ? 'bg-[rgba(106,62,49,0.12)] text-[#6a3e31]' : 'bg-[#f7f0ee] text-[#8a5446]'}`}
                  style={NS}
                >
                  {talukPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-[4px] w-full bg-[#efe0dc] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6a3e31] rounded-full transition-all"
                  style={{ width: `${talukPct}%` }}
                />
              </div>

              <span className="text-[11px] text-[#727272]" style={NS}>
                {talukCompleted}/{talukTotal} {t('finance_taluk_gps_completed')}
              </span>

              {/* GP list — shown when this taluk is selected */}
              {isSelectedTaluk && gpList.length > 0 && (
                <div className="flex flex-col gap-[4px] mt-[4px] border-t border-[#efe0dc] pt-[8px]">
                  {gpList.map(g => {
                    const isSelectedGp = g === selectedGp;
                    return (
                      <div
                        key={g}
                        onClick={e => { e.stopPropagation(); onGpClick(talukName, g); }}
                        className={`flex items-center gap-[6px] px-[8px] py-[5px] rounded-[6px] cursor-pointer text-[11px] transition-colors
                          ${isSelectedGp
                            ? 'bg-[#6a3e31] text-white font-medium'
                            : 'text-[#525c66] hover:bg-[rgba(106,62,49,0.08)]'
                          }`}
                        style={NS}
                      >
                        <Icon
                          name="place"
                          size="small"
                          color={isSelectedGp ? '#fff' : '#c99080'}
                          className="shrink-0"
                        />
                        <span className="truncate">{g}</span>
                        {isSelectedGp && (
                          <span className="ml-auto shrink-0 text-[10px] bg-white bg-opacity-20 px-[4px] py-[1px] rounded text-white">
                            {t('tag_completed').toLowerCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedGp && (
        <div className="flex items-center gap-[8px] bg-[rgba(106,62,49,0.08)] border border-[rgba(106,62,49,0.2)] rounded-[8px] px-[14px] py-[10px]">
          <Icon name="place" size="small" color="#6a3e31" />
          <span className="text-[13px] font-medium text-[#6a3e31]" style={NS}>
            {selectedGp}
          </span>
          <span className="text-[12px] text-[#525c66]" style={NS}>
            — {t('finance_gp_data_note')}
          </span>
        </div>
      )}
    </div>
  );
}

export default function FinanceScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [zilla, setZilla] = useState('');
  const [taluk, setTaluk] = useState('');
  const [gp, setGp] = useState('');
  const [reportType, setReportType] = useState('Year Book Closure');
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [view, setView] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [moduleSlide, setModuleSlide] = useState(0);

  const isMonthBook = reportType === 'Month Book Closure';

  const tableData = useMemo(
    () => isMonthBook
      ? generateMonthBookTableData(zilla)
      : generateYearBookTableData(zilla, taluk),
    [isMonthBook, zilla, taluk]
  );

  const filteredData = useMemo(() => {
    if (!search.trim()) return tableData;
    const q = search.toLowerCase();
    return tableData.filter(r => r.district.toLowerCase().includes(q));
  }, [tableData, search]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pagedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const chartData = useMemo(() => generateChartData(filteredData as { district: string; totalGPs: number; completed?: number }[]), [filteredData]);
  const mapData = useMemo(() => generateMapData(filteredData as { district: string; totalGPs: number; completed: number }[], zilla), [filteredData, zilla]);
  const districtTooltipData = useMemo(() => generateDistrictTooltipData(), []);

  // Dropdown options derived from hierarchy
  const talukOptions = zilla ? Object.keys(KARNATAKA_HIERARCHY[zilla] ?? {}) : [];
  const gpOptions = (zilla && taluk) ? (KARNATAKA_HIERARCHY[zilla]?.[taluk] ?? []) : [];

  // Filter pill summary
  const pillParts = [
    zilla || 'All Districts',
    ...(taluk ? [taluk] : []),
    ...(gp ? [gp] : []),
    reportType || 'Year Book Closure',
    financialYear,
  ];

  // "Browse other modules" — exclude Finance (current page)
  const otherModules = ALL_MODULES.filter(m => m.id !== 'finance');
  const visibleModules = otherModules.slice(moduleSlide, moduleSlide + 3);
  const canPrev = moduleSlide > 0;
  const canNext = moduleSlide + 3 < otherModules.length;

  const MONTH_LABELS: Record<MonthKey, string> = {
    apr: 'April', may: 'May', jun: 'June', jul: 'July',
    aug: 'August', sep: 'September', oct: 'October', nov: 'November',
    dec: 'December', jan: 'January', feb: 'February', mar: 'March',
  };

  const TABLE_COLUMNS = isMonthBook
    ? [
        { key: 'slNo',     label: t('finance_col_sl_no'),    width: 'w-[60px] shrink-0' },
        { key: 'district', label: t('finance_col_district'), width: 'w-[180px] shrink-0' },
        { key: 'totalGPs', label: t('finance_col_total_gps'), width: 'w-[110px] shrink-0' },
        ...MONTH_KEYS.map(m => ({
          key: m,
          label: MONTH_LABELS[m],
          width: 'w-[100px] shrink-0',
        })),
      ]
    : [
        { key: 'slNo',          label: t('finance_col_sl_no'),          width: 'w-[70px] shrink-0' },
        { key: 'district',      label: t('finance_col_district'),       width: 'flex-1 min-w-0' },
        { key: 'totalGPs',      label: t('finance_col_total_gps'),      width: 'w-[110px] shrink-0' },
        { key: 'completed',     label: t('finance_col_completed'),      width: 'w-[260px] shrink-0' },
        { key: 'pending',       label: t('finance_col_pending'),        width: 'w-[100px] shrink-0' },
        { key: 'completionPct', label: t('finance_col_completion_pct'), width: 'w-[120px] shrink-0' },
      ];

  return (
    <ScaleToFit>
    <div className="flex flex-col min-h-screen w-full bg-white">
      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar version="home-page-nav-menu" />

      {/* Back nav + breadcrumb */}
      <div className="px-[200px] pt-[32px] flex items-center justify-between">
        <GoBackToPreviousPage label={t('finance_back_to_home')} onClick={() => navigate('/homepage')} />
        <Breadcrumb level={3} items={[t('finance_breadcrumb_home'), t('finance_breadcrumb_modules'), t('finance_breadcrumb_finance')]} />
      </div>

      {/* SectionTopper — inset with margin, rounded */}
      <div className="px-[200px] pt-[20px]">
        <SectionTopper
          variant="variant3"
          heading={t('finance_section_heading')}
          subheading={t('finance_section_subheading')}
          illustration={FINANCE_ILLUS}
          className="rounded-[10px]"
        />
      </div>

      {/* Main content */}
      <div id="main-content" tabIndex={-1} className="flex flex-col gap-[24px] px-[200px] pt-[40px] pb-[50px] w-full">

        {/* Filter row 1: Zilla / Taluk / GP */}
        <div className="flex gap-[20px] items-end w-full">
          <DropdownField
            label={t('finance_label_zilla')}
            placeholder={t('finance_placeholder_district')}
            value={zilla}
            onChange={v => { setZilla(v); setTaluk(''); setGp(''); setPage(1); }}
            options={DISTRICTS}
            showAll
            allLabel="All Districts"
            className="flex-1"
          />
          <DropdownField
            label={t('finance_label_taluk')}
            placeholder={zilla ? t('finance_placeholder_taluk') : t('finance_placeholder_taluk_first')}
            value={taluk}
            onChange={v => { setTaluk(v); setGp(''); setPage(1); }}
            options={talukOptions}
            showAll
            allLabel="All Taluks"
            disabled={!zilla}
            className="flex-1"
          />
          <DropdownField
            label={t('finance_label_gp')}
            placeholder={taluk ? t('finance_placeholder_gp') : t('finance_placeholder_gp_first')}
            value={gp}
            onChange={v => { setGp(v); setPage(1); }}
            options={gpOptions}
            showAll
            allLabel="All GPs"
            disabled={!taluk}
            className="flex-1"
          />
        </div>

        {/* Filter row 2: Report Type + Financial Year */}
        <div className="flex gap-[20px] items-end w-full">
          <DropdownField
            label={t('finance_label_report_type')}
            placeholder={t('finance_placeholder_select')}
            value={reportType}
            onChange={v => { setReportType(v); setPage(1); }}
            options={REPORT_TYPES}
            className="flex-1"
          />
          <DropdownField
            label={t('finance_label_financial_year')}
            placeholder={t('finance_placeholder_select')}
            value={financialYear}
            onChange={v => { setFinancialYear(v); setPage(1); }}
            options={FIN_YEARS}
            className="flex-1"
          />
          <div className="flex-1" />
        </div>

        {/* Search CTA */}
        <div className="flex w-full justify-center">
          <Button variant="filled" iconPlacement="left" iconName="search" text={t('btn_search')} onClick={() => setPage(1)} />
        </div>

        {/* Data card: summary bar + toggle + search + table/chart/map + download */}
        <div className="bg-white border border-[#c6c6c6] rounded-[10px] w-full overflow-hidden">

          {/* Summary bar — topmost, full width */}
          <SectionHeading
            variant="with-box"
            text={pillParts.join('  |  ')}
            fullWidth
            className="border-b border-[#c6c6c6]"
          />

          {/* Toolbar row */}
          <div className="flex items-center justify-between px-[20px] pt-[14px] pb-[14px] border-b border-[#c6c6c6]">
            {/* Segmented toggle — grey variant, shared border */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setView('table')}
                className={`flex items-center gap-[8px] px-[24px] py-[10px] border border-[#b0b0b0] rounded-tl-[8px] rounded-bl-[8px] border-r-0 text-[14px] font-medium tracking-[0.1px] leading-[20px] cursor-pointer transition-colors
                  ${view === 'table' ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}
              >
                <Icon name="table_chart" size="small" color={view === 'table' ? '#6a3e31' : '#727272'} />
                {t('finance_toggle_table')}
              </button>
              <button
                type="button"
                onClick={() => setView('chart')}
                className={`flex items-center gap-[8px] px-[24px] py-[10px] border border-[#b0b0b0] border-r-0 text-[14px] font-medium tracking-[0.1px] leading-[20px] cursor-pointer transition-colors
                  ${view === 'chart' ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}
              >
                <Icon name="bar_chart" size="small" color={view === 'chart' ? '#6a3e31' : '#727272'} />
                {t('finance_toggle_chart')}
              </button>
              <button
                type="button"
                onClick={() => setView('map')}
                className={`flex items-center gap-[8px] px-[24px] py-[10px] border border-[#b0b0b0] rounded-tr-[8px] rounded-br-[8px] text-[14px] font-medium tracking-[0.1px] leading-[20px] cursor-pointer transition-colors
                  ${view === 'map' ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}
              >
                <Icon name="map" size="small" color={view === 'map' ? '#6a3e31' : '#727272'} />
                {t('finance_toggle_map')}
              </button>
            </div>

            {/* Search with mic */}
            <SearchInput
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder={t('finance_search_placeholder')}
              showMic
              className="w-[260px]"
            />
          </div>

          {/* Data view */}
          <div className="p-[20px]">
            {view === 'table' && (
              <div className="flex flex-col gap-[20px]">
                <div className={isMonthBook ? 'overflow-x-auto' : undefined}>
                  <Table
                    columns={TABLE_COLUMNS}
                    rows={pagedData as Record<string, unknown>[]}
                    className={isMonthBook ? 'min-w-[1200px]' : undefined}
                  />
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setPage}
                  onItemsPerPageChange={n => { setItemsPerPage(n); setPage(1); }}
                />
              </div>
            )}

            {view === 'chart' && (
              <div className="flex flex-col gap-[16px]">
                <p className="font-semibold text-[15px] text-[#3b3b3b]" style={NS}>
                  {t('finance_chart_title')} ({financialYear})
                </p>
                <div className="flex items-center gap-[20px]">
                  <div className="flex items-center gap-[6px]">
                    <div className="size-[10px] rounded-full shrink-0" style={{ background: '#6a3e31' }} />
                    <span className="text-[12px] text-[#525c66]" style={NS}>{t('finance_chart_completed')}</span>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <div className="size-[10px] rounded-full shrink-0" style={{ background: '#efe0dc' }} />
                    <span className="text-[12px] text-[#525c66]" style={NS}>{t('finance_chart_pending')}</span>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                  <div role="img" aria-label="Stacked bar chart showing completed and pending transactions by district" style={{ width: Math.max(900, chartData.length * 48), height: 420, overflow: 'visible' }}>
                    <ResponsiveBar
                      data={chartData}
                      keys={['Completed', 'Pending']}
                      indexBy="district"
                      groupMode="stacked"
                      margin={{ top: 24, right: 20, bottom: 100, left: 60 }}
                      padding={0.35}
                      colors={({ id }) => id === 'Completed' ? '#6a3e31' : '#efe0dc'}
                      borderRadius={2}
                      axisBottom={{ tickRotation: -30, tickSize: 0, tickPadding: 8 }}
                      axisLeft={{ tickSize: 0, tickPadding: 8 }}
                      enableLabel={false}
                      enableGridX={false}
                      gridYValues={5}
                      motionConfig="gentle"
                      tooltip={({ id, value, data, indexValue }) => {
                        const total = (data['Completed'] as number) + (data['Pending'] as number);
                        const pct   = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0';
                        return (
                          <div style={{ background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontFamily: 'Noto Sans', fontSize: 12, color: '#212121', minWidth: 200 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{String(indexValue)}</div>
                            <div>{String(id)}: <strong>{Number(value).toLocaleString('en-IN')}</strong> ({pct}%)</div>
                            <div style={{ color: '#727272', marginTop: 2 }}>Total: {total.toLocaleString('en-IN')}</div>
                          </div>
                        );
                      }}
                      theme={{
                        axis: { ticks: { text: { fontFamily: 'Noto Sans', fontSize: 11, fill: '#525c66' } } },
                        grid: { line: { stroke: '#f0f0f0' } },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {view === 'map' && !zilla && (
              <div className="flex flex-col items-center gap-[12px] w-full">
                <KarnatakaLeafletMap
                  gpData={mapData}
                  districtTooltipData={districtTooltipData}
                  width="100%"
                  height={480}
                  noPanZoom
                  onDistrictClick={(geoName) => {
                    const distName = GEO_TO_DISTRICT[geoName] ?? geoName;
                    setZilla(distName);
                    setTaluk('');
                    setGp('');
                  }}
                />
                <MapLegend lowLabel={t('map_legend_low')} highLabel={t('map_legend_high')} />
                <p className="text-[12px] text-[#727272] text-center" style={NS}>
                  {t('finance_map_hint')}
                </p>
              </div>
            )}

            {view === 'map' && zilla && (
              <div className="flex flex-col gap-[16px] w-full">
                {/* Back nav — full width, left-aligned */}
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={() => { setZilla(''); setTaluk(''); setGp(''); }}
                    className="flex items-center gap-[4px] text-[#6a3e31] text-[12px] font-medium cursor-pointer bg-transparent border-none p-0"
                    style={NS}
                  >
                    <Icon name="chevron_left" size="small" color="#6a3e31" />
                    {t('finance_taluk_all_districts')}
                  </button>
                  <span className="text-[#c6c6c6] text-[14px]">/</span>
                  <span className="font-semibold text-[15px] text-[#212121]" style={NS}>{zilla}</span>
                </div>

                {/* Map + cards row */}
                <div className="flex gap-[32px] w-full items-start">
                  {/* Isolated district shape */}
                  <div className="flex flex-col items-center gap-[4px] shrink-0">
                    <DistrictShape
                      districtGeoName={Object.entries(GEO_TO_DISTRICT).find(([, v]) => v === zilla)?.[0] ?? zilla}
                      width={340}
                      height={400}
                      talukGpData={Object.fromEntries(
                        Object.entries(KARNATAKA_HIERARCHY[zilla] ?? {}).map(([t, gps]) => [t, gps.length])
                      )}
                      selectedTaluk={taluk}
                      onTalukClick={(t) => { setTaluk(t); setGp(''); }}
                    />
                    <p className="text-[13px] font-semibold text-[#6a3e31] text-center" style={NS}>{zilla}</p>
                  </div>
                  {/* Taluk cards — hide back button inside TalukGrid since we moved it */}
                  <div className="flex-1 min-w-0">
                    <TalukGrid
                      district={zilla}
                      selectedTaluk={taluk}
                      selectedGp={gp}
                      districtRow={YEAR_BOOK_DATA.find(r => r.district === zilla)}
                      hierarchy={KARNATAKA_HIERARCHY[zilla] ?? {}}
                      onTalukClick={(t) => { setTaluk(t); setGp(''); }}
                      onGpClick={(t, g) => { setTaluk(t); setGp(g); }}
                      onBack={() => { setZilla(''); setTaluk(''); setGp(''); }}
                      hideBack
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Download + Share — bottom of card */}
          <div className="flex justify-center gap-[16px] py-[20px] border-t border-[#c6c6c6]">
            <Button
              variant="filled"
              iconPlacement="left"
              iconName="download"
              text={t('btn_download')}
            />
            <Button
              variant="filled"
              iconPlacement="left"
              iconName="share"
              text={t('btn_share')}
            />
          </div>
        </div>
      </div>

      {/* Browse other modules */}
      <div className="flex flex-col gap-[32px] items-center px-[200px] py-[60px] w-full bg-[rgba(106,62,49,0.08)]">
        <p className="font-semibold text-[28px] text-[#212121]" style={NS}>
          {t('finance_browse_modules')}
        </p>
        <div className="flex items-center gap-[20px] w-full">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setModuleSlide(s => s - 1)}
            className="flex items-center justify-center size-[40px] rounded-full border border-[#c6c6c6] bg-white shrink-0 cursor-pointer disabled:opacity-30 hover:bg-[#f7f0ee] transition-colors"
            aria-label="Previous modules"
          >
            <Icon name="chevron_left" size="small" color="#212121" />
          </button>

          <div className="flex gap-[24px] flex-1 min-w-0">
            {visibleModules.map(mod => (
              <div key={mod.id} className="flex-1 min-w-0">
                <Card
                  variant="illustration"
                  title={mod.title}
                  subtitle={mod.description}
                  text={t('homepage_module_cta')}
                  illustration={
                    <img
                      src={mod.illustration}
                      alt={mod.title}
                      className="block max-h-[88px] max-w-[96px] w-auto h-auto"
                      style={{ objectFit: 'contain', flexShrink: 0 }}
                    />
                  }
                  onClick={mod.route ? () => navigate(mod.route!) : undefined}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={!canNext}
            onClick={() => setModuleSlide(s => s + 1)}
            className="flex items-center justify-center size-[40px] rounded-full border border-[#c6c6c6] bg-white shrink-0 cursor-pointer disabled:opacity-30 hover:bg-[#f7f0ee] transition-colors"
            aria-label="Next modules"
          >
            <Icon name="chevron_right" size="small" color="#212121" />
          </button>
        </div>
      </div>

      <AppDownloadCTA variant="cta-option-2" />
      <Footer variant="dark" />
      <AccessibilityFab />
    </div>
    </ScaleToFit>
  );
}
