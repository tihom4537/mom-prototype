import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import {
  Navbar,
  Sidebar,
  Breadcrumb,
  MeetingDetailsTag,
  SmallDetailsText,
  Button,
  Icon,
  SectionHolder,
  DashboardMenuBarItem,
  StatusBadge,
  DropdownBoxOfProfile,
  DropdownBoxOfIcon,
} from '../components';
import type { NumberCircleType } from '../components';
import type { MeetingData, MeetingTab } from '../context/MeetingsContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCircleType(stepNum: number, stepsCompleted: number): NumberCircleType {
  if (stepNum <= stepsCompleted) return 'small-card';
  if (stepNum === stepsCompleted + 1) return 'current';
  return 'greyed-out';
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
  const { meetings } = useMeetings();

  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');
  const [profileOpen, setProfileOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab]       = useState<MeetingTab>('today');

  const toggleSidebar = () => setSidebarState(s => (s === 'full' ? 'shortened' : 'full'));

  const allTabs: Array<{ key: MeetingTab; labelKey: string }> = [
    { key: 'today',     labelKey: 'tab_today'     },
    { key: 'upcoming',  labelKey: 'tab_upcoming'  },
    { key: 'past',      labelKey: 'tab_past'      },
    { key: 'drafts',    labelKey: 'tab_drafts'    },
    { key: 'cancelled', labelKey: 'tab_cancelled' },
  ];

  const stepKeys       = ['meeting_step_1', 'meeting_step_2', 'meeting_step_3', 'meeting_step_4', 'meeting_step_5'];
  const createStepKeys = ['stepper_step1', 'stepper_step2', 'stepper_step3'];
  const visible = meetings.filter((m: MeetingData) => m.tab === activeTab);
  const countFor = (tab: MeetingTab) => meetings.filter((m: MeetingData) => m.tab === tab).length;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f1f2f2]">

      {/* ── Navbar ── */}
      <div className="shrink-0 relative z-40">
        <Navbar
          version="default-with-welcome"
          onProfileClick={() => { setProfileOpen(o => !o); setSettingsOpen(false); }}
          onSettingsClick={() => { setSettingsOpen(o => !o); setProfileOpen(false); }}
        />
        {profileOpen && (
          <div className="absolute right-[88px] top-full shadow-lg">
            <DropdownBoxOfProfile
              isOpen
              onToggle={() => setProfileOpen(false)}
              menuLabel="Switch Profile"
              items={['PDO — Kakanur GP', 'Secretary — Hosakote GP', 'Log out']}
              className="w-[293px]"
            />
          </div>
        )}
        {settingsOpen && (
          <div className="absolute right-[26px] top-full shadow-lg">
            <DropdownBoxOfIcon
              isOpen
              onToggle={() => setSettingsOpen(false)}
              menuLabel="Settings"
              items={['Settings', 'Help & Support', 'Log out']}
            />
          </div>
        )}
      </div>

      {/* ── Sidebar + main ── */}
      <div className="flex flex-1 min-h-0">
        <Sidebar state={sidebarState} onMenuClick={toggleSidebar} className="shrink-0 h-full" />

        <div className="flex flex-col flex-1 min-h-0 min-w-0">

          {/* Fixed breadcrumb */}
          <div className="shrink-0 px-6 pt-6 pb-5 bg-[#f1f2f2]">
            <Breadcrumb
              level={3}
              items={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_meeting_list')]}
            />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <SectionHolder
              variant="with-description"
              title={t('meeting_list_heading')}
              subtitle={t('meeting_list_subtext')}
              bodyClassName="px-[25px] pt-[20px] pb-[30px]"
            >
              {/* Tab bar */}
              <div className="flex items-center gap-[20px]">
                {allTabs.map(({ key, labelKey }) => (
                  <DashboardMenuBarItem
                    key={key}
                    text={t(labelKey)}
                    count={countFor(key)}
                    state={activeTab === key ? 'selected' : 'default'}
                    badgeVariant="neutral"
                    onClick={() => setActiveTab(key)}
                  />
                ))}
              </div>

              {/* Divider */}
              <hr className="border-t border-[#e6e6e6] w-full mb-[30px] mt-0" />

              {/* Cards — 3-col grid */}
              {visible.length === 0 ? (
                <p
                  className="text-sm text-[#727272] py-8 text-center w-full"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {t('meeting_list_empty')}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-[20px]">
                  {visible.map((meeting: MeetingData) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      stepKeys={stepKeys}
                      createStepKeys={createStepKeys}
                      t={t}
                      onCta={() => meeting.tab === 'past' ? navigate(`/meetings/view/${meeting.id}`) : navigate('/meetings/attendance', { state: { meetingId: meeting.id } })}
                      onDraftCta={() => navigate('/meetings/create')}
                    />
                  ))}
                </div>
              )}
            </SectionHolder>
          </div>
        </div>
      </div>
    </div>
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
}

