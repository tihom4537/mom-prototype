import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import { WebSocketSTTClient } from '../utils/websocketSttClient';
import { PcmAudioRecorder } from '../utils/pcmAudioRecorder';
import {
  Navbar,
  Sidebar,
  Breadcrumb,
  SectionHolder,
  Stepper,
  StepNavBar,
  Button,
  Icon,
  DropdownBoxOfProfile,
  DropdownBoxOfIcon,
  InputField,
  DropdownField,
  DatePicker,
  TimePicker,
  DescriptionField,
  Checkbox,
  SearchInput,
  Table,
  Pagination,
} from '../components';
import type { TableColumn } from '../components';

const MODAL_PAGE_SIZE_OPTIONS = [8, 15, 25, 50];

// ─── GP Staff mock data ────────────────────────────────────────────────────────

interface StaffMember {
  id: number;
  name: string;
  designation: string;
  gender: string;
  phone: string;
  email: string;
  gp: string;
  district: string;
}

const GP_STAFF: StaffMember[] = [
  { id: 1,  name: 'Ramesh Kumar',  designation: 'Panchayat Development Officer', gender: 'Male',   phone: '9876543210', email: 'ramesh@gp.kar.in',   gp: 'Kakanur GP',  district: 'Raichur' },
  { id: 2,  name: 'Savitha Devi',  designation: 'GP Secretary',                  gender: 'Female', phone: '9845123456', email: 'savitha@gp.kar.in',  gp: 'Kakanur GP',  district: 'Raichur' },
  { id: 3,  name: 'Mahesh Naik',   designation: 'Elected Member Ward 1',         gender: 'Male',   phone: '9731245678', email: 'mahesh@gp.kar.in',   gp: 'Kakanur GP',  district: 'Raichur' },
  { id: 4,  name: 'Priya Shetty',  designation: 'GP President',                  gender: 'Female', phone: '9632145870', email: 'priya@gp.kar.in',    gp: 'Kakanur GP',  district: 'Raichur' },
  { id: 5,  name: 'Venkatesh Rao', designation: 'Elected Member Ward 2',         gender: 'Male',   phone: '9541236780', email: 'venkat@gp.kar.in',   gp: 'Kakanur GP',  district: 'Raichur' },
  { id: 6,  name: 'Lakshmi Devi',  designation: 'GP Vice President',             gender: 'Female', phone: '9412345670', email: 'lakshmi@gp.kar.in',  gp: 'Kakanur GP',  district: 'Raichur' },
  { id: 7,  name: 'Suresh Bhat',   designation: 'Elected Member Ward 1',         gender: 'Male',   phone: '9312456789', email: 'suresh@gp.kar.in',   gp: 'Hosakote GP', district: 'Bengaluru Rural' },
  { id: 8,  name: 'Anitha Kumar',  designation: 'GP Secretary',                  gender: 'Female', phone: '9234567891', email: 'anitha@gp.kar.in',   gp: 'Hosakote GP', district: 'Bengaluru Rural' },
  { id: 9,  name: 'Raju Gowda',   designation: 'Elected Member Ward 3',         gender: 'Male',   phone: '9123456780', email: 'raju@gp.kar.in',     gp: 'Hosakote GP', district: 'Bengaluru Rural' },
  { id: 10, name: 'Kavitha Nair',  designation: 'Panchayat Development Officer', gender: 'Female', phone: '8976543211', email: 'kavitha@gp.kar.in',  gp: 'Hosakote GP', district: 'Bengaluru Rural' },
  { id: 11, name: 'Shiva Murthy',  designation: 'Elected Member Ward 4',         gender: 'Male',   phone: '8912345672', email: 'shivam@gp.kar.in',   gp: 'Kakanur GP',  district: 'Raichur' },
  { id: 12, name: 'Meena Kumari',  designation: 'Elected Member Ward 5',         gender: 'Female', phone: '8845236710', email: 'meena@gp.kar.in',    gp: 'Kakanur GP',  district: 'Raichur' },
];

