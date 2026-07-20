import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import { registerPageNarrator, unregisterPageNarrator } from '../data/pageSummaries';
import { buildMeetingListNarrative } from '../utils/narratives';
import {
  MeetingDetailsTag,
  MeetingDetailsCard,
  SmallDetailsText,
  Button,
  Icon,
  SectionHolder,
  DashboardMenuBarItem,
  StatusBadge,
  SearchInput,
  DropdownField,
  DatePicker,
} from '../components';
import TimePicker from '../components/TimePicker';
import type { NumberCircleType } from '../components';
import type { MeetingData, MeetingTab } from '../context/MeetingsContext';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import ModalShell from '../components/ModalShell';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCircleType(stepNum: number, stepsCompleted: number): NumberCircleType {
  if (stepNum <= stepsCompleted) return 'small-card';
  if (stepNum === stepsCompleted + 1) return 'current';
  return 'greyed-out';
}

const EDIT_WINDOW_DAYS = 2;

// Meeting ids are Date.now() at scheduling time (see addMeeting) — reuse as the "scheduled at" timestamp.
// Returns how many whole days of the edit window remain (0 or negative once the window has closed).
function editDaysLeft(meetingId: number): number {
  const scheduledAt = new Date(meetingId); scheduledAt.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysSinceScheduled = Math.round((today.getTime() - scheduledAt.getTime()) / 86_400_000);
  return EDIT_WINDOW_DAYS - daysSinceScheduled;
}

function getCtaKey(tab: MeetingTab, stepsCompleted: number): string {
  if (tab === 'past') return 'btn_view_meeting';
  if (tab === 'cancelled') return 'btn_view_meeting';
  if (stepsCompleted === 0) return 'btn_start_meeting';
  if (stepsCompleted === 1) return 'btn_add_proceedings_list';
  if (stepsCompleted === 2) return 'btn_review_proceedings';
  if (stepsCompleted === 3) return 'btn_closure_attendance';
  if (stepsCompleted === 4) return 'btn_send_approval';
  return 'btn_view_meeting';
}

