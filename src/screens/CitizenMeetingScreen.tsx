import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { ResponsiveBar } from '@nivo/bar';
import { PatternDefsLayer, makeBarColors } from '../components/ChartPatterns';
import AccessibilityBar from '../components/AccessibilityBar';
import AccessibilityFab from '../components/AccessibilityFab';
import Navbar from '../components/Navbar';
import ScaleToFit from '../components/ScaleToFit';
import GoBackToPreviousPage from '../components/GoBackToPreviousPage';
import Breadcrumb from '../components/Breadcrumb';
import SectionTopper from '../components/SectionTopper';
import SectionHeading from '../components/SectionHeading';
import DropdownField from '../components/DropdownField';
import RadioButton from '../components/RadioButton';
import DashboardMetricCard from '../components/DashboardMetricCard';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Icon from '../components/Icon';
import InfoBox from '../components/InfoBox';
import AppDownloadCTA from '../components/AppDownloadCTA';
import Footer from '../components/Footer';
import { DISTRICTS, KARNATAKA_HIERARCHY } from '../data/karnatakaData';
import { registerPageNarrator, unregisterPageNarrator } from '../data/pageSummaries';
import { buildMeetingNarrative } from '../utils/narratives';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

// ── Data ──────────────────────────────────────────────────────────────────────
interface MeetingRow extends Record<string, unknown> {
  slNo: number;
  meetingType: string;
  scheduled: number;
  conducted: number;
  completionPct: string;
}

const MEETING_DATA: MeetingRow[] = [
  { slNo: 1,  meetingType: 'Finance, Audit and Planning Standing Committee', scheduled: 17294,  conducted: 8660,  completionPct: '50.1%' },
  { slNo: 2,  meetingType: 'Habitation Sabha',                               scheduled: 342,    conducted: 123,   completionPct: '36.0%' },
  { slNo: 3,  meetingType: 'GP General Body - First Meeting',                scheduled: 963,    conducted: 366,   completionPct: '38.0%' },
  { slNo: 4,  meetingType: 'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha', scheduled: 2800, conducted: 1464, completionPct: '52.3%' },
  { slNo: 5,  meetingType: 'Mahila Sabha',                                   scheduled: 21697,  conducted: 13410, completionPct: '61.8%' },
  { slNo: 6,  meetingType: 'Ward Sabha - Special',                           scheduled: 2333,   conducted: 896,   completionPct: '38.4%' },
  { slNo: 7,  meetingType: 'KDP Meeting',                                    scheduled: 3744,   conducted: 2132,  completionPct: '56.9%' },
  { slNo: 8,  meetingType: 'Orientation Grama Sabha - Perspective Planning', scheduled: 18049,  conducted: 7912,  completionPct: '43.8%' },
  { slNo: 9,  meetingType: 'GP General Body - Emergency',                    scheduled: 3571,   conducted: 1789,  completionPct: '50.1%' },
  { slNo: 10, meetingType: 'IPAAP Grama Sabha',                              scheduled: 13329,  conducted: 8546,  completionPct: '64.1%' },
  { slNo: 11, meetingType: 'Makkala Sabha',                                  scheduled: 16723,  conducted: 10396, completionPct: '62.2%' },
  { slNo: 12, meetingType: 'Habitation Sabha - Special',                     scheduled: 42,     conducted: 20,    completionPct: '47.6%' },
  { slNo: 13, meetingType: 'General Standing Committee',                     scheduled: 2125,   conducted: 1285,  completionPct: '60.5%' },
  { slNo: 14, meetingType: 'GP General Body',                                scheduled: 141600, conducted: 88018, completionPct: '62.2%' },
  { slNo: 15, meetingType: 'Final Grama Sabha - Perspective Planning',       scheduled: 15315,  conducted: 6789,  completionPct: '44.3%' },
  { slNo: 16, meetingType: 'Ward Sabha',                                     scheduled: 117462, conducted: 56409, completionPct: '48.0%' },
  { slNo: 17, meetingType: 'GP General Body - Special, Convened by 1/3 Members', scheduled: 2480, conducted: 1269, completionPct: '51.2%' },
  { slNo: 18, meetingType: 'Grama Sabha',                                    scheduled: 25680,  conducted: 13615, completionPct: '53.0%' },
  { slNo: 19, meetingType: 'Grama Sabha - Special Budget',                   scheduled: 311,    conducted: 149,   completionPct: '47.9%' },
  { slNo: 20, meetingType: 'Grama Sabha - Special',                          scheduled: 28835,  conducted: 19893, completionPct: '69.0%' },
  { slNo: 21, meetingType: 'Village Water and Sanitation Committee Meeting',  scheduled: 3631,   conducted: 1042,  completionPct: '28.7%' },
  { slNo: 22, meetingType: 'Ward Sabha - Emergency',                         scheduled: 1398,   conducted: 575,   completionPct: '41.1%' },
  { slNo: 23, meetingType: 'Habitation Sabha - Emergency',                   scheduled: 66,     conducted: 8,     completionPct: '12.1%' },
];

