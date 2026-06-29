import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import { registerPageNarrator, unregisterPageNarrator } from '../data/pageSummaries';
import { buildMeetingOverviewNarrative } from '../utils/narratives';
import {
  UrgencyBanner,
  QuickActionCard,
  UpcomingMeetingRow,
  ComplianceCard,
  ActionItemCard,
  DashboardMenuBarItem,
  AgendaNoLabel,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

// ── Mock data ──────────────────────────────────────────────────────────────────

type MandatoryTab = 'all' | 'on-track' | 'due-soon' | 'overdue';
type ActionTab = 'pending' | 'completed';
type MC = { typeKey: string; completed: number; total: number; status: 'circle-on-track' | 'circle-due-soon' | 'circle-overdue'; nextDueKey: string };
type ActionItemData = {
  id: string;
  taskKey: string;
  sourceKey: string;
  daysSinceAssigned: number;
  status: 'open' | 'in-progress' | 'done';
};

const MONTHLY_CARDS_DATA: MC[] = [
  { typeKey: 'mock_type_gp_general_ordinary',   completed: 1, total: 12, status: 'circle-due-soon', nextDueKey: 'mock_due_end_of_may' },
  { typeKey: 'mock_type_finance_committee',      completed: 1, total: 12, status: 'circle-due-soon', nextDueKey: 'mock_due_end_of_may' },
  { typeKey: 'mock_type_general_standing',       completed: 1, total: 12, status: 'circle-due-soon', nextDueKey: 'mock_due_end_of_may' },
  { typeKey: 'mock_type_social_justice',         completed: 0, total: 12, status: 'circle-overdue',  nextDueKey: 'mock_due_overdue_april' },
];

const SEMI_ANNUAL_CARDS_DATA: MC[] = [
  { typeKey: 'mock_type_grama_sabha_ordinary',       completed: 0, total: 2, status: 'circle-on-track', nextDueKey: 'mock_due_october' },
  { typeKey: 'mock_type_ward_sabha_ordinary',        completed: 0, total: 2, status: 'circle-on-track', nextDueKey: 'mock_due_september' },
  { typeKey: 'mock_type_habitation_sabha_ordinary',  completed: 0, total: 2, status: 'circle-on-track', nextDueKey: 'mock_due_october' },
  { typeKey: 'mock_type_habitation_sabha_emergency', completed: 0, total: 2, status: 'circle-on-track', nextDueKey: 'mock_due_as_required' },
];

const FIXED_DATE_CARDS_DATA: MC[] = [
  { typeKey: 'mock_type_grama_sabha_budget',   completed: 0, total: 2, status: 'circle-overdue',  nextDueKey: 'mock_due_april_missed_oct' },
  { typeKey: 'mock_type_kdp_meeting',          completed: 0, total: 4, status: 'circle-overdue',  nextDueKey: 'mock_due_april_missed_jul' },
  { typeKey: 'mock_type_makkala_sabha',        completed: 0, total: 1, status: 'circle-on-track', nextDueKey: 'mock_due_by_march' },
  { typeKey: 'mock_type_mahila_sabha',         completed: 0, total: 1, status: 'circle-on-track', nextDueKey: 'mock_due_by_march' },
  { typeKey: 'mock_type_grama_sabha_special',  completed: 0, total: 1, status: 'circle-on-track', nextDueKey: 'mock_due_min_3months' },
  { typeKey: 'mock_type_ward_sabha_special',   completed: 0, total: 1, status: 'circle-on-track', nextDueKey: 'mock_due_min_3months' },
  { typeKey: 'mock_type_habitation_sabha_special', completed: 0, total: 1, status: 'circle-on-track', nextDueKey: 'mock_due_min_3months' },
];

const ACTION_ITEMS_DATA: ActionItemData[] = [
  { id: 'a1', taskKey: 'mock_task_street_lights', sourceKey: 'mock_source_gp_jan', daysSinceAssigned: 42, status: 'open' },
  { id: 'a2', taskKey: 'mock_task_mgnrega',       sourceKey: 'mock_source_gp_feb', daysSinceAssigned: 16, status: 'in-progress' },
  { id: 'a3', taskKey: 'mock_task_property_tax',  sourceKey: 'mock_source_finance_mar', daysSinceAssigned: 5, status: 'open' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function MeetingOverviewScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { meetings } = useMeetings();
  const draftMeetings = meetings.filter(m => m.tab === 'drafts');

  const [activeTab,    setActiveTab]    = useState<MandatoryTab>('all');

  useEffect(() => {
    const upcomingCount = 3; // UPCOMING_MEETINGS is a static mock of 3
    registerPageNarrator('/meetings/overview', () =>
      buildMeetingOverviewNarrative(draftMeetings.length, upcomingCount)
    );
    return () => unregisterPageNarrator('/meetings/overview');
  }, [draftMeetings.length]);
  const [actionTab,    setActionTab]    = useState<ActionTab>('pending');
  const [actionItems,  setActionItems]  = useState(ACTION_ITEMS_DATA);

  // Translated mock data (resolved per active language)
  const UPCOMING_MEETINGS = [
    { id: 'u1', name: t('mock_meeting_gp_general_april'), meta: t('mock_meta_ordinary_apr'), daysCount: 14, noticeBadge: 'green' as const },
    { id: 'u2', name: t('mock_meeting_finance_april'),    meta: t('mock_meta_standing_may'), daysCount: 21, noticeBadge: 'green' as const },
    { id: 'u3', name: t('mock_meeting_grama_sabha_ordinary'), meta: t('mock_meta_semi_annual_may'), daysCount: 35, noticeBadge: 'green' as const },
  ];

  const MONTHLY_CARDS    = MONTHLY_CARDS_DATA.map(c => ({ ...c, type: t(c.typeKey), nextDue: t(c.nextDueKey) }));
  const SEMI_ANNUAL_CARDS = SEMI_ANNUAL_CARDS_DATA.map(c => ({ ...c, type: t(c.typeKey), nextDue: t(c.nextDueKey) }));
  const FIXED_DATE_CARDS  = FIXED_DATE_CARDS_DATA.map(c => ({ ...c, type: t(c.typeKey), nextDue: t(c.nextDueKey) }));

  function markDone(id: string) {
    setActionItems(prev => prev.map(a => a.id === id ? { ...a, status: 'done' as const } : a));
  }

  // Filter compliance cards by tab
  const allCards = [...MONTHLY_CARDS, ...SEMI_ANNUAL_CARDS, ...FIXED_DATE_CARDS];
  const overdueMandatoryCount = allCards.filter(c => c.status === 'circle-overdue').length;
  const dueSoonCount          = allCards.filter(c => c.status === 'circle-due-soon').length;
  const onTrackCount          = allCards.filter(c => c.status === 'circle-on-track').length;

  function filterCards(cards: typeof MONTHLY_CARDS) {
    if (activeTab === 'all')       return cards;
    if (activeTab === 'on-track')  return cards.filter(c => c.status === 'circle-on-track');
    if (activeTab === 'due-soon')  return cards.filter(c => c.status === 'circle-due-soon');
    if (activeTab === 'overdue')   return cards.filter(c => c.status === 'circle-overdue');
    return cards;
  }

  const openTaskCount = actionItems.filter(a => a.status !== 'done').length;

  return (
    <MeetingShellLayout
      stepperActiveState={1}
      showStepper={false}
      showBack={false}
      breadcrumbItems={[
        t('breadcrumb_module'),
        t('breadcrumb_meetings'),
        t('overview_breadcrumb'),
      ]}
    >
            <div role="main" className="flex flex-col gap-[20px]">
              <h1 className="sr-only">Meeting Overview</h1>

              {/* ── Welcome heading ── */}
              <div className="flex flex-col gap-[5px] px-[10px] mt-[10px]">
                <p className="font-semibold text-[24px] leading-normal text-[#4b4b4b]" style={NS}>
                  {t('overview_welcome')}
                </p>
                <p className="font-light text-[20px] leading-normal text-[#4b4b4b]" style={NS}>
                  {t('overview_subtitle')}
                </p>
              </div>

              {/* ── Section 1: Urgency Banner (conditional) ── */}
              <div className="mt-[10px]">
                <UrgencyBanner
                  status="scheduled-today"
                  meetingName={t('mock_today_meeting_name')}
                  meta={t('mock_today_meta')}
                  labelText={t('banner_label_scheduled_today')}
                  ctaText={t('banner_cta_start')}
                  onAction={() => navigate('/meetings/list?mode=start')}
                />
              </div>

              {/* ── Section 2: Quick Actions ── */}
              <div className="flex flex-col gap-[3px] rounded-[20px] overflow-hidden">
                {/* Header */}
                <div className="bg-white flex items-center px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px]">
                  <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                    {t('section_quick_actions')}
                  </span>
                </div>
                {/* Body */}
                <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[30px] pt-[20px] pb-[30px]">
                  <div className="flex gap-[20px] flex-wrap">
                    <QuickActionCard
                      title={t('quick_action_schedule_title')}
                      description={t('quick_action_schedule_desc')}
                      onClick={() => navigate('/meetings/create')}
                    />
                    <QuickActionCard
                      title={t('quick_action_view_all_title')}
                      description={t('quick_action_view_all_desc')}
                      icon="format_list_bulleted"
                      onClick={() => navigate('/meetings/list')}
                    />
                    <QuickActionCard
                      title={t('quick_action_calendar_title')}
                      description={t('quick_action_calendar_desc')}
                      icon="calendar_month"
                      onClick={() => navigate('/meetings/calendar')}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 2b: Draft Reminders ── */}
              {draftMeetings.length > 0 && (
                <div className="flex flex-col gap-[3px] rounded-[20px] overflow-hidden">
                  <div className="bg-white flex items-center gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px]">
                    <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                      {t('section_draft_reminders')}
                    </span>
                    <AgendaNoLabel
                      type="default"
                      text={`${draftMeetings.length} ${t('draft_reminder_tag')}`}
                    />
                  </div>
                  <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[30px] pt-[10px] pb-[10px]">
                    {draftMeetings.map((m, idx) => (
                      <UpcomingMeetingRow
                        key={m.id}
                        daysLabel={t('draft_reminder_tag')}
                        daysLabelVariant="red"
                        meetingName={m.name}
                        meetingMeta={`${m.date} · ${m.venue}`}
                        viewDetailsLabel={t('draft_reminder_cta')}
                        isLast={idx === draftMeetings.length - 1}
                        onViewDetails={() => navigate('/meetings/create', { state: { draftId: m.id } })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Section 3: Upcoming Meetings ── */}
              <div className="flex flex-col gap-[3px] rounded-[20px] overflow-hidden">
                {/* Header */}
                <div className="bg-white flex items-center gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px]">
                  <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                    {t('section_upcoming_meetings')}
                  </span>
                  <AgendaNoLabel
                    type="default"
                    text={`${UPCOMING_MEETINGS.length} ${t('upcoming_meetings_tag')}`}
                  />
                </div>
                {/* Body */}
                <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[30px] pt-[10px] pb-[10px]">
                  {UPCOMING_MEETINGS.map((m, idx) => (
                    <UpcomingMeetingRow
                      key={m.id}
                      daysLabel={t('in_x_days').replace('{n}', String(m.daysCount))}
                      meetingName={m.name}
                      meetingMeta={m.meta}
                      noticeBadge={m.noticeBadge}
                      noticeBadgeLabel={t('upcoming_notice_sent')}
                      viewDetailsLabel={t('upcoming_view_details_btn')}
                      isLast={idx === UPCOMING_MEETINGS.length - 1}
                      onViewDetails={() => navigate('/meetings/list')}
                    />
                  ))}
                </div>
              </div>

              {/* ── Section 4: Mandatory Meetings ── */}
              <div className="flex flex-col gap-[3px] rounded-[20px] overflow-hidden">
                {/* Header */}
                <div className="bg-white flex flex-col gap-[6px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px]">
                  <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                    {t('section_mandatory_meetings')}
                  </span>
                  <span className="font-semibold text-[14px] leading-[24px] text-[#454545]" style={NS}>
                    {t('mandatory_subtitle')}
                  </span>
                </div>

                {/* Body */}
                <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[30px] pt-[20px] pb-[30px] flex flex-col gap-[25px]">

                  {/* Tab bar */}
                  <div className="flex items-center gap-[20px] border-b border-[rgba(106,62,49,0.12)] pb-[2px]">
                    <DashboardMenuBarItem
                      text={t('mandatory_tab_all')}
                      count={allCards.length}
                      state={activeTab === 'all' ? 'selected' : 'default'}
                      badgeVariant="neutral"
                      onClick={() => setActiveTab('all')}
                    />
                    <DashboardMenuBarItem
                      text={t('mandatory_tab_on_track')}
                      count={onTrackCount}
                      state={activeTab === 'on-track' ? 'selected' : 'default'}
                      badgeVariant="green"
                      onClick={() => setActiveTab('on-track')}
                    />
                    <DashboardMenuBarItem
                      text={t('mandatory_tab_due_soon')}
                      count={dueSoonCount}
                      state={activeTab === 'due-soon' ? 'selected' : 'default'}
                      badgeVariant="yellow"
                      onClick={() => setActiveTab('due-soon')}
                    />
                    <DashboardMenuBarItem
                      text={t('mandatory_tab_overdue')}
                      count={overdueMandatoryCount}
                      state={activeTab === 'overdue' ? 'selected' : 'default'}
                      badgeVariant="red"
                      onClick={() => setActiveTab('overdue')}
                    />
                  </div>

                  {/* Monthly group */}
                  {filterCards(MONTHLY_CARDS).length > 0 && (
                    <div className="flex flex-col gap-[12px]">
                      <p className="font-semibold text-[14px] leading-[20px] text-[#525c66] tracking-[0.1px]" style={NS}>
                        {t('mandatory_group_monthly')}
                      </p>
                      <div className="flex gap-[16px] flex-wrap">
                        {filterCards(MONTHLY_CARDS).map((c, i) => (
                          <ComplianceCard
                            key={i}
                            meetingType={c.type}
                            completed={c.completed}
                            total={c.total}
                            status={c.status}
                            nextDueText={c.nextDue}
                            completedYearLabel={t('mandatory_completed_year')}
                            badgeLabelOnTrack={t('compliance_badge_on_track')}
                            badgeLabelDueSoon={t('compliance_badge_due_soon')}
                            badgeLabelOverdue={t('compliance_badge_overdue')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Semi-Annual group */}
                  {filterCards(SEMI_ANNUAL_CARDS).length > 0 && (
                    <div className="flex flex-col gap-[12px]">
                      <p className="font-semibold text-[14px] leading-[20px] text-[#525c66] tracking-[0.1px]" style={NS}>
                        {t('mandatory_group_semi_annual')}
                      </p>
                      <div className="flex gap-[16px] flex-wrap">
                        {filterCards(SEMI_ANNUAL_CARDS).map((c, i) => (
                          <ComplianceCard
                            key={i}
                            meetingType={c.type}
                            completed={c.completed}
                            total={c.total}
                            status={c.status}
                            nextDueText={c.nextDue}
                            completedYearLabel={t('mandatory_completed_year')}
                            badgeLabelOnTrack={t('compliance_badge_on_track')}
                            badgeLabelDueSoon={t('compliance_badge_due_soon')}
                            badgeLabelOverdue={t('compliance_badge_overdue')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fixed Date group */}
                  {filterCards(FIXED_DATE_CARDS).length > 0 && (
                    <div className="flex flex-col gap-[12px]">
                      <p className="font-semibold text-[14px] leading-[20px] text-[#525c66] tracking-[0.1px]" style={NS}>
                        {t('mandatory_group_fixed_date')}
                      </p>
                      <div className="flex gap-[16px] flex-wrap">
                        {filterCards(FIXED_DATE_CARDS).map((c, i) => (
                          <ComplianceCard
                            key={i}
                            meetingType={c.type}
                            completed={c.completed}
                            total={c.total}
                            status={c.status}
                            nextDueText={c.nextDue}
                            completedYearLabel={t('mandatory_completed_year')}
                            badgeLabelOnTrack={t('compliance_badge_on_track')}
                            badgeLabelDueSoon={t('compliance_badge_due_soon')}
                            badgeLabelOverdue={t('compliance_badge_overdue')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 5: Action Items — temporarily hidden ──
              <div className="flex flex-col gap-[3px] rounded-[20px] overflow-hidden">
                <div className="bg-white flex items-center gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px]">
                  <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                    {t('section_action_items')}
                  </span>
                  {openTaskCount > 0 && (
                    <AgendaNoLabel type="default" text={`${openTaskCount} ${t('action_items_tag')}`} />
                  )}
                </div>
                <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[30px] pt-[20px] pb-[30px] flex flex-col gap-[16px]">
                  <div className="flex items-center gap-[20px] border-b border-[rgba(106,62,49,0.12)] pb-[2px]">
                    <DashboardMenuBarItem text={t('action_tab_pending')} count={actionItems.filter(a => a.status !== 'done').length} state={actionTab === 'pending' ? 'selected' : 'default'} badgeVariant="neutral" onClick={() => setActionTab('pending')} />
                    <DashboardMenuBarItem text={t('action_tab_completed')} count={actionItems.filter(a => a.status === 'done').length} state={actionTab === 'completed' ? 'selected' : 'default'} badgeVariant="neutral" onClick={() => setActionTab('completed')} />
                  </div>
                  <div className="flex flex-col gap-[12px]">
                    {actionItems.filter(a => actionTab === 'pending' ? a.status !== 'done' : a.status === 'done').map(item => (
                      <ActionItemCard key={item.id} taskDescription={t(item.taskKey)} sourceMeeting={t(item.sourceKey)} daysSinceAssigned={t('days_ago').replace('{n}', String(item.daysSinceAssigned))} status={item.status} statusOpenLabel={t('status_open')} statusInProgressLabel={t('status_in_progress')} statusDoneLabel={t('status_done')} markDoneLabel={t('action_item_mark_done')} onMarkDone={() => markDone(item.id)} />
                    ))}
                  </div>
                </div>
              </div>
              ── end Section 5 ── */}

            </div>
    </MeetingShellLayout>
  );
}
