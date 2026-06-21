import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import {
  MeetingDetailsCard,
  SectionHolder,
  Button,
  QuorumBar,
  NumberCircle,
  Table,
} from '../components';
import type { TableColumn } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS = [
  { id: 1,  name: 'Suresh Patil',     designation: 'President',         gpName: 'Kakanur GP',  phone: '9512345678', email: 'suresh@kgp.gov.in',   status: 'present' },
  { id: 2,  name: 'Anitha Rao',       designation: 'Vice President',    gpName: 'Kakanur GP',  phone: '9423567890', email: 'anitha@kgp.gov.in',   status: 'present' },
  { id: 3,  name: 'Ramesh Kumar',     designation: 'PDO',               gpName: 'Kakanur GP',  phone: '9876543210', email: 'ramesh@kgp.gov.in',   status: 'present' },
  { id: 4,  name: 'Savitha Gowda',    designation: 'Secretary',         gpName: 'Kakanur GP',  phone: '9845123456', email: 'savitha@kgp.gov.in',  status: 'present' },
  { id: 5,  name: 'Manjunath B.',     designation: 'Ward Member',       gpName: 'Hosakote GP', phone: '9741230987', email: 'manju@kgp.gov.in',    status: 'present' },
  { id: 6,  name: 'Lakshmi Devi',     designation: 'Ward Member',       gpName: 'Hosakote GP', phone: '9632014785', email: 'lakshmi@kgp.gov.in',  status: 'present' },
  { id: 7,  name: 'Prakash Hegde',    designation: 'Ward Member',       gpName: 'Hosakote GP', phone: '9334512678', email: 'prakash@kgp.gov.in',  status: 'absent'  },
  { id: 8,  name: 'Kaveri S.',        designation: 'Ward Member',       gpName: 'Hosakote GP', phone: '9245631089', email: 'kaveri@kgp.gov.in',   status: 'present' },
  { id: 9,  name: 'Nagesh M.',        designation: 'Ward Member',       gpName: 'Kakanur GP',  phone: '9156789023', email: 'nagesh@kgp.gov.in',   status: 'present' },
  { id: 10, name: 'Bhavana Naik',     designation: 'Ward Member',       gpName: 'Hosakote GP', phone: '9067891234', email: 'bhavana@kgp.gov.in',  status: 'absent'  },
  { id: 11, name: 'Raju Chandra',     designation: 'Ward Member',       gpName: 'Kakanur GP',  phone: '8978012345', email: 'raju@kgp.gov.in',     status: 'present' },
  { id: 12, name: 'Geetha Kumari',    designation: 'Ward Member',       gpName: 'Hosakote GP', phone: '8889123456', email: 'geetha@kgp.gov.in',   status: 'present' },
];

const MOCK_AGENDA = [
  {
    id: 1,
    headingKey: 'agenda_heading_1',
    descriptionKey: 'agenda_desc_1',
    proceedings: 'The minutes of the previous meeting were read out by the Secretary. All members confirmed the accuracy of the proceedings. The decisions taken were acknowledged and action-taken reports were presented. The meeting unanimously resolved to confirm the minutes as read.',
  },
  {
    id: 2,
    headingKey: 'agenda_heading_2',
    descriptionKey: 'agenda_desc_2',
    proceedings: 'Circulars received from the State Government regarding MGNREGS wage revision, Swachh Bharat Mission Phase II implementation, and gram sabha schedule notifications were read aloud and explained to all members. Members noted the contents and resolved to comply with the directives as per government guidelines.',
  },
  {
    id: 3,
    headingKey: 'agenda_heading_3',
    descriptionKey: 'agenda_desc_3',
    proceedings: 'The deposit expenditure statement for Q3 2025–26 was presented by the Secretary. Total deposits: ₹14,82,000. Total expenditure: ₹11,36,500. The General Body reviewed each line item and unanimously approved the statement after minor clarifications.',
  },
  {
    id: 4,
    headingKey: 'agenda_heading_4',
    descriptionKey: 'agenda_desc_4',
    proceedings: 'A total of 12 public applications were reviewed, including requests for street light repair in Ward 4, road resurfacing on the main market road, and tank bund desilting. The meeting resolved to take action on 9 of the 12 applications within 30 days and referred the remaining 3 to the district office.',
  },
];

type Gender = 'woman' | 'man' | 'other';
interface ReviewParticipant { id: number; name: string; designation: string; gender: Gender; }

