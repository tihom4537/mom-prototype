import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import { useAgenda } from '../context/AgendaContext';
import type { ClosureRow, BiometricStatus } from '../context/MeetingsContext';
import {
  MeetingDetailsCard,
  SectionHolder,
  SearchInput,
  DropdownField,
  Button,
  Icon,
  QuorumBar,
  AttendancePill,
  Tooltip,
  InfoBox,
  CloseButton,
} from '../components';
import type { AttendanceStatus } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

const QUORUM_PERCENT   = 51;
const NO_BIOMETRIC_MAX = 2;

const ELECTED_DESIGNATIONS = ['President', 'Vice President', 'Ward Member'];
const isElected = (designation: string) =>
  ELECTED_DESIGNATIONS.some(d => designation.toLowerCase().startsWith(d.toLowerCase()));

const INITIAL: ClosureRow[] = [
  { id: 1,  name: 'Ramesh Kumar',  designation: 'PDO',            gpName: 'Kakanur GP',  phone: '9876543210', email: 'ramesh@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 2,  name: 'Savitha Gowda', designation: 'Secretary',      gpName: 'Kakanur GP',  phone: '9845123456', email: 'savitha@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 3,  name: 'Manjunath B.',  designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9741230987', email: 'manju@kgp.gov.in',    status: 'unmarked', biometric: 'none', reason: '' },
  { id: 4,  name: 'Lakshmi Devi',  designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9632014785', email: 'lakshmi@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 5,  name: 'Suresh Patil',  designation: 'President',      gpName: 'Kakanur GP',  phone: '9512345678', email: 'suresh@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 6,  name: 'Anitha Rao',    designation: 'Vice President', gpName: 'Kakanur GP',  phone: '9423567890', email: 'anitha@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 7,  name: 'Prakash Hegde', designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9334512678', email: 'prakash@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 8,  name: 'Kaveri S.',     designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9245631089', email: 'kaveri@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 9,  name: 'Nagesh M.',     designation: 'Ward Member',    gpName: 'Kakanur GP',  phone: '9156789023', email: 'nagesh@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 10, name: 'Bhavana Naik',  designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9067891234', email: 'bhavana@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 11, name: 'Raju Chandra',  designation: 'Ward Member',    gpName: 'Kakanur GP',  phone: '8978012345', email: 'raju@kgp.gov.in',     status: 'unmarked', biometric: 'none', reason: '' },
  { id: 12, name: 'Geetha Kumari', designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '8889123456', email: 'geetha@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
];

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;


// ─── AgendaVoteCard ───────────────────────────────────────────────────────────

function AgendaVoteCard({ index, heading, description, proceedings, vote, bordered = true, tAgreed, tDisagreed, tNone, tEmpty }: {
  index: number;
  heading: string;
  description?: string;
  proceedings: string;
  vote: 'agree' | 'disagree' | null;
  bordered?: boolean;
  tAgreed: string;
  tDisagreed: string;
  tNone: string;
  tEmpty: string;
}) {
  const wrapCls = bordered
    ? 'border border-[rgba(106,62,49,0.24)] rounded-[8px] px-[15px] py-[12px]'
    : 'px-[0px] pt-[0px] pb-[0px]';

  return (
    <div className={`flex flex-col gap-[8px] ${wrapCls}`}>
      {/* Agenda header row: number circle + heading/desc + vote pill */}
      <div className="flex items-center gap-[15px]">
        <div className="bg-[#efe0dc] flex items-center justify-center rounded-full size-[32px] shrink-0">
          <span className="font-medium text-[14px] text-[#6a3e31] text-center" style={NS}>{index}</span>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-medium text-[14px] text-[#4b4b4b] leading-6" style={NS}>{heading}</span>
        </div>
        {/* Vote pill */}
        {vote === 'agree' && (
          <div className="flex items-center gap-[4px] shrink-0 rounded-full px-[10px] py-[4px] bg-[rgba(46,125,50,0.10)]">
            <Icon name="check" size="small" color="#2e7d32" />
            <span className="text-[11px] font-medium text-[#2e7d32] whitespace-nowrap" style={NS}>{tAgreed}</span>
          </div>
        )}
        {vote === 'disagree' && (
          <div className="flex items-center gap-[4px] shrink-0 rounded-full px-[10px] py-[4px] bg-[rgba(198,40,40,0.10)]">
            <Icon name="close" size="small" color="#c62828" />
            <span className="text-[11px] font-medium text-[#c62828] whitespace-nowrap" style={NS}>{tDisagreed}</span>
          </div>
        )}
        {vote === null && (
          <div className="flex items-center gap-[4px] shrink-0 rounded-full px-[10px] py-[4px] bg-[rgba(113,113,113,0.10)]">
            <span className="text-[11px] font-medium text-[#727272] whitespace-nowrap" style={NS}>{tNone}</span>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── BiometricModal ───────────────────────────────────────────────────────────

interface BiometricModalProps {
  row: ClosureRow;
  agendaItems: { id: number; heading: string; description?: string; proceedingsText: string | Record<string,string> }[];
  savedVotes: Record<number, { id: number; vote: 'agree' | 'disagree' | null }[]>;
  onClose: () => void;
  onTakeBiometric: (id: number) => void;
}

function BiometricModal({ row, agendaItems, savedVotes, onClose, onTakeBiometric }: BiometricModalProps) {
  const { t, tDesignation } = useLanguage();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isTaken = row.biometric === 'taken';

  useEffect(() => {
    if (!isTaken) return;
    const timer = setTimeout(onClose, 1500);
    return () => clearTimeout(timer);
  }, [isTaken, onClose]);
  const isFailed = row.biometric === 'failed';
  const isPending = row.biometric === 'pending';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col w-[1000px] max-w-[92vw] max-h-[88vh] rounded-[20px] shadow-2xl bg-white overflow-hidden">

        {/* Header */}
        <div className="bg-white flex items-center justify-between px-[25px] py-[15px] border-b border-[#c6c6c6] shrink-0 rounded-t-[20px]">
          <p className="text-[20px] font-semibold text-[#6a3e31] leading-[24px]" style={NS}>{t('bio_modal_title')}</p>
          <CloseButton onClick={onClose} />
        </div>

        {/* Body */}
        <div className="bg-white flex-1 overflow-y-auto px-[30px] py-[25px] flex flex-col gap-[0px]">
          {/* Member identity box */}
          <div className="flex items-center gap-[14px] bg-[#f5f5f5] rounded-[10px] px-[18px] py-[14px] mb-[24px]">
            <Icon name="person" size="large" color="#9e9e9e" />
            <div className="flex flex-col">
              <span className="text-[17px] font-semibold text-[#6a3e31] leading-[22px]" style={NS}>{row.name}</span>
              <span className="text-[13px] text-[#4b4b4b] leading-[18px]" style={NS}>{tDesignation(row.designation)}</span>
            </div>
          </div>
          {/* Overview bar */}
          {(() => {
            const total = agendaItems.length;
            const agreed = agendaItems.filter(a => {
              const p = (savedVotes[a.id] ?? []).find(p => p.id === row.id);
              return p?.vote === 'agree';
            }).length;
            const disagreed = agendaItems.filter(a => {
              const p = (savedVotes[a.id] ?? []).find(p => p.id === row.id);
              return p?.vote === 'disagree';
            }).length;
            return (
              <div className="flex items-center gap-[20px] bg-[rgba(106,62,49,0.05)] rounded-[10px] px-[20px] py-[12px] mb-[24px]">
                <div className="flex items-center gap-[5px]">
                  <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{t('bio_modal_overview_total')}:</span>
                  <span className="text-[14px] font-bold text-[#6a3e31]" style={NS}>{total}</span>
                </div>
                <div className="w-px h-[20px] bg-[rgba(106,62,49,0.2)]" />
                <div className="flex items-center gap-[5px]">
                  <Icon name="check" size="small" color="#2e7d32" />
                  <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{t('bio_modal_overview_agreed')}:</span>
                  <span className="text-[14px] font-bold text-[#2e7d32]" style={NS}>{agreed}</span>
                </div>
                <div className="w-px h-[20px] bg-[rgba(106,62,49,0.2)]" />
                <div className="flex items-center gap-[5px]">
                  <Icon name="close" size="small" color="#c62828" />
                  <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{t('bio_modal_overview_disagreed')}:</span>
                  <span className="text-[14px] font-bold text-[#c62828]" style={NS}>{disagreed}</span>
                </div>
              </div>
            );
          })()}
          <p className="text-[13px] font-semibold text-[#4b4b4b] mb-[20px]" style={NS}>{t('bio_modal_agendas_label')}</p>
          {agendaItems.map((agenda, idx) => {
            const participants = savedVotes[agenda.id] ?? [];
            const participant = participants.find(p => p.id === row.id);
            const vote = participant?.vote ?? null;
            return (
              <div key={agenda.id}>
                <AgendaVoteCard
                  index={idx + 1}
                  heading={agenda.heading}
                  description={agenda.description}
                  proceedings={typeof agenda.proceedingsText === 'object' ? Object.entries(agenda.proceedingsText).filter(([,v]) => v.trim()).map(([k,v]) => `${k}: ${v}`).join('\n') : agenda.proceedingsText}
                  vote={vote}
                  bordered={false}
                  tAgreed={t('bio_modal_vote_agreed')}
                  tDisagreed={t('bio_modal_vote_disagreed')}
                  tNone={t('bio_modal_vote_none')}
                  tEmpty={t('bio_modal_proceedings_empty')}
                />
                {idx < agendaItems.length - 1 && (
                  <div className="border-b border-[#c6c6c6] mt-[14px] mb-[14px]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[#c6c6c6] px-[25px] py-[18px] shrink-0 flex flex-col gap-[10px] rounded-b-[20px]">
          {/* CTA row */}
          <div className="flex flex-col items-center gap-[8px]">
            <div className="flex items-center justify-center gap-[10px]">
              <Button variant="grey-outlined" text={t('btn_close')} onClick={onClose} />
              <Button
                variant="filled"
                iconPlacement="left"
                iconName="fingerprint"
                text={isTaken ? t('bio_modal_btn_taken') : t('bio_modal_btn_take')}
                state={isTaken ? 'disabled' : 'default'}
                onClick={isTaken ? undefined : () => onTakeBiometric(row.id)}
              />
            </div>
            {isTaken && (
              <div className="flex items-center gap-[6px]">
                <Icon name="check_circle" size="small" color="#2e7d32" />
                <span className="text-[12px] font-medium text-[#2e7d32]" style={NS}>{t('bio_modal_msg_taken')}</span>
              </div>
            )}
            {isFailed && (
              <div className="flex items-center gap-[6px]">
                <Icon name="error" size="small" color="#c62828" />
                <span className="text-[12px] font-medium text-[#c62828]" style={NS}>{t('bio_modal_msg_failed')}</span>
              </div>
            )}
            {isPending && (
              <div className="flex items-center gap-[6px]">
                <Icon name="warning" size="small" color="#f57f17" />
                <span className="text-[12px] font-medium text-[#f57f17]" style={NS}>{t('bio_modal_msg_pending')}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


// ─── Biometric cell ───────────────────────────────────────────────────────────

function BiometricCell({ status, biometric, onTake, tBioTake, tBioTaken, tBioPending, tBioFailed, tRetry }: {
  status: AttendanceStatus;
  biometric: BiometricStatus;
  onTake: () => void;
  tBioTake: string;
  tBioTaken: string;
  tBioPending: string;
  tBioFailed: string;
  tRetry: string;
}) {
  if (status !== 'present') return <span className="text-[12px] text-[#c6c6c6]" style={NS}>—</span>;

  if (biometric === 'none') {
    return (
      <button
        type="button"
        onClick={onTake}
        className="text-[13px] text-[#6a3e31] underline decoration-[#6a3e31] underline-offset-[2px] hover:text-[#ae6651] transition-colors"
        style={NS}
      >
        {tBioTake}
      </button>
    );
  }

  if (biometric === 'taken') return (
    <div className="flex items-center gap-[5px]">
      <Icon name="fingerprint" size="small" color="#2e7d32" />
      <span className="text-[13px] font-medium text-[#2e7d32]" style={NS}>{tBioTaken}</span>
    </div>
  );

  if (biometric === 'pending') return (
    <div className="flex items-center gap-[5px]">
      <Icon name="fingerprint" size="small" color="#f57f17" />
      <span className="text-[13px] font-medium text-[#f57f17]" style={NS}>{tBioPending}</span>
    </div>
  );

  // failed
  return (
    <div className="flex items-center gap-[5px]">
      <Icon name="fingerprint" size="small" color="#c62828" />
      <span className="text-[13px] font-medium text-[#c62828]" style={NS}>{tBioFailed}</span>
      <button type="button" onClick={onTake} className="flex items-center justify-center ml-[2px] hover:opacity-70 transition-opacity" title={tRetry}>
        <Icon name="refresh" size="small" color="#ae6651" />
      </button>
    </div>
  );
}


// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AttendanceScreenV2() {
  const { t, tDesignation } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const meetingId: number | undefined = (location.state as { meetingId?: number } | null)?.meetingId;
  const { meetings, updateMeeting, openingAbsentIds, closureRows, setClosureRows, savedVotes, meetingAgendas } = useMeetings();
  const { agendaItems: globalAgendaItems } = useAgenda();
  const isClosureRoute = pathname === '/meetings/closure-attendance';
  const currentMeeting = meetingId != null ? meetings.find(m => m.id === meetingId) : undefined;
  // Closure attendance is step 4 — once proceeded past (stepsCompleted >= 4), never celebrate again.
  const celebrationLocked = (currentMeeting?.stepsCompleted ?? 0) >= 4;

  const [biometricModalRow, setBiometricModalRow] = useState<ClosureRow | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [permissionFiles, setPermissionFiles] = useState<Record<number, File | null>>({});
  const permFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const FILTERED_INITIAL = INITIAL.filter(r => !openingAbsentIds.has(r.id));
  const rows = closureRows ?? FILTERED_INITIAL;
  function setRows(updater: ClosureRow[] | ((prev: ClosureRow[]) => ClosureRow[])) {
    const next = typeof updater === 'function' ? updater(rows) : updater;
    setClosureRows(next);
  }

  const total    = rows.length;
  const present  = rows.filter(r => r.status === 'present').length;
  const absent   = rows.filter(r => r.status === 'absent').length;
  const unmarked = rows.filter(r => r.status === 'unmarked').length;
  // Present members who have NOT taken biometric (the exempted ones — capped at NO_BIOMETRIC_MAX)
  const noBiometricCount = rows.filter(r => r.status === 'present' && r.biometric === 'none').length;
  const electedRows    = rows.filter(r => isElected(r.designation));
  const electedTotal   = electedRows.length;
  const electedPresent = electedRows.filter(r => r.status === 'present').length;
  const quorumPct  = electedTotal > 0 ? Math.round((electedPresent / electedTotal) * 100) : 0;
  const quorumMet  = quorumPct >= QUORUM_PERCENT;
  const allMarked        = unmarked === 0;
  const biometricValid   = noBiometricCount <= NO_BIOMETRIC_MAX;
  const canProceed       = allMarked && quorumMet && biometricValid;

  function update(id: number, patch: Partial<ClosureRow>) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  function markStatus(id: number, s: 'present' | 'absent' | 'unmarked') {
    const row = rows.find(r => r.id === id);
    const next = (s !== 'unmarked' && row?.status === s) ? 'unmarked' : s;
    update(id, { status: next, biometric: 'none', reason: '' });
  }

  function openBiometricModal(id: number) {
    const row = rows.find(r => r.id === id)!;
    setBiometricModalRow(row);
  }

  function handleCaptureBiometric(id: number) {
    const row = rows.find(r => r.id === id)!;
    if (row.biometric === 'none') {
      // Demo: cycle by id; at limit force taken
      const noBioOthers = rows.filter(r => r.id !== id && r.status === 'present' && (r.biometric === 'pending' || r.biometric === 'failed')).length;
      const result: BiometricStatus = noBioOthers >= NO_BIOMETRIC_MAX ? 'taken' : id % 3 === 0 ? 'failed' : id % 2 === 0 ? 'pending' : 'taken';
      update(id, { biometric: result });
      setBiometricModalRow(prev => prev ? { ...prev, biometric: result } : null);
    } else if (row.biometric === 'failed') {
      update(id, { biometric: 'taken' });
      setBiometricModalRow(prev => prev ? { ...prev, biometric: 'taken' } : null);
    }
  }

  const allPresent = rows.every(r => r.status === 'present');
  function markAllPresent() {
    setRows(prev => prev.map(r => ({ ...r, status: 'present' as AttendanceStatus, biometric: 'none' as BiometricStatus, reason: '' })));
  }

  function unmarkAll() {
    setRows(prev => prev.map(r => ({ ...r, status: 'unmarked' as AttendanceStatus, biometric: 'none' as BiometricStatus, reason: '' })));
  }

  const F_PRESENT      = t('attendance_filter_present');
  const F_ABSENT       = t('attendance_filter_absent');
  const F_UNMARKED     = t('attendance_filter_unmarked');
  const F_NO_BIOMETRIC = t('attendance_filter_no_biometric');
  const filterOptions  = [t('attendance_filter_all'), F_PRESENT, F_ABSENT, F_UNMARKED, F_NO_BIOMETRIC];

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === F_PRESENT)      list = list.filter(r => r.status === 'present');
    if (filter === F_ABSENT)       list = list.filter(r => r.status === 'absent');
    if (filter === F_UNMARKED)     list = list.filter(r => r.status === 'unmarked');
    if (filter === F_NO_BIOMETRIC) list = list.filter(r => r.status === 'present' && (r.biometric === 'pending' || r.biometric === 'failed'));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.designation.toLowerCase().includes(q) || r.gpName.toLowerCase().includes(q));
    }
    return list;
  }, [rows, filter, search, F_PRESENT, F_ABSENT, F_UNMARKED, F_NO_BIOMETRIC]);

  function accentColor(status: AttendanceStatus, hovered = false) {
    if (status === 'present') return '#2e7d32';
    if (status === 'absent')  return '#FFAC9A';
    return hovered ? '#e0e0e0' : 'white';
  }

  // Reason required: absent members, OR present members with unresolved/no biometric
  function showReason(row: ClosureRow) {
    return row.status === 'absent' || (row.status === 'present' && (row.biometric === 'none' || row.biometric === 'pending' || row.biometric === 'failed'));
  }

  const atBiometricLimit = noBiometricCount >= NO_BIOMETRIC_MAX;

  // Agenda items for modal: use per-meeting store if present, else global (demo) agendas
  const userMeetingAgendas = meetingId != null ? (meetingAgendas[meetingId] ?? null) : null;
  const effectiveModalAgendas = userMeetingAgendas
    ? userMeetingAgendas.map(a => ({ id: a.id, heading: a.title, description: a.description, proceedingsText: a.proceedingsText }))
    : globalAgendaItems.map(a => ({ id: a.id, heading: a.heading, description: a.description, proceedingsText: a.proceedingsText }));

  // Flatten savedVotes for modal lookup: Record<agendaId, {id, vote}[]>
  const flatVotes: Record<number, { id: number; vote: 'agree' | 'disagree' | null }[]> = {};
  Object.entries(savedVotes).forEach(([agendaId, participants]) => {
    flatVotes[Number(agendaId)] = participants.map(p => ({ id: p.id, vote: p.vote }));
  });

  return (
    <>
      {/* Biometric modal */}
      {biometricModalRow && (
        <BiometricModal
          row={biometricModalRow}
          agendaItems={effectiveModalAgendas}
          savedVotes={flatVotes}
          onClose={() => setBiometricModalRow(null)}
          onTakeBiometric={handleCaptureBiometric}
        />
      )}

      <MeetingShellLayout
        stepperActiveState={4}
        backRoute="/meetings/proceedings-review"
        breadcrumbItems={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_closure_attendance')]}
      >
              <MeetingDetailsCard
                variant="default-shortened"
                meetingTitle={t('mock_meeting_title')}
                modeOfMeeting={t('meeting_type_in_person')}
                date="19/03/2026"
                time="10:00 a.m"
                venue="Kakanur GP Office (1501001003)"
                participants={`${total} ${t('meeting_participants_label')}`}
              />

              <SectionHolder
                variant="with-tag"
                title={t(isClosureRoute ? 'attendance_closure_section_title' : 'attendance_section_title')}
                tagText={`${total} ${t('review_viz_participants')}`}
                bodyClassName="px-[25px] pt-[20px] pb-[30px] flex flex-col gap-[16px]"
              >
                <InfoBox type="plain" text={t('attendance_hint')} />

                {/* Summary bar */}
                <QuorumBar
                  total={electedTotal} present={electedPresent} absent={electedTotal - electedPresent} unmarked={electedRows.filter(r => r.status === 'unmarked').length}
                  noBiometricCount={noBiometricCount} quorumPct={quorumPct} quorumMet={quorumMet}
                  quorumRequired={QUORUM_PERCENT}
                  celebrationLocked={celebrationLocked}
                />

                {/* Search + filter */}
                <div className="flex items-center justify-between w-full">
                  <SearchInput value={search} onChange={setSearch} placeholder={t('attendance_search_placeholder')} className="w-[240px]" />
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[12px] font-medium leading-[16px] tracking-[0.5px] text-[#6f6f6f] whitespace-nowrap" style={NS}>{t('attendance_filter_label')}</span>
                    <DropdownField value={filter} onChange={setFilter} options={filterOptions} placeholder="All" className="w-[150px]" />
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-[6px] border border-[#c6c6c6] overflow-hidden">
                <table
                  className="w-full"
                  style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
                >
                  <colgroup>
                    <col style={{ width: '50px' }} />
                    <col style={{ width: '155px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '210px' }} />
                    <col style={{ width: '210px' }} />
                    <col style={{ width: '210px' }} />
                  </colgroup>

                  <thead>
                    <tr className="bg-[#ddd]">
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle" style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid', borderLeftColor: '#dddddd' }}>
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_sl')}</span>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_name_designation')}</span>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_gp')}</span>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_phone')}</span>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_email')}</span>
                      </th>
                      <th className="px-[12px] py-[8px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal shrink-0" style={NS}>{t('attendance_col_attendance')}</span>
                          <button
                            type="button"
                            onClick={allPresent ? unmarkAll : markAllPresent}
                            className="flex items-center gap-[3px] px-[6px] py-[3px] rounded-[5px] border border-[#388e3c] text-[#388e3c] text-[10px] font-medium bg-white hover:bg-[#e8f5e9] transition-colors whitespace-nowrap shrink-0"
                            style={NS}
                          >
                            <Icon name="check" size="small" color="#388e3c" />
                            {allPresent ? t('attendance_clear_all') : t('attendance_mark_all_present')}
                          </button>
                        </div>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <div className="flex flex-col gap-[2px]">
                          <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_biometric')}</span>
                          <span className={`text-[10px] leading-[13px] whitespace-nowrap font-normal ${atBiometricLimit ? 'text-[#c62828]' : 'text-[#727272]'}`} style={NS}>{t('attendance_biometric_limit')}</span>
                        </div>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-[#c6c6c6] align-middle">
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_reason')}</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[12px] text-[#727272] bg-white" style={NS}>
                          {t('attendance_no_match')}
                        </td>
                      </tr>
                    ) : filtered.map((row, idx) => {
                      const isHovered = hoveredRow === row.id;
                      const hoverCls = isHovered ? 'bg-[#f5f5f5]' : '';
                      const bb = idx < filtered.length - 1 ? 'border-b border-[#e8e8e8]' : '';
                      return (
                      <tr key={row.id} className={`bg-white transition-colors ${hoverCls}`} onMouseEnter={() => setHoveredRow(row.id)} onMouseLeave={() => setHoveredRow(null)} onMouseDown={() => setHoveredRow(null)}>
                        <td
                          className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle transition-colors ${hoverCls} ${bb}`}
                          style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid', borderLeftColor: accentColor(row.status, isHovered) }}
                        >
                          <span className="text-[12px] text-[#4b4b4b]" style={NS}>{row.id}</span>
                        </td>
                        <td className={`px-[12px] py-[8px] border-r border-[#e8e8e8] align-middle transition-colors ${hoverCls} ${bb}`}>
                          <span className="text-[12px] font-medium text-[#212121] leading-5 block" style={NS}>{row.name}</span>
                          <span className="text-[11px] text-[#727272] leading-4 block" style={NS}>{tDesignation(row.designation)}</span>
                        </td>
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle transition-colors ${hoverCls} ${bb}`}>
                          <span className="text-[12px] text-[#4b4b4b]" style={NS}>{row.gpName}</span>
                        </td>
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle transition-colors ${hoverCls} ${bb}`}>
                          <span className="text-[12px] text-[#4b4b4b]" style={NS}>{row.phone}</span>
                        </td>
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle transition-colors ${hoverCls} ${bb}`}>
                          <span className="text-[12px] text-[#4b4b4b] truncate block w-full overflow-hidden" style={NS}>{row.email}</span>
                        </td>
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle transition-colors ${hoverCls} ${bb}`}>
                          <AttendancePill status={row.status} onMark={(s: 'present' | 'absent') => markStatus(row.id, s)} onUnmark={() => markStatus(row.id, 'unmarked')} />
                        </td>
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle transition-colors ${hoverCls} ${bb}`}>
                          <BiometricCell
                            status={row.status}
                            biometric={row.biometric}
                            onTake={() => openBiometricModal(row.id)}
                            tBioTake={t('attendance_biometric_take')}
                            tBioTaken={t('attendance_biometric_taken')}
                            tBioPending={t('attendance_biometric_pending')}
                            tBioFailed={t('attendance_biometric_failed')}
                            tRetry={t('attendance_biometric_retry')}
                          />
                        </td>
                        <td className={`px-[8px] align-middle transition-colors ${hoverCls} ${bb}`}>
                          {showReason(row) ? (
                            <div className="flex flex-col gap-[4px] py-[6px]">
                              {row.status === 'absent' ? (
                                <>
                                  <DropdownField
                                    value={row.reason === 'with_permission' ? t('attendance_absent_with_permission') : row.reason === 'without_permission' ? t('attendance_absent_without_permission') : ''}
                                    onChange={val => update(row.id, { reason: val === t('attendance_absent_with_permission') ? 'with_permission' : val === t('attendance_absent_without_permission') ? 'without_permission' : '' })}
                                    options={[t('attendance_absent_with_permission'), t('attendance_absent_without_permission')]}
                                    placeholder={t('attendance_absent_select')}
                                  />
                                  {row.reason === 'with_permission' && (
                                    <div className="flex items-center gap-[6px]">
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        ref={el => { permFileRefs.current[row.id] = el; }}
                                        onChange={e => {
                                          const file = e.target.files?.[0] ?? null;
                                          setPermissionFiles(prev => ({ ...prev, [row.id]: file }));
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => permFileRefs.current[row.id]?.click()}
                                        className="flex items-center gap-[4px] text-[11px] text-[#6a3e31] border border-[#6a3e31] rounded-[6px] px-[8px] py-[3px] hover:bg-[#f7f0ee] transition-colors"
                                        style={NS}
                                      >
                                        <Icon name="upload" size="small" color="#6a3e31" />
                                        {permissionFiles[row.id] ? permissionFiles[row.id]!.name : t('attendance_upload_permission')}
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <DropdownField
                                    value={
                                      row.reason === 'device_failure' ? t('no_bio_reason_device_failure') :
                                      row.reason === 'technical_issue' ? t('no_bio_reason_technical_issue') :
                                      row.reason === 'member_exempt' ? t('no_bio_reason_member_exempt') :
                                      row.reason === 'other' ? t('no_bio_reason_other') : ''
                                    }
                                    onChange={val => update(row.id, {
                                      reason:
                                        val === t('no_bio_reason_device_failure') ? 'device_failure' :
                                        val === t('no_bio_reason_technical_issue') ? 'technical_issue' :
                                        val === t('no_bio_reason_member_exempt') ? 'member_exempt' :
                                        val === t('no_bio_reason_other') ? 'other' : ''
                                    })}
                                    options={[t('no_bio_reason_device_failure'), t('no_bio_reason_technical_issue'), t('no_bio_reason_member_exempt'), t('no_bio_reason_other')]}
                                    placeholder={t('attendance_reason_no_biometric')}
                                  />
                                  {row.reason !== '' && (
                                    <div className="flex items-center gap-[6px]">
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        ref={el => { permFileRefs.current[row.id] = el; }}
                                        onChange={e => {
                                          const file = e.target.files?.[0] ?? null;
                                          setPermissionFiles(prev => ({ ...prev, [row.id]: file }));
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => permFileRefs.current[row.id]?.click()}
                                        className="flex items-center gap-[4px] text-[11px] text-[#6a3e31] border border-[#6a3e31] rounded-[6px] px-[8px] py-[3px] hover:bg-[#f7f0ee] transition-colors"
                                        style={NS}
                                      >
                                        <Icon name="upload" size="small" color="#6a3e31" />
                                        {permissionFiles[row.id] ? permissionFiles[row.id]!.name : t('attendance_upload_biometric_proof')}
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#c6c6c6] px-[4px]" style={NS}>—</span>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                {!canProceed && !allMarked && (
                  <InfoBox type="plain" text={`${unmarked} ${unmarked > 1 ? t('attendance_not_yet_marked_plural') : t('attendance_not_yet_marked_singular')}`} />
                )}

              </SectionHolder>

              <div className="flex items-center justify-center gap-[10px] mt-[20px]">
                <Button
                  variant="outlined"
                  iconPlacement="left"
                  iconName="arrow_back"
                  text={t('btn_previous')}
                  onClick={() => navigate('/meetings/proceedings-review', { state: { meetingId } })}
                />
                <Button
                  variant="filled"
                  iconPlacement="right"
                  iconName="arrow_forward"
                  text={t('btn_proceed_next')}
                  state={canProceed ? 'default' : 'disabled'}
                  onClick={canProceed ? () => {
                    if (isClosureRoute && meetingId != null && (currentMeeting?.stepsCompleted ?? 0) < 4) {
                      updateMeeting(meetingId, { stepsCompleted: 4 });
                    }
                    navigate(isClosureRoute ? '/meetings/send-to-president' : '/agenda-list', { state: { meetingId } });
                  } : undefined}
                />
              </div>
      </MeetingShellLayout>
    </>
  );
}