// ─── Date blocking logic ───────────────────────────────────────────────────────
// Dates before today and within next 15 days are blocked.
// Only dates 15+ days from today are selectable.
function getMinSelectableDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateMeetingScreen() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const { meetings } = useMeetings();

  const desigKeyMapMain: Record<string, string> = {
    'Panchayat Development Officer': 'desig_pdo_full',
    'GP Secretary': 'desig_secretary_full',
    'GP President': 'desig_president_full',
    'GP Vice President': 'desig_vice_president_full',
    'Elected Member Ward 1': 'desig_elected_ward1',
    'Elected Member Ward 2': 'desig_elected_ward2',
    'Elected Member Ward 3': 'desig_elected_ward3',
    'Elected Member Ward 4': 'desig_elected_ward4',
    'Elected Member Ward 5': 'desig_elected_ward5',
  };

  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Section 1: Meeting details ──
  const [meetingType,  setMeetingType]  = useState('');
  const [date,         setDate]         = useState('');
  const [time,         setTime]         = useState('');
  const [mode,         setMode]         = useState('');
  const [meetingLink,  setMeetingLink]  = useState('');
  const [venue,        setVenue]        = useState('');
  const [chairperson,  setChairperson]  = useState('');
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');

  // ── Description mic recording ──
  const [descRecording,   setDescRecording]   = useState(false);
  const [descSttError,    setDescSttError]    = useState('');
  const descRecorderRef = useRef<PcmAudioRecorder | null>(null);
  const descAudioCtxRef = useRef<AudioContext | null>(null);
  const descAnalyserRef = useRef<AnalyserNode | null>(null);
  const descWsClientRef = useRef<WebSocketSTTClient | null>(null);
  const descUpdatedTextRef = useRef<string>(description);

  // Keep ref in sync with state so we can access updated value during async operations
  useEffect(() => {
    descUpdatedTextRef.current = description;
  }, [description]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      const wsClient = descWsClientRef.current;
      if (wsClient) {
        wsClient.close().catch(err => console.error('[CreateMeeting] Cleanup error:', err));
        descWsClientRef.current = null;
      }
      const recorder = descRecorderRef.current;
      if (recorder) {
        recorder.stop();
        descRecorderRef.current = null;
      }
    };
  }, []);

  async function handleDescMicClick() {
    if (descRecording) {
      // Stop recording and process audio
      console.log('[CreateMeeting] Stop button clicked - transitioning to process audio');
      await handleDescConfirmRecording();
      return;
    }

    // Start recording
    setDescSttError('');
    console.log('[CreateMeeting] Mic button clicked - starting recording');

    let stream: MediaStream;
    if (!navigator.mediaDevices?.getUserMedia) {
      setDescSttError('Microphone is not available. This feature requires a secure (HTTPS) connection.');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const isNotAllowed = err instanceof DOMException && err.name === 'NotAllowedError';
      setDescSttError(isNotAllowed
        ? 'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        : 'Could not access the microphone. Please check your browser permissions and try again.'
      );
      return;
    }

    const pcmRecorder = new PcmAudioRecorder();
    descRecorderRef.current = pcmRecorder;

    try {
      await pcmRecorder.start();
      setDescRecording(true);
      console.log('[CreateMeeting] PCM recording started');
    } catch (err) {
      console.error('[CreateMeeting] PCM recorder failed:', err);
      setDescSttError('Failed to initialize audio recorder. Please check microphone access.');
      descRecorderRef.current = null;
    }
  }

  async function handleDescConfirmRecording() {
    console.log('[CreateMeeting] handleDescConfirmRecording called');
    const recorder = descRecorderRef.current;
    if (!recorder) {
      console.error('[CreateMeeting] No recorder found!');
      return;
    }

    setDescRecording(false);
    setDescSttError('');

    let wsClient: WebSocketSTTClient | null = null;

    try {
      // Stop recording and get audio
      const audioData = recorder.stop();
      descRecorderRef.current = null;
      console.log('[CreateMeeting] Recording stopped. Audio data:', audioData.length, 'bytes');

      if (audioData.length === 0) {
        setDescSttError('No audio data captured');
        return;
      }

      // Create WebSocket client using current language setting
      wsClient = new WebSocketSTTClient(lang);
      descWsClientRef.current = wsClient;

      await wsClient.connect();
      console.log('[CreateMeeting] WebSocket connected');

      let transcriptReceived = false;
      let transcriptPromiseResolve: (() => void) | null = null;
      const transcriptPromise = new Promise<void>(resolve => {
        transcriptPromiseResolve = resolve;
      });

      wsClient.on('transcript', (text: string) => {
        console.log('[CreateMeeting] Transcript received:', text);
        transcriptReceived = true;
        if (text.trim()) {
          const newText = descUpdatedTextRef.current + (descUpdatedTextRef.current.trim() ? ' ' : '') + text;
          descUpdatedTextRef.current = newText;
          setDescription(newText);
        }
        if (transcriptPromiseResolve) {
          transcriptPromiseResolve();
          transcriptPromiseResolve = null;
        }
      });

      wsClient.on('error', (msg: string) => {
        console.error('[CreateMeeting] WebSocket error:', msg);
        setDescSttError(`Speech recognition error: ${msg}`);
      });

      // Send audio
      console.log('[CreateMeeting] Sending audio...');
      await wsClient.send(audioData);
      console.log('[CreateMeeting] Audio sent. Sending end signal...');

      await wsClient.end();
      console.log('[CreateMeeting] End signal sent. Waiting for transcript...');

      // Wait for transcript response
      const transcriptTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => {
          console.error('[CreateMeeting] Transcript timeout');
          reject(new Error('Transcript response timeout'));
        }, 60000)
      );

      try {
        await Promise.race([transcriptPromise, transcriptTimeout]);
        console.log('[CreateMeeting] Transcript received successfully');
      } catch (timeoutErr) {
        console.error('[CreateMeeting] Promise race failed:', timeoutErr);
        if (!transcriptReceived) {
          console.warn('[CreateMeeting] Warning: Transcript event never fired');
        }
        throw timeoutErr;
      }

      if (wsClient) {
        await wsClient.close();
        console.log('[CreateMeeting] WebSocket closed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[CreateMeeting] Error:', msg);
      setDescSttError(`Speech recognition failed — ${msg}`);

      if (wsClient) {
        try {
          await wsClient.close();
        } catch (closeErr) {
          console.error('[CreateMeeting] Error closing WebSocket:', closeErr);
        }
      }
    }

    descWsClientRef.current = null;
  }

  // ── Section 2: Participants ──
  const [participants,    setParticipants]    = useState<StaffMember[]>([]);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [modalSelected,   setModalSelected]   = useState<Set<number>>(new Set());
  const [staffSearch,     setStaffSearch]     = useState('');
  const [modalPage,       setModalPage]       = useState(1);
  const [modalPageSize,   setModalPageSize]   = useState(MODAL_PAGE_SIZE_OPTIONS[0]);

  // ── Validation ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSidebar = () => setSidebarState(s => s === 'full' ? 'shortened' : 'full');

  const meetingTypeOptions = [
    t('meeting_type_gp_general_body'),
    t('meeting_type_gram_sabha_ordinary'),
    t('meeting_type_gram_sabha_special_budget'),
    t('meeting_type_ward_sabha_ordinary'),
    t('meeting_type_habitation_ordinary'),
    t('meeting_type_habitation_emergency'),
    t('meeting_type_kdp'),
    t('meeting_type_makkala_sabha'),
    t('meeting_type_mahila_sabha'),
    t('meeting_type_finance_committee'),
    t('meeting_type_general_standing'),
    t('meeting_type_social_justice'),
    t('meeting_type_gram_sabha_special'),
    t('meeting_type_ward_sabha_special'),
    t('meeting_type_habitation_special'),
  ];
  const modeOptions = [t('field_mode_offline'), t('field_mode_online')];

  function ordinal(n: number) {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function handleMeetingTypeChange(val: string) {
    setMeetingType(val);
    setErrors(e => ({ ...e, meetingType: undefined as any }));
    const year = new Date().getFullYear();
    const keyword = val.toLowerCase();
    const count = meetings.filter(m => {
      const nameYear = m.name.match(/\d{4}$/)?.[0];
      return nameYear === String(year) && m.name.toLowerCase().includes(keyword);
    }).length;
    setTitle(`${ordinal(count + 1)} ${val} ${year}`);
  }

  const minDate = getMinSelectableDate();

  // ── Participants modal ──
  function openModal() {
    setModalSelected(new Set(participants.map(p => p.id)));
    setStaffSearch('');
    setModalPage(1);
    setModalPageSize(MODAL_PAGE_SIZE_OPTIONS[0]);
    setModalOpen(true);
  }

  function handleModalAdd() {
    setParticipants(GP_STAFF.filter(s => modalSelected.has(s.id)));
    setModalOpen(false);
  }

  function toggleStaff(id: number) {
    setModalSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllStaff(ids: number[]) {
    setModalSelected(prev => new Set([...prev, ...ids]));
  }

  function clearAllStaff() {
    setModalSelected(new Set());
  }

  const filteredStaff = GP_STAFF.filter(s =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.designation.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.gp.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // ── Proceed Next enable logic ──
  const isOnline = mode === t('field_mode_online');
  const section1Valid =
    !!meetingType &&
    !!date &&
    !!time &&
    !!mode &&
    (!isOnline || !!meetingLink.trim()) &&
    !!venue.trim() &&
    !!chairperson.trim() &&
    !!title.trim();
  const section2Valid = participants.length >= 5;
  const canProceed = section1Valid && section2Valid;

  // ── Submit (navigate to Stage 2) ──
  function handleProceed() {
    if (!canProceed) return;
    if (descRecording) descRecorderRef.current?.stop();
    navigate('/meetings/create/agenda', {
      state: {
        meetingType, date, time, mode, meetingLink, venue, chairperson, title, description,
        participants,
      },
    });
  }

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
          <div className="absolute right-[88px] top-full shadow-lg z-50">
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
          <div className="absolute right-[26px] top-full shadow-lg z-50">
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

          {/* Breadcrumb + Stepper — fixed header */}
          <div className="shrink-0 flex flex-col gap-[15px] px-6 pt-5 pb-[10px] bg-[#f1f2f2]">
            <Breadcrumb
              level={3}
              items={[
                t('breadcrumb_module'),
                t('breadcrumb_meetings'),
                t('breadcrumb_create_meeting'),
              ]}
            />
            <Stepper
              activeState={1}
              stepLabels={[t('stepper_step1'), t('stepper_step2'), t('stepper_step3')]}
            />
          </div>

          <div className="shrink-0 px-6 pt-[10px]">
            <StepNavBar showBack={false} />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[50px]">
            <div className="flex flex-col gap-[25px]">

              {/* ── Section 1: Meeting Details ── */}
              <SectionHolder variant="mandatory" title={t('section_meeting_details')}>
                <div className="flex flex-col gap-[30px] px-[30px] pt-[25px] pb-[35px]">

                  {/* Row 1: Meeting Type | Date | Time — 3 equal columns */}
                  <div className="flex gap-[30px] items-start">
                    <div className="flex-1 min-w-0">
                      <DropdownField
                        label={t('field_meeting_type')}
                        placeholder={t('field_meeting_type_placeholder')}
                        value={meetingType}
                        onChange={handleMeetingTypeChange}
                        options={meetingTypeOptions}
                        required
                        hasError={!!errors.meetingType}
                        errorText={errors.meetingType}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DatePicker
                        label={t('field_date')}
                        required
                        value={date}
                        onChange={val => { setDate(val); setErrors(e => ({ ...e, date: undefined as any })); }}
                        placeholder={t('field_date_placeholder')}
                        hasError={!!errors.date}
                        errorText={errors.date}
                        minDate={minDate}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <TimePicker
                        label={t('field_time')}
                        required
                        value={time}
                        onChange={val => { setTime(val); setErrors(e => ({ ...e, time: undefined as any })); }}
                        placeholder={t('field_time_placeholder')}
                        hasError={!!errors.time}
                        errorText={errors.time}
                      />
                    </div>
                  </div>

                  {/* Row 2: Mode | Online link (only when online) | Venue */}
                  <div className="flex gap-[30px] items-start">
                    <div className="flex-1 min-w-0">
                      <DropdownField
                        label={t('field_mode')}
                        placeholder={t('field_mode_placeholder')}
                        value={mode}
                        onChange={val => {
                          setMode(val);
                          setErrors(e => ({ ...e, mode: undefined as any, meetingLink: undefined as any }));
                          if (val !== t('field_mode_online')) setMeetingLink('');
                        }}
                        options={modeOptions}
                        required
                        hasError={!!errors.mode}
                        errorText={errors.mode}
                      />
                    </div>
                    {isOnline && (
                      <div className="flex-1 min-w-0">
                        <InputField
                          label={t('field_meeting_link')}
                          placeholder={t('field_meeting_link_placeholder')}
                          value={meetingLink}
                          onChange={val => { setMeetingLink(val); setErrors(e => ({ ...e, meetingLink: undefined as any })); }}
                          required
                          fieldState={errors.meetingLink ? 'error' : 'default'}
                          errorText={errors.meetingLink}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <InputField
                        label={t('field_venue')}
                        placeholder={t('field_venue_placeholder')}
                        value={venue}
                        onChange={val => { setVenue(val); setErrors(e => ({ ...e, venue: undefined as any })); }}
                        required
                        fieldState={errors.venue ? 'error' : 'default'}
                        errorText={errors.venue}
                      />
                    </div>
                  </div>

                  {/* Row 3: Chairperson Name (1/3 width) */}
                  <div className="flex gap-[30px] items-start">
                    <div className="w-[346px] shrink-0">
                      <InputField
                        label={t('field_chairperson')}
                        placeholder={t('field_chairperson_placeholder')}
                        value={chairperson}
                        onChange={val => { setChairperson(val); setErrors(e => ({ ...e, chairperson: undefined as any })); }}
                        required
                        fieldState={errors.chairperson ? 'error' : 'default'}
                        errorText={errors.chairperson}
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#c6c6c6] w-full" />

                  {/* Title (720px wide) */}
                  <div className="w-[720px]">
                    <InputField
                      label={t('field_title')}
                      placeholder={t('field_title_placeholder')}
                      value={title}
                      onChange={val => { setTitle(val); setErrors(e => ({ ...e, title: undefined as any })); }}
                      required
                      fieldState={errors.title ? 'error' : 'default'}
                      errorText={errors.title}
                    />
                  </div>

                  {/* Description (720px wide) + mic */}
                  <div className="w-[720px]">
                    <DescriptionField
                      label={t('field_description')}
                      placeholder={t('field_description_placeholder')}
                      value={description}
                      onChange={setDescription}
                      onMicClick={handleDescMicClick}
                      micRecording={descRecording}
                      micAnalyserNode={descAnalyserRef.current ?? undefined}
                    />
                    {descSttError && (
                      <p className="text-xs text-[#b7131a] mt-1" style={{ fontFamily: 'Noto Sans' }}>{descSttError}</p>
                    )}
                  </div>
                </div>
              </SectionHolder>

              {/* ── Section 2: Participant Details ── */}
              <SectionHolder variant="mandatory" title={t('section_participants')}>
                <div className="flex flex-col gap-4 px-[30px] pt-[25px] pb-[35px]">
                  <div className="flex gap-[15px] items-center">
                    <Button
                      variant="filled"
                      size="small"
                      iconPlacement="left"
                      iconName="people_alt"
                      text={t('btn_select_participants')}
                      onClick={openModal}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      iconPlacement="left"
                      iconName="person_add"
                      text={t('btn_add_participants')}
                      onClick={() => {}}
                    />
                  </div>

                  {/* Selected participants table */}
                  {participants.length > 0 && (
                    <Table
                      columns={[
                        {
                          key: 'slno',
                          label: t('participant_col_slno'),
                          width: 'w-[50px] shrink-0',
                          render: (_v, row) => <span>{String((row as unknown as StaffMember & { _idx: number })._idx + 1)}</span>,
                        },
                        {
                          key: 'name',
                          label: t('participant_col_name'),
                          width: 'flex-1 min-w-0',
                          render: (_v, row) => {
                            const p = row as unknown as StaffMember;
                            return (
                              <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#212121] leading-5" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>{p.name}</span>
                                <span className="text-[11px] text-[#727272] leading-4" style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>{desigKeyMapMain[p.designation] ? t(desigKeyMapMain[p.designation]) : p.designation}</span>
                              </div>
                            );
                          },
                        },
                        {
                          key: 'gender',
                          label: t('participant_col_gender'),
                          width: 'w-[80px] shrink-0',
                        },
                        {
                          key: 'phone',
                          label: t('participant_col_phone'),
                          width: 'w-[115px] shrink-0',
                        },
                        {
                          key: 'email',
                          label: t('participant_col_email'),
                          width: 'w-[170px] shrink-0',
                        },
                        {
                          key: 'gp',
                          label: t('participant_col_gp'),
                          width: 'w-[160px] shrink-0',
                        },
                        {
                          key: 'district',
                          label: t('participant_col_district'),
                          width: 'w-[160px] shrink-0',
                        },
                        {
                          key: 'remove',
                          label: '',
                          width: 'w-[48px] shrink-0',
                          render: (_v, row) => {
                            const p = row as unknown as StaffMember;
                            return (
                              <button
                                type="button"
                                onClick={() => setParticipants(prev => prev.filter(x => x.id !== p.id))}
                                className="flex items-center justify-center size-7 rounded hover:bg-[#f5ede9] transition-colors"
                              >
                                <Icon name="close" size="small" color="#727272" />
                              </button>
                            );
                          },
                        },
                      ] as TableColumn<Record<string, unknown>>[]}
                      rows={participants.map((p, idx) => ({ ...p, _idx: idx } as unknown as Record<string, unknown>))}
                      getRowId={row => (row as unknown as StaffMember).id}
                    />
                  )}

                  {participants.length > 0 && participants.length < 5 && (
                    <p
                      className="text-xs text-[#b7131a] leading-4"
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >
                      {t('validation_min_participants')}
                    </p>
                  )}
                </div>
              </SectionHolder>

              {/* ── Proceed Next button ── */}
              <div className="flex justify-center pt-2">
                <Button
                  variant="filled"
                  size="large"
                  iconPlacement="right"
                  iconName="arrow_forward"
                  state={canProceed ? 'default' : 'disabled'}
                  text={t('btn_proceed_next')}
                  onClick={handleProceed}
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Select Participants Modal ── */}
      {modalOpen && (
        <SelectParticipantsModal
          t={t}
          staffSearch={staffSearch}
          onSearchChange={(val) => { setStaffSearch(val); setModalPage(1); }}
          filteredStaff={filteredStaff}
          selected={modalSelected}
          onToggle={toggleStaff}
          onSelectAll={selectAllStaff}
          onClearAll={clearAllStaff}
          onAdd={handleModalAdd}
          onClose={() => setModalOpen(false)}
          page={modalPage}
          onPageChange={setModalPage}
          pageSize={modalPageSize}
          onPageSizeChange={(sz) => { setModalPageSize(sz); setModalPage(1); }}
        />
      )}
    </div>
  );
}

// ─── Select Participants Modal ─────────────────────────────────────────────────

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface SelectParticipantsModalProps {
  t: (key: string) => string;
  staffSearch: string;
  onSearchChange: (val: string) => void;
  filteredStaff: StaffMember[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onClearAll: () => void;
  onAdd: () => void;
  onClose: () => void;
  page: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange: (sz: number) => void;
}

function SelectParticipantsModal({
  t,
  staffSearch,
  onSearchChange,
  filteredStaff,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  onAdd,
  onClose,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: SelectParticipantsModalProps) {
  const totalPages  = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const pageStart   = (page - 1) * pageSize;
  const pageStaff   = filteredStaff.slice(pageStart, pageStart + pageSize);
  const allSelected = filteredStaff.length > 0 && filteredStaff.every(s => selected.has(s.id));

  const columns: TableColumn<Record<string, unknown>>[] = [
    {
      key: 'slno',
      label: t('participant_col_slno'),
      width: 'w-[52px] shrink-0',
      render: (_val, row) => {
        const idx = filteredStaff.findIndex(s => s.id === (row as unknown as StaffMember).id);
        return (
          <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] w-full text-center" style={NS}>
            {idx + 1}
          </span>
        );
      },
    },
    {
      key: 'name',
      label: (
        <div className="flex items-center gap-[8px]">
          <span>{t('participant_col_name')}</span>
          <button
            type="button"
            onClick={allSelected ? onClearAll : () => onSelectAll(filteredStaff.map(s => s.id))}
            className="flex items-center gap-[3px] px-[6px] py-[2px] rounded-[5px] border border-[#388e3c] text-[#388e3c] text-[12px] font-medium bg-white hover:bg-[#e8f5e9] active:bg-[#c8e6c9] transition-colors whitespace-nowrap shrink-0"
            style={NS}
          >
            <Icon name="check" size="small" color="#388e3c" />
            {allSelected ? t('btn_clear_all') : t('btn_select_all').replace('{n}', String(filteredStaff.length))}
          </button>
        </div>
      ),
      width: 'w-[300px] shrink-0',
      cellType: 'checkbox',
      render: (_val, row) => {
        const staff = row as unknown as StaffMember;
        const isSelected = selected.has(staff.id);
        return (
          <>
            <div className="shrink-0">
              <Checkbox checked={isSelected} onChange={() => onToggle(staff.id)} color="green" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[14px] font-medium leading-[20px] text-[#212121] truncate" style={NS}>
                {staff.name}
              </span>
              <span className="text-[12px] leading-[16px] text-[#727272] tracking-[0.4px] truncate" style={NS}>
                {staff.designation}
              </span>
            </div>
          </>
        );
      },
    },
    { key: 'gender',   label: t('participant_col_gender'),   width: 'w-[75px] shrink-0' },
    { key: 'phone',    label: t('participant_col_phone'),    width: 'w-[105px] shrink-0' },
    { key: 'email',    label: t('participant_col_email'),    width: 'flex-1 min-w-0' },
    { key: 'gp',       label: t('participant_col_gp'),       width: 'w-[110px] shrink-0' },
    { key: 'district', label: t('participant_col_district'), width: 'w-[120px] shrink-0' },
  ];

  const desigKeyMap: Record<string, string> = {
    'Panchayat Development Officer': 'desig_pdo_full',
    'GP Secretary': 'desig_secretary_full',
    'GP President': 'desig_president_full',
    'GP Vice President': 'desig_vice_president_full',
    'Elected Member Ward 1': 'desig_elected_ward1',
    'Elected Member Ward 2': 'desig_elected_ward2',
    'Elected Member Ward 3': 'desig_elected_ward3',
    'Elected Member Ward 4': 'desig_elected_ward4',
    'Elected Member Ward 5': 'desig_elected_ward5',
  };

  const rows = pageStaff.map(s => ({
    ...s,
    designation: desigKeyMap[s.designation] ? t(desigKeyMap[s.designation]) : s.designation,
    gender: s.gender === 'Male' ? t('gender_male') : s.gender === 'Female' ? t('gender_female') : s.gender,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex flex-col gap-0 w-[960px] max-h-[85vh] shadow-2xl">

        {/* Header */}
        <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] pt-[20px] pb-[20px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 border-b border-[#e0e0e0]">
          <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] whitespace-nowrap" style={NS}>
            {t('popup_select_participants_title')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0"
          >
            <Icon name="close" size="small" color="#6a3e31" />
          </button>
        </div>

        {/* Body */}
        <div className="bg-white rounded-bl-[20px] rounded-br-[20px] flex flex-col gap-[16px] px-[35px] pt-[25px] pb-[30px] min-h-0 overflow-hidden">

          <div className="shrink-0">
            <SearchInput
              value={staffSearch}
              onChange={onSearchChange}
              placeholder={t('popup_search_placeholder')}
            />
          </div>

          {/* Scrollable table area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <Table
              columns={columns}
              rows={rows}
              selectedIds={selected}
              getRowId={(row) => (row as unknown as StaffMember).id}
              onRowClick={(row) => onToggle((row as unknown as StaffMember).id)}
              emptyMessage={t('popup_search_placeholder')}
            />
          </div>

          <div className="shrink-0">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredStaff.length}
              itemsPerPage={pageSize}
              itemsPerPageOptions={MODAL_PAGE_SIZE_OPTIONS}
              onPageChange={onPageChange}
              onItemsPerPageChange={onPageSizeChange}
              itemControl={true}
            />
          </div>

          <div className="flex items-center justify-end gap-[15px] shrink-0">
            <Button
              variant="outlined"
              iconPlacement="none"
              text={t('btn_close')}
              onClick={onClose}
            />
            <Button
              variant="filled"
              iconPlacement="none"
              state={selected.size >= 5 ? 'default' : 'disabled'}
              text={`${t('btn_add')} (${selected.size})`}
              onClick={onAdd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
