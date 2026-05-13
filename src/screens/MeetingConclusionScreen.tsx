import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Navbar, Sidebar, Breadcrumb, Button, Icon, SectionHolder } from '../components';
import { useState, useEffect, useRef } from 'react';

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

function DonutChart({ women, men, total }: { women: number; men: number; total: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 130;
  const strokeW = 20;
  const r = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    const womenAngle = (women / total) * 2 * Math.PI;
    const startTop = -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startTop, startTop + womenAngle);
    ctx.strokeStyle = '#e07060';
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'butt';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, startTop + womenAngle, startTop + 2 * Math.PI);
    ctx.strokeStyle = '#6a3e31';
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'butt';
    ctx.stroke();
  }, [women, men, total, cx, cy, r]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

export default function MeetingConclusionScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');
  const [profileOpen,  setProfileOpen]  = useState(false);

  const wPct = Math.round((STATS.women / TOTAL_ATTENDED) * 100);
  const mPct = 100 - wPct;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f1f2f2]">

      {/* Navbar */}
      <div className="shrink-0 relative z-40">
        <Navbar
          version="default-with-welcome"
          onProfileClick={() => setProfileOpen(o => !o)}
          onSettingsClick={() => {}}
        />
        {profileOpen && (
          <div className="absolute top-full right-[60px] z-50" onClick={() => setProfileOpen(false)}>
            <div className="bg-white shadow-lg rounded-lg p-2 text-sm" style={NS}>Profile menu</div>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="shrink-0 z-30">
          <Sidebar
            state={sidebarState}
            onMenuClick={() => setSidebarState(s => s === 'full' ? 'shortened' : 'full')}
          />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

          {/* Breadcrumb */}
          <div className="shrink-0 px-6 pt-6 pb-5 bg-[#f1f2f2]">
            <Breadcrumb level={3} items={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('conclusion_breadcrumb')]} />
          </div>

          {/* Content */}
          <div className="flex-1 px-6 pb-10 flex flex-col items-center gap-[16px]">

            {/* ── 1. Sent confirmation bar — stands alone, highlighted ── */}
            <div className="w-full max-w-[820px] bg-white rounded-[14px] px-[24px] py-[16px] flex items-center gap-[14px]">
              <div className="size-[40px] rounded-full bg-[#e8f5e9] flex items-center justify-center shrink-0">
                <Icon name="check_circle" size="medium" color="#2e7d32" />
              </div>
              <p className="font-semibold text-[15px] leading-[22px] text-[#2e7d32]" style={NS}>{t('conclusion_sent_label')}</p>
            </div>

            {/* ── 2. Section holder — meeting name + all detail cards inside ── */}
            <div className="w-full max-w-[820px]">
              <SectionHolder
                variant="with-description"
                title={MEETING_TITLE}
                subtitle={MEETING_META}
                bodyClassName="px-[24px] py-[24px]"
              >
                {/* Cards grid inside section body */}
                <div className="flex flex-col gap-[16px]">

                  {/* Row 1: agendas + tasks + resolutions */}
                  <div className="flex gap-[12px]">
                    {/* Agendas */}
                    <div className="bg-[#f9f5f4] rounded-[12px] px-[20px] py-[16px] flex flex-col gap-[8px] flex-1">
                      <div className="flex items-center gap-[10px]">
                        <div className="size-[34px] rounded-full bg-[rgba(106,62,49,0.12)] flex items-center justify-center shrink-0">
                          <Icon name="list_alt" size="small" color="#6a3e31" />
                        </div>
                        <p className="font-semibold text-[30px] leading-[1] text-[#19203D]" style={NS}>{STATS.agendas}</p>
                      </div>
                      <p className="font-normal text-[12px] leading-[20px] text-[#616161] tracking-[0.2px]" style={NS}>{t('conclusion_stat_agendas')}</p>
                    </div>


                    {/* Resolutions */}
                    <div className="bg-[rgba(245,127,23,0.06)] rounded-[12px] px-[20px] py-[16px] flex flex-col gap-[8px] flex-1">
                      <div className="flex items-center gap-[10px]">
                        <div className="size-[34px] rounded-full bg-[rgba(245,127,23,0.12)] flex items-center justify-center shrink-0">
                          <Icon name="gavel" size="small" color="#f57f17" />
                        </div>
                        <p className="font-semibold text-[30px] leading-[1] text-[#19203D]" style={NS}>{STATS.resolutions}</p>
                      </div>
                      <p className="font-normal text-[12px] leading-[20px] text-[#616161] tracking-[0.2px]" style={NS}>{t('conclusion_stat_resolutions')}</p>
                    </div>
                  </div>

                  {/* Row 2: donut attendance + members + message */}
                  <div className="flex gap-[12px] items-start">

                    {/* Attendance donut */}
                    <div className="bg-[#f9f5f4] rounded-[12px] p-[20px] flex flex-col gap-[16px] shrink-0 w-[260px]">
                      <p className="font-semibold text-[14px] leading-[20px] text-[#19203D]" style={NS}>{t('conclusion_donut_title')}</p>
                      <div className="flex items-center gap-[16px]">
                        {/* donut */}
                        <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                          <DonutChart women={STATS.women} men={STATS.men} total={TOTAL_ATTENDED} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1px]">
                            <p className="font-semibold text-[18px] leading-[1] text-[#19203D]" style={NS}>{TOTAL_ATTENDED}</p>
                            <p className="font-normal text-[12px] leading-[13px] text-[#727272] text-center" style={NS}>{t('conclusion_total_attended')}</p>
                          </div>
                        </div>
                        {/* legend */}
                        <div className="flex flex-col gap-[8px] flex-1">
                          <div className="rounded-[8px] px-[10px] py-[8px]" style={{ background: 'rgba(224,112,96,0.12)' }}>
                            <p className="font-medium text-[11px] text-[#727272]" style={NS}>{t('conclusion_stat_women')}</p>
                            <p className="font-semibold text-[18px] leading-[1] text-[#e07060]" style={NS}>{STATS.women}</p>
                            <p className="font-normal text-[12px] text-[#727272]" style={NS}>{wPct}%</p>
                          </div>
                          <div className="rounded-[8px] px-[10px] py-[8px]" style={{ background: 'rgba(106,62,49,0.10)' }}>
                            <p className="font-medium text-[11px] text-[#727272]" style={NS}>{t('conclusion_stat_men')}</p>
                            <p className="font-semibold text-[18px] leading-[1] text-[#6a3e31]" style={NS}>{STATS.men}</p>
                            <p className="font-normal text-[12px] text-[#727272]" style={NS}>{mPct}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Members + message stacked */}
                    <div className="flex flex-col gap-[12px] flex-1 min-w-0">

                      {/* Members who attended */}
                      <div className="bg-[#f9f5f4] rounded-[12px] p-[20px] flex flex-col gap-[12px]">
                        <p className="font-semibold text-[14px] leading-[20px] text-[#19203D]" style={NS}>{t('conclusion_attendance_title')}</p>
                        <div className="flex flex-wrap gap-[6px]">
                          {MEMBERS_ATTENDED.map((m, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-[5px] rounded-[20px] px-[10px] py-[5px] bg-white border border-[rgba(106,62,49,0.12)]"
                            >
                              <Icon name="person" size="small" color="#6a3e31" />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-medium leading-[15px] text-[#19203D]" style={NS}>{m.name}</span>
                                <span className="text-[12px] font-normal leading-[13px] text-[#727272]" style={NS}>{m.designation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Message — directed at members */}
                      <div className="rounded-[12px] px-[20px] py-[18px] flex flex-col gap-[8px]" style={{ background: 'rgba(106,62,49,0.06)' }}>
                        <p className="font-semibold text-[15px] leading-[22px] text-[#19203D]" style={NS}>{t('conclusion_message_line1')}</p>
                        <p className="font-medium text-[13px] leading-[20px] text-[#6a3e31]" style={NS}>{t('conclusion_message_line2')}</p>
                        <p className="font-normal text-[12px] leading-[20px] text-[#727272] tracking-[0.1px]" style={NS}>{t('conclusion_thank_you')}</p>
                      </div>

                    </div>
                  </div>

                  {/* CTA row */}
                  <div className="flex justify-end pt-[4px]">
                    <Button
                      variant="filled"
                      iconPlacement="left"
                      iconName="arrow_back"
                      text={t('conclusion_cta')}
                      onClick={() => navigate('/meetings/list')}
                    />
                  </div>

                </div>
              </SectionHolder>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