const TOTAL_SCHEDULED = 439790;
const TOTAL_CONDUCTED = 244766;
const OVERALL_PCT = ((TOTAL_CONDUCTED / TOTAL_SCHEDULED) * 100).toFixed(1);

// ── Monthly GP participation data (2026) ─────────────────────────────────────
interface MonthlyGPRow { meetingType: string; scheduledGPs: number; conductedGPs: number; }
type MonthlyData = Record<string, MonthlyGPRow[]>;

const GP_MONTHLY_DATA: MonthlyData = {
  January: [
    { meetingType: 'Finance, Audit and Planning Standing Committee', scheduledGPs: 155,  conductedGPs: 155  },
    { meetingType: 'Habitation Sabha',                               scheduledGPs: 15,   conductedGPs: 15   },
    { meetingType: 'Ward Sabha - Special',                           scheduledGPs: 20,   conductedGPs: 19   },
    { meetingType: 'GP General Body - First Meeting',                scheduledGPs: 2,    conductedGPs: 2    },
    { meetingType: 'Mahila Sabha',                                   scheduledGPs: 527,  conductedGPs: 524  },
    { meetingType: 'KDP Meeting',                                    scheduledGPs: 109,  conductedGPs: 108  },
    { meetingType: 'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha', scheduledGPs: 59, conductedGPs: 57 },
    { meetingType: 'IPAAP Grama Sabha',                              scheduledGPs: 17,   conductedGPs: 17   },
    { meetingType: 'GP General Body - Emergency',                    scheduledGPs: 77,   conductedGPs: 77   },
    { meetingType: 'Orientation Grama Sabha - Perspective Planning', scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Makkala Sabha',                                  scheduledGPs: 1686, conductedGPs: 1679 },
    { meetingType: 'Habitation Sabha - Special',                     scheduledGPs: 5,    conductedGPs: 5    },
    { meetingType: 'General Standing Committee',                     scheduledGPs: 132,  conductedGPs: 131  },
    { meetingType: 'GP General Body',                                scheduledGPs: 3647, conductedGPs: 3644 },
    { meetingType: 'GP General Body - Special, Convened by 1/3 Members', scheduledGPs: 59, conductedGPs: 59 },
    { meetingType: 'Ward Sabha',                                     scheduledGPs: 919,  conductedGPs: 917  },
    { meetingType: 'Final Grama Sabha - Perspective Planning',       scheduledGPs: 2,    conductedGPs: 2    },
    { meetingType: 'Grama Sabha',                                    scheduledGPs: 362,  conductedGPs: 359  },
    { meetingType: 'Grama Sabha - Special Budget',                   scheduledGPs: 26,   conductedGPs: 26   },
    { meetingType: 'Grama Sabha - Special',                          scheduledGPs: 6614, conductedGPs: 6510 },
    { meetingType: 'Village Water and Sanitation Committee Meeting',  scheduledGPs: 237,  conductedGPs: 236  },
    { meetingType: 'Ward Sabha - Emergency',                         scheduledGPs: 6,    conductedGPs: 6    },
    { meetingType: 'Habitation Sabha - Emergency',                   scheduledGPs: 0,    conductedGPs: 0    },
  ],
  February: [
    { meetingType: 'Finance, Audit and Planning Standing Committee', scheduledGPs: 81,   conductedGPs: 81   },
    { meetingType: 'Habitation Sabha',                               scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Special',                           scheduledGPs: 4,    conductedGPs: 4    },
    { meetingType: 'Mahila Sabha',                                   scheduledGPs: 79,   conductedGPs: 79   },
    { meetingType: 'KDP Meeting',                                    scheduledGPs: 53,   conductedGPs: 53   },
    { meetingType: 'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha', scheduledGPs: 41, conductedGPs: 41 },
    { meetingType: 'GP General Body - First Meeting',                scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'IPAAP Grama Sabha',                              scheduledGPs: 18,   conductedGPs: 18   },
    { meetingType: 'Orientation Grama Sabha - Perspective Planning', scheduledGPs: 40,   conductedGPs: 40   },
    { meetingType: 'GP General Body - Emergency',                    scheduledGPs: 34,   conductedGPs: 34   },
    { meetingType: 'Makkala Sabha',                                  scheduledGPs: 139,  conductedGPs: 139  },
    { meetingType: 'Habitation Sabha - Special',                     scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'General Standing Committee',                     scheduledGPs: 65,   conductedGPs: 65   },
    { meetingType: 'GP General Body',                                scheduledGPs: 1757, conductedGPs: 1757 },
    { meetingType: 'GP General Body - Special, Convened by 1/3 Members', scheduledGPs: 52, conductedGPs: 52 },
    { meetingType: 'Ward Sabha',                                     scheduledGPs: 343,  conductedGPs: 343  },
    { meetingType: 'Final Grama Sabha - Perspective Planning',       scheduledGPs: 2,    conductedGPs: 2    },
    { meetingType: 'Grama Sabha',                                    scheduledGPs: 155,  conductedGPs: 155  },
    { meetingType: 'Grama Sabha - Special Budget',                   scheduledGPs: 13,   conductedGPs: 13   },
    { meetingType: 'Grama Sabha - Special',                          scheduledGPs: 1076, conductedGPs: 1076 },
    { meetingType: 'Village Water and Sanitation Committee Meeting',  scheduledGPs: 90,   conductedGPs: 90   },
    { meetingType: 'Habitation Sabha - Emergency',                   scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Emergency',                         scheduledGPs: 0,    conductedGPs: 0    },
  ],
  March: [
    { meetingType: 'Finance, Audit and Planning Standing Committee', scheduledGPs: 60,   conductedGPs: 60   },
    { meetingType: 'Habitation Sabha',                               scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Special',                           scheduledGPs: 19,   conductedGPs: 19   },
    { meetingType: 'GP General Body - First Meeting',                scheduledGPs: 1,    conductedGPs: 1    },
    { meetingType: 'Mahila Sabha',                                   scheduledGPs: 292,  conductedGPs: 292  },
    { meetingType: 'KDP Meeting',                                    scheduledGPs: 68,   conductedGPs: 68   },
    { meetingType: 'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha', scheduledGPs: 14, conductedGPs: 14 },
    { meetingType: 'IPAAP Grama Sabha',                              scheduledGPs: 601,  conductedGPs: 601  },
    { meetingType: 'Orientation Grama Sabha - Perspective Planning', scheduledGPs: 360,  conductedGPs: 360  },
    { meetingType: 'GP General Body - Emergency',                    scheduledGPs: 24,   conductedGPs: 24   },
    { meetingType: 'Makkala Sabha',                                  scheduledGPs: 29,   conductedGPs: 29   },
    { meetingType: 'Habitation Sabha - Special',                     scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'General Standing Committee',                     scheduledGPs: 9,    conductedGPs: 9    },
    { meetingType: 'GP General Body',                                scheduledGPs: 2504, conductedGPs: 2504 },
    { meetingType: 'GP General Body - Special, Convened by 1/3 Members', scheduledGPs: 20, conductedGPs: 20 },
    { meetingType: 'Ward Sabha',                                     scheduledGPs: 180,  conductedGPs: 180  },
    { meetingType: 'Final Grama Sabha - Perspective Planning',       scheduledGPs: 18,   conductedGPs: 18   },
    { meetingType: 'Grama Sabha - Special Budget',                   scheduledGPs: 9,    conductedGPs: 9    },
    { meetingType: 'Grama Sabha',                                    scheduledGPs: 116,  conductedGPs: 116  },
    { meetingType: 'Grama Sabha - Special',                          scheduledGPs: 1208, conductedGPs: 1205 },
    { meetingType: 'Village Water and Sanitation Committee Meeting',  scheduledGPs: 66,   conductedGPs: 66   },
    { meetingType: 'Habitation Sabha - Emergency',                   scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Emergency',                         scheduledGPs: 0,    conductedGPs: 0    },
  ],
  April: [
    { meetingType: 'Finance, Audit and Planning Standing Committee', scheduledGPs: 43,   conductedGPs: 43   },
    { meetingType: 'Habitation Sabha',                               scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Special',                           scheduledGPs: 3,    conductedGPs: 3    },
    { meetingType: 'GP General Body - First Meeting',                scheduledGPs: 6,    conductedGPs: 6    },
    { meetingType: 'Mahila Sabha',                                   scheduledGPs: 2305, conductedGPs: 2304 },
    { meetingType: 'KDP Meeting',                                    scheduledGPs: 55,   conductedGPs: 55   },
    { meetingType: 'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha', scheduledGPs: 19, conductedGPs: 19 },
    { meetingType: 'IPAAP Grama Sabha',                              scheduledGPs: 582,  conductedGPs: 582  },
    { meetingType: 'Orientation Grama Sabha - Perspective Planning', scheduledGPs: 240,  conductedGPs: 240  },
    { meetingType: 'GP General Body - Emergency',                    scheduledGPs: 17,   conductedGPs: 17   },
    { meetingType: 'Makkala Sabha',                                  scheduledGPs: 112,  conductedGPs: 112  },
    { meetingType: 'Habitation Sabha - Special',                     scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'General Standing Committee',                     scheduledGPs: 4,    conductedGPs: 4    },
    { meetingType: 'GP General Body',                                scheduledGPs: 2713, conductedGPs: 2712 },
    { meetingType: 'Ward Sabha',                                     scheduledGPs: 303,  conductedGPs: 303  },
    { meetingType: 'GP General Body - Special, Convened by 1/3 Members', scheduledGPs: 18, conductedGPs: 18 },
    { meetingType: 'Final Grama Sabha - Perspective Planning',       scheduledGPs: 49,   conductedGPs: 49   },
    { meetingType: 'Grama Sabha',                                    scheduledGPs: 203,  conductedGPs: 203  },
    { meetingType: 'Grama Sabha - Special Budget',                   scheduledGPs: 9,    conductedGPs: 9    },
    { meetingType: 'Grama Sabha - Special',                          scheduledGPs: 1497, conductedGPs: 1497 },
    { meetingType: 'Village Water and Sanitation Committee Meeting',  scheduledGPs: 178,  conductedGPs: 178  },
    { meetingType: 'Habitation Sabha - Emergency',                   scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Emergency',                         scheduledGPs: 0,    conductedGPs: 0    },
  ],
  May: [
    { meetingType: 'Finance, Audit and Planning Standing Committee', scheduledGPs: 36,   conductedGPs: 36   },
    { meetingType: 'Habitation Sabha',                               scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Special',                           scheduledGPs: 16,   conductedGPs: 16   },
    { meetingType: 'GP General Body - First Meeting',                scheduledGPs: 5,    conductedGPs: 5    },
    { meetingType: 'Mahila Sabha',                                   scheduledGPs: 1784, conductedGPs: 1784 },
    { meetingType: 'KDP Meeting',                                    scheduledGPs: 54,   conductedGPs: 54   },
    { meetingType: 'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha', scheduledGPs: 13, conductedGPs: 13 },
    { meetingType: 'IPAAP Grama Sabha',                              scheduledGPs: 149,  conductedGPs: 149  },
    { meetingType: 'Orientation Grama Sabha - Perspective Planning', scheduledGPs: 14,   conductedGPs: 14   },
    { meetingType: 'GP General Body - Emergency',                    scheduledGPs: 32,   conductedGPs: 32   },
    { meetingType: 'Makkala Sabha',                                  scheduledGPs: 205,  conductedGPs: 205  },
    { meetingType: 'Habitation Sabha - Special',                     scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'General Standing Committee',                     scheduledGPs: 5,    conductedGPs: 5    },
    { meetingType: 'GP General Body',                                scheduledGPs: 2959, conductedGPs: 2958 },
    { meetingType: 'Ward Sabha',                                     scheduledGPs: 581,  conductedGPs: 581  },
    { meetingType: 'GP General Body - Special, Convened by 1/3 Members', scheduledGPs: 29, conductedGPs: 29 },
    { meetingType: 'Final Grama Sabha - Perspective Planning',       scheduledGPs: 2,    conductedGPs: 2    },
    { meetingType: 'Grama Sabha',                                    scheduledGPs: 143,  conductedGPs: 143  },
    { meetingType: 'Grama Sabha - Special Budget',                   scheduledGPs: 4,    conductedGPs: 4    },
    { meetingType: 'Grama Sabha - Special',                          scheduledGPs: 613,  conductedGPs: 611  },
    { meetingType: 'Village Water and Sanitation Committee Meeting',  scheduledGPs: 270,  conductedGPs: 270  },
    { meetingType: 'Habitation Sabha - Emergency',                   scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Emergency',                         scheduledGPs: 0,    conductedGPs: 0    },
  ],
  June: [
    { meetingType: 'Finance, Audit and Planning Standing Committee', scheduledGPs: 21,   conductedGPs: 9    },
    { meetingType: 'Habitation Sabha',                               scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Special',                           scheduledGPs: 12,   conductedGPs: 7    },
    { meetingType: 'GP General Body - First Meeting',                scheduledGPs: 4,    conductedGPs: 2    },
    { meetingType: 'Mahila Sabha',                                   scheduledGPs: 625,  conductedGPs: 322  },
    { meetingType: 'KDP Meeting',                                    scheduledGPs: 34,   conductedGPs: 8    },
    { meetingType: 'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha', scheduledGPs: 6, conductedGPs: 5 },
    { meetingType: 'IPAAP Grama Sabha',                              scheduledGPs: 19,   conductedGPs: 11   },
    { meetingType: 'Orientation Grama Sabha - Perspective Planning', scheduledGPs: 2,    conductedGPs: 1    },
    { meetingType: 'GP General Body - Emergency',                    scheduledGPs: 1,    conductedGPs: 0    },
    { meetingType: 'Makkala Sabha',                                  scheduledGPs: 65,   conductedGPs: 37   },
    { meetingType: 'Habitation Sabha - Special',                     scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'General Standing Committee',                     scheduledGPs: 1,    conductedGPs: 0    },
    { meetingType: 'GP General Body',                                scheduledGPs: 1478, conductedGPs: 637  },
    { meetingType: 'Ward Sabha',                                     scheduledGPs: 223,  conductedGPs: 116  },
    { meetingType: 'Final Grama Sabha - Perspective Planning',       scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'GP General Body - Special, Convened by 1/3 Members', scheduledGPs: 8, conductedGPs: 1  },
    { meetingType: 'Grama Sabha',                                    scheduledGPs: 139,  conductedGPs: 60   },
    { meetingType: 'Grama Sabha - Special Budget',                   scheduledGPs: 4,    conductedGPs: 3    },
    { meetingType: 'Grama Sabha - Special',                          scheduledGPs: 1724, conductedGPs: 1513 },
    { meetingType: 'Village Water and Sanitation Committee Meeting',  scheduledGPs: 515,  conductedGPs: 189  },
    { meetingType: 'Habitation Sabha - Emergency',                   scheduledGPs: 0,    conductedGPs: 0    },
    { meetingType: 'Ward Sabha - Emergency',                         scheduledGPs: 0,    conductedGPs: 0    },
  ],
};

const MEETING_TYPES = [
  'All',
  'GP General Body',
  'GP General Body - Special, Convened by 1/3 Members',
  'GP General Body - Emergency',
  'GP General Body - First Meeting',
  'GP General Body - Special, Convened by Adhyaksha/Upadhyaksha',
  'Finance, Audit and Planning Standing Committee',
  'Grama Sabha',
  'Grama Sabha - Special',
  'Grama Sabha - Special Budget',
  'Ward Sabha',
  'Ward Sabha - Special',
  'Ward Sabha - Emergency',
  'Habitation Sabha',
  'Habitation Sabha - Special',
  'Habitation Sabha - Emergency',
  'KDP Meeting',
  'Makkala Sabha',
  'Mahila Sabha',
  'Orientation Grama Sabha - Perspective Planning',
  'General Standing Committee',
  'Village Water and Sanitation Committee Meeting',
  'IPAAP Grama Sabha',
  'Final Grama Sabha - Perspective Planning',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const YEARS = ['2022', '2023', '2024', '2025', '2026'];

// Stacked bar: conducted (filled) + notConducted (gap)
const BAR_CONDUCTED_COLOR   = '#6a3e31';
const BAR_NOT_CONDUCTED_COLOR = '#dfc2b9';

type LevelFilter = 'GP' | 'TP' | 'ZP';

const BASE_COLS = [
  { key: 'slNo',          label: 'Sr.',               width: 'w-[50px] shrink-0' },
  { key: 'meetingType',   label: 'Meeting Type',      width: 'flex-1 min-w-0' },
  { key: 'scheduled',     label: 'Meetings Scheduled', width: 'w-[180px] shrink-0' },
  { key: 'conducted',     label: 'Meetings Conducted', width: 'w-[180px] shrink-0' },
  { key: 'completionPct', label: 'Completion %',      width: 'w-[140px] shrink-0' },
];

const GP_COLS = [
  { key: 'scheduledGPs',    label: 'Scheduled GPs',   width: 'w-[130px] shrink-0' },
  { key: 'conductedGPs',    label: 'Conducted GPs',   width: 'w-[130px] shrink-0' },
  { key: 'gpCompletionPct', label: 'GP Completion %', width: 'w-[130px] shrink-0' },
];

export default function CitizenMeetingScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Filter state (mock — no data filtering)
  const [selectedZilla, setSelectedZilla]       = useState('');
  const [selectedTaluk, setSelectedTaluk]       = useState('');
  const [selectedGP, setSelectedGP]             = useState('');
  const [selectedMeetingType, setSelectedMeetingType] = useState('');
  const [selectedMonth, setSelectedMonth]       = useState('');
  const [selectedYear, setSelectedYear]         = useState('');
  const [levelFilter, setLevelFilter]           = useState<LevelFilter>('GP');

  // Derived dropdown options from hierarchy
  const zillaOptions = DISTRICTS;
  const talukOptions = useMemo(() =>
    selectedZilla && KARNATAKA_HIERARCHY[selectedZilla]
      ? Object.keys(KARNATAKA_HIERARCHY[selectedZilla])
      : [],
  [selectedZilla]);
  const gpOptions = useMemo(() =>
    selectedZilla && selectedTaluk && KARNATAKA_HIERARCHY[selectedZilla]?.[selectedTaluk]
      ? KARNATAKA_HIERARCHY[selectedZilla][selectedTaluk]
      : [],
  [selectedZilla, selectedTaluk]);

  // Pagination
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(10);

  const monthlyGPRows = useMemo(() =>
    selectedMonth && GP_MONTHLY_DATA[selectedMonth] ? GP_MONTHLY_DATA[selectedMonth] : null,
  [selectedMonth]);

  // Filtered typed rows — used for bar chart
  const baseRows = useMemo((): MeetingRow[] => {
    if (!selectedMeetingType || selectedMeetingType === 'All') return MEETING_DATA;
    return MEETING_DATA.filter(r => r.meetingType === selectedMeetingType);
  }, [selectedMeetingType]);

  // Table rows — merges GP monthly columns when month is selected
  const tableRows = useMemo((): Record<string, unknown>[] => {
    if (!monthlyGPRows) return baseRows as Record<string, unknown>[];
    return baseRows.map(r => {
      const gp = monthlyGPRows.find(g => g.meetingType === r.meetingType);
      return {
        ...r,
        scheduledGPs:    gp ? gp.scheduledGPs : '—',
        conductedGPs:    gp ? gp.conductedGPs : '—',
        gpCompletionPct: gp && gp.scheduledGPs > 0
          ? `${((gp.conductedGPs / gp.scheduledGPs) * 100).toFixed(1)}%`
          : '—',
      };
    });
  }, [baseRows, monthlyGPRows]);

  const tableCols = monthlyGPRows ? [...BASE_COLS, ...GP_COLS] : BASE_COLS;

  const pagedRows = tableRows.slice((page - 1) * perPage, page * perPage);

  // Bar chart data sorted by scheduled desc
  const barData = useMemo(() =>
    [...baseRows]
      .sort((a, b) => b.scheduled - a.scheduled)
      .map(r => ({
        id: r.meetingType.length > 28 ? r.meetingType.slice(0, 26) + '…' : r.meetingType,
        fullName: r.meetingType,
        conducted: r.conducted,
        notConducted: r.scheduled - r.conducted,
      })),
  [baseRows]);

  const barWidth = Math.max(900, barData.length * 80);

  // ── Live narrator registration ───────────────────────────────────────────────
  useEffect(() => {
    const totalMeetings = MEETING_DATA.reduce((s, r) => s + r.scheduled, 0);
    const conducted = MEETING_DATA.reduce((s, r) => s + r.conducted, 0);
    const notConducted = totalMeetings - conducted;
    const byCount = [...MEETING_DATA].sort((a, b) => b.conducted - a.conducted);
    const top = byCount[0];
    const bot = byCount[byCount.length - 1];
    registerPageNarrator('/citizen/meetings', () =>
      buildMeetingNarrative({
        totalMeetings,
        conducted,
        notConducted,
        topDistrict: top?.meetingType ?? '—',
        topDistrictCount: top?.conducted ?? 0,
        bottomDistrict: bot?.meetingType ?? '—',
        bottomDistrictCount: bot?.conducted ?? 0,
      })
    );
    return () => unregisterPageNarrator('/citizen/meetings');
  }, []);

  const [dataView, setDataView] = useState<'chart' | 'table'>('table');
  const isChart = dataView === 'chart';

  return (
    <ScaleToFit>
    <div className="flex flex-col min-h-screen w-full bg-white">
      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar version="home-page-nav-menu" />

      {/* Back + breadcrumb */}
      <div className="px-[200px] pt-[32px] flex items-center justify-between">
        <GoBackToPreviousPage label="Back to Citizen Services" onClick={() => navigate('/citizen')} />
        <Breadcrumb level={3} items={['Home', 'Citizen Services', 'Meeting Management']} />
      </div>

      {/* SectionTopper */}
      <div className="px-[200px] pt-[20px]">
        <SectionTopper
          variant="variant3"
          heading="Meeting Management"
          subheading="Track scheduled and conducted meetings across all Gram Panchayats in Karnataka"
          illustration="/Illustrations/meetings.svg"
          className="rounded-[10px]"
        />
      </div>

      {/* ── Metric cards ── */}
      <div id="main-content" role="main" tabIndex={-1} className="px-[200px] pt-[24px]">
        <h1 className="sr-only">Meeting Records</h1>
        <div className="flex gap-[20px]">
          <DashboardMetricCard
            icon="event"
            label="Total Scheduled Meetings"
            primaryValue={TOTAL_SCHEDULED.toLocaleString('en-IN')}
            trend="none"
            changeLabel="across all meeting types"
            className="flex-1 w-auto"
          />
          <DashboardMetricCard
            icon="check_circle"
            label="Total Conducted Meetings"
            primaryValue={TOTAL_CONDUCTED.toLocaleString('en-IN')}
            trend="none"
            changeLabel="successfully held"
            className="flex-1 w-auto"
          />
          <DashboardMetricCard
            icon="analytics"
            label="Overall Completion Rate"
            primaryValue={`${OVERALL_PCT}%`}
            trend="none"
            changeLabel="meetings conducted vs scheduled"
            className="flex-1 w-auto"
          />
        </div>
      </div>

      <div className="px-[200px] pt-[24px]">
        <div className="border-t border-[#c6c6c6] w-full" />
      </div>

      {/* ── Filters ── */}
      <div className="px-[200px] pt-[45px] flex flex-col gap-[16px]">
        {/* Row 1: view level radio */}
        <div className="flex items-center gap-[24px]">
          <span className="text-[13px] font-medium text-[#525c66]" style={NS}>View level:</span>
          {(['GP', 'TP', 'ZP'] as LevelFilter[]).map(lvl => (
            <RadioButton
              key={lvl}
              label={lvl === 'GP' ? 'Grama Panchayat' : lvl === 'TP' ? 'Taluk Panchayat' : 'Zilla Panchayat'}
              selected={levelFilter === lvl}
              onChange={() => {
                setLevelFilter(lvl);
                setSelectedZilla('');
                setSelectedTaluk('');
                setSelectedGP('');
              }}
            />
          ))}
        </div>

        {/* Row 2: location dropdowns — conditional on level */}
        <div className="flex gap-[16px] items-end">
          {/* ZP: Zilla only | TP: Zilla + Taluk | GP: Zilla + Taluk + GP */}
          <DropdownField
            label="Zilla"
            placeholder="All Zillas"
            value={selectedZilla}
            onChange={v => { setSelectedZilla(v); setSelectedTaluk(''); setSelectedGP(''); }}
            options={zillaOptions}
            showAll
            allLabel="All Zillas"
            className="flex-1"
          />
          {(levelFilter === 'TP' || levelFilter === 'GP') && (
            <DropdownField
              label="Taluk"
              placeholder="All Taluks"
              value={selectedTaluk}
              onChange={v => { setSelectedTaluk(v); setSelectedGP(''); }}
              options={talukOptions}
              showAll
              allLabel="All Taluks"
              className="flex-1"
            />
          )}
          {levelFilter === 'GP' && (
            <DropdownField
              label="Grama Panchayat"
              placeholder="All GPs"
              value={selectedGP}
              onChange={setSelectedGP}
              options={gpOptions}
              showAll
              allLabel="All GPs"
              className="flex-1"
            />
          )}
        </div>

        {/* Row 3: meeting type + month + year */}
        <div className="flex gap-[16px] items-end">
          <DropdownField
            label="Meeting Type"
            placeholder="All Meeting Types"
            value={selectedMeetingType}
            onChange={setSelectedMeetingType}
            options={MEETING_TYPES}
            showAll
            allLabel="All Meeting Types"
            className="flex-[2]"
          />
          <DropdownField
            label="Month"
            placeholder="All Months"
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={MONTHS}
            showAll
            allLabel="All Months"
            className="flex-1"
          />
          <DropdownField
            label="Year"
            placeholder="All Years"
            value={selectedYear}
            onChange={setSelectedYear}
            options={YEARS}
            showAll
            allLabel="All Years"
            className="flex-1"
          />
        </div>

        {/* Row 4: search button */}
        <div className="flex justify-center">
          <Button variant="filled" iconPlacement="left" iconName="search" text="Search" />
        </div>
      </div>

      {/* ── Combined chart + table section ── */}
      <div className="px-[200px] pt-[45px] pb-[60px]">
        <div className="bg-white border border-[#c6c6c6] rounded-[10px] w-full" style={{ overflow: 'visible', isolation: 'isolate' }}>
          <SectionHeading
            variant="with-box"
            text="Scheduled vs Conducted — Meeting Type Wise"
            fullWidth
            className="border-b border-[#c6c6c6]"
          />

          {/* Toggle toolbar */}
          <div className="flex items-center justify-between px-[20px] pt-[14px] pb-[14px] border-b border-[#c6c6c6]">
            <div className="flex items-center">
              <button type="button" onClick={() => setDataView('table')}
                className={`flex items-center gap-[8px] px-[20px] py-[8px] border border-[#b0b0b0] rounded-tl-[8px] rounded-bl-[8px] border-r-0 text-[13px] font-medium cursor-pointer transition-colors ${!isChart ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}>
                <Icon name="table_chart" size="small" color={!isChart ? '#6a3e31' : '#727272'} />Table
              </button>
              <button type="button" onClick={() => setDataView('chart')}
                className={`flex items-center gap-[8px] px-[20px] py-[8px] border border-[#b0b0b0] rounded-tr-[8px] rounded-br-[8px] text-[13px] font-medium cursor-pointer transition-colors ${isChart ? 'bg-[rgba(106,62,49,0.16)] border-[#6a3e31] text-[#6a3e31]' : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                style={NS}>
                <Icon name="bar_chart" size="small" color={isChart ? '#6a3e31' : '#727272'} />Chart
              </button>
            </div>
          </div>

          {/* Chart view */}
          {isChart && (
            <div className="p-[24px]" style={{ overflow: 'visible' }}>
              <div className="flex items-center gap-[20px] mb-[16px]">
                <div className="flex items-center gap-[6px]">
                  <div className="size-[10px] rounded-full shrink-0" style={{ background: BAR_CONDUCTED_COLOR }} />
                  <span className="text-[12px] text-[#525c66]" style={NS}>Conducted</span>
                </div>
                <div className="flex items-center gap-[6px]">
                  <div className="size-[10px] rounded-full shrink-0" style={{ background: BAR_NOT_CONDUCTED_COLOR }} />
                  <span className="text-[12px] text-[#525c66]" style={NS}>Not Conducted</span>
                </div>
              </div>
              <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                <div role="img" aria-label="Bar chart showing meeting counts by district" style={{ width: barWidth, height: 460, overflow: 'visible', position: 'relative', zIndex: 10 }}>
                  <ResponsiveBar
                    data={barData}
                    keys={['conducted', 'notConducted']}
                    indexBy="id"
                    margin={{ top: 80, right: 20, bottom: 140, left: 80 }}
                    padding={0.3}
                    colors={makeBarColors({ conducted: BAR_CONDUCTED_COLOR, notConducted: BAR_NOT_CONDUCTED_COLOR })}
                    layers={[PatternDefsLayer, 'grid', 'axes', 'bars', 'markers', 'legends', 'annotations']}
                    borderRadius={2}
                    axisBottom={{ tickRotation: -40, tickSize: 0, tickPadding: 8 }}
                    axisLeft={{ tickSize: 0, tickPadding: 8 }}
                    enableLabel={false}
                    enableGridX={false}
                    gridYValues={5}
                    motionConfig="gentle"
                    tooltip={({ data }) => (
                      <div style={{ background: 'white', padding: '10px 14px', borderRadius: 8, border: '1px solid #c6c6c6', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontFamily: 'Noto Sans', fontSize: 12, color: '#212121', width: 260, pointerEvents: 'none' }}>
                        <div style={{ fontWeight: 600, marginBottom: 6, whiteSpace: 'normal', wordBreak: 'break-word' }}>{(data as { fullName: string }).fullName}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span>Scheduled: <strong>{((data as { conducted: number; notConducted: number }).conducted + (data as { conducted: number; notConducted: number }).notConducted).toLocaleString('en-IN')}</strong></span>
                          <span>Conducted: <strong>{(data as { conducted: number }).conducted.toLocaleString('en-IN')}</strong></span>
                          <span>Completion: <strong>{(((data as { conducted: number }).conducted / ((data as { conducted: number; notConducted: number }).conducted + (data as { conducted: number; notConducted: number }).notConducted)) * 100).toFixed(1)}%</strong></span>
                        </div>
                      </div>
                    )}
                    theme={{
                      axis: { ticks: { text: { fontFamily: 'Noto Sans', fontSize: 11, fill: '#525c66' } } },
                      grid: { line: { stroke: '#f0f0f0' } },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Table view */}
          {!isChart && (
            <>
              {monthlyGPRows && (
                <div className="px-[20px] pt-[16px]">
                  <InfoBox type="plain" text={`Showing GP participation data for ${selectedMonth} 2026 alongside annual meeting totals`} />
                </div>
              )}
              <div className="p-[20px] flex flex-col gap-[16px]">
                <div className="overflow-x-auto">
                  <Table
                    columns={tableCols}
                    rows={pagedRows}
                    className={monthlyGPRows ? 'min-w-[1100px]' : 'min-w-[800px]'}
                    footerRow={[
                      'Grand Total',
                      '',
                      TOTAL_SCHEDULED.toLocaleString('en-IN'),
                      TOTAL_CONDUCTED.toLocaleString('en-IN'),
                      `${OVERALL_PCT}%`,
                      ...(monthlyGPRows ? [
                        monthlyGPRows.reduce((s, r) => s + r.scheduledGPs, 0).toLocaleString('en-IN'),
                        monthlyGPRows.reduce((s, r) => s + r.conductedGPs, 0).toLocaleString('en-IN'),
                        '',
                      ] : []),
                    ]}
                  />
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(tableRows.length / perPage)}
                  totalItems={tableRows.length}
                  itemsPerPage={perPage}
                  onPageChange={setPage}
                  onItemsPerPageChange={n => { setPerPage(n); setPage(1); }}
                />
              </div>
            </>
          )}

          <div className="flex justify-center gap-[16px] py-[20px] border-t border-[#c6c6c6]">
            <Button variant="filled" iconPlacement="left" iconName="download" text={t('btn_download')} />
            <Button variant="filled" iconPlacement="left" iconName="share"    text={t('btn_share')} />
          </div>
        </div>
      </div>

      <AppDownloadCTA variant="cta-option-2" />
      <Footer variant="dark" />      <AccessibilityFab />
    </div>
    </ScaleToFit>
  );
}
