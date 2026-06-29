import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { PatternDefsLayer, makeIndexedBarColors } from '../components/ChartPatterns';
import { useHighContrast } from '../hooks/useHighContrast';
import AccessibilityBar from '../components/AccessibilityBar';
import AccessibilityFab from '../components/AccessibilityFab';
import Navbar from '../components/Navbar';
import ScaleToFit from '../components/ScaleToFit';
import GoBackToPreviousPage from '../components/GoBackToPreviousPage';
import Breadcrumb from '../components/Breadcrumb';
import DashboardMetricCard from '../components/DashboardMetricCard';
import DropdownField from '../components/DropdownField';
import Table from '../components/Table';
import AppDownloadCTA from '../components/AppDownloadCTA';
import Footer from '../components/Footer';
import SectionTopper from '../components/SectionTopper';
import SectionHeading from '../components/SectionHeading';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Icon from '../components/Icon';
import KarnatakaLeafletMap from '../components/KarnatakaLeafletMap';
import MapLegend from '../components/MapLegend';
import { DISTRICTS } from '../data/karnatakaData';
import { registerPageNarrator, unregisterPageNarrator } from '../data/pageSummaries';
import { buildCitizenDashboardNarrative } from '../utils/narratives';

type SortFilter = 'top10' | 'bottom10' | null;

// Brand-system colour tokens used:
// success-50 #EDF7E6, success-700 #005A00 (green pill)
// danger-50  #FFEEEA, danger-700 #972120  (red pill)
// neutral-50 #F3F3F3, primary-source #6a3e31 (grey/all pill)
type FilterPillVariant = 'green' | 'red' | 'grey';

interface PillColors { bg: string; bgHover: string; text: string; textHover: string; outline: string; }
const PILL_COLORS: Record<FilterPillVariant, PillColors> = {
  green: { bg: '#EDF7E6', bgHover: '#C6E5B5', text: '#309314', textHover: '#005A00', outline: '#309314' },
  red:   { bg: '#FFEEEA', bgHover: '#FFCDC0', text: '#D4362E', textHover: '#972120', outline: '#D4362E' },
  grey:  { bg: '#F3F3F3', bgHover: '#c6c6c6', text: '#6a3e31', textHover: '#4a2a1e', outline: '#6a3e31' },
};

function FilterPill({ label, variant, active, onClick }: { label: string; variant: FilterPillVariant; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const c = PILL_COLORS[variant];
  const bg   = hovered ? c.bgHover   : c.bg;
  const text = hovered ? c.textHover : c.text;
  const outline = active ? `0 0 0 2px ${c.outline}` : 'none';
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...NS, background: bg, color: text, boxShadow: outline, transition: 'background 150ms ease, color 150ms ease, box-shadow 150ms ease' }}
      className="px-[16px] py-[8px] rounded-[100px] font-semibold text-[14px] leading-[20px] cursor-pointer select-none border-none outline-none"
    >
      {label}
    </button>
  );
}

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };


// ── Service data (BSK Dashboard CSV) ──────────────────────────────────────────
interface ServiceRow extends Record<string, unknown> {
  slNo: number;
  service: string;
  total: number;
  delivered: number;
  deliveredPct: string;
  inProcessDept: number;
  inProcessApplicant: number;
  pendingBeyondSLA: number;
  rejected: number;
  rejectedPct: string;
  avgDays: string;
}

