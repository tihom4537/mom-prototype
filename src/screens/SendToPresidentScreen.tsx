import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import { useAgenda } from '../context/AgendaContext';
import {
  MeetingDetailsCard,
  SectionHolder,
  Button,
  Icon,
  InfoBox,
  TaskRow,
  DropdownField,
  DatePicker,
  TimePicker,
  DescriptionField,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskItem {
  id: number;
  text: string;
  assignee: string;
  deadline: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY =
  'The 2nd GP General Body Meeting 2026 was held on 7th February 2026 at HOSAKOTE GP Office. ' +
  'Key discussions included repair of street lights on Ward 4 assigned to Manoj K. (PDO), road repair to be completed before monsoon season, ' +
  'and a proposal to procure new water pumps for Ward 7. Resolution passed to submit project estimate to district office by March 2026. ' +
  'A total of 14 members were present. Quorum was met.';

const MOCK_TASK_KEYS = [
  { id: 1, textKey: 'mock_task_stp_1', assigneeKey: 'mock_task_assignee_manoj',     deadlineKey: 'mock_task_deadline_june'  },
  { id: 2, textKey: 'mock_task_stp_2', assigneeKey: 'mock_task_assignee_secretary', deadlineKey: 'mock_task_deadline_march' },
  { id: 3, textKey: 'mock_task_stp_3', assigneeKey: 'mock_task_assignee_ramesh',    deadlineKey: 'mock_task_deadline_may'   },
];

// Built inside component via t() — defined here as keys, resolved below
const MEETING_TYPE_KEYS = [
  'meeting_type_gp_general_body',
  'meeting_type_gram_sabha_ordinary',
  'meeting_type_gram_sabha_special_budget',
  'meeting_type_ward_sabha_ordinary',
  'meeting_type_habitation_ordinary',
  'meeting_type_habitation_emergency',
  'meeting_type_kdp',
  'meeting_type_makkala_sabha',
  'meeting_type_mahila_sabha',
  'meeting_type_finance_committee',
  'meeting_type_general_standing',
  'meeting_type_social_justice',
  'meeting_type_gram_sabha_special',
  'meeting_type_ward_sabha_special',
  'meeting_type_habitation_special',
] as const;

// GP staff for assignee dropdown
const GP_STAFF = [
  'Ramesh Kumar (PDO)',
  'Savitha Gowda (Secretary)',
  'Manoj K. (PDO)',
  'Suresh Patil (President)',
  'Anitha Rao (Vice President)',
  'Manjunath B. (Ward Member)',
  'Lakshmi Devi (Ward Member)',
  'Prakash Hegde (Ward Member)',
  'Kaveri S. (Ward Member)',
  'Nagesh M. (Ward Member)',
  'Bhavana Naik (Ward Member)',
  'Raju Chandra (Ward Member)',
  'Geetha Kumari (Ward Member)',
];

// Quick deadline options — current month + next 6
function buildDeadlineOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  for (let i = 0; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push(`Before ${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  return options;
}
const DEADLINE_OPTIONS = buildDeadlineOptions();

// Mock attendance for proceedings preview
const MOCK_ATTENDANCE = [
  { id: 1,  name: 'Suresh Patil',      designation: 'President',            status: 'present' },
  { id: 2,  name: 'Anitha Rao',        designation: 'Vice President',       status: 'present' },
  { id: 3,  name: 'Ramesh Kumar',      designation: 'PDO',                  status: 'present' },
  { id: 4,  name: 'Savitha Gowda',     designation: 'Secretary',            status: 'present' },
  { id: 5,  name: 'Manjunath B.',      designation: 'Ward Member — Ward 1', status: 'present' },
  { id: 6,  name: 'Lakshmi Devi',      designation: 'Ward Member — Ward 2', status: 'present' },
  { id: 7,  name: 'Prakash Hegde',     designation: 'Ward Member — Ward 3', status: 'absent'  },
  { id: 8,  name: 'Kaveri S.',         designation: 'Ward Member — Ward 4', status: 'present' },
  { id: 9,  name: 'Nagesh M.',         designation: 'Ward Member — Ward 5', status: 'present' },
  { id: 10, name: 'Bhavana Naik',      designation: 'Ward Member — Ward 6', status: 'present' },
  { id: 11, name: 'Raju Chandra',      designation: 'Ward Member — Ward 7', status: 'present' },
  { id: 12, name: 'Geetha Kumari',     designation: 'Ward Member — Ward 8', status: 'absent'  },
  { id: 13, name: 'Manoj K.',          designation: 'PDO (Assisting)',      status: 'present' },
  { id: 14, name: 'Divya Rao',         designation: 'Elected Member',       status: 'present' },
];

// ─── Task Modal ───────────────────────────────────────────────────────────────

interface TaskModalProps {
  initial?: TaskItem;
  onSave: (task: Omit<TaskItem, 'id'>) => void;
  onClose: () => void;
}

function TaskModal({ initial, onSave, onClose }: TaskModalProps) {
  const { t } = useLanguage();
  const [text,     setText]     = useState(initial?.text     ?? '');
  const [assignee, setAssignee] = useState(initial?.assignee ?? '');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');

  const canSave = text.trim() && assignee.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[540px] max-w-[92vw] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
          <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
            {initial ? t('task_modal_title_edit') : t('task_modal_title_add')}
          </span>
          <button type="button" onClick={onClose} className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0">
            <Icon name="close" size="small" color="#6a3e31" />
          </button>
        </div>
        {/* Body */}
        <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[25px] pb-[25px] pt-[16px] flex flex-col gap-4">
          {/* Task description */}
          <div className="flex flex-col gap-1">
            <label className="font-medium text-[14px] leading-[20px] text-[#212121]" style={NS}>
              {t('task_modal_label_description')} <span className="text-[#b7131a]">*</span>
            </label>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t('task_modal_placeholder_description')}
              className="border border-[#c6c6c6] rounded-[8px] px-3 py-[10px] text-[14px] text-[#212121] placeholder-[#727272] outline-none focus:border-[#ae6651] bg-white w-full"
              style={NS}
            />
          </div>

          {/* Assignee */}
          <DropdownField
            label={t('task_modal_label_assignee')}
            placeholder={t('task_modal_placeholder_assignee')}
            value={assignee}
            onChange={setAssignee}
            options={GP_STAFF}
            required
          />

          {/* Deadline */}
          <div className="flex flex-col gap-1">
            <label className="font-medium text-[14px] leading-[20px] text-[#212121]" style={NS}>
              {t('task_modal_label_deadline')}
            </label>
            <div className="flex flex-wrap gap-2 mb-1">
              {DEADLINE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDeadline(opt)}
                  className={`px-[15px] py-[8px] rounded-[8px] border border-[#b0b0b0] text-[#727272] font-medium text-[14px] leading-[20px] tracking-[0.1px] transition-colors focus:outline-none
                    ${deadline === opt
                      ? 'bg-[rgba(106,62,49,0.16)]'
                      : 'bg-white hover:bg-[rgba(106,62,49,0.08)] active:bg-[rgba(106,62,49,0.16)]'}`}
                  style={NS}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              placeholder={t('task_modal_placeholder_deadline')}
              className="border border-[#c6c6c6] rounded-[8px] px-3 py-[10px] text-[14px] text-[#212121] placeholder-[#727272] outline-none focus:border-[#ae6651] bg-white w-full"
              style={NS}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <Button
              text={t('task_modal_btn_cancel')}
              variant="outlined"
              state="default"
              iconPlacement="none"
              onClick={onClose}
            />
            <Button
              text={initial ? t('task_modal_btn_save') : t('task_modal_btn_add')}
              variant="filled"
              state={(canSave ? 'default' : 'disabled') as 'default' | 'disabled'}
              iconPlacement="none"
              onClick={() => { if (canSave) onSave({ text: text.trim(), assignee, deadline: deadline.trim() }); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ onConfirm, onCancel, title, body, labelYes, labelNo }: {
  onConfirm: () => void; onCancel: () => void;
  title: string; body: string; labelYes: string; labelNo: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[520px] max-w-[92vw] flex flex-col shadow-2xl">
        <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
          <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>{title}</span>
          <button type="button" onClick={onCancel} className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0">
            <Icon name="close" size="small" color="#6a3e31" />
          </button>
        </div>
        <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[25px] pb-[25px] pt-[16px] flex flex-col gap-6">
          <p className="font-normal text-[14px] leading-[22px] text-[#454545]" style={NS}>{body}</p>
          <div className="flex gap-3 justify-end">
            <Button text={labelNo}  variant="outlined" state="default" iconPlacement="none" onClick={onCancel} />
            <Button text={labelYes} variant="filled"   state="default" iconPlacement="none" onClick={onConfirm} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Success Banner ───────────────────────────────────────────────────────────

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-[440px] max-w-[90vw] p-8 flex flex-col items-center gap-5">
        <div className="bg-[#e8f5e9] rounded-full size-[64px] flex items-center justify-center">
          <Icon name="check_circle" size="large" color="#3c9718" />
        </div>
        <p className="font-semibold text-[16px] leading-[24px] text-[#212121] text-center" style={NS}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Proceedings Preview Document ─────────────────────────────────────────────

interface ProceedingsPreviewProps {
  t: (key: string) => string;
  meeting: { name: string; meetingType?: string; date: string; time: string; venue: string; chairperson?: string; description?: string; } | undefined;
  agendaItems: { id: number; heading: string; description: string; completed: boolean; proceedingsText?: string | Record<string,string>; }[];
  summary: string;
  nextMeetingDate: string;
  nextMeetingType: string;
  page: 1 | 2;
}

function ProceedingsPreviewDocument({ t, meeting, agendaItems, summary, nextMeetingDate, nextMeetingType, page: activePage }: ProceedingsPreviewProps) {
  const NS_FONT = 'Noto Sans, sans-serif';

  const page: React.CSSProperties = {
    background: 'white',
    minHeight: '1056px',
    padding: '32px 40px',
    fontFamily: NS_FONT,
    fontSize: '12px',
    color: '#1a1a1a',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
  };

  const cellLabel: React.CSSProperties = {
    fontFamily: NS_FONT, background: '#f5f0ef', fontWeight: 600, color: '#5a3a2e',
    fontSize: '11px', padding: '7px 10px', border: '1px solid #c8c0bc',
    width: '22%', verticalAlign: 'top',
  };
  const cellVal: React.CSSProperties = {
    fontFamily: NS_FONT, fontSize: '11px', color: '#1a1a1a',
    padding: '7px 10px', border: '1px solid #c8c0bc', width: '28%', verticalAlign: 'top',
  };
  const thStyle: React.CSSProperties = {
    fontFamily: NS_FONT, background: '#f5f0ef', fontWeight: 600, color: '#5a3a2e',
    fontSize: '11px', padding: '7px 10px', border: '1px solid #c8c0bc', textAlign: 'left',
  };
  const tdStyle: React.CSSProperties = {
    fontFamily: NS_FONT, fontSize: '11px', color: '#1a1a1a',
    padding: '7px 10px', border: '1px solid #c8c0bc', verticalAlign: 'top',
  };

  const sectionHeading: React.CSSProperties = {
    fontWeight: 700, fontSize: '12px', textDecoration: 'underline',
    marginBottom: '8px', marginTop: '20px', fontFamily: NS_FONT,
  };

  const nextLabel = nextMeetingDate
    ? `${nextMeetingType ? nextMeetingType + ' — ' : ''}${nextMeetingDate}`
    : '3rd GP General Body Meeting — 19/06/2026';

  const govtHeader = (
    <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px solid #b5a9a5', marginBottom: '4px' }}>
      <img
        src="/karnataka-emblem.png"
        alt="Karnataka Govt Emblem"
        style={{ width: '52px', height: '52px', objectFit: 'contain', display: 'block', margin: '0 auto 6px' }}
      />
      <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a237e', margin: '0 0 2px', fontFamily: NS_FONT }}>
        {t('proceedings_preview_govt_name')}
      </p>
      <p style={{ fontSize: '11px', color: '#3b3b3b', margin: '0 0 8px', fontFamily: NS_FONT }}>
        {t('proceedings_preview_dept_name')}
      </p>
      <p style={{ fontWeight: 700, fontSize: '17px', textDecoration: 'underline', margin: '0 0 2px', fontFamily: NS_FONT }}>
        {t('proceedings_preview_title')}
      </p>
      <p style={{ fontSize: '11px', color: '#5a5a5a', fontStyle: 'italic', margin: 0, fontFamily: NS_FONT }}>
        {t('proceedings_preview_subtitle')}
      </p>
    </div>
  );

  if (activePage === 1) {
    return (
      <div style={page}>
        {govtHeader}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
          <tbody>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_district')}</td>
              <td style={cellVal}>{t('proceedings_preview_district_val')}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_taluk')}</td>
              <td style={cellVal}>{t('proceedings_preview_taluk_val')}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_gp')}</td>
              <td style={cellVal}>{t('proceedings_preview_gp_val')}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_type')}</td>
              <td style={cellVal}>{meeting?.meetingType ?? '—'}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_date')}</td>
              <td style={cellVal}>{meeting?.date ?? '—'}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_time')}</td>
              <td style={cellVal}>{meeting?.time ?? '—'}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_venue')}</td>
              <td style={cellVal}>{meeting?.venue ?? '—'}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_chairperson')}</td>
              <td style={cellVal}>{meeting?.chairperson ?? '—'}</td>
            </tr>
            <tr>
              <td style={cellLabel}>{t('proceedings_preview_col_prev_meeting')}</td>
              <td style={cellVal}>{t('proceedings_preview_prev_meeting_val')}</td>
              <td style={cellLabel}>{t('proceedings_preview_col_quorum')}</td>
              <td style={cellVal}>{t('proceedings_preview_quorum_val')}</td>
            </tr>
            {meeting?.description && (
              <tr>
                <td style={cellLabel}>{t('proceedings_preview_col_description')}</td>
                <td style={{ ...cellVal, width: 'auto' }} colSpan={3}>{meeting.description}</td>
              </tr>
            )}
          </tbody>
        </table>

        <p style={sectionHeading}>{t('proceedings_preview_decisions_heading')}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '44px' }}>{t('proceedings_preview_col_sl')}</th>
              <th style={{ ...thStyle, width: '35%' }}>{t('proceedings_preview_col_agenda')}</th>
              <th style={thStyle}>{t('proceedings_preview_col_decisions')}</th>
            </tr>
          </thead>
          <tbody>
            {agendaItems.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600 }}>{item.heading}</span>
                  {item.description && (
                    <span style={{ display: 'block', fontSize: '10px', color: '#5a5a5a', marginTop: '2px' }}>
                      {item.description}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {item.proceedingsText
                    ? (typeof item.proceedingsText === 'object'
                        ? Object.entries(item.proceedingsText).filter(([,v]) => v.trim()).map(([k,v]) => `${k}: ${v}`).join('\n')
                        : item.proceedingsText)
                    : item.completed && summary
                    ? (idx === 0 ? summary : t('proceedings_preview_mock_summary'))
                    : <span style={{ color: '#9e9e9e', fontStyle: 'italic' }}>{t('proceedings_preview_no_proceedings')}</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={page}>
      {govtHeader}

      <p style={{ ...sectionHeading, marginTop: '16px' }}>{t('proceedings_preview_attendance_heading')}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '40px' }}>{t('proceedings_preview_col_sl')}</th>
            <th style={thStyle}>{t('proceedings_preview_col_name_desig')}</th>
            <th style={{ ...thStyle, width: '110px' }}>{t('proceedings_preview_col_attendance')}</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_ATTENDANCE.map((m, idx) => (
            <tr key={m.id}>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
              <td style={tdStyle}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: '#5a5a5a', marginLeft: '4px' }}>— {m.designation}</span>
              </td>
              <td style={{ ...tdStyle, color: m.status === 'present' ? '#2e7d32' : '#b71c1c', fontWeight: 500 }}>
                {m.status === 'present' ? t('proceedings_preview_present') : t('proceedings_preview_absent')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #c6c6c6' }}>
        {summary && (
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#5a3a2e', marginBottom: '6px', fontFamily: NS_FONT }}>
              {t('proceedings_preview_closing')}
            </p>
            <p style={{ fontSize: '11px', color: '#3b3b3b', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: NS_FONT }}>
              {summary}
            </p>
          </div>
        )}
        <p style={{ fontSize: '11px', fontFamily: NS_FONT }}>
          <strong>{t('proceedings_preview_next_meeting_label')}</strong>{' '}{nextLabel}
        </p>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '160px', borderBottom: '1px solid #1a1a1a', marginBottom: '4px' }} />
          <p style={{ fontSize: '11px', color: '#5a5a5a', fontFamily: NS_FONT }}>
            {t('proceedings_preview_chairperson_sig')}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '160px', borderBottom: '1px solid #1a1a1a', marginBottom: '4px' }} />
          <p style={{ fontSize: '11px', color: '#5a5a5a', fontFamily: NS_FONT }}>
            {t('proceedings_preview_pdo_sig')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const CURRENT_MEETING_ID = 2;

export default function SendToPresidentScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const meetingId: number | undefined = (location.state as { meetingId?: number } | null)?.meetingId;
  const { meetings, addMeeting, updateMeeting, meetingAgendas } = useMeetings();
  const currentMeeting = meetingId != null ? meetings.find(m => m.id === meetingId) : meetings.find(m => m.id === CURRENT_MEETING_ID);
  const { agendaItems } = useAgenda();

  const userAgendas = meetingId != null ? (meetingAgendas[meetingId] ?? null) : null;
  const effectiveAgendaItems = userAgendas
    ? userAgendas.map(a => ({ id: a.id, heading: a.title, description: a.description, completed: a.completed, proceedingsText: a.proceedingsText }))
    : agendaItems;
  const meetingTypeOptions = MEETING_TYPE_KEYS.map(k => t(k));

  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [tasks,   setTasks]   = useState<TaskItem[]>(() =>
    MOCK_TASK_KEYS.map(k => ({ id: k.id, text: t(k.textKey), assignee: t(k.assigneeKey), deadline: t(k.deadlineKey) }))
  );

  // Task modal state — null = closed, undefined id = adding new
  const [taskModal, setTaskModal] = useState<{ task?: TaskItem } | null>(null);

  const [nextMeetingType, setNextMeetingType] = useState('');
  const [nextMeetingDate, setNextMeetingDate] = useState('');
  const [nextMeetingTime, setNextMeetingTime] = useState('');

  const [showModal,   setShowModal]   = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [proceedingsPage, setProceedingsPage] = useState<1 | 2>(1);
  const [pdoSigned,   setPdoSigned]   = useState(false);
  const [pdoSignedAt, setPdoSignedAt] = useState('');
  const [signConfirmOpen, setSignConfirmOpen] = useState(false);

  function handlePdoSign() {
    const now = new Date();
    const ts = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setPdoSignedAt(ts);
    setPdoSigned(true);
    setSignConfirmOpen(false);
  }

  function removeTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function handleSaveTask(data: Omit<TaskItem, 'id'>) {
    if (taskModal?.task) {
      setTasks(prev => prev.map(t => t.id === taskModal.task!.id ? { ...t, ...data } : t));
    } else {
      setTasks(prev => [...prev, { id: Date.now(), ...data }]);
    }
    setTaskModal(null);
  }

  function handleConfirmSend() {
    updateMeeting(CURRENT_MEETING_ID, {
      status:         'pending_president',
      stepsCompleted: 5,
      tab:            'today',
    });

    if (nextMeetingType) {
      const isSameType = currentMeeting?.meetingType === nextMeetingType;
      addMeeting({
        name:               `${nextMeetingType} (Draft)`,
        mode:               isSameType ? (currentMeeting?.mode ?? 'IN PERSON') : 'IN PERSON',
        date:               nextMeetingDate || '',
        time:               nextMeetingTime || '',
        venue:              isSameType ? (currentMeeting?.venue ?? '') : '',
        participants:       isSameType ? (currentMeeting?.participants ?? 0) : 0,
        gpName:             currentMeeting?.gpName ?? 'Hosakote Gram Panchayat',
        electedQuorum:      currentMeeting?.electedQuorum ?? '51%',
        participantsQuorum: currentMeeting?.participantsQuorum ?? '10%',
        stepsCompleted:     0,
        tab:                'drafts',
        status:             'draft',
        meetingType:        nextMeetingType,
        chairperson:        currentMeeting?.chairperson,
        description:        currentMeeting?.description,
      });
    }

    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); navigate('/meetings/list'); }, 2500);
  }

  return (
    <>
      {/* Task modal */}
      {taskModal !== null && (
        <TaskModal
          initial={taskModal.task}
          onSave={handleSaveTask}
          onClose={() => setTaskModal(null)}
        />
      )}

      {showModal && (
        <ConfirmModal
          title={t('send_president_modal_title')}
          body={t('send_president_modal_body')}
          labelYes={t('send_president_modal_yes')}
          labelNo={t('send_president_modal_no')}
          onConfirm={handleConfirmSend}
          onCancel={() => setShowModal(false)}
        />
      )}
      {showSuccess && <SuccessBanner message={t('send_president_success_msg')} />}

      {/* PDO Sign Confirm Modal */}
      {signConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[500px] shadow-2xl flex flex-col">
            <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
              <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>{t('sign_confirm_title')}</span>
              <button type="button" onClick={() => setSignConfirmOpen(false)} className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0">
                <Icon name="close" size="small" color="#6a3e31" />
              </button>
            </div>
            <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[25px] pt-[20px] pb-[25px] flex flex-col gap-[20px]">
              <p className="text-[14px] leading-[22px] text-[#3b3b3b]" style={NS}>{t('sign_proceedings_confirm_body')}</p>
              <div className="bg-[#f7f0ee] rounded-[10px] px-[20px] py-[15px] flex flex-col gap-[10px]">
                <div className="flex items-center gap-[10px]">
                  <Icon name="person" size="small" color="#6a3e31" />
                  <span className="text-[14px] font-medium text-[#212121]" style={NS}>{t('sign_pdo_name')}</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Icon name="badge" size="small" color="#6a3e31" />
                  <span className="text-[13px] text-[#727272]" style={NS}>{t('sign_pdo_designation')}</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Icon name="calendar_today" size="small" color="#6a3e31" />
                  <span className="text-[13px] text-[#727272]" style={NS}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-[12px]">
                <Button variant="outlined" iconPlacement="none" text={t('sign_confirm_no')} onClick={() => setSignConfirmOpen(false)} />
                <Button variant="filled" iconPlacement="left" iconName="verified" text={t('sign_confirm_yes')} onClick={handlePdoSign} />
              </div>
            </div>
          </div>
        </div>
      )}

      <MeetingShellLayout
        stepperActiveState={5}
        backRoute="/meetings/closure-attendance"
        breadcrumbItems={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_send_president')]}
      >
              <MeetingDetailsCard
                variant="default-shortened"
                meetingTitle={t('mock_meeting_title')}
                modeOfMeeting={t('meeting_type_in_person')}
                date="7/02/2026"
                time="11:15 a.m"
                venue="HOSAKOTE GP office (1522007034027)"
                participants={`16 ${t('meeting_participants_label')}`}
              />

              {/* ── Meeting Summary ─────────────────────────────────────────── */}
              <SectionHolder
                variant="default"
                title={t('send_president_section_summary')}
                bodyClassName="px-[25px] pt-[16px] pb-[25px] flex flex-col gap-4"
              >
                <InfoBox type="plain" text={t('send_president_summary_hint')} />
                <div className="w-3/4">
                  <DescriptionField
                    label={t('send_president_summary_label')}
                    placeholder={t('send_president_summary_placeholder')}
                    value={summary}
                    onChange={setSummary}
                    autoFocus
                  />
                </div>
              </SectionHolder>


              {/* ── Proceedings Preview ────────────────────────────────────── */}
              <SectionHolder
                variant="default"
                title={t('proceedings_preview_section_title')}
                bodyClassName="px-[25px] pt-[16px] pb-[25px] flex flex-col gap-4"
              >
                <InfoBox
                  type="plain"
                  text={`${t('proceedings_preview_disclaimer')} ${t('proceedings_preview_disclaimer_en')}`}
                />
                <div className="max-w-[760px] mx-auto w-full flex flex-col gap-3">
                  {/* Page */}
                  <div className="shadow-[0_2px_12px_rgba(0,0,0,0.10)]">
                    <ProceedingsPreviewDocument
                      t={t}
                      meeting={currentMeeting}
                      agendaItems={effectiveAgendaItems}
                      summary={summary}
                      nextMeetingDate={nextMeetingDate}
                      nextMeetingType={nextMeetingType}
                      page={proceedingsPage}
                    />
                  </div>
                  {/* Pagination */}
                  <div className="flex items-center justify-center gap-[12px]">
                    <button
                      type="button"
                      disabled={proceedingsPage === 1}
                      onClick={() => setProceedingsPage(1)}
                      className="flex items-center justify-center size-[32px] rounded-full border border-[#c6c6c6] bg-white disabled:opacity-30 hover:bg-[#f5f0ee] transition-colors"
                    >
                      <Icon name="chevron_left" size="small" color="#6a3e31" />
                    </button>
                    <span
                      className="text-[12px] font-medium text-[#454545]"
                      style={NS}
                    >
                      {proceedingsPage} / 2
                    </span>
                    <button
                      type="button"
                      disabled={proceedingsPage === 2}
                      onClick={() => setProceedingsPage(2)}
                      className="flex items-center justify-center size-[32px] rounded-full border border-[#c6c6c6] bg-white disabled:opacity-30 hover:bg-[#f5f0ee] transition-colors"
                    >
                      <Icon name="chevron_right" size="small" color="#6a3e31" />
                    </button>
                  </div>
                </div>
              </SectionHolder>

              {/* ── Schedule Next Meeting ───────────────────────────────────── */}
              <SectionHolder
                variant="mandatory"
                title={t('send_president_section_next_meeting')}
                bodyClassName="px-[25px] pt-[16px] pb-[25px] flex flex-col gap-4"
              >
                <div className="flex gap-4 items-end">
                  <div className="flex-1 min-w-0">
                    <DropdownField
                      label={t('send_president_next_type_label')}
                      placeholder={t('send_president_next_type_placeholder')}
                      value={nextMeetingType}
                      onChange={setNextMeetingType}
                      options={meetingTypeOptions}
                      required
                      opensUp
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DatePicker
                      label={t('send_president_next_date_label')}
                      required
                      value={nextMeetingDate}
                      onChange={setNextMeetingDate}
                      placeholder={t('send_president_next_date_placeholder')}
                      opensUp
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TimePicker
                      label={t('send_president_next_time_label')}
                      required
                      value={nextMeetingTime}
                      onChange={setNextMeetingTime}
                      placeholder={t('send_president_next_time_placeholder')}
                      opensUp
                    />
                  </div>
                </div>
              </SectionHolder>

              {/* ── PDO Sign Section ───────────────────────────────────────── */}
              <SectionHolder
                variant="default"
                title={t('sign_pdo_section_title')}
                bodyClassName="px-[25px] pt-[16px] pb-[25px] flex flex-col gap-4"
              >
                {!pdoSigned ? (
                  <div className="flex flex-col gap-[12px] items-start">
                    <div className="flex flex-col gap-[2px]">
                      <p className="font-medium text-[14px] text-[#212121]" style={NS}>{t('sign_pdo_name')}</p>
                      <p className="text-[12px] text-[#727272]" style={NS}>{t('sign_pdo_designation')}</p>
                    </div>
                    <Button
                      variant="filled"
                      size="small"
                      iconPlacement="left"
                      iconName="draw"
                      text={t('btn_sign_proceedings')}
                      onClick={() => setSignConfirmOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-[12px]">
                    <div className="bg-[#e8f5e9] rounded-full size-[36px] flex items-center justify-center shrink-0">
                      <Icon name="check" size="small" color="#2e7d32" />
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <p className="font-medium text-[14px] text-[#212121]" style={NS}>{t('sign_pdo_name')}</p>
                      <p className="text-[12px] text-[#2e7d32]" style={NS}>{t('sign_proceedings_success_label')} · {pdoSignedAt}</p>
                    </div>
                  </div>
                )}
              </SectionHolder>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-[10px] mt-[20px]">
                <Button
                  variant="outlined"
                  iconPlacement="left"
                  iconName="arrow_back"
                  text={t('btn_previous')}
                  onClick={() => navigate('/meetings/closure-attendance', { state: { meetingId } })}
                />
                <Button
                  text={t('send_president_btn_end')}
                  variant="filled"
                  state={pdoSigned ? 'default' : 'disabled'}
                  iconPlacement="none"
                  onClick={() => pdoSigned && setShowModal(true)}
                />
              </div>
      </MeetingShellLayout>
    </>
  );
}
