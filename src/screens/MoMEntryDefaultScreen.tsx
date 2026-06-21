import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda, type AgendaItem } from '../context/AgendaContext';
import { useMeetings } from '../context/MeetingsContext';
import type { FeedbackResult } from './MoMEntryPostRecordingScreen';
import {
  GoBackToPreviousPage,
  SectionHeading,
  AgendaCard,
  QuestionFieldsSmall,
  Button,
  InfoBox,
  SmallDetailsText,
  Icon,
  MicButton,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { STT_API, FEEDBACK_API } from '../config/api';
import {
  classifyAgenda,
  CATEGORY_FIELDS,
  flattenProceedings,
  parseProceedings,
  type StructuredProceedings,
} from '../utils/agendaClassifier';

type FieldRecordingState = 'idle' | 'recording' | 'processing';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export default function MoMEntryDefaultScreen() {
  const { lang, t } = useLanguage();
  const { saveProceedings } = useAgenda();
  const { saveMeetingProceedings, meetingAgendas } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();

  type RouteState = { agenda?: AgendaItem; discussionText?: string; feedbackCompleted?: boolean; meetingId?: number } | null;
  const routeState = location.state as RouteState;
  const agenda = routeState?.agenda;
  const meetingId = routeState?.meetingId;

  // Derive fields from agenda category
  const category = agenda
    ? classifyAgenda(agenda.heading, agenda.description)
    : classifyAgenda('', '');
  const fields = CATEGORY_FIELDS[category];

  // Parse any pre-existing proceedings into structured form
  const initialStructured = (): StructuredProceedings => {
    const existing = routeState?.discussionText;
    if (!existing) return Object.fromEntries(fields.map(f => [f, '']));
    if (typeof existing === 'object') return existing as StructuredProceedings;
    return parseProceedings(existing, fields);
  };

  const [fieldValues, setFieldValues] = useState<StructuredProceedings>(initialStructured);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [feedbackCompleted, setFeedbackCompleted] = useState(routeState?.feedbackCompleted ?? false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'action_option_approval' | 'action_option_discussion' | 'action_option_information' | null>(null);

  // Per-field recording state
  const [fieldRecState, setFieldRecState] = useState<Record<string, FieldRecordingState>>({});
  const [fieldSttError, setFieldSttError] = useState<Record<string, string | null>>({});

  // Per-field audio refs keyed by field name
  const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
  const audioChunksRef    = useRef<Record<string, Blob[]>>({});
  const audioCtxRef       = useRef<Record<string, AudioContext>>({});
  const analyserRef       = useRef<Record<string, AnalyserNode>>({});
  const [analyserNodes, setAnalyserNodes] = useState<Record<string, AnalyserNode | null>>({});
  const [speakingField, setSpeakingField] = useState<string | null>(null);

  // File input refs per field
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const audioInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const hasAnyText = fields.some(f => (fieldValues[f] ?? '').trim().length > 0);
  const isFeedbackEnabled = hasAnyText && !isFetchingFeedback &&
    !Object.values(fieldRecState).some(s => s !== 'idle');

  const updateField = (field: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const teardownFieldAudio = useCallback((field: string) => {
    audioCtxRef.current[field]?.close();
    delete audioCtxRef.current[field];
    delete analyserRef.current[field];
    setAnalyserNodes(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleReadAloud = (field: string) => {
    if (speakingField === field) {
      window.speechSynthesis.cancel();
      setSpeakingField(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fieldValues[field] ?? '');
    utterance.onend = () => setSpeakingField(null);
    utterance.onerror = () => setSpeakingField(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingField(field);
  };

  const handleMicClick = async (field: string) => {
    if ((fieldRecState[field] ?? 'idle') !== 'idle') return;
    setFieldSttError(prev => ({ ...prev, [field]: null }));
    setActiveField(field);

    if (!navigator.mediaDevices?.getUserMedia) {
      setFieldSttError(prev => ({ ...prev, [field]: 'Microphone not available on this connection.' }));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const denied = err instanceof DOMException && err.name === 'NotAllowedError';
      setFieldSttError(prev => ({ ...prev, [field]: denied ? 'Microphone access denied.' : 'Could not access microphone.' }));
      return;
    }

    const audioCtx = new AudioContext();
    audioCtxRef.current[field] = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current[field] = analyser;
    setAnalyserNodes(prev => ({ ...prev, [field]: analyser }));

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecordersRef.current[field] = mr;
    audioChunksRef.current[field] = [];
    mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current[field]?.push(e.data); };
    mr.start();
    setFieldRecState(prev => ({ ...prev, [field]: 'recording' }));
  };

  const handleMicConfirm = (field: string) => {
    const mr = mediaRecordersRef.current[field];
    if (!mr) return;
    setFieldRecState(prev => ({ ...prev, [field]: 'processing' }));
    const existingText = fieldValues[field] ?? '';

    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      delete mediaRecordersRef.current[field];
      teardownFieldAudio(field);
      const chunks = audioChunksRef.current[field] ?? [];
      audioChunksRef.current[field] = [];
      const mimeType = chunks[0]?.type ?? 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch(STT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioDataUri: reader.result as string, locale: lang }),
          });
          if (!res.ok) throw new Error(`STT API ${res.status}`);
          const data: { transcription: string } = await res.json();
          const sep = existingText.trim() ? ' ' : '';
          updateField(field, existingText + sep + data.transcription);
          setFieldRecState(prev => ({ ...prev, [field]: 'idle' }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setFieldSttError(prev => ({ ...prev, [field]: `Speech recognition failed — ${msg}` }));
          setFieldRecState(prev => ({ ...prev, [field]: 'idle' }));
        }
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
  };

  // ── Get Feedback ──────────────────────────────────────────────────────────
  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setFeedbackCompleted(true);
    setIsFetchingFeedback(true);

    const flatText = flattenProceedings(fieldValues);

    const MOCK_TEXT = 'Information was provided regarding Swachh Saturday village cleanliness activities, Onagalu Day observance, and COVID-19 JN.1 precautionary measures.';
    if (flatText.trim() === MOCK_TEXT || Object.values(fieldValues).join(' ').includes('Swachh Saturday')) {
      const feedbackResult: FeedbackResult = {
        category: 'Information / Intimation',
        category_reason: 'The agenda shares updates on sanitation, observances, and health.',
        feedback: [
          'Specify the exact number of beneficiaries identified under PM Awas Yojana — provide [count] and [ward name].',
          'Mention the name of the KUWSDB official contacted regarding water supply disruptions in [ward number].',
          'Include the resolution number and date for the decision on caste and income certificate delays.',
        ],
        spans: ['Swachh Saturday village cleanliness activities', 'Onagalu Day observance', 'COVID-19 JN.1 precautionary measures'],
        modes: ['APPEND', 'APPEND', 'REPHRASE'],
        flag_message: null,
      };
      setIsFetchingFeedback(false);
      navigate('/mom-entry/feedback', {
        state: { agenda, discussionText: flatText, structuredProceedings: fieldValues, feedbackResult, feedbackCompleted: true, meetingId },
      });
      return;
    }

    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_id:         agenda ? String(agenda.id) : '1',
          agenda_subject:    agenda?.heading || 'General Discussion',
          mom_discussion:    flatText,
          feedback_language: /[ಀ-೿]/.test(flatText) ? 'kn' : 'en',
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Feedback API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }
      const feedbackResult: FeedbackResult = await res.json();
      navigate('/mom-entry/feedback', {
        state: { agenda, discussionText: flatText, structuredProceedings: fieldValues, feedbackResult, feedbackCompleted: true, meetingId },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFeedbackError(`Failed to get feedback — ${msg}. Please try again.`);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (agenda) {
      const hasUserAgendas = meetingId != null && (meetingAgendas[meetingId]?.length ?? 0) > 0;
      if (hasUserAgendas) {
        saveMeetingProceedings(meetingId!, agenda.id, fieldValues);
      } else {
        saveProceedings(agenda.id, fieldValues);
      }
    }
    navigate('/agenda-list', { state: { meetingId } });
  };

  const isSaveEnabled = hasAnyText && feedbackCompleted;

  return (
    <MeetingShellLayout stepperActiveState={2} showBack={false}>
      <div className="flex flex-col gap-[3px]">

        {/* Header bar */}
        <div className="bg-white pl-[20px] pr-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-full">
          <GoBackToPreviousPage
            label={t('go_back')}
            onClick={() => navigate('/agenda-list', { state: { meetingId } })}
          />
        </div>

        <div className="bg-white flex gap-[32px] p-[30px] rounded-bl-[15px] rounded-br-[15px]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-[20px] flex-1 min-w-0">

            <SectionHeading text={t('mom_entry_heading')} className="shrink-0" />

            <AgendaCard
              stage="subpage"
              agendaNumber={agenda ? String(agenda.id) : '1'}
              agendaHeading={agenda?.heading ?? 'Reading and reporting on the proceedings of the previous meeting'}
              agendaDescription={agenda?.description ?? 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.'}
              className="shrink-0 w-full"
            />

            {/* Action field */}
            <div className="flex flex-col gap-[6px] items-start shrink-0 w-full">
              <QuestionFieldsSmall
                type="mandatory"
                questionText={t('action_field_label')}
                className="shrink-0 w-full"
              />
              <div className="relative shrink-0">
                {actionOpen && (
                  <div className="fixed inset-0 z-10" onClick={() => setActionOpen(false)} />
                )}
                <div className="relative z-20">
                  <Button
                    variant="outlined"
                    size="small"
                    iconPlacement="right"
                    text={selectedAction ? t(selectedAction) : t('action_field_placeholder')}
                    onClick={() => setActionOpen(o => !o)}
                  />
                  {actionOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-md overflow-hidden min-w-full">
                      {(['action_option_approval', 'action_option_discussion', 'action_option_information'] as const).map(key => (
                        <button
                          key={key}
                          className="bg-white flex items-center px-4 py-2 w-full hover:bg-[#f7f0ee] transition-colors text-left"
                          onClick={() => { setSelectedAction(key); setActionOpen(false); }}
                        >
                          <span className="font-normal text-sm text-[#212121] tracking-[0.25px]" style={NS}>
                            {t(key)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Structured field rows */}
            <div className="flex flex-col gap-[6px] items-start w-full">
              <QuestionFieldsSmall
                type="mandatory"
                questionText={t('discussion_field_label')}
                className="shrink-0"
              />
              <InfoBox type="plain" text={t('discussion_field_info')} className="shrink-0 w-full" />

              {feedbackError && (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={NS}>
                  {feedbackError}
                </p>
              )}

              {(() => {
                const activeRecField = fields.find(f => (fieldRecState[f] ?? 'idle') === 'recording');
                const outerBorder = activeRecField
                  ? 'border-[#ff7468] shadow-[0_0_0_1px_#ff7468]'
                  : 'border-[rgba(106,62,49,0.24)]';
                return (
              <div className={`w-full flex flex-col rounded-[12px] border transition-colors overflow-hidden ${outerBorder}`}>
                {fields.map((field, idx) => {
                  const isActive = activeField === field;
                  const recState = fieldRecState[field] ?? 'idle';
                  const isRecording = recState === 'recording';
                  const isProcessing = recState === 'processing';
                  const err = fieldSttError[field];

                  return (
                    <div
                      key={field}
                      className={`flex transition-colors ${idx < fields.length - 1 ? 'border-b border-[rgba(106,62,49,0.18)]' : ''} bg-white`}
                      onClick={() => setActiveField(field)}
                    >
                      {/* Left label column */}
                      <div className="w-[180px] shrink-0 flex items-start px-[16px] py-[14px] border-r border-[rgba(106,62,49,0.18)] bg-[#faf7f6]">
                        <span className="text-[14px] font-semibold leading-[20px] text-[#6a3e31]" style={NS}>
                          {field}
                        </span>
                      </div>

                      {/* Right entry column — active: brown left accent line */}
                      <div className={`flex-1 flex flex-col min-w-0 ${isActive ? 'border-l-2 border-[#6a3e31]' : ''}`}>
                        {isProcessing ? (
                          <div className="flex items-center gap-[8px] px-[14px] py-[14px] flex-1">
                            <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6" stroke="#ffa199" strokeWidth="2" strokeOpacity="0.3" />
                              <path d="M8 2a6 6 0 0 1 6 6" stroke="#ff7468" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="text-[12px] text-[#6a3e31] font-medium" style={NS}>Transcribing…</span>
                          </div>
                        ) : (
                          <textarea
                            value={fieldValues[field] ?? ''}
                            onChange={e => {
                              updateField(field, e.target.value);
                              const el = e.target;
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }}
                            onFocus={() => setActiveField(field)}
                            ref={el => {
                              if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
                            }}
                            placeholder={`Enter ${field.toLowerCase()}…`}
                            rows={1}
                            className="w-full resize-none bg-transparent border-none outline-none px-[14px] py-[14px] text-[14px] text-[#212121] leading-[20px] placeholder:text-[#bdbdbd] overflow-hidden"
                            style={{ ...NS, minHeight: '52px' }}
                          />
                        )}

                        {/* Per-field STT error */}
                        {err && (
                          <p className="text-[11px] text-[#b7131a] px-[14px] pb-[6px]" style={NS}>{err}</p>
                        )}

                        {/* Active row toolbar */}
                        {isActive && !isProcessing && (
                          <div className="flex items-center justify-between px-[10px] pb-[10px]">
                            {/* Hidden file inputs */}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={el => { photoInputRefs.current[field] = el; }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) updateField(field, (fieldValues[field] ?? '') + ` [Photo: ${file.name}]`);
                              }}
                            />
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              ref={el => { audioInputRefs.current[field] = el; }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) updateField(field, (fieldValues[field] ?? '') + ` [Audio: ${file.name}]`);
                              }}
                            />

                            {/* Left: scan + upload buttons */}
                            <div className="flex items-center gap-[8px]">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); photoInputRefs.current[field]?.click(); }}
                                className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[10px] py-[6px] border-none cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <Icon name="photo_camera" size="small" color="#6a3e31" />
                                <span className="text-[#6a3e31] text-[12px] font-medium leading-5" style={NS}>{t('btn_scan_photo')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); audioInputRefs.current[field]?.click(); }}
                                className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[10px] py-[6px] border-none cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <Icon name="upload_file" size="small" color="#6a3e31" />
                                <span className="text-[#6a3e31] text-[12px] font-medium leading-5" style={NS}>{t('btn_upload_audio')}</span>
                              </button>
                            </div>

                            {/* Right: read-aloud + mic */}
                            <div className="flex items-center gap-[8px]">
                              {(fieldValues[field] ?? '').trim().length > 0 && !isRecording && (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); handleReadAloud(field); }}
                                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f0ebe9] transition-colors border-none bg-transparent cursor-pointer"
                                >
                                  <Icon name={speakingField === field ? 'stop_circle' : 'volume_up'} size="medium" color="#6a3e31" />
                                </button>
                              )}
                              <MicButton
                                isRecording={isRecording}
                                onClick={() => isRecording ? handleMicConfirm(field) : handleMicClick(field)}
                                analyserNode={analyserNodes[field] ?? undefined}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
                );
              })()}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-[15px] items-start justify-end shrink-0 w-full mt-[10px]">
              {isFetchingFeedback && (
                <span className="text-sm text-[#727272] mr-2" style={NS}>
                  {t('feedback_fetching')}
                </span>
              )}
              <Button
                variant="outlined"
                state={isFeedbackEnabled ? 'default' : 'disabled'}
                iconPlacement="none"
                text={t('btn_get_feedback')}
                onClick={isFeedbackEnabled ? handleGetFeedback : undefined}
              />
              <Button
                variant="filled"
                state={isSaveEnabled ? 'default' : 'disabled'}
                iconPlacement="none"
                text={t('btn_save')}
                onClick={isSaveEnabled ? handleSave : undefined}
              />
            </div>
          </div>

          {/* ── Right: feedback placeholder ── */}
          <div className="bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] w-[360px] shrink-0 self-stretch overflow-y-auto">
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />
            <SmallDetailsText text={t('feedback_empty_state')} className="shrink-0" />
          </div>

        </div>
      </div>
    </MeetingShellLayout>
  );
}