// Actions per tab — returns array of { key, disabled? }
function getActions(tab: MeetingTab): Array<{ key: string; disabled?: boolean }> {
  if (tab === 'past') return [
    { key: 'action_view_meeting_notice' },
    { key: 'action_view_proceedings' },
    { key: 'action_print_proceedings' },
    { key: 'action_remarks' },
  ];
  if (tab === 'upcoming') return [
    { key: 'action_view_notice' },
    { key: 'action_adjourn_meeting' },
    { key: 'action_cancel_meeting' },
  ];
  if (tab === 'today') return [
    { key: 'action_view_notice' },
    { key: 'action_adjourn_meeting' },
    { key: 'action_cancel_meeting' },
  ];
  if (tab === 'drafts') return [
    { key: 'action_view_notice' },
    { key: 'action_edit_view' },
    { key: 'action_delete_meeting' },
  ];
  // cancelled — placeholder, user will specify later
  return [];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MeetingListScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { meetings, updateMeeting } = useMeetings();

  const [activeTab,      setActiveTab]      = useState<MeetingTab>('today');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchInput,    setSearchInput]    = useState('');
  const [filterType,     setFilterType]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');

  // Action modals
  const [adjournModalMeeting, setAdjournModalMeeting] = useState<MeetingData | null>(null);
  const [cancelModalMeeting,  setCancelModalMeeting]  = useState<MeetingData | null>(null);

  function handleAction(meeting: MeetingData, key: string) {
    if (key === 'action_view_notice' || key === 'action_view_meeting_notice') {
      navigate(`/meetings/view-notice/${meeting.id}`);
    } else if (key === 'action_adjourn_meeting') {
      setAdjournModalMeeting(meeting);
    } else if (key === 'action_cancel_meeting') {
      setCancelModalMeeting(meeting);
    }
  }

  // Derive display status from stepsCompleted (used for filter matching)
  const deriveStatus = (m: MeetingData): string => {
    if (m.tab === 'cancelled') return t('meeting_status_cancelled');
    if (m.stepsCompleted >= 5)  return t('meeting_status_completed');
    if (m.stepsCompleted >= 4)  return t('meeting_status_president_sign');
    if (m.stepsCompleted >= 1)  return t('meeting_status_in_progress');
    return t('meeting_status_scheduled');
  };

  // Status options that can actually occur per tab — upcoming meetings haven't
  // started (always "Scheduled"), past meetings are wrapping up or done, and
  // drafts/cancelled tabs have no meaningful status filter (every row already
  // shares the one implicit status), so the dropdown is hidden for those.
  const STATUS_OPTIONS_BY_TAB: Partial<Record<MeetingTab, string[]>> = {
    upcoming: [t('meeting_status_scheduled')],
    past:     [t('meeting_status_president_sign'), t('meeting_status_completed')],
  };
  const statusOptions = STATUS_OPTIONS_BY_TAB[activeTab];

  const allTabs: Array<{ key: MeetingTab; labelKey: string }> = [
    { key: 'today',     labelKey: 'tab_today'     },
    { key: 'upcoming',  labelKey: 'tab_upcoming'  },
    { key: 'past',      labelKey: 'tab_past'      },
    { key: 'drafts',    labelKey: 'tab_drafts'    },
    { key: 'cancelled', labelKey: 'tab_cancelled' },
  ];

  const stepKeys       = ['meeting_step_1', 'meeting_step_2', 'meeting_step_3', 'meeting_step_4', 'meeting_step_5'];
  const createStepKeys = ['stepper_step1', 'stepper_step2', 'stepper_step3'];
  const countFor = (tab: MeetingTab) => meetings.filter((m: MeetingData) => m.tab === tab).length;

  // Convert DD/MM/YYYY → YYYY-MM-DD for comparison
  const toISO = (dmy: string) => { const [d, mo, y] = dmy.split('/'); return `${y}-${mo}-${d}`; };

  const visible = meetings.filter((m: MeetingData) => {
    if (m.tab !== activeTab) return false;
    if (activeTab === 'today') return true; // no filter/search bar on Today tab
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType && m.meetingType !== filterType) return false;
    if (filterStatus && deriveStatus(m) !== filterStatus) return false;
    if (filterDateFrom) { try { if (m.date < toISO(filterDateFrom)) return false; } catch {} }
    if (filterDateTo)   { try { if (m.date > toISO(filterDateTo))   return false; } catch {} }
    return true;
  });

  const hasActiveFilters = searchInput || searchQuery || filterType || filterStatus || filterDateFrom || filterDateTo;

  // Unique meeting types for filter dropdown
  const meetingTypeOptions = Array.from(
    new Set(meetings.map((m: MeetingData) => m.meetingType).filter(Boolean))
  ) as string[];

  useEffect(() => {
    registerPageNarrator('/meetings/list', () =>
      buildMeetingListNarrative({
        todayCount:     countFor('today'),
        upcomingCount:  countFor('upcoming'),
        pastCount:      countFor('past'),
        draftCount:     countFor('drafts'),
        cancelledCount: countFor('cancelled'),
        activeTab,
        activeTabCount: visible.length,
      })
    );
    return () => unregisterPageNarrator('/meetings/list');
  }, [activeTab, meetings]);

  return (
    <MeetingShellLayout
      stepperActiveState={1}
      showStepper={false}
      showBack={false}
      breadcrumbItems={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_meeting_list')]}
    >
      <div role="main">
      <h1 className="sr-only">Meeting List</h1>
      <SectionHolder
        variant="with-description"
        title={t('meeting_list_heading')}
        subtitle={t('meeting_list_subtext')}
        bodyClassName="px-[25px] pt-[20px] pb-[30px]"
      >
        {/* Tab bar */}
        <div className="flex items-end gap-[20px]">
          {allTabs.map(({ key, labelKey }) => (
            <DashboardMenuBarItem
              key={key}
              text={t(labelKey)}
              count={countFor(key)}
              state={activeTab === key ? 'selected' : 'default'}
              badgeVariant="neutral"
              onClick={() => { setActiveTab(key); setFilterStatus(''); }}
            />
          ))}
        </div>

        {/* Divider */}
        <hr className="border-t border-[#e6e6e6] w-full mb-[28px] mt-0" />

        {/* Filter bar — hidden on Today tab, not needed there */}
        {activeTab !== 'today' && (
          <div className="flex gap-[12px] items-end mb-[32px] justify-between">
            {/* Left: filter dropdowns + dates */}
            <div className="flex gap-[12px] items-end flex-wrap">
              <div className="w-[180px] shrink-0">
                <DropdownField
                  label={t('meeting_list_filter_type_label')}
                  placeholder={t('meeting_list_filter_type')}
                  value={filterType}
                  onChange={setFilterType}
                  options={meetingTypeOptions}
                />
              </div>
              {statusOptions && activeTab !== 'upcoming' && activeTab !== 'past' && (
                <div className="w-[160px] shrink-0">
                  <DropdownField
                    label={t('meeting_list_filter_status_label')}
                    placeholder={t('meeting_list_filter_status')}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={statusOptions}
                  />
                </div>
              )}
              <div className="w-[140px] shrink-0">
                <DatePicker
                  label={t('meeting_list_filter_from')}
                  value={filterDateFrom}
                  onChange={setFilterDateFrom}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="w-[140px] shrink-0">
                <DatePicker
                  label={t('meeting_list_filter_to')}
                  value={filterDateTo}
                  onChange={setFilterDateTo}
                  placeholder="DD/MM/YYYY"
                  opensLeft
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchInput(''); setFilterType(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="flex items-center gap-[4px] text-[13px] text-[#6a3e31] hover:underline bg-transparent border-none cursor-pointer shrink-0 pb-[10px]"
                  style={{ fontFamily: 'Noto Sans' }}
                >
                  <Icon name="close" size="small" color="#6a3e31" />
                  {t('meeting_list_clear_filters')}
                </button>
              )}
            </div>

            {/* Right: search + button */}
            <div className="flex items-end gap-[8px] shrink-0">
              <div className="w-[240px]">
                <SearchInput
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={() => setSearchQuery(searchInput)}
                  placeholder={t('meeting_list_search_placeholder')}
                />
              </div>
              <Button
                variant="filled"
                size="default"
                iconPlacement="none"
                text={t('meeting_list_search_btn')}
                onClick={() => setSearchQuery(searchInput)}
              />
            </div>
          </div>
        )}

        {/* Cards — 3-col grid */}
        {visible.length === 0 ? (
          <p
            className="text-sm text-[#727272] py-8 text-center w-full"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {t('meeting_list_empty')}
          </p>
        ) : (
          <div className={`grid grid-cols-2 xl:grid-cols-3 gap-[20px] ${activeTab === 'today' ? 'mt-[24px]' : ''}`}>
            {visible.map((meeting: MeetingData) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                stepKeys={stepKeys}
                createStepKeys={createStepKeys}
                t={t}
                onCta={() => (meeting.tab === 'past' || meeting.stepsCompleted >= 5) ? navigate(`/meetings/view/${meeting.id}`) : navigate('/meetings/attendance', { state: { meetingId: meeting.id } })}
                onDraftCta={() => navigate('/meetings/create')}
                onEditAgenda={() => navigate('/meetings/create/agenda', {
                  state: {
                    editMeetingId: meeting.id,
                    title: meeting.name,
                    meetingType: meeting.meetingType,
                    date: meeting.date,
                    time: meeting.time,
                    venue: meeting.venue,
                    chairperson: meeting.chairperson,
                    description: meeting.description,
                  },
                })}
                onAction={(key) => handleAction(meeting, key)}
                showStages={false}
              />
            ))}
          </div>
        )}
      </SectionHolder>
      </div>

      {/* Action modals */}
      {adjournModalMeeting && (
        <AdjournModal
          meeting={adjournModalMeeting}
          onClose={() => setAdjournModalMeeting(null)}
          onConfirm={(date, time) => {
            updateMeeting(adjournModalMeeting.id, { nextMeetingDate: date, nextMeetingTime: time });
            setAdjournModalMeeting(null);
          }}
          t={t}
        />
      )}
      {cancelModalMeeting && (
        <CancelMeetingModal
          meeting={cancelModalMeeting}
          onClose={() => setCancelModalMeeting(null)}
          onConfirm={() => {
            updateMeeting(cancelModalMeeting.id, { tab: 'cancelled', status: 'cancelled' });
            setCancelModalMeeting(null);
          }}
          t={t}
        />
      )}
    </MeetingShellLayout>
  );
}

