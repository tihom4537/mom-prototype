import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import {
  Navbar,
  Sidebar,
  Breadcrumb,
  Stepper,
  StepNavBar,
  Button,
  Icon,
} from '../components';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

function GovtEmblem() {
  return (
    <img
      src="/karnataka-emblem.png"
      alt="Karnataka Government Emblem"
      className="size-[64px] object-contain shrink-0"
    />
  );
}

interface AgendaItem { id: number; title: string; description: string; }
interface StaffMember { id: number; name: string; designation: string; gp: string; }

export default function SignNoticeScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { addMeeting, setMeetingAgendas } = useMeetings();
  const meetingData = location.state ?? {};

  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signed,      setSigned]      = useState(false);
  const [signedAt,    setSignedAt]    = useState('');

  const noticeRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setSidebarState(s => s === 'full' ? 'shortened' : 'full');

  // Derive display values from router state
  const meetingTitle   = meetingData.title        ?? 'GP General Body Meeting 2026';
  const meetingType    = meetingData.meetingType   ?? 'General Body';
  const meetingDate    = meetingData.date          ?? '—';
  const meetingTime    = meetingData.time          ?? '—';
  const meetingVenue   = meetingData.venue         ?? '—';
  const chairperson    = meetingData.chairperson   ?? '—';
  const agendas: AgendaItem[] = meetingData.agendas ?? [];
  const participants: StaffMember[] = meetingData.participants ?? [];
  const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const signerName = t('sign_pdo_name');
  const signerDesig = t('sign_pdo_designation');

  function handleSign() {
    const now = new Date();
    const ts = now.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    setSignedAt(ts);
    setSigned(true);
    setConfirmOpen(false);

    // Add meeting to context as upcoming
    const newMeetingId = addMeeting({
      name: meetingTitle,
      mode: meetingData.mode === t('field_mode_online') ? 'ONLINE' : 'IN PERSON',
      date: meetingDate,
      time: meetingTime,
      venue: meetingVenue,
      participants: participants.length,
      gpName: 'Kakanur Gram Panchayat',
      electedQuorum: '51%',
      participantsQuorum: '10%',
      stepsCompleted: 0,
      tab: 'today',
      description: meetingData.description,
      chairperson,
      meetingType,
    });
    // Save agendas under the new meeting id so they show up in the proceedings flow
    if (agendas.length > 0) {
      setMeetingAgendas(newMeetingId, agendas.map((a, idx) => ({
        id: idx + 1,
        title: a.title,
        description: a.description,
        completed: false,
        proceedingsText: '',
      })));
    }

    // Trigger print → browser Save as PDF
    setTimeout(() => window.print(), 400);
  }

  function handleReDownload() {
    window.print();
  }

  function handleExit() {
    navigate('/meetings/list');
  }

  function handleShareEmail() {
    const subject = encodeURIComponent(`Meeting Notice — ${meetingTitle}`);
    const body = encodeURIComponent(
      `Dear Participant,\n\nPlease find the meeting notice for:\n\n` +
      `Meeting: ${meetingTitle}\nDate: ${meetingDate}\nTime: ${meetingTime}\nVenue: ${meetingVenue}\n\n` +
      `This notice has been digitally signed by ${signerName} (${signerDesig}) on ${signedAt}.\n\nRegards,\nKakanur Gram Panchayat`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `📋 *Meeting Notice — ${meetingTitle}*\n\n` +
      `📅 Date: ${meetingDate}\n⏰ Time: ${meetingTime}\n📍 Venue: ${meetingVenue}\n\n` +
      `✅ Digitally signed by ${signerName} on ${signedAt}\n\n_Kakanur Gram Panchayat_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  return (
    <>
      {/* ── Print styles (only visible when printing) ── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #notice-print-area { display: block !important; position: fixed; inset: 0; }
        }
        #notice-print-area { display: none; }
      `}</style>

      {/* ── Printable notice (hidden on screen, shown on print) ── */}
      <div id="notice-print-area">
        <NoticePrintContent
          meetingTitle={meetingTitle}
          meetingType={meetingType}
          meetingDate={meetingDate}
          meetingTime={meetingTime}
          meetingVenue={meetingVenue}
          chairperson={chairperson}
          agendas={agendas}
          participants={participants}
          printDate={printDate}
          signed={signed}
          signerName={signerName}
          signerDesig={signerDesig}
          signedAt={signedAt}
        />
      </div>

      <div className="h-screen overflow-hidden flex flex-col bg-[#f1f2f2]">

        {/* ── Navbar ── */}
        <div className="shrink-0 relative z-40">
          <Navbar version="default-with-welcome" />
        </div>

        {/* ── Sidebar + main ── */}
        <div className="flex flex-1 min-h-0">
          <Sidebar state={sidebarState} onMenuClick={toggleSidebar} className="shrink-0 h-full" />

          <div className="flex flex-col flex-1 min-h-0 min-w-0">

            {/* Breadcrumb + Stepper — fixed header */}
            <div className="shrink-0 flex flex-col gap-[15px] px-6 pt-5 pb-[10px] bg-[#f1f2f2]">
              <Breadcrumb
                level={3}
                items={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_create_meeting')]}
              />
              <Stepper
                activeState={3}
                stepLabels={[t('stepper_step1'), t('stepper_step2'), t('stepper_step3')]}
              />
            </div>

            <div className="shrink-0 px-6 pt-[10px]">
              <StepNavBar onBack={() => navigate('/meetings/create/agenda')} backLabel={t('nav_previous_step')} />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[50px]">
              <div className="flex flex-col gap-[25px]">

                {/* Notice preview card */}
                <div className="bg-white rounded-[20px] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-[25px] py-[20px] border-b border-[#c6c6c6]">
                    <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                      {t('sign_notice_preview_heading')}
                    </span>
                    {signed && (
                      <div className="flex items-center bg-[#e8f5e9] px-[12px] py-[6px] rounded-full">
                        <span className="text-[13px] font-medium text-[#2e7d32]" style={NS}>{t('sign_success_label')}</span>
                      </div>
                    )}
                  </div>
                  {/* Body */}
                  <div className="px-[25px] pt-[20px] pb-[25px]">
                    <div
                      ref={noticeRef}
                      className="max-w-[760px] mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.10)] overflow-hidden"
                    >
                      <NoticeDocumentView
                        meetingTitle={meetingTitle}
                        meetingType={meetingType}
                        meetingDate={meetingDate}
                        meetingTime={meetingTime}
                        meetingVenue={meetingVenue}
                        chairperson={chairperson}
                        agendas={agendas}
                        participants={participants}
                        printDate={printDate}
                        signed={signed}
                        signerName={signerName}
                        signerDesig={signerDesig}
                        signedAt={signedAt}
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-[15px] pt-2">
                  {!signed ? (
                    <>
                      <Button
                        variant="outlined"
                        iconPlacement="none"
                        text={t('btn_exit_to_meetings')}
                        onClick={handleExit}
                      />
                      <Button
                        variant="filled"
                        iconPlacement="left"
                        iconName="draw"
                        text={t('btn_sign_notice')}
                        onClick={() => setConfirmOpen(true)}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        iconPlacement="none"
                        text={t('btn_exit_to_meetings')}
                        onClick={handleExit}
                      />
                      <Button
                        variant="outlined"
                        iconPlacement="left"
                        iconName="download"
                        text={t('btn_re_download')}
                        onClick={handleReDownload}
                      />
                      <Button
                        variant="filled"
                        iconPlacement="left"
                        iconName="mail"
                        text={t('btn_share_email')}
                        onClick={handleShareEmail}
                      />
                      <Button
                        variant="filled"
                        iconPlacement="left"
                        iconName="share"
                        text={t('btn_share_whatsapp')}
                        onClick={handleShareWhatsApp}
                      />
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Sign Modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[500px] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
              <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                {t('sign_confirm_title')}
              </span>
              <button type="button" onClick={() => setConfirmOpen(false)} className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0">
                <Icon name="close" size="small" color="#6a3e31" />
              </button>
            </div>
            {/* Body */}
            <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[25px] pt-[20px] pb-[25px] flex flex-col gap-[20px]">
              <p className="text-[14px] leading-[22px] text-[#3b3b3b]" style={NS}>
                {t('sign_confirm_body')}
              </p>

              {/* Signer info */}
              <div className="bg-[#f7f0ee] rounded-[10px] px-[20px] py-[15px] flex flex-col gap-[10px]">
                <div className="flex items-center gap-[10px]">
                  <Icon name="person" size="small" color="#6a3e31" />
                  <span className="text-[14px] font-medium text-[#212121]" style={NS}>{signerName}</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Icon name="badge" size="small" color="#6a3e31" />
                  <span className="text-[13px] text-[#727272]" style={NS}>{signerDesig}</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Icon name="calendar_today" size="small" color="#6a3e31" />
                  <span className="text-[13px] text-[#727272]" style={NS}>{printDate}</span>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-[12px]">
                <Button
                  variant="outlined"
                  iconPlacement="none"
                  text={t('sign_confirm_no')}
                  onClick={() => setConfirmOpen(false)}
                />
                <Button
                  variant="filled"
                  iconPlacement="left"
                  iconName="verified"
                  text={t('sign_confirm_yes')}
                  onClick={handleSign}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Notice Document View (screen) ─────────────────────────────────────────────

interface NoticeProps {
  meetingTitle: string;
  meetingType: string;
  meetingDate: string;
  meetingTime: string;
  meetingVenue: string;
  chairperson: string;
  agendas: AgendaItem[];
  participants: StaffMember[];
  printDate: string;
  signed: boolean;
  signerName: string;
  signerDesig: string;
  signedAt: string;
}

function NoticeDocumentView(p: NoticeProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-white font-['Noto_Sans'] text-[13px] text-[#1a1a1a]">
      {/* Govt header */}
      <div className="flex flex-col items-center gap-[6px] px-[40px] py-[24px] border-b border-[#d0d0d0]">
        <GovtEmblem />
        <p className="font-bold text-[13px] text-center text-[#1a237e]" style={NS}>ಕರ್ನಾಟಕ ಸರ್ಕಾರ</p>
        <p className="text-[12px] text-center text-[#3b3b3b]" style={NS}>ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಮತ್ತು ಪಂಚಾಯತ್ ರಾಜ್ ಇಲಾಖೆ</p>
        <p className="font-bold text-[18px] mt-[6px] text-[#1a1a1a] underline" style={NS}>ಸಭೆಯ ಸೂಚನೆ</p>
        <p className="text-[11px] text-[#5a5a5a] italic" style={NS}>(Meeting Notice)</p>
      </div>

      {/* Details table */}
      <div className="px-[40px] pt-[20px]">
        <table className="w-full border-collapse border border-[#c0c0c0] text-[12px]">
          <tbody>
            {[
              ['ಜಿಲ್ಲಾ ಪಂಚಾಯತಿ / District', 'Raichur', 'ತಾಲೂಕು ಪಂಚಾಯತಿ / Taluk', 'Kakanur'],
              ['ಗ್ರಾಮ ಪಂಚಾಯತಿ / GP', 'Kakanur GP', 'ಪ್ರಕಾರ / Type', p.meetingType],
              ['ದಿನಾಂಕ / Date', p.meetingDate, 'ಸಮಯ / Time', p.meetingTime],
              ['ಸ್ಥಳ / Venue', p.meetingVenue, 'ಅಧ್ಯಕ್ಷರು / Chairperson', p.chairperson],
            ].map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`border border-[#c0c0c0] px-[10px] py-[7px] ${ci % 2 === 0 ? 'bg-[#f5f0ef] font-medium text-[#5a3a2e] w-[22%]' : 'w-[28%]'}`}
                    style={NS}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Meeting title */}
      <div className="px-[40px] pt-[16px]">
        <p className="font-semibold text-[14px] text-[#1a1a1a]" style={NS}>{p.meetingTitle}</p>
      </div>

      {/* Agenda table */}
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
            {p.agendas.length > 0 ? p.agendas.map((a, i) => (
              <tr key={a.id}>
                <td className="border border-[#c0c0c0] px-[10px] py-[7px] text-center" style={NS}>{i + 1}</td>
                <td className="border border-[#c0c0c0] px-[10px] py-[7px]" style={NS}>
                  <span className="font-medium">{a.title}</span>
                  {a.description && <span className="block text-[11px] text-[#5a5a5a] mt-[2px]">{a.description}</span>}
                </td>
                <td className="border border-[#c0c0c0] px-[10px] py-[7px]" style={NS}></td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="border border-[#c0c0c0] px-[10px] py-[7px] text-center text-[#727272]" style={NS}>No agenda items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Participants */}
      {p.participants.length > 0 && (
        <div className="px-[40px] pt-[16px]">
          <p className="font-semibold text-[13px] underline mb-[8px]" style={NS}>ಭಾಗವಹಿಸುವವರ ಪಟ್ಟಿ / Participants:</p>
          <table className="w-full border-collapse border border-[#c0c0c0] text-[12px]">
            <thead>
              <tr className="bg-[#f5f0ef]">
                <th className="border border-[#c0c0c0] px-[10px] py-[7px] text-left font-semibold text-[#5a3a2e] w-[50px]" style={NS}>ಕ್ರ.ಸಂ.</th>
                <th className="border border-[#c0c0c0] px-[10px] py-[7px] text-left font-semibold text-[#5a3a2e]" style={NS}>ಹೆಸರು ಮತ್ತು ಹುದ್ದೆ / Name & Designation</th>
                <th className="border border-[#c0c0c0] px-[10px] py-[7px] text-left font-semibold text-[#5a3a2e]" style={NS}>ಗ್ರಾಮ ಪಂಚಾಯತಿ / GP</th>
              </tr>
            </thead>
            <tbody>
              {p.participants.map((m, i) => (
                <tr key={m.id}>
                  <td className="border border-[#c0c0c0] px-[10px] py-[6px] text-center" style={NS}>{i + 1}</td>
                  <td className="border border-[#c0c0c0] px-[10px] py-[6px]" style={NS}>{m.name} , {m.designation}</td>
                  <td className="border border-[#c0c0c0] px-[10px] py-[6px]" style={NS}>{m.gp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signature block */}
      <div className="px-[40px] pt-[24px] pb-[30px]">
        {p.signed ? (
          <div className="flex flex-col items-end gap-[4px]">
            <div className="flex items-center gap-[6px] text-[#2e7d32]">
              <span className="text-[18px]">✓</span>
              <span className="font-semibold text-[13px]" style={NS}>{t('sign_digitally_signed_by')} {p.signerName}</span>
            </div>
            <span className="text-[11px] text-[#5a5a5a]" style={NS}>{p.signerDesig}</span>
            <span className="text-[11px] text-[#5a5a5a]" style={NS}>Date: {p.signedAt}</span>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-[30px]">
            <div className="flex flex-col items-end gap-[4px]">
              <div className="w-[200px] border-b border-[#1a1a1a]" />
              <span className="text-[12px] text-[#5a5a5a]" style={NS}>ಪಂಚಾಯತಿ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ</span>
              <span className="text-[11px] text-[#5a5a5a] italic" style={NS}>{t('sign_pdo_designation_parens')}</span>
            </div>
          </div>
        )}
        <p className="text-[11px] text-[#727272] mt-[20px]" style={NS}>ಮುದ್ರಣ ದಿನಾಂಕ / Print Date: {p.printDate}</p>
      </div>
    </div>
  );
}

// ── Print-only version ────────────────────────────────────────────────────────

function NoticePrintContent(p: NoticeProps) {
  const { t } = useLanguage();
  return (
    <div style={{ fontFamily: 'Noto Sans, sans-serif', fontSize: '13px', padding: '40px', color: '#1a1a1a' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', color: '#1a237e' }}>ಕರ್ನಾಟಕ ಸರ್ಕಾರ — ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಮತ್ತು ಪಂಚಾಯತ್ ರಾಜ್ ಇಲಾಖೆ</p>
        <p style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: 'underline', marginTop: '8px' }}>ಸಭೆಯ ಸೂಚನೆ (Meeting Notice)</p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
        <tbody>
          {[
            ['District', 'Raichur', 'Taluk', 'Kakanur'],
            ['GP', 'Kakanur GP', 'Type', p.meetingType],
            ['Date', p.meetingDate, 'Time', p.meetingTime],
            ['Venue', p.meetingVenue, 'Chairperson', p.chairperson],
          ].map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ border: '1px solid #ccc', padding: '6px 10px', background: ci % 2 === 0 ? '#f5f0ef' : 'white', fontWeight: ci % 2 === 0 ? 'bold' : 'normal' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>{p.meetingTitle}</p>
      <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '8px' }}>Meeting Agenda:</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f5f0ef' }}>
            <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left', width: '50px' }}>No.</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left' }}>Subject</th>
            <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left', width: '160px' }}>Note</th>
          </tr>
        </thead>
        <tbody>
          {p.agendas.map((a, i) => (
            <tr key={a.id}>
              <td style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>{i + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{a.title}{a.description ? ` — ${a.description}` : ''}</td>
              <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}></td>
            </tr>
          ))}
        </tbody>
      </table>
      {p.participants.length > 0 && (
        <>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '8px' }}>Participants:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f5f0ef' }}>
                <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left', width: '40px' }}>No.</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left' }}>Name & Designation</th>
                <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left' }}>GP</th>
              </tr>
            </thead>
            <tbody>
              {p.participants.map((m, i) => (
                <tr key={m.id}>
                  <td style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{m.name} , {m.designation}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{m.gp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <div style={{ marginTop: '40px', textAlign: 'right' }}>
        {p.signed ? (
          <>
            <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ {t('sign_digitally_signed_by')} {p.signerName}</p>
            <p style={{ fontSize: '11px', color: '#555' }}>{p.signerDesig}</p>
            <p style={{ fontSize: '11px', color: '#555' }}>Date: {p.signedAt}</p>
          </>
        ) : (
          <>
            <div style={{ width: '200px', borderBottom: '1px solid #000', marginLeft: 'auto', marginBottom: '4px' }} />
            <p style={{ fontSize: '12px' }}>{t('sign_pdo_designation')} {t('sign_pdo_designation_parens')}</p>
          </>
        )}
        <p style={{ fontSize: '11px', color: '#888', marginTop: '20px' }}>Print Date: {p.printDate}</p>
      </div>
    </div>
  );
}
