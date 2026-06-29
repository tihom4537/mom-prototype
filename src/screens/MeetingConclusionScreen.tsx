import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Button, Icon, SectionHolder } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

const MEETING_TITLE = '2nd GP General Body Meeting 2026';
const MEETING_META  = '7 February 2026  ·  10:00 AM  ·  HOSAKOTE GP Office';

const STATS = {
  agendas:     8,
  men:         56,
  women:       104,
  tasks:       5,
  resolutions: 3,
};

const TOTAL_ATTENDED = STATS.men + STATS.women;

const MEMBERS_ATTENDED = [
  { name: 'Savitha Gowda',   designation: 'Secretary' },
  { name: 'Manjunath B.',    designation: 'Ward Member' },
  { name: 'Lakshmi Devi',    designation: 'Ward Member' },
  { name: 'Suresh Patil',    designation: 'President' },
  { name: 'Anitha Rao',      designation: 'Vice President' },
  { name: 'Prakash Hegde',   designation: 'Ward Member' },
  { name: 'Kaveri S.',       designation: 'Ward Member' },
  { name: 'Nagesh M.',       designation: 'Ward Member' },
  { name: 'Bhavana Naik',    designation: 'Ward Member' },
  { name: 'Raju Chandra',    designation: 'Ward Member' },
  { name: 'Geetha Kumari',   designation: 'Ward Member' },
];

const MEMBERS_ABSENT = [
  { name: 'Basavaraju K.',   designation: 'Ward Member' },
  { name: 'Sumitra Devi',    designation: 'Ward Member' },
  { name: 'Venkatesh Naik',  designation: 'Ward Member' },
];

const TOTAL_MEMBERS   = 14;
const QUORUM_REQUIRED = Math.ceil(TOTAL_MEMBERS * 0.51);
const QUORUM_MET      = MEMBERS_ATTENDED.length >= QUORUM_REQUIRED;

const NEXT_MEETING = {
  type:  'GP General Body Meeting — Ordinary',
  date:  '7 March 2026',
  time:  '10:00 AM',
  venue: 'HOSAKOTE GP Office',
};

