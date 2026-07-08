import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda } from '../context/AgendaContext';
import { useMeetings } from '../context/MeetingsContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { getNoticePeriod, getEarliestDate } from '../utils/meetingNoticePeriods';
import {
  AgendaCard,
  MeetingDetailsCard,
  SectionHolder,
  Button,
  AttendancePill,
  Icon,
  CloseButton,
  DropdownField,
  DatePicker,
  TimePicker,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

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

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

type VoteStatus = 'agree' | 'disagree' | null;
type Gender = 'woman' | 'man' | 'other';

interface ReviewParticipant {
  id: number;
  name: string;
  designation: string;
  phone: string;
  email: string;
  gender: Gender;
  vote: VoteStatus;
}

const MOCK_PARTICIPANTS: Omit<ReviewParticipant, 'vote'>[] = [
  { id: 1,  name: 'Ramesh Kumar',  designation: 'PDO',            phone: '9876543210', email: 'ramesh@kgp.gov.in',  gender: 'man'   },
  { id: 2,  name: 'Savitha Gowda', designation: 'Secretary',      phone: '9845123456', email: 'savitha@kgp.gov.in', gender: 'woman' },
  { id: 3,  name: 'Manjunath B.',  designation: 'Ward Member',    phone: '9741230987', email: 'manju@kgp.gov.in',   gender: 'man'   },
  { id: 4,  name: 'Lakshmi Devi',  designation: 'Ward Member',    phone: '9632014785', email: 'lakshmi@kgp.gov.in', gender: 'woman' },
  { id: 5,  name: 'Suresh Patil',  designation: 'President',      phone: '9512345678', email: 'suresh@kgp.gov.in',  gender: 'man'   },
  { id: 6,  name: 'Anitha Rao',    designation: 'Vice President', phone: '9423567890', email: 'anitha@kgp.gov.in',  gender: 'woman' },
  { id: 7,  name: 'Prakash Hegde', designation: 'Ward Member',    phone: '9334512678', email: 'prakash@kgp.gov.in', gender: 'man'   },
  { id: 8,  name: 'Kaveri S.',     designation: 'Ward Member',    phone: '9245631089', email: 'kaveri@kgp.gov.in',  gender: 'woman' },
  { id: 9,  name: 'Nagesh M.',     designation: 'Ward Member',    phone: '9156789023', email: 'nagesh@kgp.gov.in',  gender: 'man'   },
  { id: 10, name: 'Bhavana Naik',  designation: 'Ward Member',    phone: '9067891234', email: 'bhavana@kgp.gov.in', gender: 'woman' },
  { id: 11, name: 'Raju Chandra',  designation: 'Ward Member',    phone: '8978012345', email: 'raju@kgp.gov.in',    gender: 'man'   },
  { id: 12, name: 'Geetha Kumari', designation: 'Ward Member',    phone: '8889123456', email: 'geetha@kgp.gov.in',  gender: 'woman' },
];



// ── ParticipantPercentageCard ──────────────────────────────────────────────────
function ParticipantPercentageCard({
  percent,
  count,
  total,
  type,
  participantsLabel,
  participantsOutOf,
  voteLabel,
}: {
  percent: number;
  count: number;
  total: number;
  type: 'agree' | 'disagree';
  participantsLabel: string;
  participantsOutOf: string;
  voteLabel: string;
}) {
  const bg = type === 'agree' ? 'rgba(56,147,20,0.08)' : 'rgba(183,19,26,0.16)';
  return (
    <div
      className="flex flex-col gap-[5px] items-center px-[20px] py-[15px] rounded-[8px] w-[190px] mx-auto"
      style={{ backgroundColor: bg }}
    >
      <span className="text-[16px] leading-[20px] text-[#6a3e31] text-center" style={NS}>
        <span className="font-semibold">{percent}%</span>{' '}
        <span className="font-semibold">{voteLabel}</span>
      </span>
      <span className="font-normal text-[12px] leading-[16px] tracking-[0.4px] text-[#212121] text-center" style={NS}>
        {count} {participantsOutOf} {total} {participantsLabel}
      </span>
    </div>
  );
}

// ── AvatarGrid ────────────────────────────────────────────────────────────────
function AvatarGrid({ participants }: { participants: ReviewParticipant[] }) {
  return (
    <div className="flex flex-wrap gap-x-[12px] gap-y-[10px] justify-center mx-auto" style={{ maxWidth: 'calc(4 * 52px + 3 * 12px)' }}>
      {participants.map(p => (
        <div key={p.id} className="flex flex-col items-center gap-[4px] w-[52px]">
          <img
            src={p.gender === 'woman' ? '/avatar-woman.PNG' : '/avatar-man.PNG'}
            alt={p.name}
            className="size-[44px] object-contain"
          />
          <span
            className="text-[12px] text-[#3b3b3b] text-center leading-[13px] w-full truncate"
            style={NS}
            title={p.name}
          >
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── VoteTable ─────────────────────────────────────────────────────────────────
function VoteTable({
  participants,
  colName,
  colSl,
}: {
  participants: ReviewParticipant[];
  colName: string;
  colSl: string;
}) {
  const { tDesignation } = useLanguage();
  return (
    <div className="flex flex-col rounded-[6px] border border-[#c6c6c6] overflow-hidden w-full">
      {/* Header */}
      <div className="flex bg-[#ddd] border-b border-[#c6c6c6] shrink-0">
        <div className="w-[44px] shrink-0 px-[10px] py-[8px] border-r border-[#c6c6c6]">
          <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{colSl}</span>
        </div>
        <div className="flex-1 min-w-0 px-[10px] py-[8px]">
          <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{colName}</span>
        </div>
      </div>
      {/* Rows */}
      {participants.map((p, idx) => (
        <div
          key={p.id}
          className={`flex items-center bg-white ${idx < participants.length - 1 ? 'border-b border-[#e8e8e8]' : ''}`}
        >
          <div className="w-[44px] shrink-0 flex items-center px-[10px] h-[50px] border-r border-[#e8e8e8]">
            <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{idx + 1}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center px-[10px] py-[8px] min-h-[50px]">
            <span className="text-[12px] font-medium text-[#212121] leading-5 truncate" style={NS}>{p.name}</span>
            <span className="text-[11px] text-[#727272] leading-4 truncate" style={NS}>{tDesignation(p.designation)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const CURRENT_MEETING_ID = 2;

export default function ProceedingsReviewScreen() {
  const { t, tDesignation } = useLanguage();
  const { agendaItems } = useAgenda();
  const navigate = useNavigate();
  const location = useLocation();
  const meetingId: number | undefined = (location.state as { meetingId?: number } | null)?.meetingId;
  const { openingAbsentIds, savedVotes, setSavedVotes, reviews, setReviews, meetingAgendas, meetings, addMeeting, updateMeeting } = useMeetings();
  const currentMeeting = meetingId != null ? meetings.find(m => m.id === meetingId) : meetings.find(m => m.id === CURRENT_MEETING_ID);
  const { screenReaderMode, speak } = useAccessibility();
  const meetingTypeOptions = MEETING_TYPE_KEYS.map(k => t(k));

  const [nextMeetingType, setNextMeetingType] = useState('');
  const [nextMeetingDate, setNextMeetingDate] = useState('');
  const [nextMeetingTime, setNextMeetingTime] = useState('');
  const nextNoticePeriod = getNoticePeriod(nextMeetingType);
  const nextMinDate = nextMeetingType ? getEarliestDate(nextNoticePeriod.days) : undefined;

  // Use per-meeting agendas if this is a user-created meeting
  const userAgendas = meetingId != null ? (meetingAgendas[meetingId] ?? null) : null;
  const effectiveAgendaItems = userAgendas
    ? userAgendas.map(a => ({ id: a.id, heading: a.title, description: a.description, completed: a.completed, proceedingsText: a.proceedingsText }))
    : agendaItems;
  // Review modal state
  const [reviewModalId, setReviewModalId]               = useState<number | null>(null);
  const [workingParticipants, setWorkingParticipants]   = useState<ReviewParticipant[]>([]);
  // 'entry' = vote table, 'viz' = result visualisation
  const [reviewPhase, setReviewPhase] = useState<'entry' | 'viz'>('entry');

  const reviewModalItem = reviewModalId !== null ? effectiveAgendaItems.find(a => a.id === reviewModalId) : null;

  const allReviewed = effectiveAgendaItems.every(a => reviews[a.id]);

  function initFilteredParticipants(): ReviewParticipant[] {
    return MOCK_PARTICIPANTS.filter(p => !openingAbsentIds.has(p.id)).map(p => ({ ...p, vote: null }));
  }

  function openReviewModal(agendaId: number) {
    setWorkingParticipants(savedVotes[agendaId] ?? initFilteredParticipants());
    setReviewPhase('entry');
    setReviewModalId(agendaId);
  }

  function openVizModal(agendaId: number) {
    setWorkingParticipants(savedVotes[agendaId] ?? initFilteredParticipants());
    setReviewPhase('viz');
    setReviewModalId(agendaId);
  }

  function setVote(participantId: number, vote: VoteStatus) {
    setWorkingParticipants(prev =>
      prev.map(p => p.id === participantId ? { ...p, vote } : p)
    );
  }

  const allVoted = workingParticipants.length > 0 && workingParticipants.every(p => p.vote !== null);

  function handleSaveReview() {
    if (reviewModalId === null) return;
    setSavedVotes(prev => ({ ...prev, [reviewModalId]: workingParticipants }));
    setReviewPhase('viz');
  }

  function handleSaveAndClose() {
    if (reviewModalId === null) return;
    setReviews(prev => ({ ...prev, [reviewModalId]: true }));
    setReviewModalId(null);
    setReviewPhase('entry');
  }

  // ── Derived vote stats ─────────────────────────────────────────────────────
  const agreedList    = workingParticipants.filter(p => p.vote === 'agree');
  const disagreedList = workingParticipants.filter(p => p.vote === 'disagree');
  const total         = workingParticipants.length;
  const agreePercent  = total > 0 ? Math.round((agreedList.length / total) * 100) : 0;
  const disagreePercent = total > 0 ? Math.round((disagreedList.length / total) * 100) : 0;
  const womenCount  = workingParticipants.filter(p => p.gender === 'woman').length;
  const menCount    = workingParticipants.filter(p => p.gender === 'man').length;
  const othersCount = workingParticipants.filter(p => p.gender === 'other').length;

  function handleProceed() {
    if (!allReviewed) return;

    // Record the chosen next-meeting details on the current meeting so the
    // Send to President proceedings preview can show them later.
    const targetId = meetingId ?? CURRENT_MEETING_ID;
    if (nextMeetingType) {
      updateMeeting(targetId, { nextMeetingType, nextMeetingDate });

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

    navigate('/meetings/closure-attendance', { state: { meetingId } });
  }

  return (
    <MeetingShellLayout stepperActiveState={3}>

      <MeetingDetailsCard
        variant="default-shortened"
        meetingTitle={t('mock_meeting_title')}
        modeOfMeeting={t('meeting_type_in_person')}
        date="19/03/2026"
        time="10:00 a.m"
        venue="Kakanur GP Office (1501001003)"
        participants={`14 ${t('meeting_participants_label')}`}
      />

      <SectionHolder
        variant="with-tag"
        title={t('proceedings_review_section_title')}
        tagText={`${effectiveAgendaItems.length} ${t('proceedings_review_count_agendas')}`}
        bodyClassName="px-[30px] pt-[25px] pb-[35px] flex flex-col gap-[30px]"
      >
        {effectiveAgendaItems.map(item => (
          <AgendaCard
            key={item.id}
            stage={reviews[item.id] ? 'review-done' : 'review-pending'}
            agendaNumber={String(item.id)}
            agendaHeading={item.heading}
            agendaDescription={item.description}
            addReviewText={t('proceedings_review_add_review')}
            viewProceedingsText={t('btn_view_proceedings')}
            editProceedingsText={t('btn_edit_proceedings')}
            onAddReview={() => openReviewModal(item.id)}
            onViewProceedings={() => openVizModal(item.id)}
            onEditProceedings={() => openReviewModal(item.id)}
          />
        ))}
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
              minDate={nextMinDate}
              meetingType={nextMeetingType}
              noticeDays={nextNoticePeriod.days}
              onOpenNarrate={screenReaderMode ? (text) => speak(text) : undefined}
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

      <div className="flex items-center justify-center gap-[10px] pb-2 mt-[20px]">
        <Button
          variant="outlined"
          iconPlacement="left"
          iconName="arrow_back"
          text={t('btn_previous')}
          onClick={() => navigate('/agenda-list', { state: { meetingId } })}
        />
        <Button
          variant="filled"
          iconPlacement="right"
          iconName="arrow_forward"
          text={t('proceedings_review_btn_proceed')}
          state={allReviewed ? 'default' : 'disabled'}
          onClick={allReviewed ? handleProceed : undefined}
        />
      </div>


      {/* Review modal */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[820px] max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex flex-col min-h-0">
            {/* Header */}
            <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
              <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                {t('review_modal_title')}
              </span>
              <CloseButton onClick={() => { setReviewModalId(null); setReviewPhase('entry'); }} />
            </div>
            {/* Body */}
            <div className="bg-white rounded-bl-[20px] rounded-br-[20px] flex flex-col gap-[20px] px-[30px] pt-[25px] pb-[30px] min-h-0">
              {/* Agenda card — shown in both phases */}
              <div className="border border-[rgba(106,62,49,0.24)] rounded-[8px] px-[15px] py-[12px] flex items-center shrink-0">
                <div className="flex items-center gap-[15px]">
                  <div className="bg-[#efe0dc] flex items-center justify-center rounded-full size-[32px] shrink-0">
                    <span className="font-medium text-[14px] text-[#6a3e31] text-center" style={NS}>
                      {reviewModalItem.id}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-[14px] text-[#4b4b4b] leading-6" style={NS}>
                      {reviewModalItem.heading}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── ENTRY PHASE: vote table ── */}
              {reviewPhase === 'entry' && (
                <>
                  <div className="flex flex-col rounded-[6px] border border-[#c6c6c6] overflow-hidden min-h-0 flex-1">
                    {/* Fixed header */}
                    <div className="flex bg-[#ddd] border-b border-[#c6c6c6] shrink-0">
                      <div className="w-[50px] shrink-0 px-[12px] py-[10px] border-r border-[#c6c6c6]">
                        <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{t('review_col_sl')}</span>
                      </div>
                      <div className="w-[170px] shrink-0 px-[12px] py-[10px] border-r border-[#c6c6c6]">
                        <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{t('review_col_name')}</span>
                      </div>
                      <div className="flex-1 min-w-0 px-[12px] py-[10px] border-r border-[#c6c6c6]">
                        <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{t('review_col_vote')}</span>
                      </div>
                      <div className="w-[130px] shrink-0 px-[12px] py-[10px]">
                        <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{t('review_col_phone')}</span>
                      </div>
                    </div>
                    {/* Scrollable rows */}
                    <div className="overflow-y-auto flex-1">
                      {workingParticipants.map((p, idx) => (
                        <div
                          key={p.id}
                          className={`group flex items-center ${idx < workingParticipants.length - 1 ? 'border-b border-[#e8e8e8]' : ''}`}
                          style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid', borderLeftColor: p.vote === 'agree' ? '#2e7d32' : p.vote === 'disagree' ? '#FFAC9A' : 'transparent' }}
                        >
                          <div className="w-[50px] shrink-0 flex items-center px-[12px] h-[50px] border-r border-[#e8e8e8] group-hover:bg-[#eeeeee]">
                            <span className="text-[12px] text-[#4b4b4b]" style={NS}>{p.id}</span>
                          </div>
                          <div className="w-[170px] shrink-0 flex items-center px-[12px] h-[50px] border-r border-[#e8e8e8] group-hover:bg-[#eeeeee]">
                            <div className="flex flex-col">
                              <span className="text-[12px] font-medium text-[#212121] leading-5" style={NS}>{p.name}</span>
                              <span className="text-[11px] text-[#727272] leading-4" style={NS}>{tDesignation(p.designation)}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 flex items-center px-[12px] h-[50px] border-r border-[#e8e8e8] group-hover:bg-[#eeeeee]">
                            <AttendancePill
                              status={p.vote === 'agree' ? 'present' : p.vote === 'disagree' ? 'absent' : 'unmarked'}
                              onMark={s => setVote(p.id, s === 'present' ? 'agree' : 'disagree')}
                              onUnmark={() => setVote(p.id, null)}
                              presentLabel={t('review_btn_agree')}
                              absentLabel={t('review_btn_disagree')}
                            />
                          </div>
                          <div className="w-[130px] shrink-0 flex items-center px-[12px] h-[50px] group-hover:bg-[#eeeeee]">
                            <span className="text-[12px] text-[#4b4b4b]" style={NS}>{p.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer — entry phase */}
                  <div className="flex items-center justify-center gap-[12px] shrink-0 pt-[5px]">
                    <Button
                      variant="outlined"
                      size="small"
                      iconPlacement="none"
                      text={t('btn_close')}
                      onClick={() => { setReviewModalId(null); setReviewPhase('entry'); }}
                    />
                    <Button
                      variant="filled"
                      size="small"
                      iconPlacement="none"
                      text={t('review_btn_submit')}
                      state={allVoted ? 'default' : 'disabled'}
                      onClick={allVoted ? handleSaveReview : undefined}
                    />
                  </div>
                </>
              )}

              {/* ── VIZ PHASE: results visualisation ── */}
              {reviewPhase === 'viz' && (
                <>
                  <div className="overflow-y-auto flex-1 flex flex-col gap-[25px]">
                    {/* Summary bar */}
                    <div className="bg-[#f7f0ee] flex items-center justify-center px-[20px] py-[10px] rounded-[10px] w-full shrink-0">
                      <span className="font-semibold text-[14px] leading-[24px] text-[#6a3e31] whitespace-nowrap" style={NS}>
                        {t('review_viz_total')}: {total}&nbsp;&nbsp;|&nbsp;&nbsp;
                        {t('review_viz_women')}: {womenCount}&nbsp;&nbsp;|&nbsp;&nbsp;
                        {t('review_viz_men')}: {menCount}&nbsp;&nbsp;|&nbsp;&nbsp;
                        {t('review_viz_others')}: {othersCount}
                      </span>
                    </div>

                    {/* Two-column layout — grid so avatar/stats/table rows align across sides */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gridTemplateRows: 'auto auto auto auto', columnGap: '24px', rowGap: '0px' }}>
                      {/* Row 1: avatar grids */}
                      <div style={{ gridColumn: 1, gridRow: 1, paddingBottom: '30px' }}>
                        <AvatarGrid participants={agreedList} />
                      </div>
                      <div style={{ gridColumn: 2, gridRow: '1 / 5', backgroundColor: 'rgba(106,62,49,0.40)' }} />
                      <div style={{ gridColumn: 3, gridRow: 1, paddingBottom: '30px' }}>
                        <AvatarGrid participants={disagreedList} />
                      </div>
                      {/* Row 2: ballot images */}
                      <div style={{ gridColumn: 1, gridRow: 2, paddingBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                        <img src="/Agree Ballot.PNG" alt="Agree ballot" style={{ height: '72px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ gridColumn: 3, gridRow: 2, paddingBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                        <img src="/Disagree Ballot.PNG" alt="Disagree ballot" style={{ height: '72px', objectFit: 'contain' }} />
                      </div>
                      {/* Row 3: percentage cards */}
                      <div style={{ gridColumn: 1, gridRow: 3, paddingBottom: '20px' }}>
                        <ParticipantPercentageCard
                          percent={agreePercent}
                          count={agreedList.length}
                          total={total}
                          type="agree"
                          participantsLabel={t('review_viz_participants')}
                          participantsOutOf={t('proceedings_review_count_out')}
                          voteLabel={t('review_viz_agreed')}
                        />
                      </div>
                      <div style={{ gridColumn: 3, gridRow: 3, paddingBottom: '20px' }}>
                        <ParticipantPercentageCard
                          percent={disagreePercent}
                          count={disagreedList.length}
                          total={total}
                          type="disagree"
                          participantsLabel={t('review_viz_participants')}
                          participantsOutOf={t('proceedings_review_count_out')}
                          voteLabel={t('review_viz_disagreed')}
                        />
                      </div>
                      {/* Row 4: tables */}
                      <div style={{ gridColumn: 1, gridRow: 4 }}>
                        <VoteTable
                          participants={agreedList}
                          colSl={t('review_col_sl')}
                          colName={t('review_viz_col_name')}
                        />
                      </div>
                      <div style={{ gridColumn: 3, gridRow: 4 }}>
                        <VoteTable
                          participants={disagreedList}
                          colSl={t('review_col_sl')}
                          colName={t('review_viz_col_name')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer — viz phase */}
                  <div className="flex items-center justify-center gap-[10px] shrink-0 pt-[5px]">
                    <Button
                      variant="outlined"
                      size="small"
                      iconPlacement="none"
                      text={t('review_btn_go_back_edit')}
                      onClick={() => setReviewPhase('entry')}
                    />
                    <Button
                      variant="filled"
                      size="small"
                      iconPlacement="none"
                      text={t('review_btn_save_close')}
                      onClick={handleSaveAndClose}
                    />
                  </div>
                </>
              )}

            </div>
            </div>
          </div>
        </div>
      )}

    </MeetingShellLayout>
  );
}
