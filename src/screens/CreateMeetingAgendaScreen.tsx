import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import {
  Stepper,
  StepNavBar,
  Button,
  Icon,
  SectionHolder,
  DescriptionField,
  InputField,
  InfoBox,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const TEMPLATE_PREVIEW_IMG = '/minutes template.jpg';

interface AgendaItem {
  id: number;
  description: string;
  title: string;
}

// ── Mock: previous meeting minutes by type ────────────────────────────────────
const PREV_MINUTES: Record<string, string> = {
  'GP General Body Meeting': 'The previous GP General Body Meeting discussed: (1) approval of the annual budget for FY 2025–26 with a total outlay of ₹42 lakhs; (2) status of PMGSY road work on the Kakanur–Hosakote stretch — contractor directed to complete by March 2026; (3) sanction of funds under SBM Phase II for construction of 14 individual household toilets; (4) review of pending Panchayat tax collections — 38% dues outstanding; (5) nomination of ward members to the Grievance Redressal Committee.',
  'Gram Sabha':              'The previous Gram Sabha discussed: (1) presentation of village development plan for 2025–26 and public feedback; (2) identification of 12 beneficiaries under PM Awas Yojana (Gramin) — list read aloud and objections invited; (3) review of MGNREGS job card issuance — 3 pending applications noted; (4) discussion on drinking water supply disruptions in Ward 4 — PDO directed to raise with KUWSDB; (5) public grievances on delay in issuance of caste and income certificates.',
  'Special Meeting':         'The previous Special Meeting discussed: (1) emergency repair of the GP office roof following monsoon damage — expenditure of ₹1.8 lakhs approved; (2) resolution passed to apply for additional grant under 15th Finance Commission; (3) approval of revised estimates for Anganwadi building construction.',
  'Emergency Meeting':       'The previous Emergency Meeting discussed: (1) flood relief measures for 3 affected wards — distribution of food kits and tarpaulins to 47 households; (2) damage assessment report submitted to Taluk office; (3) request for additional funds under SDRF passed by resolution.',
};

// ── Mock: government circulars (date, number, one-line description) ───────────
interface Circular { date: string; number: string; subject: string; }
const GOVT_CIRCULARS: Circular[] = [
  { date: '2026-01-08', number: 'RD/GP/2026/01',  subject: 'Guidelines on 15th Finance Commission grant utilisation for rural infrastructure works.' },
  { date: '2026-01-22', number: 'RDPR/SBM/2026/04', subject: 'Revised targets for ODF-Plus villages under Swachh Bharat Mission Phase II for 2025–26.' },
  { date: '2026-02-05', number: 'RD/MGNREGS/2026/07', subject: 'Instructions on timely wage payment and muster-roll digitisation under MGNREGS.' },
  { date: '2026-02-19', number: 'RDPR/PMAY-G/2026/09', subject: 'List of eligible beneficiaries for PM Awas Yojana (Gramin) — third instalment release procedure.' },
  { date: '2026-03-03', number: 'RD/TAX/2026/11',  subject: 'Directions to Gram Panchayats on property tax revision and recovery of arrears before financial year close.' },
  { date: '2026-03-15', number: 'RDPR/KUWSDB/2026/13', subject: 'Action plan for resolving drinking water supply grievances in rural areas before summer.' },
  { date: '2026-04-01', number: 'RD/ELECT/2026/15', subject: 'Instructions on conduct of Gram Panchayat ward member elections in notified vacancies.' },
  { date: '2026-04-14', number: 'RDPR/FINANCE/2026/18', subject: 'Annual audit compliance — Gram Panchayats directed to submit utilisation certificates by 30 April 2026.' },
];

function parseDMY(dmy: string): Date | null {
  const parts = dmy.split('/');
  if (parts.length !== 3) return null;
  return new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`);
}

// GP General Body Meeting only — items 3-9 are specific to that meeting's statutory agenda (see default agenda sheets)
const GP_GENERAL_BODY_MARKERS = ['GP General Body Meeting', 'ಜಿಪಿ ಸಾಮಾನ್ಯ ಸಭೆ'];

function buildDefaultAgendas(meetingType: string, prevMeetingDate: string | undefined, t: (k: string) => string): AgendaItem[] {
  const isGpGeneralBody = GP_GENERAL_BODY_MARKERS.some(marker => meetingType.includes(marker));

  const prevMinutes = PREV_MINUTES[meetingType] ?? 'The proceedings of the previous meeting will be read out, discussed, and confirmed by members.';

  const meetingDateObj = prevMeetingDate ? parseDMY(prevMeetingDate) : null;
  const relevantCirculars = GOVT_CIRCULARS.filter(c => {
    const cd = new Date(c.date);
    if (meetingDateObj && cd <= meetingDateObj) return false;
    return true;
  });
  const circularText = relevantCirculars.length > 0
    ? 'The following government circulars received since the last meeting will be read out and discussed:\n' +
      relevantCirculars.map(c => `• ${c.number} (${c.date}): ${c.subject}`).join('\n')
    : 'Government circulars received since the last meeting will be read out and appropriate action/compliance noted.';

  const base: AgendaItem[] = [
    {
      id: 1,
      title: t('default_agenda_title_1'),
      description: prevMinutes,
    },
    {
      id: 2,
      title: t('default_agenda_title_2'),
      description: circularText,
    },
  ];

  if (!isGpGeneralBody) return base;

  return [
    ...base,
    { id: 3, title: t('default_agenda_title_3'), description: t('default_agenda_desc_3') },
    { id: 4, title: t('default_agenda_title_4'), description: t('default_agenda_desc_4') },
    { id: 5, title: t('default_agenda_title_5'), description: t('default_agenda_desc_5') },
    { id: 6, title: t('default_agenda_title_6'), description: t('default_agenda_desc_6') },
    { id: 7, title: t('default_agenda_title_7'), description: t('default_agenda_desc_7') },
    { id: 8, title: t('default_agenda_title_8'), description: t('default_agenda_desc_8') },
    { id: 9, title: t('default_agenda_title_9'), description: t('default_agenda_desc_9') },
  ];
}

export default function CreateMeetingAgendaScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { meetingAgendas, setMeetingAgendas } = useMeetings();
  const meetingData = location.state ?? {};
  const editMeetingId: number | undefined = meetingData.editMeetingId;
  const isEditMode = editMeetingId !== undefined;
  const existingAgendas = isEditMode ? meetingAgendas[editMeetingId] : undefined;

  // ── Agenda items — first nine pre-populated (default agendas), or the
  // meeting's already-saved agendas when editing an existing upcoming meeting ──
  const initialAgendas = existingAgendas && existingAgendas.length > 0
    ? existingAgendas.map(a => ({ id: a.id, title: a.title, description: a.description }))
    : buildDefaultAgendas(meetingData.meetingType ?? '', meetingData.date, t);
  const nextId = useRef(Math.max(10, ...initialAgendas.map(a => a.id)) + 1);
  const [agendas, setAgendas] = useState<AgendaItem[]>(initialAgendas);


  // ── Per-agenda mic state ──
  const [agendaRecording, setAgendaRecording] = useState<Record<number, boolean>>({});
  const [agendaSttError,  setAgendaSttError]  = useState<Record<number, string>>({});
  const agendaMediaRefs    = useRef<Record<number, MediaRecorder | null>>({});
  const agendaChunksRefs   = useRef<Record<number, Blob[]>>({});
  const agendaAudioCtxRefs = useRef<Record<number, AudioContext | null>>({});
  const agendaAnalyserRefs = useRef<Record<number, AnalyserNode | null>>({});

  async function handleAgendaMicClick(id: number) {
    if (agendaRecording[id]) {
      agendaMediaRefs.current[id]?.stop();
      return;
    }
    setAgendaSttError(prev => ({ ...prev, [id]: '' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      agendaAudioCtxRefs.current[id] = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      agendaAnalyserRefs.current[id] = analyser;
      const mr = new MediaRecorder(stream);
      agendaChunksRefs.current[id] = [];
      mr.ondataavailable = e => { if (e.data.size > 0) agendaChunksRefs.current[id].push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        agendaAudioCtxRefs.current[id]?.close(); agendaAudioCtxRefs.current[id] = null;
        agendaAnalyserRefs.current[id] = null;
        setAgendaRecording(prev => ({ ...prev, [id]: false }));
        const blob = new Blob(agendaChunksRefs.current[id], { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const res = await fetch('http://localhost:8000/speech-to-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioDataUri: reader.result, locale: 'en' }),
            });
            const data = await res.json();
            if (data.transcription) {
              updateAgenda(id, 'description', (agendas.find(a => a.id === id)?.description ?? '') + (agendas.find(a => a.id === id)?.description ? ' ' : '') + data.transcription);
            }
          } catch {
            setAgendaSttError(prev => ({ ...prev, [id]: 'Speech-to-text failed.' }));
          }
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      agendaMediaRefs.current[id] = mr;
      setAgendaRecording(prev => ({ ...prev, [id]: true }));
    } catch {
      setAgendaSttError(prev => ({ ...prev, [id]: 'Microphone access denied.' }));
    }
  }

  // ── Uploaded files ──

  // ── Template modals ──
  const [sampleModalOpen,    setSampleModalOpen]    = useState(false);
  const [templateModalOpen,  setTemplateModalOpen]  = useState(false);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);
  const [templateTab,        setTemplateTab]        = useState<'paper' | 'word'>('paper');

  // ── Paper template: single common 4-column layout for every agenda item ──
  type ColDef = { kn: string; en: string; width?: string };

  const COMMON_COLS: ColDef[] = [
    { kn: 'ಚರ್ಚೆ / ಮಾಹಿತಿ',        en: 'Discussion / Information' },
    { kn: 'ತೀರ್ಮಾನ / ನಿರ್ಣಯ',      en: 'Decision / Resolution' },
    { kn: 'ಜವಾಬ್ದಾರಾದವರು / ಸಂಸ್ಥೆ', en: 'Responsible person / org', width: '22%' },
    { kn: 'ಕಾಲಾವಧಿ',                en: 'Timeline / Follow-up',     width: '14%' },
  ];

  // ── Build paper (print) HTML ──────────────────────────────────────────────
  function buildPaperHTML(items: AgendaItem[], meeting: Record<string, unknown>): string {
    const title        = (meeting.title as string) || (meeting.meetingTitle as string) || 'Meeting';
    const date         = (meeting.date as string) || (meeting.meetingDate as string) || '';
    const time         = (meeting.time as string) || (meeting.meetingTime as string) || '';
    const participants = (meeting.participants as unknown[])?.length ?? 0;
    const metaParts    = [date, time, participants > 0 ? `${participants} participants` : ''].filter(Boolean).join('  ·  ');

    // Instruction box text (Kannada, matches reference image style)
    const instructionText = `[ನಿರ್ದಿಷ್ಟ ವಾರ್ಡ್ / ಗ್ರಾಮ / ಪ್ರದೇಶ]ದಲ್ಲಿರುವ [ನಿರ್ದಿಷ್ಟ ಸಮಸ್ಯೆ]ಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯವನ್ನು ಸಭೆಯಲ್ಲಿ [ಸದಸ್ಯರು / ನಾಗರಿಕರು / ನಿರ್ದಿಷ್ಟ ಗುಂಪು] ಮುಂದಿಟ್ಟರು. ಈ ವಿಷಯದ ಬಗ್ಗೆ ಚರ್ಚೆ ನಡೆಸಿದ ನಂತರ, ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಲು [ಪ್ರಸ್ತಾವಿತ ಪರಿಹಾರ ಕ್ರಮ / ತಿದ್ದುಪಡಿ ಕ್ರಮ] ಕೈಗೊಳ್ಳಲು ತೀರ್ಮಾನಿಸಲಾಯಿತು.`;

    const agendaSections = items.map((a, i) => {
      const cols = COMMON_COLS;

      // Build colgroup widths
      const colgroup = cols.map(c => `<col style="width:${c.width ?? 'auto'}">`).join('');

      // Single header row: Kannada bold + English small below, no separator line between them
      const thCells = cols.map((c, ci) => {
        const borderLeft = ci === 0 ? '1px solid #D13644' : '1px solid #D13644';
        return `<th style="border:1px solid #D13644;padding:8px 10px;text-align:left;background:#f5f5f5;vertical-align:top;">
          <div style="font-size:13px;font-weight:600;color:#19203D;font-family:'Noto Sans Kannada','Noto Sans',sans-serif;">${c.kn}</div>
          <div style="font-size:10px;font-weight:400;color:#616161;margin-top:2px;">${c.en}</div>
        </th>`;
      }).join('');

      // Empty ruled rows — count matches col count
      const emptyRows = Array.from({ length: 8 }, () => {
        const tds = cols.map(() =>
          `<td style="border:1px solid #e8e8e8;height:28px;padding:0;"></td>`
        ).join('');
        return `<tr>${tds}</tr>`;
      }).join('');

      return `
        <div style="margin-bottom:28px;page-break-inside:avoid;">
          <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px;">
            <span style="font-size:15px;font-weight:700;color:#D13644;min-width:22px;">${i + 1}.</span>
            <span style="font-size:15px;font-weight:700;color:#19203D;">${a.title || '—'}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #D13644;">
            <colgroup>${colgroup}</colgroup>
            <thead><tr>${thCells}</tr></thead>
            <tbody>${emptyRows}</tbody>
          </table>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>Minutes Notesheet — ${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Sans+Kannada:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans', 'Times New Roman', serif; color: #19203D; margin: 0; padding: 32px 40px; font-size: 13px; }
  @media print { body { padding: 20px 28px; } .no-break { page-break-inside: avoid; } }
</style>
</head><body>

  <!-- Top row: title left, instruction box right -->
  <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:28px;">

    <div style="flex:0 0 auto;max-width:260px;">
      <div style="font-size:11px;font-weight:400;color:#616161;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">Meeting Proceedings &nbsp;·&nbsp; ಸಭೆಯ ನಡಾವಳಿಗಳು</div>
      <div style="font-size:16px;font-weight:700;color:#19203D;line-height:1.3;">${title}</div>
      ${(date || time || participants > 0) ? `<div style="font-size:11px;color:#616161;margin-top:6px;">${[date, time, participants > 0 ? `${participants} participants` : ''].filter(Boolean).join('  ·  ')}</div>` : ''}
    </div>

    <div style="flex:1;border:1.5px solid #D13644;border-radius:6px;padding:12px 14px;font-size:11px;color:#19203D;line-height:1.7;">
      ${instructionText}
    </div>
  </div>

  <!-- Agenda sections -->
  ${agendaSections}

</body></html>`;
  }

  // ── Build Word-style HTML ─────────────────────────────────────────────────
  function buildWordHTML(items: AgendaItem[], meeting: Record<string, unknown>): string {
    const title        = (meeting.title as string) || (meeting.meetingTitle as string) || 'Meeting';
    const date         = (meeting.date as string) || (meeting.meetingDate as string) || '';
    const time         = (meeting.time as string) || (meeting.meetingTime as string) || '';
    const participants = (meeting.participants as unknown[])?.length ?? 0;

    const agendaTables = items.map((a, i) => {
      const cols = COMMON_COLS;
      const fieldRows = cols.map(c => `
        <tr>
          <td style="width:32%;background:#f5f5f5;border:1px solid #C6C6C6;padding:7px 10px;vertical-align:top;">
            <div style="font-size:12px;font-weight:600;color:#484848;font-family:'Noto Sans Kannada','Noto Sans',sans-serif;">${c.kn}</div>
            <div style="font-size:10px;font-weight:400;color:#616161;margin-top:2px;">${c.en}</div>
          </td>
          <td style="border:1px solid #C6C6C6;padding:7px 10px;font-size:12px;color:#212121;height:64px;"></td>
        </tr>`).join('');

      return `
        <div style="margin-bottom:20px;">
          <div style="background:#757575;color:white;padding:7px 12px;">
            <span style="font-size:12px;font-weight:700;">${i + 1}. ${a.title || '—'}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${fieldRows}</tbody>
          </table>
        </div>`;
    }).join('');

    const metaParts = [date, time, participants > 0 ? `${participants} participants` : ''].filter(Boolean).join('  ·  ');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Minutes Template — ${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  body { font-family: 'Noto Sans', Arial, sans-serif; color: #212121; margin: 0; padding: 32px 40px; font-size: 13px; }
</style>
</head><body>
  <div style="border-bottom:2px solid #C6C6C6;padding-bottom:10px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:400;color:#616161;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">Meeting Proceedings &nbsp;·&nbsp; ಸಭೆಯ ನಡಾವಳಿಗಳು</div>
    <div style="font-size:16px;font-weight:700;color:#212121;">${title}</div>
    ${metaParts ? `<div style="font-size:11px;color:#616161;margin-top:6px;">${metaParts}</div>` : ''}
  </div>
  ${agendaTables}
</body></html>`;
  }

  function downloadHTML(html: string, filename: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleGetTemplate() {
    setTemplateModalOpen(true);
  }

  function handleDownloadTemplate() {
    downloadHTML(buildWordHTML(sortedForTemplate(agendas), meetingData), 'minutes_template_word.html');
    setTemplateDownloaded(true);
  }

  const sortedForTemplate = (items: AgendaItem[]) =>
    [...items].sort((a, b) => (a.id <= 9 ? -1 : 1) - (b.id <= 9 ? -1 : 1));

  function addAgenda() {
    const id = nextId.current++;
    setAgendas(prev => [...prev, { id, description: '', title: '' }]);
  }

  function removeAgenda(id: number) {
    setAgendas(prev => prev.filter(a => a.id !== id));
  }

  function updateAgenda(id: number, field: 'description' | 'title', value: string) {
    setAgendas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  // Submit enable: at least one agenda with both fields filled
  const canSubmit = agendas.some(a => a.title.trim() && a.description.trim());

  return (
    <MeetingShellLayout
      showStepper={false}
      backRoute={isEditMode ? '/meetings/list' : '/meetings/create'}
      breadcrumbItems={[
        t('breadcrumb_module'),
        t('breadcrumb_meetings'),
        t(isEditMode ? 'breadcrumb_edit_meeting' : 'breadcrumb_create_meeting'),
      ]}
    >
      <div className="flex flex-col gap-[15px]">
        {!isEditMode && (
          <Stepper
            activeState={2}
            stepLabels={[t('stepper_step1'), t('stepper_step2'), t('stepper_step3')]}
          />
        )}

        <div className="flex flex-col gap-[25px]">

              {/* ── Section 1: Agenda Details ── */}
              <div className="flex flex-col gap-[3px]">
                {/* Section header */}
                <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px]">
                  <div className="flex items-center gap-[5px]">
                    <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] whitespace-nowrap" style={NS}>
                      {t('section_agenda_details')}
                    </span>
                    <span className="font-medium text-sm text-[#b7131a] leading-5" style={NS}>*</span>
                  </div>
                  <Button
                    variant="outlined"
                    size="small"
                    iconPlacement="left"
                    iconName="add"
                    text={t('btn_add_agenda')}
                    onClick={addAgenda}
                  />
                </div>

                {/* Section body */}
                <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[30px] pt-[25px] pb-[35px] flex flex-col xl:flex-row gap-[30px] xl:items-start">

                  {/* Tips panel — top at < xl, right col at xl+ */}
                  <div className="w-full xl:w-[360px] xl:shrink-0 bg-[#f7f0ee] rounded-[12px] px-[20px] py-[20px] flex flex-col gap-[10px] xl:self-start xl:order-2">
                    <div className="flex items-center gap-[6px]">
                      <Icon name="tips_and_updates" size="small" color="#6a3e31" />
                      <span className="font-semibold text-[18px] text-[#6a3e31] leading-[24px]" style={NS}>{t('agenda_tips_title')}</span>
                    </div>
                    <ul className="flex flex-col gap-[8px] list-none m-0 p-0">
                      {['agenda_tips_1','agenda_tips_2','agenda_tips_3','agenda_tips_4','agenda_tips_5'].map(key => (
                        <li key={key} className="flex items-start gap-[6px]">
                          <span className="shrink-0 mt-[5px] size-[5px] rounded-full bg-[#6a3e31]" />
                          <span className="text-[14px] text-[#3b3b3b] leading-[20px]" style={NS}>{t(key)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-[4px] border-t border-[rgba(106,62,49,0.2)] pt-[12px] flex flex-col gap-[8px]">
                      <span className="font-semibold text-[12px] text-[#6a3e31] uppercase tracking-[0.6px]" style={NS}>{t('agenda_tips_examples_heading')}</span>
                      {(['1','2'] as const).map(n => (
                        <div key={n} className="bg-white rounded-[8px] px-[12px] py-[10px] border border-[rgba(106,62,49,0.16)] flex flex-col gap-[3px]">
                          <span className="font-semibold text-[14px] text-[#212121] leading-[20px]" style={NS}>{t(`agenda_tips_example_${n}_title`)}</span>
                          <span className="text-[12px] text-[#727272] leading-[18px]" style={NS}>{t(`agenda_tips_example_${n}_desc`)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agenda list — below tips at < xl, left col at xl+ */}
                  <div className="flex-1 min-w-0 flex flex-col gap-[16px] xl:order-1">
                    {agendas.map((agenda, idx) => (
                      <div key={agenda.id} className="flex flex-col gap-[0px]">
                        <div className="bg-[#f5f5f5] rounded-[15px] px-[20px] pt-[24px] pb-[32px] flex gap-[20px] items-start">
                          {/* Number circle */}
                          <div className="shrink-0 flex items-center mt-[4px]">
                            <div className="bg-[#efe0dc] flex flex-col items-center justify-center px-1 py-[6px] rounded-full size-[32px]">
                              <span className="font-medium text-sm text-[#6a3e31] text-center leading-5 tracking-[0.1px]" style={NS}>
                                {idx + 1}
                              </span>
                            </div>
                          </div>

                          {/* Fields */}
                          <div className="flex-1 min-w-0 flex flex-col gap-[20px]">
                            <InputField
                              label={t('agenda_title_label')}
                              placeholder={t('agenda_title_placeholder')}
                              required
                              value={agenda.title}
                              onChange={val => updateAgenda(agenda.id, 'title', val)}
                            />
                            <div>
                              <DescriptionField
                                label={t('agenda_description_label')}
                                placeholder={t('agenda_description_placeholder')}
                                required
                                value={agenda.description}
                                onChange={val => updateAgenda(agenda.id, 'description', val)}
                                onMicClick={() => handleAgendaMicClick(agenda.id)}
                                micRecording={!!agendaRecording[agenda.id]}
                                micAnalyserNode={agendaAnalyserRefs.current[agenda.id] ?? undefined}
                              />
                              {agendaSttError[agenda.id] && (
                                <p className="text-xs text-[#b7131a] mt-1" style={{ fontFamily: 'Noto Sans' }}>{agendaSttError[agenda.id]}</p>
                              )}
                            </div>
                          </div>

                          {/* Remove button — visible for user-added agendas, invisible spacer for defaults */}
                          {agenda.id >= 10 ? (
                            <button
                              type="button"
                              onClick={() => removeAgenda(agenda.id)}
                              className="shrink-0 flex items-center justify-center size-9 rounded-[8px] transition-colors hover:bg-[#ebebeb] cursor-pointer"
                            >
                              <Icon name="close" size="medium" color="#424242" />
                            </button>
                          ) : (
                            <div className="shrink-0 size-9" />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Agenda button */}
                    <div className="flex items-center justify-start mt-[4px]">
                      <Button
                        variant="outlined"
                        size="small"
                        iconPlacement="left"
                        iconName="add"
                        text={t('btn_add_agenda')}
                        onClick={addAgenda}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Generate Template ── */}
              <SectionHolder
                variant="with-description"
                title={t('section_generate_template')}
                subtitle={t('generate_template_subtitle')}
                bodyClassName="px-[30px] pt-[20px] pb-[30px] flex flex-col gap-[18px]"
              >
                {/* Clickable thumbnail — opens sample image preview */}
                <div className="flex flex-col gap-[10px] w-[450px]">
                  <button
                    type="button"
                    onClick={() => setSampleModalOpen(true)}
                    className="h-[294px] w-full rounded-[10px] overflow-hidden border border-[#C6C6C6] cursor-pointer hover:opacity-90 transition-opacity relative"
                  >
                    <iframe
                      srcDoc={buildPaperHTML(sortedForTemplate(agendas), meetingData)}
                      title="Template thumbnail"
                      className="absolute top-0 left-0 border-none bg-white"
                      style={{ width: '150%', height: '150%', transform: 'scale(0.667)', transformOrigin: 'top left', pointerEvents: 'none' }}
                    />
                  </button>
                  <div className="flex items-start gap-[8px]">
                    <Icon name="info" size="small" color="#727272" />
                    <span className="font-medium text-[12px] leading-5 text-[#727272] tracking-[0.1px]" style={NS}>
                      {t('template_preview_info')}
                    </span>
                  </div>
                </div>

                <div className="flex">
                  <Button
                    variant="outlined"
                    size="small"
                    iconPlacement="left"
                    iconName="description"
                    text={t('btn_get_template')}
                    onClick={handleGetTemplate}
                  />
                </div>
              </SectionHolder>

              {/* ── Submit button ── */}
              <div className="flex justify-center pt-2">
                <Button
                  variant="filled"
                  size="large"
                  iconPlacement="none"
                  state={canSubmit ? 'default' : 'disabled'}
                  text={isEditMode ? t('btn_save_agenda_changes') : t('btn_submit_generate_notice')}
                  onClick={() => {
                    if (!canSubmit) return;
                    Object.values(agendaMediaRefs.current).forEach(mr => mr?.stop());
                    if (isEditMode) {
                      setMeetingAgendas(editMeetingId, agendas.map(a => ({
                        id: a.id,
                        title: a.title,
                        description: a.description,
                        completed: false,
                        proceedingsText: '',
                      })));
                      navigate('/meetings/list');
                      return;
                    }
                    navigate('/meetings/create/sign-notice', {
                      state: { ...meetingData, agendas },
                    });
                  }}
                />
              </div>

        </div>
      </div>

      {/* ── Template Preview Modal ── */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[24px]">
          <div className="w-full max-w-[820px] max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
              <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                {t('template_modal_title')}
              </span>
              <button type="button" onClick={() => setTemplateModalOpen(false)} className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0">
                <Icon name="close" size="small" color="#6a3e31" />
              </button>
            </div>
            {/* Body */}
            <div className="bg-white rounded-bl-[20px] rounded-br-[20px] flex flex-col gap-[16px] px-[25px] pt-[20px] pb-[25px] overflow-y-auto">
              <div className="flex items-start gap-[8px]">
                <Icon name="info" size="small" color="#727272" />
                <span className="font-medium text-[12px] leading-5 text-[#727272] tracking-[0.1px]" style={NS}>
                  {t('template_generated_info')}
                </span>
              </div>

              {/* Tab bar */}
              <div className="flex gap-[8px] shrink-0">
                <Button
                  variant="small-grey"
                  selected={templateTab === 'paper'}
                  iconPlacement="left"
                  iconName="print"
                  text="Print / Paper"
                  onClick={() => setTemplateTab('paper')}
                />
                <Button
                  variant="small-grey"
                  selected={templateTab === 'word'}
                  iconPlacement="left"
                  iconName="description"
                  text="Word Document"
                  onClick={() => setTemplateTab('word')}
                />
              </div>

              {/* Single iframe preview */}
              <iframe
                srcDoc={templateTab === 'paper' ? buildPaperHTML(sortedForTemplate(agendas), meetingData) : buildWordHTML(sortedForTemplate(agendas), meetingData)}
                title="Minutes Template"
                className="w-full rounded-[10px] border border-[#C6C6C6] bg-white"
                style={{ height: '500px' }}
              />

              {/* Actions row */}
              <div className="flex items-center justify-center gap-[10px] shrink-0">
                <Button
                  variant="outlined"
                  iconPlacement="none"
                  text={t('btn_close')}
                  onClick={() => setTemplateModalOpen(false)}
                />
                <Button
                  variant="filled"
                  iconPlacement="left"
                  iconName={templateTab === 'paper' ? 'print' : 'download'}
                  text={templateTab === 'paper' ? 'Download / Print' : (templateDownloaded ? 'Re-download .docx' : 'Download .docx')}
                  onClick={() => {
                    if (templateTab === 'paper') {
                      downloadHTML(buildPaperHTML(sortedForTemplate(agendas), meetingData), 'minutes_notesheet.html');
                    } else {
                      handleDownloadTemplate();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sample Preview Modal ── */}
      {sampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[800px] max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
              <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                {t('template_preview_info')}
              </span>
              <button type="button" onClick={() => setSampleModalOpen(false)} className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0">
                <Icon name="close" size="small" color="#6a3e31" />
              </button>
            </div>
            {/* Body */}
            <div className="bg-white rounded-bl-[20px] rounded-br-[20px] flex flex-col gap-[16px] px-[25px] pt-[20px] pb-[25px] overflow-y-auto">
              <div className="relative w-full rounded-[10px] border border-[#C6C6C6] overflow-hidden" style={{ height: '520px' }}>
                <iframe
                  srcDoc={buildPaperHTML(sortedForTemplate(agendas), meetingData)}
                  title="Template preview"
                  className="absolute top-0 left-0 border-none bg-white"
                  style={{ width: '150%', height: '150%', transform: 'scale(0.667)', transformOrigin: 'top left', pointerEvents: 'none' }}
                />
              </div>
              <div className="flex items-center justify-end shrink-0">
                <Button
                  variant="outlined"
                  iconPlacement="none"
                  text={t('btn_close')}
                  onClick={() => setSampleModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </MeetingShellLayout>
  );
}