const SERVICE_DATA: ServiceRow[] = [
  { slNo: 1,  service: 'Permission for Industrial/Agro Unit',         total: 1878,    delivered: 1505,    deliveredPct: '80.14%', inProcessDept: 15,   inProcessApplicant: 26,  pendingBeyondSLA: 7,    rejected: 332,   rejectedPct: '17.68%', avgDays: '9.16'  },
  { slNo: 2,  service: 'Building Construction License',               total: 105422,  delivered: 92037,   deliveredPct: '87.30%', inProcessDept: 859,  inProcessApplicant: 1194,pendingBeyondSLA: 192,  rejected: 11332, rejectedPct: '10.75%', avgDays: '11.12' },
  { slNo: 3,  service: 'Disconnection of Water Supply',               total: 107,     delivered: 52,      deliveredPct: '48.60%', inProcessDept: 1,    inProcessApplicant: 13,  pendingBeyondSLA: 1,    rejected: 41,    rejectedPct: '38.32%', avgDays: '26.90' },
  { slNo: 4,  service: 'Job Card (MGNREGA)',                          total: 0,       delivered: 0,       deliveredPct: '0%',     inProcessDept: 0,    inProcessApplicant: 0,   pendingBeyondSLA: 0,    rejected: 0,     rejectedPct: '0%',     avgDays: '0'     },
  { slNo: 5,  service: 'Maintenance of Drinking Water',               total: 1194740, delivered: 1190477, deliveredPct: '99.64%', inProcessDept: 2860, inProcessApplicant: 3,   pendingBeyondSLA: 1322, rejected: 1400,  rejectedPct: '0.12%',  avgDays: '2.44'  },
  { slNo: 6,  service: 'Maintenance of Street Light',                 total: 1185014, delivered: 1182174, deliveredPct: '99.76%', inProcessDept: 1873, inProcessApplicant: 0,   pendingBeyondSLA: 381,  rejected: 967,   rejectedPct: '0.08%',  avgDays: '2.20'  },
  { slNo: 7,  service: 'Maintenance of Village Sanitation',           total: 454955,  delivered: 453842,  deliveredPct: '99.76%', inProcessDept: 767,  inProcessApplicant: 0,   pendingBeyondSLA: 233,  rejected: 346,   rejectedPct: '0.08%',  avgDays: '2.39'  },
  { slNo: 8,  service: 'New Water Supply Connection',                 total: 4481,    delivered: 3560,    deliveredPct: '79.45%', inProcessDept: 24,   inProcessApplicant: 136, pendingBeyondSLA: 24,   rejected: 761,   rejectedPct: '16.98%', avgDays: '12.79' },
  { slNo: 9,  service: 'No Objection Certificate',                    total: 101020,  delivered: 93372,   deliveredPct: '92.43%', inProcessDept: 575,  inProcessApplicant: 483, pendingBeyondSLA: 321,  rejected: 6590,  rejectedPct: '6.52%',  avgDays: '5.92'  },
  { slNo: 10, service: 'Occupancy Certificate',                       total: 43792,   delivered: 40279,   deliveredPct: '91.98%', inProcessDept: 391,  inProcessApplicant: 161, pendingBeyondSLA: 89,   rejected: 2961,  rejectedPct: '6.76%',  avgDays: '4.87'  },
  { slNo: 11, service: 'Permission/Reg. Overground/Underground Cable',total: 1142,    delivered: 583,     deliveredPct: '51.05%', inProcessDept: 474,  inProcessApplicant: 10,  pendingBeyondSLA: 0,    rejected: 75,    rejectedPct: '6.57%',  avgDays: '59.00' },
  { slNo: 12, service: 'Permission/Reg. Telecom Tower',               total: 20270,   delivered: 17079,   deliveredPct: '84.26%', inProcessDept: 1371, inProcessApplicant: 105, pendingBeyondSLA: 0,    rejected: 1715,  rejectedPct: '8.46%',  avgDays: '58.99' },
  { slNo: 13, service: 'Providing Employment to Labourers',           total: 152655,  delivered: 151355,  deliveredPct: '99.15%', inProcessDept: 436,  inProcessApplicant: 0,   pendingBeyondSLA: 280,  rejected: 864,   rejectedPct: '0.57%',  avgDays: '0'     },
  { slNo: 14, service: 'Road Cutting Permission',                     total: 267,     delivered: 202,     deliveredPct: '75.66%', inProcessDept: 3,    inProcessApplicant: 7,   pendingBeyondSLA: 1,    rejected: 55,    rejectedPct: '20.60%', avgDays: '23.75' },
  { slNo: 15, service: 'Trade License',                               total: 126601,  delivered: 115794,  deliveredPct: '91.46%', inProcessDept: 1494, inProcessApplicant: 825, pendingBeyondSLA: 191,  rejected: 8488,  rejectedPct: '6.70%',  avgDays: '9.67'  },
];

// ── District data ──────────────────────────────────────────────────────────────
interface DistrictRow extends Record<string, unknown> {
  slNo: number;
  district: string;
  total: number;
}

const DISTRICT_DATA: DistrictRow[] = [
  { slNo: 1,  district: 'Bagalkote',        total: 23015  },
  { slNo: 2,  district: 'Ballari',          total: 258002 },
  { slNo: 3,  district: 'Belagavi',         total: 19522  },
  { slNo: 4,  district: 'Bengaluru',        total: 23884  },
  { slNo: 5,  district: 'Bengaluru Rural',  total: 208598 },
  { slNo: 6,  district: 'Bengaluru South',  total: 250455 },
  { slNo: 7,  district: 'Bidar',            total: 4027   },
  { slNo: 8,  district: 'Chamarajanagara',  total: 37730  },
  { slNo: 9,  district: 'Chikkaballapura',  total: 325347 },
  { slNo: 10, district: 'Chikkamagaluru',   total: 648513 },
  { slNo: 11, district: 'Chitradurga',      total: 18953  },
  { slNo: 12, district: 'Dakshina Kannada', total: 101586 },
  { slNo: 13, district: 'Davanagere',       total: 36182  },
  { slNo: 14, district: 'Dharwar',          total: 5077   },
  { slNo: 15, district: 'Gadag',            total: 87613  },
  { slNo: 16, district: 'Hassan',           total: 231080 },
  { slNo: 17, district: 'Haveri',           total: 19535  },
  { slNo: 18, district: 'Kalaburagi',       total: 10451  },
  { slNo: 19, district: 'Kodagu',           total: 10548  },
  { slNo: 20, district: 'Kolar',            total: 527261 },
  { slNo: 21, district: 'Koppal',           total: 43451  },
  { slNo: 22, district: 'Mandya',           total: 56502  },
  { slNo: 23, district: 'Mysuru',           total: 40489  },
  { slNo: 24, district: 'Raichur',          total: 10110  },
  { slNo: 25, district: 'Shivamogga',       total: 120147 },
  { slNo: 26, district: 'Tumakuru',         total: 147089 },
  { slNo: 27, district: 'Udupi',            total: 62184  },
  { slNo: 28, district: 'Uttara Kannada',   total: 30127  },
  { slNo: 29, district: 'Vijayanagar',      total: 10937  },
  { slNo: 30, district: 'Vijayapura',       total: 23098  },
  { slNo: 31, district: 'Yadgir',           total: 2922   },
];