// ─── Step circle ──────────────────────────────────────────────────────────────

function StepCircle({ type, num, completed }: { type: NumberCircleType; num: number; completed: boolean }) {
  const styles: Record<NumberCircleType, string> = {
    'small-card':  'bg-[rgba(60,151,24,0.16)] border-[#3c9718]',
    'greyed-out':  'bg-[#e8e8e8] border-[#c6c6c6]',
    'current':     'bg-[#6a3e31] border-[#6a3e31]',
    'agenda':      'bg-[#ff7468] border-[#ff7468]',
    'proceedings': 'bg-[#efe0dc] border-[#6a3e31]',
    'subpage':     'bg-[#efe0dc] border-transparent',
  };
  const textColor: Record<NumberCircleType, string> = {
    'small-card':  '#3c9718',
    'greyed-out':  '#888',
    'current':     'white',
    'agenda':      'white',
    'proceedings': '#6a3e31',
    'subpage':     '#6a3e31',
  };

  return (
    <div className={`flex items-center justify-center rounded-full border shrink-0 size-5 ${styles[type]}`}>
      {completed ? (
        <Icon name="check" size="small" color={textColor[type]} />
      ) : (
        <span
          className="text-[12px] font-semibold leading-none"
          style={{ color: textColor[type], fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {num}
        </span>
      )}
    </div>
  );
}

// ─── Other Actions hover dropdown ─────────────────────────────────────────────

interface ActionsMenuProps {
  actions: Array<{ key: string; disabled?: boolean }>;
  t: (key: string) => string;
  onAction: (key: string) => void;
}

function ActionsMenu({ actions, t, onAction }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outlined"
        size="small"
        iconPlacement="right"
        iconName="arrow_drop_down"
        text={t('btn_other_actions')}
        onClick={() => setOpen(o => !o)}
      />

      {open && (
        <div className="absolute bottom-full mb-[4px] right-0 z-50 bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-[#c6c6c6] overflow-hidden min-w-[200px]">
          {actions.map(({ key, disabled }) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => { setOpen(false); if (!disabled) onAction(key); }}
              className={`w-full text-left px-[16px] py-[10px] text-[13px] leading-5 transition-colors
                ${disabled
                  ? 'text-[#bdbdbd] cursor-not-allowed'
                  : 'text-[#212121] hover:bg-[#f7f0ee] cursor-pointer'
                }`}
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {t(key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal shared NS ──────────────────────────────────────────────────────────

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

// ─── Adjourn Modal ─────────────────────────────────────────────────────────────

function AdjournModal({ meeting, onClose, onConfirm, t }: { meeting: MeetingData; onClose: () => void; onConfirm: (date: string, time: string) => void; t: (k: string) => string }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const name = meeting.nameKey ? t(meeting.nameKey) : meeting.name;

  return (
    <ModalShell title="Choose New Meeting Date" onClose={onClose}>
      <div className="border border-[var(--neutral-200)] bg-[#fafafa] rounded-[12px] px-[16px] py-[14px] flex flex-col gap-[10px]">
        <p className="text-[16px] font-semibold text-[#6a3e31] leading-[22px]" style={NS}>{name}</p>
        <MeetingDetailsTag modeOfMeeting={meeting.mode === 'IN PERSON' ? t('meeting_mode_in_person') : t('meeting_mode_online')} date={meeting.date} time={meeting.time} />
        <div className="flex flex-col gap-[2px]">
          <SmallDetailsText text={`Venue: ${meeting.venue}`} />
          <SmallDetailsText text={`${meeting.participants} ${t('meeting_participants_label')}`} />
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-medium text-[#3b3b3b]" style={NS}>Date</span>
        <DatePicker value={date} onChange={setDate} placeholder="Select date" />
      </div>
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-medium text-[#3b3b3b]" style={NS}>Time</span>
        <TimePicker value={time} onChange={setTime} placeholder="Select time" opensUp />
      </div>
      <div className="flex gap-[10px] items-center justify-center w-full">
        <Button variant="outlined" size="small" iconPlacement="none" text="Cancel" onClick={onClose} />
        <Button variant="filled" size="small" iconPlacement="none" text="Confirm Adjournment" state={date && time ? 'default' : 'disabled'} onClick={date && time ? () => onConfirm(date, time) : undefined} />
      </div>
    </ModalShell>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

function CancelMeetingModal({ meeting, onClose, onConfirm, t }: { meeting: MeetingData; onClose: () => void; onConfirm: () => void; t: (k: string) => string }) {
  const name = meeting.nameKey ? t(meeting.nameKey) : meeting.name;
  const modeLabel = meeting.mode === 'IN PERSON' ? t('meeting_mode_in_person') : t('meeting_mode_online');

  return (
    <ModalShell title="Cancel Meeting" titleColor="#c62828" onClose={onClose} width="w-[560px]">
      <div className="border border-[var(--neutral-200)] bg-[#fafafa] rounded-[12px] px-[16px] py-[14px] flex flex-col gap-[10px]">
        <p className="text-[16px] font-semibold text-[#6a3e31] leading-[22px]" style={NS}>{name}</p>
        <MeetingDetailsTag modeOfMeeting={modeLabel} date={meeting.date} time={meeting.time} />
        <div className="flex flex-col gap-[2px]">
          <SmallDetailsText text={`Venue: ${meeting.venue}`} />
          <SmallDetailsText text={`${meeting.participants} ${t('meeting_participants_label')}`} />
        </div>
      </div>
      <p className="text-[14px] text-[#3b3b3b] leading-[22px]" style={NS}>
        Are you sure you want to cancel this meeting? This action cannot be undone.
      </p>
      <div className="flex gap-[10px] items-center justify-center w-full">
        <Button variant="outlined" size="small" iconPlacement="none" text="Go Back" onClick={onClose} />
        <Button variant="filled" size="small" iconPlacement="none" text="Cancel Meeting" onClick={onConfirm} />
      </div>
    </ModalShell>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────

interface MeetingCardProps {
  meeting: MeetingData;
  stepKeys: string[];
  createStepKeys: string[];
  t: (key: string) => string;
  onCta: () => void;
  onDraftCta: () => void;
  onEditAgenda: () => void;
  onAction: (key: string) => void;
  showStages?: boolean;
}

function MeetingCard({ meeting, stepKeys, createStepKeys, t, onCta, onDraftCta, onEditAgenda, onAction, showStages = true }: MeetingCardProps) {
  const modeLabel = meeting.mode === 'IN PERSON'
    ? t('meeting_mode_in_person')
    : t('meeting_mode_online');

  const actions = getActions(meeting.tab);
  const isCancelled = meeting.tab === 'cancelled';
  const isDraft = meeting.tab === 'drafts';

  const isPast = meeting.tab === 'past';
  const isToday = meeting.tab === 'today';
  const isPendingPresident = meeting.status === 'pending_president';
  const badgeVariant = isCancelled ? 'red' : isDraft ? 'yellow' : isPast ? 'teal' : isPendingPresident ? 'yellow' : isToday ? 'green' : 'blue';
  const badgeLabel   = isCancelled ? t('meeting_badge_cancelled') : isDraft ? t('meeting_badge_draft') : isPast ? t('meeting_badge_completed') : isPendingPresident ? t('meeting_badge_president_pending') : isToday ? t('meeting_badge_today') : t('meeting_badge_scheduled');

  // Upcoming meetings that haven't started yet can have their details edited
  // for EDIT_WINDOW_DAYS days after scheduling, then the edit window closes.
  const isUpcomingUnstarted = meeting.tab === 'upcoming' && meeting.stepsCompleted === 0;
  const daysLeft = isUpcomingUnstarted ? editDaysLeft(meeting.id) : null;
  const editLocked = daysLeft !== null && daysLeft <= 0;

  return (
    <div className="bg-white border border-[rgba(106,62,49,0.32)] flex flex-col gap-3 items-start p-[20px] rounded-[15px]">

      {/* Status badge */}
      <div className="flex items-center gap-[8px] flex-wrap">
        {isUpcomingUnstarted ? (
          <StatusBadge
            variant="blue"
            label={editLocked ? t('meeting_edit_locked') : `${t('meeting_edit_open')} · ${daysLeft}${t('meeting_edit_days_left_suffix')}`}
          />
        ) : (
          <StatusBadge variant={badgeVariant} label={badgeLabel} />
        )}
      </div>

      {/* Meeting info */}
      <div className="flex flex-col gap-[6px] items-start w-full">
        <p
          className="font-semibold text-[16px] leading-[24px] text-[#6a3e31] text-left"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {meeting.nameKey ? t(meeting.nameKey) : meeting.name}
        </p>

        <MeetingDetailsTag modeOfMeeting={modeLabel} date={meeting.date} time={meeting.time} />

        <div className="flex flex-col items-start gap-[4px]">
          <div className="flex items-center gap-[4px]">
            <Icon name="place" size="small" color="#3b3b3b" />
            <span className="text-xs font-medium text-[#3b3b3b] leading-6" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {meeting.venue}
            </span>
          </div>
          <div className="flex items-center gap-[4px]">
            <Icon name="people_alt" size="small" color="#3b3b3b" />
            <span className="text-xs font-medium text-[#3b3b3b] leading-6" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
              {meeting.participants} {t('meeting_participants_label')}
            </span>
          </div>
        </div>

        <div className="bg-[#F5F5F5] flex flex-col gap-0 items-start px-2 py-1 rounded-[5px] w-full">
          <SmallDetailsText text={t('meeting_quorum_heading')} bold />
          <SmallDetailsText text={`${t('meeting_elected_quorum_label')} ${meeting.electedQuorum}`} />
          <SmallDetailsText text={`${t('meeting_participants_quorum_label')} ${meeting.participantsQuorum}`} />
        </div>
      </div>

      {/* Progress steps */}
      {!showStages ? null : !isCancelled && !isPast ? (
        <div className="flex flex-col items-start w-full">
          {(isDraft ? createStepKeys : stepKeys).map((key, idx) => {
            const stepNum = idx + 1;
            const circleType = getCircleType(stepNum, meeting.stepsCompleted);
            const isCompleted = stepNum <= meeting.stepsCompleted;
            return (
              <div key={idx} className="w-full">
                {idx > 0 && (
                  <>
                    <div className="pl-[10px]"><div className="h-[4px] w-px bg-[rgba(106,62,49,0.25)]" /></div>
                    <div className="h-px w-full bg-[#e6e6e6]" />
                    <div className="pl-[10px]"><div className="h-[4px] w-px bg-[rgba(106,62,49,0.25)]" /></div>
                  </>
                )}
                <div className="flex gap-2 items-center w-full py-[2px]">
                  <StepCircle type={circleType} num={stepNum} completed={isCompleted} />
                  <span
                    className="text-[11px] font-medium leading-4 text-left text-[#3b3b3b]"
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                  >
                    {t(key)}
                  </span>
                </div>
                {idx === 0 && (
                  <div className="pl-[10px]"><div className="h-[4px] w-px bg-[rgba(106,62,49,0.25)]" /></div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full py-[6px]">
          <span
            className="text-[11px] leading-4 text-[#727272]"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {isPast ? t('meeting_stages_all_completed') : t('meeting_stages_none_completed')}
          </span>
        </div>
      )}

      {/* CTAs */}
      <div className={`flex gap-[10px] w-full justify-end items-center ${!showStages ? 'mt-[12px]' : ''}`}>
        {actions.length > 0 && <ActionsMenu actions={actions} t={t} onAction={onAction} />}
        {isDraft ? (
          <Button
            variant="filled"
            size="small"
            iconPlacement="none"
            text={t('btn_schedule_meeting')}
            onClick={onDraftCta}
          />
        ) : isUpcomingUnstarted ? (
          <Button
            variant="filled"
            size="small"
            iconPlacement="left"
            iconName="edit"
            text={t('btn_edit_meeting')}
            state={editLocked ? 'disabled' : 'default'}
            onClick={editLocked ? undefined : onEditAgenda}
          />
        ) : (
          <Button
            variant="filled"
            size="small"
            iconPlacement="none"
            text={t(getCtaKey(meeting.tab, meeting.stepsCompleted))}
            onClick={onCta}
          />
        )}
      </div>
    </div>
  );
}
