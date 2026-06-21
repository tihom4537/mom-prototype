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
        <div className="w-full bg-white rounded-[14px] px-[24px] py-[16px] flex items-center gap-[14px]">
          <div className="size-[40px] rounded-full bg-[#e8f5e9] flex items-center justify-center shrink-0">
            <Icon name="check_circle" size="medium" color="#2e7d32" />
          </div>
          <p className="font-semibold text-[15px] leading-[22px] text-[#2e7d32]" style={NS}>{t('conclusion_sent_label')}</p>
        </div>

        {/* ── 2. Thank-you card ── */}
        <div className="w-full bg-white rounded-[14px] px-[32px] py-[28px] flex flex-col gap-[6px]">
          <p className="font-bold text-[20px] leading-[28px] text-[#484848]" style={NS}>{t('conclusion_message_line1')}</p>
          <p className="font-semibold text-[15px] leading-[22px] text-[#6a3e31]" style={NS}>{t('conclusion_message_line2')}</p>
          <p className="font-normal text-[14px] leading-[22px] text-[#5e5e5e] tracking-[0.1px] mt-[2px]" style={NS}>{t('conclusion_thank_you')}</p>
        </div>

        {/* ── 3. Section holder — meeting name + all detail cards ── */}
        <div className="w-full">
          <SectionHolder
            variant="with-description"
            title={`${MEETING_TITLE} — Meeting Summary`}
            subtitle={MEETING_META}
            bodyClassName="px-[24px] py-[24px]"
          >
            <div className="flex flex-col gap-[16px]">

              {/* Row 1: agendas + resolutions + tasks */}
              <div className="flex gap-[12px]">
                <div className="bg-[#F3F3F3] rounded-[12px] px-[20px] py-[16px] flex flex-col gap-[8px] flex-1">
                  <div className="flex items-center gap-[10px]">
                    <div className="size-[34px] rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                      <Icon name="list_alt" size="small" color="#6a3e31" />
                    </div>
                    <p className="font-semibold text-[30px] leading-[1] text-[#484848]" style={NS}>{STATS.agendas}</p>
                  </div>
                  <p className="font-normal text-[12px] leading-[20px] text-[#727272] tracking-[0.2px]" style={NS}>{t('conclusion_stat_agendas')}</p>
                </div>
                <div className="bg-[#F3F3F3] rounded-[12px] px-[20px] py-[16px] flex flex-col gap-[8px] flex-1">
                  <div className="flex items-center gap-[10px]">
                    <div className="size-[34px] rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                      <Icon name="gavel" size="small" color="#f57f17" />
                    </div>
                    <p className="font-semibold text-[30px] leading-[1] text-[#484848]" style={NS}>{STATS.resolutions}</p>
                  </div>
                  <p className="font-normal text-[12px] leading-[20px] text-[#727272] tracking-[0.2px]" style={NS}>{t('conclusion_stat_resolutions')}</p>
                </div>
                <div className="bg-[#F3F3F3] rounded-[12px] px-[20px] py-[16px] flex flex-col gap-[8px] flex-1">
                  <div className="flex items-center gap-[10px]">
                    <div className="size-[34px] rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
                      <Icon name="task_alt" size="small" color="#6a3e31" />
                    </div>
                    <p className="font-semibold text-[30px] leading-[1] text-[#484848]" style={NS}>{STATS.tasks}</p>
                  </div>
                  <p className="font-normal text-[12px] leading-[20px] text-[#727272] tracking-[0.2px]" style={NS}>{t('conclusion_stat_tasks')}</p>
                </div>
              </div>

              {/* Row 2: attendance breakdown (50%) + members (50%) */}
              <div className="flex gap-[12px] items-start">

                {/* Attendance breakdown — avatar-based, ~50% width */}
                <div className="bg-[#F3F3F3] rounded-[12px] p-[20px] flex flex-col gap-[16px] w-[50%]">
                  <p className="font-semibold text-[14px] leading-[20px] text-[#484848]" style={NS}>{t('conclusion_donut_title')}</p>

                  {/* Women row */}
                  <div className="flex flex-col gap-[8px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[8px]">
                        <img src="/avatar-woman.PNG" alt="Women" className="w-[44px] h-[44px] object-contain" />
                        <span className="font-medium text-[12px] text-[#727272]" style={NS}>{t('conclusion_stat_women')}</span>
                      </div>
                      <div className="flex items-baseline gap-[4px]">
                        <span className="font-bold text-[20px] leading-[1] text-[#e07060]" style={NS}>{STATS.women}</span>
                        <span className="font-normal text-[11px] text-[#868686]" style={NS}>{wPct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-[6px] rounded-full bg-[#E0E0E0]">
                      <div className="h-full rounded-full bg-[#e07060]" style={{ width: `${wPct}%` }} />
                    </div>
                  </div>

                  {/* Men row */}
                  <div className="flex flex-col gap-[8px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[8px]">
                        <img src="/avatar-man.PNG" alt="Men" className="w-[44px] h-[44px] object-contain" />
                        <span className="font-medium text-[12px] text-[#727272]" style={NS}>{t('conclusion_stat_men')}</span>
                      </div>
                      <div className="flex items-baseline gap-[4px]">
                        <span className="font-bold text-[20px] leading-[1] text-[#6a3e31]" style={NS}>{STATS.men}</span>
                        <span className="font-normal text-[11px] text-[#868686]" style={NS}>{mPct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-[6px] rounded-full bg-[#E8E8E8]">
                      <div className="h-full rounded-full bg-[#6a3e31]" style={{ width: `${mPct}%` }} />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-[#E0E0E0] pt-[12px] flex items-center justify-between">
                    <span className="font-medium text-[12px] text-[#727272]" style={NS}>{t('conclusion_total_attended')}</span>
                    <span className="font-bold text-[22px] leading-[1] text-[#484848]" style={NS}>{TOTAL_ATTENDED}</span>
                  </div>
                </div>

                {/* Members who attended — ~50% width */}
                <div className="bg-[#F3F3F3] rounded-[12px] p-[20px] flex flex-col gap-[12px] w-[50%] min-w-0">
                  <p className="font-semibold text-[14px] leading-[20px] text-[#484848]" style={NS}>{t('conclusion_attendance_title')}</p>
                  <div className="flex flex-wrap gap-[6px]">
                    {MEMBERS_ATTENDED.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-[5px] rounded-[20px] px-[10px] py-[5px] bg-white border border-[#E0E0E0]"
                      >
                        <Icon name="person" size="small" color="#6a3e31" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium leading-[15px] text-[#484848]" style={NS}>{m.name}</span>
                          <span className="text-[11px] font-normal leading-[13px] text-[#727272]" style={NS}>{m.designation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
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