const GRAND_TOTAL = DISTRICT_DATA.reduce((s, r) => s + r.total, 0);
const SLA_TOTAL = SERVICE_DATA.reduce((s, r) => s + r.pendingBeyondSLA, 0);

// top-N districts + Others bucket for donut
function districtChartData(n = 10) {
  const sorted = [...DISTRICT_DATA].sort((a, b) => b.total - a.total);
  const top = sorted.slice(0, n);
  const othersTotal = sorted.slice(n).reduce((s, r) => s + r.total, 0);
  const result = top.map(r => ({ name: r.district, value: r.total }));
  if (othersTotal > 0) result.push({ name: 'Others', value: othersTotal });
  return result;
}

// top-N services + Others for donut (exclude 0-total rows)
function serviceChartData(n = 10) {
  const sorted = SERVICE_DATA.filter(r => r.total > 0).sort((a, b) => b.total - a.total);
  const top = sorted.slice(0, n);
  const othersTotal = sorted.slice(n).reduce((s, r) => s + r.total, 0);
  const result = top.map(r => ({ name: r.service, value: r.total }));
  if (othersTotal > 0) result.push({ name: 'Others', value: othersTotal });
  return result;
}

const PALETTE = [
  '#6a3e31', // brown-900
  '#8a5446', // brown-700
  '#aa6e5e', // brown-500
  '#c99080', // brown-300
  '#dfc2b9', // brown-200
  '#efe0dc', // brown-100
  '#ff7468', // coral-primary
  '#ff9d97', // coral-light
  '#B0B0B0', // neutral-300
  '#989898', // neutral-400
  '#868686', // neutral-500
  '#727272', // neutral-600
];

type ViewMode = 'pie' | 'bar' | 'map';
type ChartMode = 'pie' | 'bar';

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

function generateDistrictMapData(selectedDistrict: string): Record<string, number> {
  const out: Record<string, number> = {};
  Object.entries(GEO_TO_DISTRICT).forEach(([geoName, distName]) => {
    const row = DISTRICT_DATA.find(r => r.district === distName);
    out[geoName] = selectedDistrict && distName !== selectedDistrict ? -1 : (row?.total ?? 0);
  });
  return out;
}


const TOOLTIP_STYLE = {
  fontFamily: 'Noto Sans',
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
};


// Nivo pie pattern defs — hatch/dot patterns for high-contrast mode
const PIE_HATCH_IDS = ['lines-a', 'dots-a', 'lines-b', 'dots-b', 'lines-c', 'dots-c', 'lines-d', 'dots-d'];
const PIE_HATCH_DEFS = [
  { id: 'lines-a', type: 'patternLines' as const, rotation: -45, lineWidth: 4, spacing: 8,  background: 'inherit', color: 'rgba(255,255,255,0.5)' },
  { id: 'dots-a',  type: 'patternDots'  as const, size: 4,       padding: 4,  stagger: true, background: 'inherit', color: 'rgba(255,255,255,0.5)' },
  { id: 'lines-b', type: 'patternLines' as const, rotation: 45,  lineWidth: 4, spacing: 8,  background: 'inherit', color: 'rgba(255,255,255,0.5)' },
  { id: 'dots-b',  type: 'patternDots'  as const, size: 3,       padding: 6,  stagger: false,background: 'inherit', color: 'rgba(255,255,255,0.5)' },
  { id: 'lines-c', type: 'patternLines' as const, rotation: 0,   lineWidth: 4, spacing: 8,  background: 'inherit', color: 'rgba(255,255,255,0.5)' },
  { id: 'dots-c',  type: 'patternDots'  as const, size: 5,       padding: 3,  stagger: true, background: 'inherit', color: 'rgba(255,255,255,0.5)' },
  { id: 'lines-d', type: 'patternLines' as const, rotation: 90,  lineWidth: 4, spacing: 8,  background: 'inherit', color: 'rgba(255,255,255,0.5)' },
  { id: 'dots-d',  type: 'patternDots'  as const, size: 2,       padding: 5,  stagger: false,background: 'inherit', color: 'rgba(255,255,255,0.5)' },
];

