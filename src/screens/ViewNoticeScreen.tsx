import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import GoBackToPreviousPage from '../components/GoBackToPreviousPage';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { Button } from '../components';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

function GovtEmblem() {
  return (
    <img src="/karnataka-emblem.png" alt="Karnataka Government Emblem" className="size-[64px] object-contain shrink-0" />
  );
}

export default function ViewNoticeScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { meetings } = useMeetings();
  const [page, setPage] = useState<1 | 2>(1);

  const meeting = meetings.find(m => m.id === Number(id));
  const meetingName = meeting ? (meeting.nameKey ? t(meeting.nameKey) : meeting.name) : '—';
  const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  function handleDownload() { window.print(); }

  function handleShareEmail() {
    const subject = encodeURIComponent(`Meeting Notice — ${meetingName}`);
    const body = encodeURIComponent(
      `Dear Participant,\n\nPlease find the meeting notice for:\n\nMeeting: ${meetingName}\nDate: ${meeting?.date ?? '—'}\nTime: ${meeting?.time ?? '—'}\nVenue: ${meeting?.venue ?? '—'}\n\nRegards,\n${meeting?.gpName ?? 'Gram Panchayat'}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `📋 *Meeting Notice — ${meetingName}*\n\n📅 Date: ${meeting?.date ?? '—'}\n⏰ Time: ${meeting?.time ?? '—'}\n📍 Venue: ${meeting?.venue ?? '—'}\n\n_${meeting?.gpName ?? 'Gram Panchayat'}_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  const pageStyle = 'bg-white text-[13px] text-[#1a1a1a] min-h-[1056px] box-border flex flex-col';

  const govtHeader = (
    <div className="flex flex-col items-center gap-[6px] px-[40px] py-[24px] border-b border-[#d0d0d0]">
      <GovtEmblem />
      <p className="font-bold text-[13px] text-center text-[#1a237e]" style={NS}>ಕರ್ನಾಟಕ ಸರ್ಕಾರ</p>
      <p className="text-[12px] text-center text-[#3b3b3b]" style={NS}>ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಮತ್ತು ಪಂಚಾಯತ್ ರಾಜ್ ಇಲಾಖೆ</p>
      <p className="font-bold text-[18px] mt-[6px] text-[#1a1a1a] underline" style={NS}>ಸಭೆಯ ಸೂಚನೆ</p>
      <p className="text-[11px] text-[#5a5a5a] italic" style={NS}>(Meeting Notice)</p>
    </div>
  );

  const page1 = (
    <div className={pageStyle}>
      {govtHeader}
      <div className="px-[40px] pt-[20px]">
        <table className="w-full border-collapse border border-[#c0c0c0] text-[12px]">
          <tbody>
            {[
              ['ಜಿಲ್ಲಾ ಪಂಚಾಯತಿ / District', 'Raichur', 'ತಾಲೂಕು ಪಂಚಾಯತಿ / Taluk', 'Kakanur'],
              ['ಗ್ರಾಮ ಪಂಚಾಯತಿ / GP', meeting?.gpName ?? 'Kakanur GP', 'ಪ್ರಕಾರ / Type', meeting?.meetingType ?? '—'],
              ['ದಿನಾಂಕ / Date', meeting?.date ?? '—', 'ಸಮಯ / Time', meeting?.time ?? '—'],
              ['ಸ್ಥಳ / Venue', meeting?.venue ?? '—', 'ಅಧ್ಯಕ್ಷರು / Chairperson', meeting?.chairperson ?? '—'],
            ].map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className={`border border-[#c0c0c0] px-[10px] py-[7px] ${ci % 2 === 0 ? 'bg-[#f5f0ef] font-medium text-[#5a3a2e] w-[22%]' : 'w-[28%]'}`} style={NS}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-[40px] pt-[16px]">
        <p className="font-semibold text-[14px]" style={NS}>{meetingName}</p>
      </div>
      <div className="px-[40px] pt-[16px]">
        <p className="font-semibold text-[13px] underline mb-[8px]" style={NS}>ಸಭೆಯ ಕಾರ್ಯಸೂಚಿ / Meeting Agenda:</p>
        <table className="w-full border-collapse border border-[#c0c0c0] text-[12px]">
          <thead>
            <tr className="bg-[#f5f0ef]">
              <th className="border border-[#c0c0c0] px-[10px] py-[7px] text-left font-semibold text-[#5a3a2e] w-[60px]" style={NS}>ಕ್ರ.ಸಂ.</th>
              <th className="border border-[#c0c0c0] px-[10px] py-[7px] text-left font-semibold text-[#5a3a2e]" style={NS}>ವಿಷಯ / Subject</th>
              <th className="border border-[#c0c0c0] px-[10px] py-[7px] text-left font-semibold text-[#5a3a2e] w-[180px]" style={NS}>ಸೂಚನೆ / Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="border border-[#c0c0c0] px-[10px] py-[7px] text-center text-[#727272]" style={NS}>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const page2 = (
    <div className={pageStyle}>
      {govtHeader}
      <div className="px-[40px] pt-[24px] pb-[30px] mt-auto">
        <div className="flex flex-col items-end gap-[30px]">
          <div className="flex flex-col items-end gap-[4px]">
            <div className="w-[200px] border-b border-[#1a1a1a]" />
            <span className="text-[12px] text-[#5a5a5a]" style={NS}>ಪಂಚಾಯತಿ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ</span>
            <span className="text-[11px] text-[#5a5a5a] italic" style={NS}>(Panchayat Development Officer)</span>
          </div>
        </div>
        <p className="text-[11px] text-[#727272] mt-[20px]" style={NS}>
          ಮುದ್ರಣ ದಿನಾಂಕ / Print Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>
    </div>
  );

  return (
    <>
    <style>{`
      @media print {
        body > * { display: none !important; }
        #notice-view-print { display: block !important; position: fixed; inset: 0; }
      }
      #notice-view-print { display: none; }
    `}</style>
    <div id="notice-view-print" style={{ fontFamily: 'Noto Sans, sans-serif', fontSize: '13px', padding: '40px', color: '#1a1a1a' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontWeight: 700, fontSize: '16px' }}>{meetingName}</p>
        <p style={{ fontSize: '12px', color: '#727272' }}>{meeting?.date} · {meeting?.time} · {meeting?.venue}</p>
      </div>
    </div>
    <MeetingShellLayout
      stepperActiveState={1}
      showStepper={false}
      showBack={false}
      breadcrumbItems={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_meeting_list'), t('sign_notice_preview_heading')]}
    >
      <GoBackToPreviousPage label={t('view_meeting_back_to_list')} onClick={() => navigate('/meetings/list')} />

      <div className="bg-white rounded-[20px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-[25px] py-[20px] border-b border-[#e0e0e0]">
          <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
            {t('sign_notice_preview_heading')}
          </span>
          <span className="text-[13px] text-[#727272]" style={NS}>{meetingName}</span>
        </div>

        {/* Notice document */}
        <div className="px-[25px] pt-[20px] pb-[25px]">
          <div className="max-w-[760px] mx-auto w-full flex flex-col gap-[16px]">
            <div className="shadow-[0_2px_12px_rgba(0,0,0,0.10)]">
              {page === 1 ? page1 : page2}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-[12px]">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="flex items-center justify-center size-[32px] rounded-full border border-[#6a3e31] disabled:opacity-40 hover:bg-[#f5f0ee] transition-colors"
              >
                <span className="material-icons text-[18px] text-[#6a3e31]">chevron_left</span>
              </button>
              <span className="text-[13px] text-[#6a3e31] font-medium" style={NS}>{page} / 2</span>
              <button
                disabled={page === 2}
                onClick={() => setPage(2)}
                className="flex items-center justify-center size-[32px] rounded-full border border-[#6a3e31] disabled:opacity-40 hover:bg-[#f5f0ee] transition-colors"
              >
                <span className="material-icons text-[18px] text-[#6a3e31]">chevron_right</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Action CTAs — outside the card */}
      <div className="flex items-center justify-center gap-[12px] flex-wrap">
        <Button variant="outlined" iconPlacement="left" iconName="download" text={t('btn_re_download')} onClick={handleDownload} />
        <Button variant="filled" iconPlacement="left" iconName="mail" text={t('btn_share_email')} onClick={handleShareEmail} />
        <Button variant="filled" iconPlacement="left" iconName="share" text={t('btn_share_whatsapp')} onClick={handleShareWhatsApp} />
      </div>
    </MeetingShellLayout>
    </>
  );
}
