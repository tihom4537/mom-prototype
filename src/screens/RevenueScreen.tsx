import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ResponsiveBar } from '@nivo/bar';
import AccessibilityBar from '../components/AccessibilityBar';
import Navbar from '../components/Navbar';
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
import { DISTRICTS, KARNATAKA_HIERARCHY } from '../data/karnatakaData';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const REVENUE_ILLUS = '/Illustrations/revenue.svg';

const ALL_MODULES = [
  {
    id: 'finance',
    title: 'Finance and Accounting',
    description: 'Access income, expenditure, budget allocations, and fund utilisation records for any Gram Panchayat.',
    illustration: '/Illustrations/finance.svg',
    route: '/finance',
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

export const REVENUE_REPORT_TYPES = [
  'DCB Register Report',
  'Demand Statistics',
  'Report On Type Properties Statistics',
  'Report on Property and Other Taxes, Fees',
];

const FIN_YEARS = ['2025-26', '2024-25', '2023-24', '2022-23'];

// ── DCB Register Report — FY 2024-25 real data from RDPR portal ──────────────
// Amounts stored as full rupees. Display: Indian comma format (toLocaleString en-IN).
interface DcbRow extends Record<string, unknown> {
  slNo: number;
  district: string;
  numGPs: number;
  arrears: number;
  yearDemand: number;
  totalDemand: number;
  totalCollection: number;
  balance: number;
}

const DCB_DATA: DcbRow[] = [
  { slNo: 1,  district: 'Bagalkote',        numGPs: 196, arrears:  7351049140, yearDemand:  3020274892, totalDemand: 10371324032, totalCollection:  2720206606, balance:  7647908974 },
  { slNo: 2,  district: 'Bengaluru',        numGPs:  85, arrears: 53507617867, yearDemand: 39502795794, totalDemand: 93010413661, totalCollection: 29873465862, balance: 62914316548 },
  { slNo: 3,  district: 'Bengaluru Rural',  numGPs: 107, arrears: 14521899022, yearDemand: 13716426832, totalDemand: 28238325854, totalCollection: 12242929278, balance: 15936233352 },
  { slNo: 4,  district: 'Belagavi',         numGPs: 497, arrears: 23602251625, yearDemand: 10127931744, totalDemand: 33730183369, totalCollection:  8446240609, balance: 25283942760 },
  { slNo: 5,  district: 'Ballari',          numGPs: 100, arrears:  1644983340, yearDemand:  1399953205, totalDemand:  3044936545, totalCollection:  1075608651, balance:  1967182161 },
  { slNo: 6,  district: 'Bidar',            numGPs: 181, arrears:  6961867713, yearDemand:  2017612861, totalDemand:  8979480574, totalCollection:  1421342490, balance:  7557504241 },
  { slNo: 7,  district: 'Vijayapura',       numGPs: 211, arrears:  9711551958, yearDemand:  3808379018, totalDemand: 13519930976, totalCollection:  2665437289, balance: 10854248083 },
  { slNo: 8,  district: 'Chamarajanagara',  numGPs: 130, arrears:  4239272754, yearDemand:  1866903076, totalDemand:  6106175830, totalCollection:  1286375284, balance:  4818665593 },
  { slNo: 9,  district: 'Chikkamagaluru',   numGPs: 226, arrears:  3733435926, yearDemand:  3064630091, totalDemand:  6798066017, totalCollection:  3345916147, balance:  3441860090 },
  { slNo: 10, district: 'Chitradurga',      numGPs: 189, arrears: 10669422056, yearDemand:  3597639011, totalDemand: 14267061067, totalCollection:  2712106527, balance: 11551515130 },
  { slNo: 11, district: 'Dakshina Kannada', numGPs: 223, arrears:  1369849094, yearDemand:  4155217678, totalDemand:  5525066772, totalCollection:  4333592682, balance:  1166228182 },
  { slNo: 12, district: 'Davanagere',       numGPs: 194, arrears:  5322494394, yearDemand:  3313307391, totalDemand:  8635801785, totalCollection:  2791782592, balance:  5841675059 },
  { slNo: 13, district: 'Dharwar',          numGPs: 146, arrears:  4155383943, yearDemand:  2346142246, totalDemand:  6501526189, totalCollection:  2006619574, balance:  4490282464 },
  { slNo: 14, district: 'Gadag',            numGPs: 122, arrears:  4701600018, yearDemand:  1498986485, totalDemand:  6200586503, totalCollection:  1397468115, balance:  4801990766 },
  { slNo: 15, district: 'Kalaburagi',       numGPs: 261, arrears: 11143626582, yearDemand:  3665285277, totalDemand: 14808911859, totalCollection:  2588879845, balance: 12221783394 },
  { slNo: 16, district: 'Hassan',           numGPs: 264, arrears:  6636487380, yearDemand:  4494745316, totalDemand: 11131232696, totalCollection:  3278620373, balance:  7845028334 },
  { slNo: 17, district: 'Haveri',           numGPs: 223, arrears:  9992755267, yearDemand:  3701767410, totalDemand: 13694522677, totalCollection:  2945352574, balance: 10747672169 },
  { slNo: 18, district: 'Kodagu',           numGPs: 102, arrears:  1371462997, yearDemand:  1538409553, totalDemand:  2909872550, totalCollection:  1489081389, balance:  1414170844 },
  { slNo: 19, district: 'Kolar',            numGPs: 154, arrears:  6541131188, yearDemand:  4769601354, totalDemand: 11310732542, totalCollection:  4254306056, balance:  7047889602 },
  { slNo: 20, district: 'Koppal',           numGPs: 152, arrears:  4142676729, yearDemand:  2008337485, totalDemand:  6151014214, totalCollection:  1429921652, balance:  4718910315 },
  { slNo: 21, district: 'Mandya',           numGPs: 231, arrears: 13947071754, yearDemand:  5748604511, totalDemand: 19695676265, totalCollection:  3968992578, balance: 15716646474 },
  { slNo: 22, district: 'Mysuru',           numGPs: 255, arrears:  6688254935, yearDemand:  7520818329, totalDemand: 14209073264, totalCollection:  5297363838, balance:  8895882186 },
  { slNo: 23, district: 'Raichur',          numGPs: 179, arrears:  2575585704, yearDemand:  1593809084, totalDemand:  4169394788, totalCollection:  1650005746, balance:  2516897294 },
  { slNo: 24, district: 'Shivamogga',       numGPs: 262, arrears:  2813767309, yearDemand:  2636697918, totalDemand:  5450465227, totalCollection:  2823289188, balance:  2622056180 },
  { slNo: 25, district: 'Tumakuru',         numGPs: 330, arrears: 13611679232, yearDemand:  7013666115, totalDemand: 20625345347, totalCollection:  4624512806, balance: 15983191082 },
  { slNo: 26, district: 'Udupi',            numGPs: 155, arrears:  1317401984, yearDemand:  3658569379, totalDemand:  4975971363, totalCollection:  3866515319, balance:  1082359376 },
  { slNo: 27, district: 'Uttara Kannada',   numGPs: 229, arrears:   507240935, yearDemand:  1756343141, totalDemand:  2263584076, totalCollection:  1895466641, balance:   365385843 },
  { slNo: 28, district: 'Chikkaballapura',  numGPs: 154, arrears:  6457644520, yearDemand:  2915200370, totalDemand:  9372844890, totalCollection:  2452936634, balance:  6912138180 },
  { slNo: 29, district: 'Bengaluru South',  numGPs: 120, arrears:  7607174040, yearDemand:  5796381546, totalDemand: 13403555586, totalCollection:  5443730556, balance:  7896394225 },
  { slNo: 30, district: 'Yadgir',           numGPs: 121, arrears:  3042082272, yearDemand:  1737739465, totalDemand:  4779821737, totalCollection:   852162970, balance:  3927228843 },
  { slNo: 31, district: 'Vijayanagar',      numGPs: 137, arrears:  5801376384, yearDemand:  2702287216, totalDemand:  8503663600, totalCollection:  1323158028, balance:  7179628664 },
];

function fmtCr(rupees: number): string {
  return '₹' + rupees.toLocaleString('en-IN');
}

// Legacy alias used by map (uses totalCollection for choropleth intensity)
interface RevenueRow extends Record<string, unknown> {
  slNo: number;
  district: string;
  numGPs: number;
  arrears: number;
  yearDemand: number;
  totalDemand: number;
  totalCollection: number;
  balance: number;
}
const REVENUE_DATA: RevenueRow[] = DCB_DATA;

function generateTableData(district: string, taluk: string): RevenueRow[] {
  const base = district
    ? REVENUE_DATA.filter(r => r.district === district)
    : REVENUE_DATA;

  if (taluk && district) {
    return base.map((r, i) => {
      const numTaluks = Object.keys(KARNATAKA_HIERARCHY[r.district] ?? {}).length || 1;
      const td = Math.round(r.totalDemand / numTaluks);
      const col = Math.round(r.totalCollection / numTaluks);
      const arr = Math.round(r.arrears / numTaluks);
      const yd = Math.round(r.yearDemand / numTaluks);
      return {
        slNo: i + 1,
        district: `${r.district} / ${taluk}`,
        numGPs: Math.round(r.numGPs / numTaluks),
        arrears: arr,
        yearDemand: yd,
        totalDemand: td,
        totalCollection: col,
        balance: td - col,
      };
    });
  }
  return base;
}

function generateDistrictTooltipData(): Record<string, { total: number; completed: number }> {
  const out: Record<string, { total: number; completed: number }> = {};
  Object.entries(GEO_TO_DISTRICT).forEach(([geoName, distName]) => {
    const row = REVENUE_DATA.find(r => r.district === distName);
    if (row) out[geoName] = { total: Math.round((row.totalDemand as number) / 1e5), completed: Math.round((row.totalCollection as number) / 1e5) };
  });
  return out;
}

function generateMapData(selectedDistrict: string): Record<string, number> {
  const out: Record<string, number> = {};
  Object.entries(GEO_TO_DISTRICT).forEach(([geoName, distName]) => {
    const row = REVENUE_DATA.find(r => r.district === distName);
    if (selectedDistrict && distName !== selectedDistrict) {
      out[geoName] = -1;
    } else {
      out[geoName] = row?.totalCollection ?? 0;
    }
  });
  return out;
}

type ViewMode = 'table' | 'chart' | 'map';

// ── Taluk Grid (same pattern as Finance) ─────────────────────────────────────
interface TalukGridProps {
  district: string;
  selectedTaluk: string;
  selectedGp: string;
  districtRow?: RevenueRow;
  hierarchy: Record<string, string[]>;
  onTalukClick: (taluk: string) => void;
  onGpClick: (taluk: string, gp: string) => void;
  onBack: () => void;
}

function TalukGrid({ district, selectedTaluk, selectedGp, districtRow, hierarchy, onTalukClick, onGpClick, onBack }: TalukGridProps) {
  const { t } = useLanguage();
  const taluks = Object.keys(hierarchy);
  const numTaluks = taluks.length || 1;
  const totalDemand = districtRow?.totalDemand ?? 0;
  const collected = districtRow?.totalCollection ?? 0;
  const distPct = totalDemand > 0 ? ((collected / totalDemand) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col gap-[16px] w-full">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-[16px]">
          <span className="text-[12px] text-[#525c66]" style={NS}>
            {t('revenue_taluk_total_demand')} <strong>{fmtCr(totalDemand)}</strong>
          </span>
          <span className="text-[12px] text-[#525c66]" style={NS}>
            {t('revenue_taluk_collected')} <strong>{fmtCr(collected)}</strong>
          </span>
          <span className="text-[12px] font-semibold text-[#6a3e31]" style={NS}>
            {distPct}% {t('finance_taluk_complete')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[12px] w-full">
        {taluks.map(talukName => {
          const gpList = hierarchy[talukName] ?? [];
          const talukDemand = Math.round(totalDemand / numTaluks);
          const talukCollected = Math.round(collected / numTaluks);
          const talukPct = talukDemand > 0 ? ((talukCollected / talukDemand) * 100).toFixed(0) : '0';
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

              <div className="h-[4px] w-full bg-[#efe0dc] rounded-full overflow-hidden">
                <div className="h-full bg-[#6a3e31] rounded-full transition-all" style={{ width: `${talukPct}%` }} />
              </div>

              <span className="text-[11px] text-[#727272]" style={NS}>
                {fmtCr(talukCollected)} / {fmtCr(talukDemand)} {t('revenue_taluk_collected_of')}
              </span>

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
                        <Icon name="place" size="small" color={isSelectedGp ? '#fff' : '#c99080'} className="shrink-0" />
                        <span className="truncate">{g}</span>
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
          <span className="text-[13px] font-medium text-[#6a3e31]" style={NS}>{selectedGp}</span>
          <span className="text-[12px] text-[#525c66]" style={NS}>— {t('revenue_gp_data_note')}</span>
        </div>
      )}
    </div>
  );
}

export default function RevenueScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [zilla, setZilla] = useState('');
  const [taluk, setTaluk] = useState('');
  const [gp, setGp] = useState('');
  const [reportType, setReportType] = useState('DCB Register Report');
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [view, setView] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [moduleSlide, setModuleSlide] = useState(0);

  const tableData = useMemo(() => generateTableData(zilla, taluk), [zilla, taluk]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return tableData;
    const q = search.toLowerCase();
    return tableData.filter(r => String(r.district).toLowerCase().includes(q));
  }, [tableData, search]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pagedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const chartData = useMemo(
    () => filteredData.map(r => {
      const demand    = Math.round((r.totalDemand as number) / 1e5);
      const collected = Math.round((r.totalCollection as number) / 1e5);
      return {
        district:      String(r.district).length > 10 ? String(r.district).slice(0, 10) + '…' : String(r.district),
        'Collected':   collected,
        'Outstanding': Math.max(0, demand - collected),
      };
    }),
    [filteredData]
  );

  const mapData = useMemo(() => generateMapData(zilla), [zilla]);
  const districtTooltipData = useMemo(() => generateDistrictTooltipData(), []);

  const talukOptions = zilla ? Object.keys(KARNATAKA_HIERARCHY[zilla] ?? {}) : [];
  const gpOptions = (zilla && taluk) ? (KARNATAKA_HIERARCHY[zilla]?.[taluk] ?? []) : [];

  const pillParts = [
    zilla || t('finance_taluk_all_districts'),
    ...(taluk ? [taluk] : []),
    ...(gp ? [gp] : []),
    reportType,
    financialYear,
  ];

  const otherModules = ALL_MODULES.filter(m => m.id !== 'revenue');
  const visibleModules = otherModules.slice(moduleSlide, moduleSlide + 3);
  const canPrev = moduleSlide > 0;
  const canNext = moduleSlide + 3 < otherModules.length;

  const TABLE_COLUMNS = [
    { key: 'slNo',            label: t('revenue_col_sl_no'),          width: 'w-[60px] shrink-0' },
    { key: 'district',        label: t('revenue_col_district'),       width: 'flex-1 min-w-0' },
    { key: 'numGPs',          label: 'No. of GPs',                    width: 'w-[110px] shrink-0' },
    { key: 'arrears',         label: 'Arrears (₹)',                   width: 'w-[150px] shrink-0',
      render: (v: unknown) => fmtCr(v as number) },
    { key: 'yearDemand',      label: 'Year Demand (₹)',               width: 'w-[150px] shrink-0',
      render: (v: unknown) => fmtCr(v as number) },
    { key: 'totalDemand',     label: 'Total Demand (₹)',              width: 'w-[150px] shrink-0',
      render: (v: unknown) => fmtCr(v as number) },
    { key: 'totalCollection', label: 'Total Collection (₹)',          width: 'w-[160px] shrink-0',
      render: (v: unknown) => fmtCr(v as number) },
    { key: 'balance',         label: 'Balance (₹)',                   width: 'w-[150px] shrink-0',
      render: (v: unknown) => fmtCr(v as number) },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar version="home-page-nav-menu" />

      {/* Back nav + breadcrumb */}
      <div className="px-[200px] pt-[32px] flex items-center justify-between">
        <GoBackToPreviousPage label={t('revenue_back_to_home')} onClick={() => navigate('/homepage')} />
        <Breadcrumb level={3} items={[t('finance_breadcrumb_home'), t('finance_breadcrumb_modules'), t('revenue_breadcrumb_revenue')]} />
      </div>

      {/* SectionTopper */}
      <div className="px-[200px] pt-[20px]">
        <SectionTopper
          variant="variant3"
          heading={t('revenue_section_heading')}
          subheading={t('revenue_section_subheading')}
          illustration={REVENUE_ILLUS}
          className="rounded-[10px]"
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-[24px] px-[200px] pt-[40px] pb-[50px] w-full">

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

        {/* Filter row 2: Report Type + Financial Year + Search CTA */}
        <div className="flex gap-[20px] items-end w-full">
          <DropdownField
            label={t('revenue_label_report_type')}
            placeholder={t('finance_placeholder_select')}
            value={reportType}
            onChange={v => { setReportType(v); setPage(1); }}
            options={REVENUE_REPORT_TYPES}
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

        {/* Data card */}
        <div className="bg-white border border-[#c6c6c6] rounded-[10px] w-full overflow-hidden">

          {/* Summary bar */}
          <SectionHeading
            variant="with-box"
            text={pillParts.join('  |  ')}
            fullWidth
            className="border-b border-[#c6c6c6]"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-[20px] pt-[14px] pb-[14px] border-b border-[#c6c6c6]">
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
                <div className="overflow-x-auto">
                  <Table
                    columns={TABLE_COLUMNS}
                    rows={pagedData as Record<string, unknown>[]}
                    className="min-w-[1100px]"
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
                  {t('revenue_chart_title')} ({financialYear})
                </p>
                <div className="flex items-center gap-[20px]">
                  <div className="flex items-center gap-[6px]">
                    <div className="size-[10px] rounded-full shrink-0" style={{ background: '#6a3e31' }} />
                    <span className="text-[12px] text-[#525c66]" style={NS}>{t('revenue_chart_collected')}</span>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <div className="size-[10px] rounded-full shrink-0" style={{ background: '#efe0dc' }} />
                    <span className="text-[12px] text-[#525c66]" style={NS}>{t('revenue_chart_outstanding')}</span>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                  <div style={{ width: Math.max(900, chartData.length * 48), height: 420, overflow: 'visible' }}>
                    <ResponsiveBar
                      data={chartData}
                      keys={['Collected', 'Outstanding']}
                      indexBy="district"
                      groupMode="stacked"
                      margin={{ top: 24, right: 20, bottom: 100, left: 60 }}
                      padding={0.35}
                      colors={({ id }) => id === 'Collected' ? '#6a3e31' : '#efe0dc'}
                      borderRadius={2}
                      axisBottom={{ tickRotation: -30, tickSize: 0, tickPadding: 8 }}
                      axisLeft={{ tickSize: 0, tickPadding: 8 }}
                      enableLabel={false}
                      enableGridX={false}
                      gridYValues={5}
                      motionConfig="gentle"
                      tooltip={({ id, value, data, indexValue }) => {
                        const total = (data['Collected'] as number) + (data['Outstanding'] as number);
                        const pct   = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0';
                        return (
                          <div style={{ background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontFamily: 'Noto Sans', fontSize: 12, color: '#212121', minWidth: 200 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{String(indexValue)}</div>
                            <div>{String(id)}: <strong>{Number(value).toLocaleString('en-IN')} L</strong> ({pct}%)</div>
                            <div style={{ color: '#727272', marginTop: 2 }}>Total Demand: {total.toLocaleString('en-IN')} L</div>
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
                  tooltipCompletedLabel="Collected (L)"
                  tooltipTotalLabel="Demand"
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
              <div className="flex gap-[32px] w-full items-start">
                <div className="flex flex-col items-center gap-[4px] shrink-0">
                  <DistrictShape
                    districtGeoName={Object.entries(GEO_TO_DISTRICT).find(([, v]) => v === zilla)?.[0] ?? zilla}
                    width={340}
                    height={400}
                    talukGpData={Object.fromEntries(
                      Object.entries(KARNATAKA_HIERARCHY[zilla] ?? {}).map(([t, gps]) => [t, gps.length])
                    )}
                    selectedTaluk={taluk}
                    onTalukClick={(tk) => { setTaluk(tk); setGp(''); }}
                  />
                  <p className="text-[13px] font-semibold text-[#6a3e31] text-center" style={NS}>{zilla}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <TalukGrid
                    district={zilla}
                    selectedTaluk={taluk}
                    selectedGp={gp}
                    districtRow={REVENUE_DATA.find(r => r.district === zilla)}
                    hierarchy={KARNATAKA_HIERARCHY[zilla] ?? {}}
                    onTalukClick={(tk) => { setTaluk(tk); setGp(''); }}
                    onGpClick={(tk, g) => { setTaluk(tk); setGp(g); }}
                    onBack={() => { setZilla(''); setTaluk(''); setGp(''); }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Download + Share */}
          <div className="flex justify-center gap-[16px] py-[20px] border-t border-[#c6c6c6]">
            <Button variant="filled" iconPlacement="left" iconName="download" text={t('btn_download')} />
            <Button variant="filled" iconPlacement="left" iconName="share"    text={t('btn_share')} />
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
    </div>
  );
}