export default function MeetingConclusionScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const wPct = Math.round((STATS.women / TOTAL_ATTENDED) * 100);
  const mPct = 100 - wPct;

  return (
    <MeetingShellLayout
      stepperActiveState={1}
      showStepper={false}
      showBack={false}
      breadcrumbItems={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('conclusion_breadcrumb')]}
    >
      <div className="flex flex-col gap-[16px]">

        {/* ── 1. Sent confirmation bar ── */}
        <div className="w-full bg-[#e8f5e9] border border-[#3c9718] rounded-[14px] px-[24px] py-[5px] flex items-center gap-[14px]">
          <div className="size-[40px] rounded-full bg-[#e8f5e9] flex items-center justify-center shrink-0">
            <Icon name="check_circle" size="medium" color="#2e7d32" />
          </div>
          <p className="font-semibold text-[15px] leading-[22px] text-[#2e7d32]" style={NS}>{t('conclusion_sent_label')}</p>
        </div>

        {/* ── 2. Thank-you card ── */}
        <div className="w-full bg-white rounded-[14px] px-[32px] py-[28px] flex items-center gap-[28px]">
          <span className="material-icons-outlined shrink-0" style={{ fontSize: 72, color: 'rgba(106,62,49,0.5)', lineHeight: 1 }}>emoji_events</span>
          <div className="flex flex-col gap-[6px]">
            <p className="font-bold text-[22px] leading-[30px] text-[#484848]" style={NS}>{t('conclusion_message_line1')}</p>
            <p className="font-semibold text-[18px] leading-[26px] text-[#6a3e31]" style={NS}>{t('conclusion_message_line2')}</p>
            <p className="font-normal text-[16px] leading-[24px] text-[#5e5e5e] tracking-[0.1px] mt-[2px]" style={NS}>{t('conclusion_thank_you')}</p>
          </div>
        </div>

        {/* ── 3. Section holder — meeting name + all detail cards ── */}
        <div className="w-full">
          <SectionHolder
            variant="default"
            title={`${MEETING_TITLE} — Meeting Summary`}
            bodyClassName="px-[24px] py-[24px]"
          >
            <div className="flex gap-[15px] items-start">

              {/* Col 1: stat cards stacked + next meeting */}
              <div className="flex flex-col gap-[15px] shrink-0" style={{ width: 305 }}>
                <div className="bg-white border border-[#ddd] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-[14px] py-[14px] flex flex-col gap-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <div className="size-[30px] rounded-full bg-[#F3F3F3] flex items-center justify-center shrink-0">
                      <Icon name="list_alt" size="small" color="#6a3e31" />
                    </div>
                    <p className="font-semibold text-[26px] leading-[1] text-[#484848]" style={NS}>{STATS.agendas}</p>
                  </div>
                  <p className="font-normal text-[12px] leading-[18px] text-[#727272]" style={NS}>{t('conclusion_stat_agendas')}</p>
                </div>
                <div className="bg-white border border-[#ddd] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-[14px] py-[14px] flex flex-col gap-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <div className="size-[30px] rounded-full bg-[#F3F3F3] flex items-center justify-center shrink-0">
                      <Icon name="gavel" size="small" color="#f57f17" />
                    </div>
                    <p className="font-semibold text-[26px] leading-[1] text-[#484848]" style={NS}>{STATS.resolutions}</p>
                  </div>
                  <p className="font-normal text-[12px] leading-[18px] text-[#727272]" style={NS}>{t('conclusion_stat_resolutions')}</p>
                </div>
                <div className="bg-white border border-[#ddd] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-[14px] py-[14px] flex flex-col gap-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <div className="size-[30px] rounded-full bg-[#F3F3F3] flex items-center justify-center shrink-0">
                      <Icon name="task_alt" size="small" color="#6a3e31" />
                    </div>
                    <p className="font-semibold text-[26px] leading-[1] text-[#484848]" style={NS}>{STATS.tasks}</p>
                  </div>
                  <p className="font-normal text-[12px] leading-[18px] text-[#727272]" style={NS}>{t('conclusion_stat_tasks')}</p>
                </div>
                {/* Next meeting */}
                <div className="bg-[rgba(106,62,49,0.05)] border border-[rgba(106,62,49,0.25)] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
                  <div className="flex items-center gap-[6px]">
                    <Icon name="event" size="medium" color="#6a3e31" />
                    <p className="font-semibold text-[16px] leading-[22px] text-[#484848]" style={NS}>{t('conclusion_next_meeting')}</p>
                  </div>
                  <p className="font-semibold text-[14px] text-[#484848]" style={NS}>{NEXT_MEETING.type}</p>
                  <div className="flex flex-col gap-[5px]">
                    <div className="flex items-center gap-[5px]">
                      <Icon name="calendar_today" size="medium" color="#727272" />
                      <span className="text-[14px] text-[#484848]" style={NS}>{NEXT_MEETING.date}</span>
                    </div>
                    <div className="flex items-center gap-[5px]">
                      <Icon name="schedule" size="medium" color="#727272" />
                      <span className="text-[14px] text-[#484848]" style={NS}>{NEXT_MEETING.time}</span>
                    </div>
                    <div className="flex items-center gap-[5px]">
                      <Icon name="location_on" size="medium" color="#727272" />
                      <span className="text-[14px] text-[#484848]" style={NS}>{NEXT_MEETING.venue}</span>
                    </div>
                  </div>
                </div>
              </div>{/* end col 1 */}

              {/* Col 2: attendance breakdown card */}
              <div className="bg-white border border-[#ddd] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] p-[20px] flex flex-col gap-[16px] shrink-0">
                <div className="flex items-center gap-[6px]">
                  <Icon name="bar_chart" size="medium" color="#727272" />
                  <p className="font-semibold text-[16px] leading-[22px] text-[#484848]" style={NS}>{t('conclusion_donut_title')}</p>
                </div>
                <div className="relative overflow-hidden rounded-[10px] border border-[#8f6459] bg-white shrink-0" style={{ width: 220, height: 480 }}>

                  {/* Women band — top 65% */}
                  <div className="absolute left-0 top-0 right-[50%]" style={{ height: `${wPct}%`, background: '#ff7468' }}>
                    <div className="absolute left-[50%] flex items-center justify-center" style={{ top: '64.6%', transform: 'translate(-50%, -50%)', width: 70, height: 70 }}>
                      <div className="absolute rounded-full bg-white" style={{ width: 50, height: 50, top: '50%', left: '50%', transform: 'translate(-50%, -43%)' }} />
                      <img src="/avatar-woman.PNG" alt="Women" className="relative object-contain" style={{ width: 70, height: 70 }} />
                    </div>
                  </div>

                  {/* Men band — bottom 35% */}
                  <div className="absolute left-0 right-[50%]" style={{ top: `${wPct}%`, bottom: 0, background: '#8f6459' }}>
                    <div className="absolute left-[50%] flex items-center justify-center" style={{ top: '27.1%', transform: 'translate(-50%, -50%)', width: 70, height: 70 }}>
                      <div className="absolute rounded-full bg-white" style={{ width: 50, height: 50, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                      <img src="/avatar-man.PNG" alt="Men" className="relative object-contain" style={{ width: 70, height: 70 }} />
                    </div>
                  </div>

                  {/* Total — centered in right column */}
                  <div className="absolute flex flex-col items-center" style={{ top: 28, left: '50%', right: 0 }}>
                    <span className="font-normal text-[12px] text-[#727272]" style={NS}>{t('conclusion_total_attended')}</span>
                    <span className="font-bold text-[22px] leading-[1] text-[#484848]" style={NS}>{TOTAL_ATTENDED}</span>
                  </div>

                  {/* Women stat box */}
                  <div className="absolute flex items-center gap-[2px]" style={{ top: '42%', left: '50%', transform: 'translateY(-50%)' }}>
                    <span className="text-[#212121] text-[18px] font-bold">→</span>
                    <div className="rounded-[8px] flex flex-col items-center bg-white" style={{ width: 80, padding: '6px 0', border: '1.5px solid #ff7468' }}>
                      <span className="font-medium text-[12px] text-[#484848]" style={NS}>{t('conclusion_stat_women')}</span>
                      <span className="font-bold text-[18px] leading-[1.1] text-[#484848]" style={NS}>{STATS.women}</span>
                      <span className="font-normal text-[12px] text-[#868686]" style={NS}>{wPct}%</span>
                    </div>
                  </div>

                  {/* Men stat box */}
                  <div className="absolute flex items-center gap-[2px]" style={{ top: '74.5%', left: '50%', transform: 'translateY(-50%)' }}>
                    <span className="text-[#212121] text-[18px] font-bold">→</span>
                    <div className="rounded-[8px] flex flex-col items-center bg-white" style={{ width: 80, padding: '6px 0', border: '1.5px solid #8f6459' }}>
                      <span className="font-medium text-[12px] text-[#484848]" style={NS}>{t('conclusion_stat_men')}</span>
                      <span className="font-bold text-[18px] leading-[1.1] text-[#484848]" style={NS}>{STATS.men}</span>
                      <span className="font-normal text-[12px] text-[#868686]" style={NS}>{mPct}%</span>
                    </div>
                  </div>

                </div>
              </div>{/* end col 2 */}

              {/* Col 3: quorum + members attended + absentees */}
              <div className="flex flex-col gap-[15px] flex-1 min-w-0">

                {/* Quorum card */}
                <div className="bg-white border border-[#ddd] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-[20px] pt-[20px] pb-[32px] flex flex-col gap-[14px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[6px]">
                      <Icon name="how_to_vote" size="medium" color="#727272" />
                      <p className="font-semibold text-[16px] leading-[22px] text-[#484848]" style={NS}>{t('conclusion_quorum_status')}</p>
                    </div>
                    <span className={`text-[12px] font-semibold px-[10px] py-[4px] rounded-full ${QUORUM_MET ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fdecea] text-[#c62828]'}`} style={NS}>
                      {QUORUM_MET ? 'Met' : 'Not Met'}
                    </span>
                  </div>
                  <div className="flex items-center gap-[16px]">
                    <div className="flex items-center gap-[5px]">
                      <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{t('conclusion_quorum_total')}</span>
                      <span className="text-[14px] font-semibold text-[#6a3e31]" style={NS}>{TOTAL_MEMBERS}</span>
                    </div>
                    <div className="w-px h-[16px] bg-[rgba(106,62,49,0.2)]" />
                    <div className="flex items-center gap-[5px]">
                      <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{t('conclusion_quorum_present')}</span>
                      <span className="text-[14px] font-semibold text-[#2e7d32]" style={NS}>{MEMBERS_ATTENDED.length}</span>
                    </div>
                    <div className="w-px h-[16px] bg-[rgba(106,62,49,0.2)]" />
                    <div className="flex items-center gap-[5px]">
                      <span className="text-[14px] font-medium text-[#6a3e31]" style={NS}>{t('conclusion_quorum_absent')}</span>
                      <span className="text-[14px] font-semibold text-[#c62828]" style={NS}>{MEMBERS_ABSENT.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <span className="text-[14px] font-medium text-[#6a3e31] whitespace-nowrap" style={NS}>{t('conclusion_quorum_target')}</span>
                    <div className="relative flex-1">
                      <div className="relative h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: QUORUM_MET ? 'rgba(60,151,24,0.15)' : 'rgba(198,40,40,0.12)' }}>
                        <div className="absolute top-0 bottom-0 w-[2px] bg-[rgba(106,62,49,0.4)] z-10" style={{ left: '51%' }} />
                        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(Math.round((MEMBERS_ATTENDED.length / TOTAL_MEMBERS) * 100), 100)}%`, backgroundColor: QUORUM_MET ? '#3c9718' : '#c62828' }} />
                      </div>
                      <span className="absolute text-[12px] text-[#9e9e9e]" style={{ ...NS, left: '51%', transform: 'translateX(-50%)', top: 8 }}>50%</span>
                    </div>
                    <span className="text-[14px] font-semibold min-w-[36px] text-right" style={{ ...NS, color: QUORUM_MET ? '#3c9718' : '#c62828' }}>
                      {Math.round((MEMBERS_ATTENDED.length / TOTAL_MEMBERS) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Members attended */}
                <div className="bg-white border border-[#ddd] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] p-[20px] flex flex-col gap-[15px]">
                  <div className="flex items-center gap-[6px]">
                    <Icon name="group" size="medium" color="#727272" />
                    <p className="font-semibold text-[16px] leading-[22px] text-[#484848]" style={NS}>{t('conclusion_attendance_title')}</p>
                  </div>
                  <div className="flex flex-wrap gap-[14px]">
                    {MEMBERS_ATTENDED.map((m, i) => (
                      <div key={i} className="flex items-start gap-[5px] rounded-[12px] px-[15px] py-[10px] bg-[#F3F3F3] border border-[#E0E0E0]">
                        <Icon name="person" size="medium" color="#6a3e31" />
                        <div className="flex flex-col gap-[4px]">
                          <span className="text-[14px] font-medium leading-[18px] text-[#484848]" style={NS}>{m.name}</span>
                          <span className="text-[12px] font-normal leading-[16px] text-[#727272]" style={NS}>{m.designation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Absentees */}
                <div className="bg-white border border-[#ddd] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] p-[20px] flex flex-col gap-[15px]">
                  <div className="flex items-center gap-[6px]">
                    <Icon name="person_off" size="medium" color="#727272" />
                    <p className="font-semibold text-[16px] leading-[22px] text-[#484848]" style={NS}>{t('conclusion_absentees')} <span className="font-normal text-[#727272]">({MEMBERS_ABSENT.length})</span></p>
                  </div>
                  <div className="flex flex-wrap gap-[14px]">
                    {MEMBERS_ABSENT.map((m, i) => (
                      <div key={i} className="flex items-start gap-[5px] rounded-[12px] px-[15px] py-[10px] bg-[#F3F3F3] border border-[#E0E0E0]">
                        <Icon name="person_off" size="medium" color="#727272" />
                        <div className="flex flex-col gap-[4px]">
                          <span className="text-[14px] font-medium leading-[18px] text-[#484848]" style={NS}>{m.name}</span>
                          <span className="text-[12px] font-normal leading-[16px] text-[#727272]" style={NS}>{m.designation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>{/* end col 3 */}

            </div>{/* end main flex row */}
          </SectionHolder>
        </div>

        {/* ── 4. CTA — outside section, centered ── */}
        <div className="flex justify-center pb-[8px]">
          <Button
            variant="filled"
            iconPlacement="left"
            iconName="arrow_back"
            text={t('conclusion_cta')}
            onClick={() => navigate('/meetings/list')}
          />
        </div>

      </div>
    </MeetingShellLayout>
  );
}
