import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Navbar,
  Sidebar,
  Breadcrumb,
  MeetingDetailsTag,
  SmallDetailsText,
  NumberCircle,
  Button,
  Icon,
  DropdownBoxOfProfile,
  DropdownBoxOfIcon,
} from '../components';
import type { NumberCircleType } from '../components';

// ─── Mock data ────────────────────────────────────────────────────────────────

type MeetingTab = 'today' | 'upcoming' | 'past';

interface MeetingData {
  id: number;
  name: string;
  mode: 'IN PERSON' | 'ONLINE';
  date: string;
  time: string;
  venue: string;
  participants: number;
  gpName: string;
  electedQuorum: string;
  participantsQuorum: string;
  stepsCompleted: number; // 0–4
  tab: MeetingTab;
}

const MEETINGS: MeetingData[] = [
  {
    id: 1,
    name: '1st GP General Body Meeting 2026',
    mode: 'IN PERSON',
    date: '19/03/2026',
    time: '10:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 14,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 0,
    tab: 'today',
  },
  {
    id: 2,
    name: '2nd GP General Body Meeting 2026',
    mode: 'IN PERSON',
    date: '19/03/2026',
    time: '2:00 p.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 16,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 2,
    tab: 'today',
  },
  {
    id: 3,
    name: '3rd GP General Body Meeting 2025',
    mode: 'IN PERSON',
    date: '15/12/2025',
    time: '11:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 12,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
  },
  {
    id: 4,
    name: '4th GP General Body Meeting 2026',
    mode: 'IN PERSON',
    date: '25/04/2026',
    time: '10:30 a.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 18,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 0,
    tab: 'upcoming',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCircleType(stepNum: number, stepsCompleted: number): NumberCircleType {
  if (stepNum <= stepsCompleted) return 'small-card';       // completed — green
  if (stepNum === stepsCompleted + 1) return 'current';     // in-progress — primary
  return 'greyed-out';                                       // not started — gray
}

function getCtaKey(stepsCompleted: number): string {
  if (stepsCompleted === 0) return 'btn_start_meeting';
  if (stepsCompleted === 1) return 'btn_add_proceedings_list';
  if (stepsCompleted === 2) return 'btn_review_proceedings';
  if (stepsCompleted === 3) return 'btn_send_approval';
  return 'btn_view_meeting';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MeetingListScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isStartMode = searchParams.get('mode') === 'start';

  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');
  const [profileOpen, setProfileOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // In start mode only Today is shown; default always Today
  const [activeTab, setActiveTab]       = useState<MeetingTab>('today');

  const toggleSidebar = () => setSidebarState(s => (s === 'full' ? 'shortened' : 'full'));

  // In start mode: only Today tab is available
  const allTabs: Array<{ key: MeetingTab; labelKey: string }> = [
    { key: 'today',    labelKey: 'tab_today'    },
    { key: 'upcoming', labelKey: 'tab_upcoming' },
    { key: 'past',     labelKey: 'tab_past'     },
  ];
  const tabs = isStartMode ? allTabs.slice(0, 1) : allTabs;

  const stepKeys = ['meeting_step_1', 'meeting_step_2', 'meeting_step_3', 'meeting_step_4'];

  // In start mode always show Today; otherwise respect activeTab
  const effectiveTab: MeetingTab = isStartMode ? 'today' : activeTab;
  const visible = MEETINGS.filter(m => m.tab === effectiveTab);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f6f7fb]">

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

        <Sidebar
          state={sidebarState}
          onMenuClick={toggleSidebar}
          className="shrink-0 h-full"
        />

        <div className="flex flex-col flex-1 min-h-0 min-w-0">

          {/* Fixed breadcrumb bar */}
          <div className="shrink-0 px-6 pt-6 pb-5 shadow-[0_4px_12px_0_rgba(0,0,0,0.06)]">
            <Breadcrumb
              level={3}
              items={[
                t('breadcrumb_module'),
                t('breadcrumb_meetings'),
                isStartMode ? t('breadcrumb_start_meeting') : t('breadcrumb_meeting_list'),
              ]}
            />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            <div className="bg-white flex flex-col gap-5 p-6 rounded-[15px]">

              {/* Page heading */}
              <div className="flex flex-col gap-2 items-start shrink-0 w-full">
                <p
                  className="font-semibold text-2xl leading-8 text-[#212121]"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {isStartMode ? t('start_meeting_heading') : t('meeting_list_heading')}
                </p>
                <p
                  className="font-normal text-sm leading-6 text-[#727272]"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {isStartMode ? t('start_meeting_subtext') : t('meeting_list_subtext')}
                </p>
              </div>

              {/* Filter tabs — hidden in start mode */}
              {!isStartMode && (
                <div className="flex gap-2 items-center shrink-0">
                  {tabs.map(({ key, labelKey }) => (
                    <Button
                      key={key}
                      variant={activeTab === key ? 'filled' : 'outlined'}
                      state="default"
                      iconPlacement="none"
                      text={t(labelKey)}
                      onClick={() => setActiveTab(key)}
                    />
                  ))}
                </div>
              )}

              {/* Divider — below tabs (regular mode) or below heading (start mode) */}
              <hr className="border-t border-[#e6e6e6] w-full -mt-1" />

              {/* Meeting cards grid */}
              {visible.length === 0 ? (
                <p
                  className="text-sm text-[#727272] py-8 text-center w-full"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {t('meeting_list_empty')}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {visible.map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      stepKeys={stepKeys}
                      t={t}
                      onCta={() => navigate('/agenda-list')}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compact step circle (20 px, smaller than the full NumberCircle) ─────────

function StepCircle({ type, num, completed }: { type: NumberCircleType; num: number; completed: boolean }) {
  const styles = {
    'small-card':  'bg-[rgba(60,151,24,0.16)] border-[#3c9718]',
    'greyed-out':  'bg-[#e8e8e8] border-[#c6c6c6]',
    'current':     'bg-[#6a3e31] border-[#6a3e31]',
    'agenda':      'bg-[#ff7468] border-[#ff7468]',
    'proceedings': 'bg-[#efe0dc] border-[#6a3e31]',
    'subpage':     'bg-[#efe0dc] border-transparent',
  } as const;

  const textColor = {
    'small-card':  '#3c9718',
    'greyed-out':  '#888',
    'current':     'white',
    'agenda':      'white',
    'proceedings': '#6a3e31',
    'subpage':     '#6a3e31',
  } as const;

  return (
    <div
      className={`flex items-center justify-center rounded-full border shrink-0 size-5 ${styles[type]}`}
    >
      {completed ? (
        <Icon name="check" size="small" color={textColor[type]} />
      ) : (
        <span
          className="text-[10px] font-semibold leading-none"
          style={{ color: textColor[type], fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {num}
        </span>
      )}
    </div>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────

interface MeetingCardProps {
  meeting: MeetingData;
  stepKeys: string[];
  t: (key: string) => string;
  onCta: () => void;
}

function MeetingCard({ meeting, stepKeys, t, onCta }: MeetingCardProps) {
  const modeLabel = meeting.mode === 'IN PERSON'
    ? t('meeting_mode_in_person')
    : t('meeting_mode_online');

  return (
    <div className="bg-white border border-[rgba(106,62,49,0.32)] flex flex-col gap-3 items-start p-4 rounded-[12px]">

      {/* ── Meeting info ── */}
      <div className="flex flex-col gap-[6px] items-start w-full">

        {/* Title */}
        <p
          className="font-semibold text-sm leading-5 text-[#6a3e31] text-left"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {meeting.name}
        </p>

        {/* Date / time / mode tag */}
        <MeetingDetailsTag
          modeOfMeeting={modeLabel}
          date={meeting.date}
          time={meeting.time}
        />

        {/* Venue · Participants */}
        <div className="flex flex-col items-start gap-0">
          <SmallDetailsText text={`${t('meeting_venue_label')} ${meeting.venue}`} />
          <SmallDetailsText text={`${t('meeting_participants_label')} ${meeting.participants}`} />
        </div>

        {/* Quorum box */}
        <div className="bg-[#F5F5F5] flex flex-col gap-0 items-start px-2 py-1 rounded-[5px] w-full">
          <SmallDetailsText text={t('meeting_quorum_heading')} bold />
          <SmallDetailsText text={`${t('meeting_elected_quorum_label')} ${meeting.electedQuorum}`} />
          <SmallDetailsText text={`${t('meeting_participants_quorum_label')} ${meeting.participantsQuorum}`} />
        </div>
      </div>

      {/* ── Progress steps ── */}
      <div className="flex flex-col items-start w-full">
        {stepKeys.map((key, idx) => {
          const stepNum = idx + 1;
          const circleType = getCircleType(stepNum, meeting.stepsCompleted);
          const isCompleted = stepNum <= meeting.stepsCompleted;

          return (
            <div key={idx} className="w-full">
              {/* Connector + separator above (all steps except the first) */}
              {idx > 0 && (
                <>
                  <div className="pl-[10px]">
                    <div className="h-[4px] w-px bg-[rgba(106,62,49,0.25)]" />
                  </div>
                  <div className="h-px w-full bg-[#e6e6e6]" />
                  <div className="pl-[10px]">
                    <div className="h-[4px] w-px bg-[rgba(106,62,49,0.25)]" />
                  </div>
                </>
              )}

              {/* Step row */}
              <div className="flex gap-2 items-center w-full py-[2px]">
                <StepCircle type={circleType} num={stepNum} completed={isCompleted} />
                <span
                  className="text-[11px] font-medium leading-4 text-[#3b3b3b] text-left"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {t(key)}
                </span>
              </div>

              {/* Connector below first step */}
              {idx === 0 && (
                <div className="pl-[10px]">
                  <div className="h-[4px] w-px bg-[rgba(106,62,49,0.25)]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── CTA ── */}
      <div className="flex w-full justify-end">
        <Button
          variant="filled"
          iconPlacement="none"
          text={t(getCtaKey(meeting.stepsCompleted))}
          onClick={onCta}
        />
      </div>
    </div>
  );
}