const MOCK_REVIEW_PARTICIPANTS: ReviewParticipant[] = [
  { id: 1,  name: 'Suresh Patil',  designation: 'President',      gender: 'man'   },
  { id: 2,  name: 'Anitha Rao',    designation: 'Vice President', gender: 'woman' },
  { id: 3,  name: 'Ramesh Kumar',  designation: 'PDO',            gender: 'man'   },
  { id: 4,  name: 'Savitha Gowda', designation: 'Secretary',      gender: 'woman' },
  { id: 5,  name: 'Manjunath B.',  designation: 'Ward Member',    gender: 'man'   },
  { id: 6,  name: 'Lakshmi Devi',  designation: 'Ward Member',    gender: 'woman' },
  { id: 8,  name: 'Kaveri S.',     designation: 'Ward Member',    gender: 'woman' },
  { id: 9,  name: 'Nagesh M.',     designation: 'Ward Member',    gender: 'man'   },
  { id: 11, name: 'Raju Chandra',  designation: 'Ward Member',    gender: 'man'   },
  { id: 12, name: 'Geetha Kumari', designation: 'Ward Member',    gender: 'woman' },
];

const byName = Object.fromEntries(MOCK_REVIEW_PARTICIPANTS.map(p => [p.name, p]));

const MOCK_REVIEWS: Record<number, { agreed: ReviewParticipant[]; disagreed: ReviewParticipant[] }> = {
  1: { agreed: MOCK_REVIEW_PARTICIPANTS, disagreed: [] },
  2: { agreed: MOCK_REVIEW_PARTICIPANTS, disagreed: [] },
  3: {
    agreed:    ['Suresh Patil','Anitha Rao','Ramesh Kumar','Savitha Gowda','Manjunath B.','Kaveri S.','Nagesh M.','Raju Chandra'].map(n => byName[n]),
    disagreed: ['Lakshmi Devi','Geetha Kumari'].map(n => byName[n]),
  },
  4: { agreed: MOCK_REVIEW_PARTICIPANTS, disagreed: [] },
};