export default function CitizenDashboardScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const highContrast = useHighContrast();
  const [selectedService, setSelectedService] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('bar');
  const [svcViewMode, setSvcViewMode] = useState<ChartMode>('pie');
  const [svcTableSort, setSvcTableSort] = useState<SortFilter>(null);
  const [distSort, setDistSort] = useState<SortFilter>(null);
  const [svcChartSort, setSvcChartSort] = useState<SortFilter>(null);

  const SNAPSHOT = [
    { label: t('citizen_dash_snap_received'),  value: '33,81,021',                              icon: 'assignment'   as const, trend: 'none' as const, changeLabel: t('citizen_dash_label_received')  },
    { label: t('citizen_dash_snap_delivered'), value: '33,30,333',                              icon: 'check_circle' as const, trend: 'none' as const, changeLabel: t('citizen_dash_label_delivered') },
    { label: t('citizen_dash_snap_dept'),      value: '11,630',                                 icon: 'sync'         as const, trend: 'none' as const, changeLabel: t('citizen_dash_label_dept')      },
    { label: t('citizen_dash_snap_applicant'), value: '2,998',                                  icon: 'person'       as const, trend: 'none' as const, changeLabel: t('citizen_dash_label_applicant') },
    { label: t('citizen_dash_snap_rejected'),  value: '36,060',                                 icon: 'cancel'       as const, trend: 'none' as const, changeLabel: t('citizen_dash_label_rejected')  },
    { label: t('citizen_dash_snap_sla'),       value: SLA_TOTAL.toLocaleString('en-IN'),        icon: 'schedule'     as const, trend: 'none' as const, changeLabel: t('citizen_dash_label_sla')       },
  ];

  const serviceOptions = SERVICE_DATA.map(r => r.service);
  const viewOptions = ['Pie Chart', 'Bar Chart'];
  const timeframeOptions = ['Last 30 Days', 'Last Quarter', 'Last Year'];

  // pagination state — service full table
  const [svcPage, setSvcPage] = useState(1);
  const [svcPerPage, setSvcPerPage] = useState(10);
  // pagination state — district table
  const [distPage, setDistPage] = useState(1);
  const [distPerPage, setDistPerPage] = useState(10);
  // pagination state — service summary table
  const [svcSumPage, setSvcSumPage] = useState(1);
  const [svcSumPerPage, setSvcSumPerPage] = useState(10);

  function applySortByTotal<T extends { total: number }>(rows: T[], sort: SortFilter): T[] {
    if (!sort) return rows;
    const sorted = [...rows].sort((a, b) => b.total - a.total);
    return sort === 'top10' ? sorted.slice(0, 10) : sorted.slice(-10).reverse();
  }

  function applySortByValue(rows: { name: string; value: number }[], sort: SortFilter): { name: string; value: number }[] {
    if (!sort) return rows;
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    return sort === 'top10' ? sorted.slice(0, 10) : sorted.slice(-10).reverse();
  }

  // filtered service rows (section 1 table)
  const filteredServices = useMemo(() => {
    let rows = SERVICE_DATA as ServiceRow[];
    if (selectedService) rows = rows.filter(r => r.service === selectedService);
    return applySortByTotal(rows, svcTableSort);
  }, [selectedService, svcTableSort]);

  // filtered district rows (section 2 table)
  const filteredDistricts = useMemo(() => {
    let rows = DISTRICT_DATA as DistrictRow[];
    if (selectedDistrict) rows = rows.filter(r => r.district === selectedDistrict);
    return applySortByTotal(rows, distSort);
  }, [selectedDistrict, distSort]);

  // district names in top/bottom set (for map greying)
  const distSortSet = useMemo<Set<string> | null>(() => {
    if (!distSort) return null;
    const sorted = [...DISTRICT_DATA].sort((a, b) => b.total - a.total);
    const slice = distSort === 'top10' ? sorted.slice(0, 10) : sorted.slice(-10);
    return new Set(slice.map(r => r.district));
  }, [distSort]);

  const distMapData = useMemo(() => {
    const out: Record<string, number> = {};
    Object.entries(GEO_TO_DISTRICT).forEach(([geoName, distName]) => {
      const row = DISTRICT_DATA.find(r => r.district === distName);
      const inSortSet = distSortSet ? distSortSet.has(distName) : true;
      const inDistFilter = !selectedDistrict || distName === selectedDistrict;
      out[geoName] = (!inSortSet || !inDistFilter) ? -1 : (row?.total ?? 0);
    });
    return out;
  }, [selectedDistrict, distSortSet]);

  // district chart data (section 2 bar/donut)
  const distDonutData = useMemo(() => {
    if (selectedDistrict) {
      const row = DISTRICT_DATA.find(r => r.district === selectedDistrict);
      return row ? [{ name: row.district, value: row.total }] : [];
    }
    const base = DISTRICT_DATA.map(r => ({ name: r.district, value: r.total }));
    return applySortByValue(base, distSort);
  }, [selectedDistrict, distSort]);

  // service chart data (section 3 donut/bar)
  const svcDonutData = useMemo(() => {
    if (selectedService) {
      const row = SERVICE_DATA.find(r => r.service === selectedService);
      return row ? [{ name: row.service, value: row.total }] : [];
    }
    const base = SERVICE_DATA.filter(r => r.total > 0).map(r => ({ name: r.service, value: r.total }));
    return applySortByValue(base, svcChartSort);
  }, [selectedService, svcChartSort]);

  const isBar = viewMode === 'bar';
  const isMap = viewMode === 'map';
  const isSvcBar = svcViewMode === 'bar';

  // paged slices
  const pagedServices    = filteredServices.slice((svcPage - 1) * svcPerPage, svcPage * svcPerPage);
  const pagedDistricts   = filteredDistricts.slice((distPage - 1) * distPerPage, distPage * distPerPage);
  const svcSumRows       = filteredServices.map(r => ({ slNo: r.slNo, service: r.service, total: r.total }));
  const pagedSvcSum      = svcSumRows.slice((svcSumPage - 1) * svcSumPerPage, svcSumPage * svcSumPerPage);

  // ── Live narrator registration ───────────────────────────────────────────────
  useEffect(() => {
    const snap = {
      totalReceived:       3381021,
      totalDelivered:      3330333,
      inProcessDept:       11630,
      inProcessApplicant:  2998,
      rejected:            36060,
      pendingSLA:          SLA_TOTAL,
    };
    registerPageNarrator('/citizen/dashboard', () =>
      buildCitizenDashboardNarrative(distDonutData, svcDonutData, snap)
    );
    return () => unregisterPageNarrator('/citizen/dashboard');
  }, [distDonutData, svcDonutData]);

  // ── table columns ────────────────────────────────────────────────────────────
  const SERVICE_COLS = [
    { key: 'slNo',              label: 'Sr.',             width: 'w-[50px] shrink-0' },
    { key: 'service',           label: 'Service',         width: 'flex-1 min-w-0' },
    { key: 'total',             label: 'Total',           width: 'w-[90px] shrink-0' },
    { key: 'delivered',         label: 'Delivered',       width: 'w-[100px] shrink-0' },
    { key: 'deliveredPct',      label: 'Delivered %',     width: 'w-[100px] shrink-0' },
    { key: 'inProcessDept',     label: 'In Process (Dept)', width: 'w-[120px] shrink-0' },
    { key: 'inProcessApplicant',label: 'In Process (Applicant)', width: 'w-[140px] shrink-0' },
    { key: 'pendingBeyondSLA',  label: 'Pending > SLA',   width: 'w-[110px] shrink-0' },
    { key: 'rejected',          label: 'Rejected',        width: 'w-[90px] shrink-0' },
    { key: 'rejectedPct',       label: 'Rejected %',      width: 'w-[100px] shrink-0' },
    { key: 'avgDays',           label: 'Avg Days',        width: 'w-[85px] shrink-0' },
  ];

  const DISTRICT_COLS = [
    { key: 'slNo',     label: 'Sr.',     width: 'w-[60px] shrink-0' },
    { key: 'district', label: 'District',width: 'flex-1 min-w-0' },
    { key: 'total',    label: 'Total Applications', width: 'w-[180px] shrink-0' },
  ];

  return (
    <ScaleToFit>
    <div className="flex flex-col min-h-screen w-full bg-white">
      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar version="home-page-nav-menu" />

      {/* Back + breadcrumb */}
      <div className="px-[200px] pt-[32px] flex items-center justify-between">
        <GoBackToPreviousPage label="Back to Citizen Services" onClick={() => navigate('/citizen')} />
        <Breadcrumb level={3} items={['Home', 'Citizen Services', 'Dashboard']} />
      </div>

      <div className="px-[200px] pt-[20px]">
        <SectionTopper
          variant="variant3"
          heading={t('citizen_dash_heading')}
          subheading={t('citizen_dash_subheading')}
          illustration="/Illustrations/citizen.svg"
          className="rounded-[10px]"
        />
      </div>

      {/* ── Snapshot cards ──────────────────────────────────────────────────── */}
      <div className="px-[200px] pt-[24px] pb-[8px]">
        <div className="flex gap-[20px] w-full">
          {SNAPSHOT.map(s => (
            <DashboardMetricCard
              key={s.label}
              icon={s.icon}
              label={s.label}
              primaryValue={s.value}
              trend={s.trend}
              changeLabel={s.changeLabel}
              className="flex-1 w-auto"
            />
          ))}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="px-[200px] pt-[60px]">
        <div className="flex gap-[20px] items-end w-full">
          <DropdownField
            label={t('citizen_dash_filter_service')}
            placeholder={t('citizen_dash_all_services')}
            value={selectedService}
            onChange={v => setSelectedService(v)}
            options={serviceOptions}
            showAll
            allLabel={t('citizen_dash_all_services')}
            className="flex-1"
          />
          <DropdownField
            label={t('citizen_dash_filter_district')}
            placeholder={t('citizen_dash_all_districts')}
            value={selectedDistrict}
            onChange={v => setSelectedDistrict(v)}
            options={DISTRICTS}
            showAll
            allLabel={t('citizen_dash_all_districts')}
            className="flex-1"
          />
          <DropdownField
            label="Timeframe"
            placeholder="All Time"
            value={selectedTimeframe}
            onChange={v => setSelectedTimeframe(v)}
            options={timeframeOptions}
            showAll
            allLabel="All Time"
            className="flex-1"
          />
        </div>
      </div>


      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div id="main-content" role="main" tabIndex={-1} className="flex flex-col gap-[64px] px-[200px] pt-[32px] pb-[60px] w-full">
        <h1 className="sr-only">Service Applications Overview</h1>

        {/* ── SECTION 1: Service-wise table ──────────────────────────────────── */}
        <div id="sec-services" className="bg-white border border-[#c6c6c6] rounded-[10px] w-full overflow-hidden">
          <SectionHeading variant="with-box" text={t('citizen_dash_sec_all_services')} fullWidth className="border-b border-[#c6c6c6]" />
          {/* Sort pills toolbar */}
          <div className="flex items-center justify-end px-[20px] pt-[12px] pb-[12px] border-b border-[#c6c6c6]">
            <div className="flex items-center gap-[8px]">
              <FilterPill label="All"        variant="grey"  active={svcTableSort === null}       onClick={() => setSvcTableSort(null)} />
              <FilterPill label="Top 10"    variant="green" active={svcTableSort === 'top10'}    onClick={() => setSvcTableSort(svcTableSort === 'top10'    ? null : 'top10')} />
              <FilterPill label="Bottom 10" variant="red"   active={svcTableSort === 'bottom10'} onClick={() => setSvcTableSort(svcTableSort === 'bottom10' ? null : 'bottom10')} />
            </div>
          </div>
          <div className="p-[20px] flex flex-col gap-[16px]">
            <div className="overflow-x-auto">
              <Table
                columns={SERVICE_COLS}
                rows={pagedServices as Record<string, unknown>[]}
                className="min-w-[1100px]"
              />
            </div>
            <Pagination
              currentPage={svcPage}
              totalPages={Math.ceil(filteredServices.length / svcPerPage)}
              totalItems={filteredServices.length}
              itemsPerPage={svcPerPage}
              onPageChange={setSvcPage}
              onItemsPerPageChange={n => { setSvcPerPage(n); setSvcPage(1); }}
            />
          </div>
          <div className="flex justify-center gap-[16px] py-[20px] border-t border-[#c6c6c6]">
            <Button variant="filled" iconPlacement="left" iconName="download" text={t('btn_download')} />
            <Button variant="filled" iconPlacement="left" iconName="share"    text={t('btn_share')} />
          </div>
        </div>

        {/* ── SECTION 2: District-wise chart + table ─────────────────────────── */}
        <div id="sec-districts" className="bg-white border border-[#c6c6c6] rounded-[10px] w-full overflow-hidden">
          <SectionHeading variant="with-box" text={t('citizen_dash_sec_district')} fullWidth className="border-b border-[#c6c6c6]" />
          {/* Toggle + sort pills toolbar */}
          <div className="flex items-center justify-between px-[20px] pt-[14px] pb-[14px] border-b border-[#c6c6c6]">
            <div className="flex items-center">
              <button type="button" onClick={() => setViewMode('bar')}
                className={`flex items-center gap-[8px] px-[20px] py-[8px] border border-[#b0b0b0] rounded-tl-[8px] rounded-bl-[8px] border-r-0 text-[13px] font-medium cursor-pointer transition-colors ${isBar ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}>
                <Icon name="bar_chart" size="small" color={isBar ? '#6a3e31' : '#727272'} />{t('citizen_dash_toggle_bar')}
              </button>
              <button type="button" onClick={() => setViewMode('pie')}
                className={`flex items-center gap-[8px] px-[20px] py-[8px] border border-[#b0b0b0] border-r-0 text-[13px] font-medium cursor-pointer transition-colors ${viewMode === 'pie' ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}>
                <Icon name="donut_large" size="small" color={viewMode === 'pie' ? '#6a3e31' : '#727272'} />{t('citizen_dash_toggle_donut')}
              </button>
              <button type="button" onClick={() => setViewMode('map')}
                className={`flex items-center gap-[8px] px-[20px] py-[8px] border border-[#b0b0b0] rounded-tr-[8px] rounded-br-[8px] text-[13px] font-medium cursor-pointer transition-colors ${isMap ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}>
                <Icon name="map" size="small" color={isMap ? '#6a3e31' : '#727272'} />{t('citizen_dash_toggle_map')}
              </button>
            </div>
            <div className="flex items-center gap-[8px]">
              <FilterPill label="All"        variant="grey"  active={distSort === null}       onClick={() => setDistSort(null)} />
              <FilterPill label="Top 10"    variant="green" active={distSort === 'top10'}    onClick={() => setDistSort(distSort === 'top10'    ? null : 'top10')} />
              <FilterPill label="Bottom 10" variant="red"   active={distSort === 'bottom10'} onClick={() => setDistSort(distSort === 'bottom10' ? null : 'bottom10')} />
            </div>
          </div>
          <div className="p-[24px]">
            {isBar ? (
              <div role="img" aria-label="Bar chart showing district-wise application volumes across Karnataka" style={{ width: '100%', height: 420 }}>
                <ResponsiveBar
                  data={distDonutData.map(d => ({ id: d.name, value: d.value }))}
                  keys={['value']}
                  indexBy="id"
                  margin={{ top: 16, right: 20, bottom: 120, left: 80 }}
                  padding={0.3}
                  colors={makeIndexedBarColors(PALETTE)}
                  layers={[PatternDefsLayer, 'grid', 'axes', 'bars', 'markers', 'legends', 'annotations']}

                  borderRadius={4}
                  axisBottom={{ tickRotation: -35, tickSize: 0, tickPadding: 8 }}
                  axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  enableLabel={false}
                  enableGridX={false}
                  gridYValues={5}
                  motionConfig="gentle"
                  tooltip={({ id: _id, value, indexValue }) => (
                    <div style={{ background: 'white', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontFamily: 'Noto Sans', fontSize: 12, color: '#212121' }}>
                      <strong>{indexValue}</strong>: {(value as number).toLocaleString('en-IN')}
                    </div>
                  )}
                  theme={{
                    axis: { ticks: { text: { fontFamily: 'Noto Sans', fontSize: 11, fill: '#525c66' } } },
                    grid: { line: { stroke: '#f0f0f0' } },
                  }}
                />
              </div>
            ) : isMap ? (
              <div role="img" aria-label="Choropleth map of Karnataka showing district-wise application density" className="flex flex-col items-center gap-[12px]">
                <KarnatakaLeafletMap gpData={distMapData} width={700} height={580} valueLabel="Total Applications" showTalukCount={false} />
                <MapLegend lowLabel={t('citizen_dash_map_low')} highLabel={t('citizen_dash_map_high')} />
                <p className="text-[12px] text-[#727272] text-center" style={NS}>{t('citizen_dash_map_hint')}</p>
              </div>
            ) : (
              <div className="flex gap-[50px] items-center justify-center">
                <div role="img" aria-label="Donut chart showing district-wise share of total applications" className="shrink-0" style={{ width: 420, height: 420 }}>
                  <ResponsivePie
                    data={distDonutData.map((d, i) => ({ id: d.name, label: d.name, value: d.value, color: PALETTE[i % PALETTE.length] }))}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.55}
                    padAngle={0.8}
                    cornerRadius={3}
                    activeOuterRadiusOffset={14}
                    colors={{ datum: 'data.color' }}
                    defs={PIE_HATCH_DEFS}
                    fill={highContrast ? distDonutData.map((d, i) => ({ match: { id: d.name }, id: PIE_HATCH_IDS[i % PIE_HATCH_IDS.length] })) : []}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    tooltip={({ datum }) => (
                      <div style={{ background: 'white', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontFamily: 'Noto Sans', fontSize: 12, color: '#212121' }}>
                        <strong>{datum.label}</strong>: {datum.value.toLocaleString('en-IN')}
                      </div>
                    )}
                    motionConfig="gentle"
                  />
                </div>
                <div className="flex flex-col gap-[8px] w-[280px] shrink-0 overflow-y-auto max-h-[400px]">
                  {distDonutData.map((d, i) => {
                    const pct = ((d.value / GRAND_TOTAL) * 100).toFixed(1);
                    return (
                      <div key={d.name} className="flex items-center gap-[8px]">
                        <div className="size-[10px] rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="text-[12px] text-[#525c66] flex-1 truncate" style={NS}>{d.name}</span>
                        <span className="text-[12px] font-semibold text-[#212121] shrink-0" style={NS}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-[#c6c6c6] p-[20px] flex flex-col gap-[16px]">
            <Table columns={DISTRICT_COLS} rows={pagedDistricts as Record<string, unknown>[]} />
            <Pagination
              currentPage={distPage}
              totalPages={Math.ceil(filteredDistricts.length / distPerPage)}
              totalItems={filteredDistricts.length}
              itemsPerPage={distPerPage}
              onPageChange={setDistPage}
              onItemsPerPageChange={n => { setDistPerPage(n); setDistPage(1); }}
            />
          </div>
          <div className="flex justify-center gap-[16px] py-[20px] border-t border-[#c6c6c6]">
            <Button variant="filled" iconPlacement="left" iconName="download" text={t('btn_download')} />
            <Button variant="filled" iconPlacement="left" iconName="share"    text={t('btn_share')} />
          </div>
        </div>

        {/* ── SECTION 3: Service-wise chart + table ─────────────────────────── */}
        <div id="sec-service-wise" className="bg-white border border-[#c6c6c6] rounded-[10px] w-full overflow-hidden">
          <SectionHeading variant="with-box" text={t('citizen_dash_sec_service')} fullWidth className="border-b border-[#c6c6c6]" />
          {/* Toggle + sort pills toolbar */}
          <div className="flex items-center justify-between px-[20px] pt-[14px] pb-[14px] border-b border-[#c6c6c6]">
            <div className="flex items-center">
              <button type="button" onClick={() => setSvcViewMode('pie')}
                className={`flex items-center gap-[8px] px-[20px] py-[8px] border border-[#b0b0b0] rounded-tl-[8px] rounded-bl-[8px] border-r-0 text-[13px] font-medium cursor-pointer transition-colors ${svcViewMode === 'pie' ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}>
                <Icon name="donut_large" size="small" color={svcViewMode === 'pie' ? '#6a3e31' : '#727272'} />{t('citizen_dash_toggle_donut')}
              </button>
              <button type="button" onClick={() => setSvcViewMode('bar')}
                className={`flex items-center gap-[8px] px-[20px] py-[8px] border border-[#b0b0b0] rounded-tr-[8px] rounded-br-[8px] text-[13px] font-medium cursor-pointer transition-colors ${isSvcBar ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}>
                <Icon name="bar_chart" size="small" color={isSvcBar ? '#6a3e31' : '#727272'} />{t('citizen_dash_toggle_bar')}
              </button>
            </div>
            <div className="flex items-center gap-[8px]">
              <FilterPill label="All"        variant="grey"  active={svcChartSort === null}       onClick={() => setSvcChartSort(null)} />
              <FilterPill label="Top 10"    variant="green" active={svcChartSort === 'top10'}    onClick={() => setSvcChartSort(svcChartSort === 'top10'    ? null : 'top10')} />
              <FilterPill label="Bottom 10" variant="red"   active={svcChartSort === 'bottom10'} onClick={() => setSvcChartSort(svcChartSort === 'bottom10' ? null : 'bottom10')} />
            </div>
          </div>
          <div className="p-[24px]">
            {!isSvcBar ? (
              <div className="flex gap-[50px] items-center justify-center">
                <div role="img" aria-label="Donut chart showing service-wise share of total applications" className="shrink-0" style={{ width: 420, height: 420 }}>
                  <ResponsivePie
                    data={svcDonutData.map((d, i) => ({ id: d.name, label: d.name, value: d.value, color: PALETTE[i % PALETTE.length] }))}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.55}
                    padAngle={0.8}
                    cornerRadius={3}
                    activeOuterRadiusOffset={14}
                    colors={{ datum: 'data.color' }}
                    defs={PIE_HATCH_DEFS}
                    fill={highContrast ? svcDonutData.map((d, i) => ({ match: { id: d.name }, id: PIE_HATCH_IDS[i % PIE_HATCH_IDS.length] })) : []}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    tooltip={({ datum }) => (
                      <div style={{ background: 'white', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontFamily: 'Noto Sans', fontSize: 12, color: '#212121' }}>
                        <strong>{datum.label}</strong>: {datum.value.toLocaleString('en-IN')}
                      </div>
                    )}
                    motionConfig="gentle"
                  />
                </div>
                <div className="flex flex-col gap-[8px] w-[300px] shrink-0 overflow-y-auto max-h-[400px]">
                  {svcDonutData.map((d, i) => {
                    const pct = ((d.value / GRAND_TOTAL) * 100).toFixed(1);
                    return (
                      <div key={d.name} className="flex items-center gap-[8px]">
                        <div className="size-[10px] rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="text-[12px] text-[#525c66] flex-1 min-w-0 leading-snug" style={NS}>{d.name}</span>
                        <span className="text-[12px] font-semibold text-[#212121] shrink-0" style={NS}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div role="img" aria-label="Bar chart showing service-wise application volumes across Karnataka" style={{ width: '100%', height: 480 }}>
                <ResponsiveBar
                  data={svcDonutData.map(d => ({ id: d.name, value: d.value }))}
                  keys={['value']}
                  indexBy="id"
                  margin={{ top: 16, right: 20, bottom: 160, left: 80 }}
                  padding={0.3}
                  colors={makeIndexedBarColors(PALETTE)}
                  layers={[PatternDefsLayer, 'grid', 'axes', 'bars', 'markers', 'legends', 'annotations']}
                  borderRadius={4}
                  axisBottom={{ tickRotation: -40, tickSize: 0, tickPadding: 8 }}
                  axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  enableLabel={false}
                  enableGridX={false}
                  gridYValues={5}
                  motionConfig="gentle"
                  tooltip={({ id: _id, value, indexValue }) => (
                    <div style={{ background: 'white', padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontFamily: 'Noto Sans', fontSize: 12, color: '#212121' }}>
                      <strong>{indexValue}</strong>: {(value as number).toLocaleString('en-IN')}
                    </div>
                  )}
                  theme={{
                    axis: { ticks: { text: { fontFamily: 'Noto Sans', fontSize: 11, fill: '#525c66' } } },
                    grid: { line: { stroke: '#f0f0f0' } },
                  }}
                />
              </div>
            )}
          </div>
          <div className="border-t border-[#c6c6c6] p-[20px] flex flex-col gap-[16px]">
            <Table
              columns={[
                { key: 'slNo',    label: 'Sr.',     width: 'w-[50px] shrink-0' },
                { key: 'service', label: 'Service', width: 'flex-1 min-w-0' },
                { key: 'total',   label: 'Total Applications', width: 'w-[180px] shrink-0' },
              ]}
              rows={pagedSvcSum as Record<string, unknown>[]}
            />
            <Pagination
              currentPage={svcSumPage}
              totalPages={Math.ceil(svcSumRows.length / svcSumPerPage)}
              totalItems={svcSumRows.length}
              itemsPerPage={svcSumPerPage}
              onPageChange={setSvcSumPage}
              onItemsPerPageChange={n => { setSvcSumPerPage(n); setSvcSumPage(1); }}
            />
          </div>
          <div className="flex justify-center gap-[16px] py-[20px] border-t border-[#c6c6c6]">
            <Button variant="filled" iconPlacement="left" iconName="download" text={t('btn_download')} />
            <Button variant="filled" iconPlacement="left" iconName="share"    text={t('btn_share')} />
          </div>
        </div>

      </div>

      <AppDownloadCTA variant="cta-option-2" />
      <Footer variant="dark" />
      <AccessibilityFab />
    </div>
    </ScaleToFit>
  );
}