function ActionsMenu({ actions, t }: ActionsMenuProps) {
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
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Button
        variant="outlined"
        size="small"
        iconPlacement="right"
        iconName="arrow_drop_down"
        text={t('btn_other_actions')}
      />

      {open && (
        <div className="absolute bottom-full mb-[4px] right-0 z-50 bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-[#e0e0e0] overflow-hidden min-w-[200px]">
          {actions.map(({ key, disabled }) => (
            <button
              key={key}
              disabled={disabled}
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

// ─── Meeting Card ─────────────────────────────────────────────────────────────

interface MeetingCardProps {
  meeting: MeetingData;
  stepKeys: string[];
  createStepKeys: string[];
  t: (key: string) => string;
  onCta: () => void;
  onDraftCta: () => void;
}

function MeetingCard({ meeting, stepKeys, createStepKeys, t, onCta, onDraftCta }: MeetingCardProps) {
  const modeLabel = meeting.mode === 'IN PERSON'
    ? t('meeting_mode_in_person')
    : t('meeting_mode_online');

  const actions = getActions(meeting.tab);
  const isCancelled = meeting.tab === 'cancelled';
  const isDraft = meeting.tab === 'drafts';

  const isPast = meeting.tab === 'past';
  const isPendingPresident = meeting.status === 'pending_president';
  const badgeVariant = isCancelled ? 'red' : isDraft ? 'yellow' : isPast ? 'green' : isPendingPresident ? 'yellow' : 'blue';
  const badgeLabel   = isCancelled ? t('meeting_badge_cancelled') : isDraft ? t('meeting_badge_draft') : isPast ? t('meeting_badge_completed') : isPendingPresident ? t('meeting_badge_president_pending') : t('meeting_badge_scheduled');

  return (
    <div className="bg-white border border-[rgba(106,62,49,0.32)] flex flex-col gap-3 items-start p-[20px] rounded-[15px]">

      {/* Status badge */}
      <StatusBadge variant={badgeVariant} label={badgeLabel} />

      {/* Meeting info */}
      <div className="flex flex-col gap-[6px] items-start w-full">
        <p
          className="font-semibold text-[16px] leading-[24px] text-[#6a3e31] text-left"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {meeting.nameKey ? t(meeting.nameKey) : meeting.name}
        </p>

        <MeetingDetailsTag modeOfMeeting={modeLabel} date={meeting.date} time={meeting.time} />

        <div className="flex flex-col items-start gap-0">
          <SmallDetailsText text={`${t('meeting_venue_label')} ${meeting.venue}`} />
          <SmallDetailsText text={`${t('meeting_participants_label')} ${meeting.participants}`} />
        </div>

        <div className="bg-[#F5F5F5] flex flex-col gap-0 items-start px-2 py-1 rounded-[5px] w-full">
          <SmallDetailsText text={t('meeting_quorum_heading')} bold />
          <SmallDetailsText text={`${t('meeting_elected_quorum_label')} ${meeting.electedQuorum}`} />
          <SmallDetailsText text={`${t('meeting_participants_quorum_label')} ${meeting.participantsQuorum}`} />
        </div>
      </div>

      {/* Progress steps */}
      {!isCancelled && !isPast ? (
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
      <div className="flex gap-[10px] w-full justify-end items-center">
        {actions.length > 0 && <ActionsMenu actions={actions} t={t} />}
        {isDraft ? (
          <Button
            variant="filled"
            size="small"
            iconPlacement="none"
            text={t('btn_schedule_meeting')}
            onClick={onDraftCta}
          />
        ) : (
          <Button
            variant="filled"
            size="small"
            iconPlacement="none"
            text={t(getCtaKey(meeting.tab, meeting.stepsCompleted))}
            state={meeting.tab === 'upcoming' && meeting.stepsCompleted === 0 ? 'disabled' : 'default'}
            onClick={meeting.tab === 'upcoming' && meeting.stepsCompleted === 0 ? undefined : onCta}
          />
        )}
      </div>
    </div>
  );
}