// ─── Review viz sub-components (mirror of ProceedingsReviewScreen) ───────────

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
          <span className="text-[12px] text-[#3b3b3b] text-center leading-[13px] w-full truncate" style={NS} title={p.name}>
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ParticipantPercentageCard({
  percent, count, total, type, participantsLabel, participantsOutOf, voteLabel,
}: {
  percent: number; count: number; total: number; type: 'agree' | 'disagree';
  participantsLabel: string; participantsOutOf: string; voteLabel: string;
}) {
  const bg = type === 'agree' ? 'rgba(56,147,20,0.08)' : 'rgba(183,19,26,0.16)';
  return (
    <div className="flex flex-col gap-[5px] items-center px-[20px] py-[15px] rounded-[8px] w-[190px] mx-auto" style={{ backgroundColor: bg }}>
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

function VoteTable({ participants, colName, colSl }: { participants: ReviewParticipant[]; colName: string; colSl: string; }) {
  return (
    <div className="flex flex-col rounded-[6px] border border-[#c6c6c6] overflow-hidden w-full">
      <div className="flex bg-[#ddd] border-b border-[#c6c6c6] shrink-0">
        <div className="w-[44px] shrink-0 px-[10px] py-[8px] border-r border-[#c6c6c6]">
          <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{colSl}</span>
        </div>
        <div className="flex-1 min-w-0 px-[10px] py-[8px]">
          <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{colName}</span>
        </div>
      </div>
      {participants.map((p, idx) => (
        <div key={p.id} className={`flex items-center bg-white ${idx < participants.length - 1 ? 'border-b border-[#e8e8e8]' : ''}`}>
          <div className="w-[44px] shrink-0 flex items-center px-[10px] h-[50px] border-r border-[#e8e8e8]">
            <span className="text-[12px] text-[#4b4b4b] tracking-[0.4px]" style={NS}>{idx + 1}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center px-[10px] py-[8px] min-h-[50px]">
            <span className="text-[12px] font-medium text-[#212121] leading-5 truncate" style={NS}>{p.name}</span>
            <span className="text-[11px] text-[#727272] leading-4 truncate" style={NS}>{p.designation}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ParticipantRow = { id: number; name: string; designation: string; status: string; sl: number };

function ParticipantsTable({ t }: { t: (k: string) => string }) {
  const sorted = [
    ...MOCK_PARTICIPANTS.filter(p => p.status === 'present'),
    ...MOCK_PARTICIPANTS.filter(p => p.status === 'absent'),
  ].map((p, i) => ({ ...p, sl: i + 1 } as ParticipantRow));

  const columns: TableColumn<Record<string, unknown>>[] = [
    {
      key: 'sl',
      label: t('view_meeting_col_sl'),
      width: 'w-[52px] shrink-0',
    },
    {
      key: 'name',
      label: t('view_meeting_col_name'),
      width: 'w-[180px] shrink-0',
      render: (_v, row) => (
        <div className="flex flex-col justify-center py-[4px]">
          <span className="text-[12px] font-medium text-[#212121] leading-5 truncate" style={NS}>
            {row.name as string}
          </span>
          <span className="text-[11px] text-[#727272] leading-4 truncate" style={NS}>
            {row.designation as string}
          </span>
        </div>
      ),
    },
    {
      key: 'gpName',
      label: t('attendance_col_gp'),
      width: 'w-[140px] shrink-0',
    },
    {
      key: 'phone',
      label: t('attendance_col_phone'),
      width: 'w-[130px] shrink-0',
    },
    {
      key: 'email',
      label: t('attendance_col_email'),
      width: 'flex-1 min-w-0',
    },
    {
      key: 'status',
      label: t('view_meeting_col_status'),
      width: 'w-[120px] shrink-0',
      render: (_v, row) => (
        <span
          className="text-[12px] font-medium"
          style={{ ...NS, color: row.status === 'present' ? '#2e7d32' : '#c62828' }}
        >
          {row.status === 'present' ? t('view_meeting_present') : t('view_meeting_absent')}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={sorted as unknown as Record<string, unknown>[]}
      getRowId={row => row.id as number}
    />
  );
}

function AgendaReviewSection({ t }: { t: (k: string) => string }) {
  return (
    <div className="flex flex-col gap-[30px]">
      {MOCK_AGENDA.map(item => {
        const review = MOCK_REVIEWS[item.id];
        const agreedList      = review?.agreed    ?? [];
        const disagreedList   = review?.disagreed ?? [];
        const total           = agreedList.length + disagreedList.length;
        const agreePercent    = total > 0 ? Math.round((agreedList.length    / total) * 100) : 0;
        const disagreePercent = total > 0 ? Math.round((disagreedList.length / total) * 100) : 0;
        const all             = [...agreedList, ...disagreedList];
        const womenCount      = all.filter(p => p.gender === 'woman').length;
        const menCount        = all.filter(p => p.gender === 'man').length;
        const othersCount     = all.filter(p => p.gender === 'other').length;

        return (
          <div key={item.id} className="border border-[rgba(106,62,49,0.24)] rounded-[10px] flex flex-col gap-[20px] p-[20px]">

            {/* Heading */}
            <div className="flex items-start gap-[14px]">
              <NumberCircle type="subpage" number={String(item.id)} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-[14px] text-[#212121] leading-[22px]" style={NS}>
                  {t(item.headingKey)}
                </span>
                <span className="text-[12px] text-[#727272] leading-[20px]" style={NS}>
                  {t(item.descriptionKey)}
                </span>
              </div>
            </div>

            {/* Proceedings */}
            <div className="flex flex-col gap-[6px]">
              <span className="text-[11px] font-semibold text-[#6a3e31] uppercase tracking-[0.5px]" style={NS}>
                {t('view_meeting_proceedings_label')}
              </span>
              <div className="bg-[rgba(221,221,221,0.15)] border border-[rgba(106,62,49,0.16)] rounded-[8px] px-[15px] py-[10px]">
                <p className="text-[12px] text-[#3b3b3b] leading-[20px]" style={NS}>
                  {item.proceedings || (
                    <span className="text-[#727272] italic">{t('view_meeting_no_proceedings')}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[rgba(106,62,49,0.16)]" />

            {/* Review viz */}
            {/* Summary bar */}
            <div className="bg-[#f7f0ee] flex items-center justify-center px-[20px] py-[10px] rounded-[10px] w-full shrink-0">
              <span className="font-semibold text-[14px] leading-[24px] text-[#6a3e31] whitespace-nowrap" style={NS}>
                {t('review_viz_total')}: {total}&nbsp;&nbsp;|&nbsp;&nbsp;
                {t('review_viz_women')}: {womenCount}&nbsp;&nbsp;|&nbsp;&nbsp;
                {t('review_viz_men')}: {menCount}&nbsp;&nbsp;|&nbsp;&nbsp;
                {t('review_viz_others')}: {othersCount}
              </span>
            </div>

            {/* Two-column: avatars → ballots → % cards → tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gridTemplateRows: 'auto auto auto auto', columnGap: '24px', rowGap: '0px' }}>
              <div style={{ gridColumn: 1, gridRow: 1, paddingBottom: '30px' }}>
                <AvatarGrid participants={agreedList} />
              </div>
              <div style={{ gridColumn: 2, gridRow: '1 / 5', backgroundColor: 'rgba(106,62,49,0.40)' }} />
              <div style={{ gridColumn: 3, gridRow: 1, paddingBottom: '30px' }}>
                <AvatarGrid participants={disagreedList} />
              </div>
              <div style={{ gridColumn: 1, gridRow: 2, paddingBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                <img src="/Agree Ballot.PNG" alt="Agree ballot" style={{ height: '72px', objectFit: 'contain' }} />
              </div>
              <div style={{ gridColumn: 3, gridRow: 2, paddingBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                <img src="/Disagree Ballot.PNG" alt="Disagree ballot" style={{ height: '72px', objectFit: 'contain' }} />
              </div>
              <div style={{ gridColumn: 1, gridRow: 3, paddingBottom: '20px' }}>
                <ParticipantPercentageCard
                  percent={agreePercent} count={agreedList.length} total={total} type="agree"
                  participantsLabel={t('review_viz_participants')} participantsOutOf={t('proceedings_review_count_out')} voteLabel={t('review_viz_agreed')}
                />
              </div>
              <div style={{ gridColumn: 3, gridRow: 3, paddingBottom: '20px' }}>
                <ParticipantPercentageCard
                  percent={disagreePercent} count={disagreedList.length} total={total} type="disagree"
                  participantsLabel={t('review_viz_participants')} participantsOutOf={t('proceedings_review_count_out')} voteLabel={t('review_viz_disagreed')}
                />
              </div>
              <div style={{ gridColumn: 1, gridRow: 4 }}>
                <VoteTable participants={agreedList}    colSl={t('review_col_sl')} colName={t('review_viz_col_name')} />
              </div>
              <div style={{ gridColumn: 3, gridRow: 4 }}>
                <VoteTable participants={disagreedList} colSl={t('review_col_sl')} colName={t('review_viz_col_name')} />
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ViewMeetingScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { meetings } = useMeetings();
  const meeting = meetings.find(m => m.id === Number(id));

  const presentCount = MOCK_PARTICIPANTS.filter(p => p.status === 'present').length;
  const absentCount  = MOCK_PARTICIPANTS.filter(p => p.status === 'absent').length;
  const total        = MOCK_PARTICIPANTS.length;
  const quorumPct    = Math.round((presentCount / total) * 100);

  const meetingName = meeting?.nameKey ? t(meeting.nameKey) : (meeting?.name ?? t('mock_meeting_title'));

  return (
    <MeetingShellLayout
      stepperActiveState={1}
      showStepper={false}
      showBack={false}
      breadcrumbItems={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_view_meeting')]}
    >
              {/* Meeting details */}
              <MeetingDetailsCard
                variant="default"
                meetingTitle={meetingName}
                modeOfMeeting={t('meeting_mode_in_person')}
                date={meeting?.date ?? '—'}
                time={meeting?.time ?? '—'}
                venue={meeting?.venue ?? '—'}
                participants={`${meeting?.participants ?? total} ${t('meeting_participants_label')}`}
              />

              {/* Quorum + Participants */}
              <SectionHolder
                variant="with-tag"
                title={t('view_meeting_section_participants')}
                tagText={`${total} ${t('meeting_participants_label')}`}
                bodyClassName="px-[25px] pt-[16px] pb-[25px] flex flex-col gap-[20px]"
              >
                <QuorumBar
                  total={total}
                  present={presentCount}
                  absent={absentCount}
                  unmarked={0}
                  noBiometricCount={0}
                  quorumPct={quorumPct}
                  quorumMet={quorumPct >= 51}
                  quorumRequired={51}
                />
                <ParticipantsTable t={t} />
              </SectionHolder>

              {/* Agenda, Minutes & Review */}
              <SectionHolder
                variant="with-tag"
                title={t('view_meeting_section_agenda')}
                tagText={`${MOCK_AGENDA.length} ${t('proceedings_review_count_agendas')}`}
                bodyClassName="px-[25px] pt-[16px] pb-[25px]"
              >
                <AgendaReviewSection t={t} />
              </SectionHolder>

              {/* Back button */}
              <div className="flex items-center justify-center pt-[4px] pb-[4px]">
                <Button
                  variant="outlined"
                  iconPlacement="left"
                  iconName="arrow_back"
                  text={t('view_meeting_back_to_list')}
                  onClick={() => navigate('/meetings/list')}
                />
              </div>
    </MeetingShellLayout>
  );
}
