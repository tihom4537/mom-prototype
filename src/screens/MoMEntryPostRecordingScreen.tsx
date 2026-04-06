import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda, type AgendaItem } from '../context/AgendaContext';
import {
  GoBackToPreviousPage,
  SectionHeading,
  AgendaCard,
  QuestionFieldsSmall,
  Button,
  InfoBox,
  TextAreaContainer,
  MicButton,
  SmallDetailsText,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { STT_API, FEEDBACK_API } from '../config/api';

type EntryState = 'idle' | 'recording' | 'processing';

export interface FeedbackResult {
  category: string;
  category_reason: string;
  feedback: string[];
  /** Parallel array: the exact phrase in discussionText each feedback item refers to (null if no span) */
  spans?: (string | null)[];
}

export default function MoMEntryPostRecordingScreen() {
  const { lang, t } = useLanguage();
  const { markCompleted } = useAgenda();
  const navigate = useNavigate();
  const location = useLocation();

  type RouteState = { agenda?: AgendaItem; discussionText?: string; feedbackCompleted?: boolean } | null;
  const routeState = location.state as RouteState;
  const agenda = routeState?.agenda;

  const [discussionText, setDiscussionText]         = useState(routeState?.discussionText ?? '');
  const [entryState, setEntryState]                 = useState<EntryState>('idle');
  const [sttError, setSttError]                     = useState<string | null>(null);
  const [feedbackError, setFeedbackError]           = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [feedbackCompleted, setFeedbackCompleted]   = useState(routeState?.feedbackCompleted ?? false);
  const [actionOpen, setActionOpen]                 = useState(false);
  const [selectedAction, setSelectedAction]         = useState<'action_option_approval' | 'action_option_discussion' | 'action_option_information' | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const teardownAudio = useCallback(() => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setAnalyserNode(null);
  }, []);

  const isRecording  = entryState === 'recording';
  const isProcessing = entryState === 'processing';
  const isIdle       = entryState === 'idle';
  const hasText      = discussionText.trim().length > 0;

  const isFeedbackEnabled = hasText && isIdle && !isFetchingFeedback;
  const isSaveEnabled     = hasText && isIdle && feedbackCompleted && !isFetchingFeedback;

  // ── Start recording ──────────────────────────────────────────────────────
  const handleMicClick = async () => {
    if (entryState !== 'idle') return;
    setSttError(null);
    setFeedbackError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setSttError('Microphone access was denied. Please allow microphone access and try again.');
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = audioCtx;
    setAnalyserNode(analyser);

    mediaRecorder.start();
    setEntryState('recording');
  };

  // ── Cancel recording ─────────────────────────────────────────────────────
  const handleCancelRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = null;
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    teardownAudio();
    setEntryState('idle');
  };

  // ── Confirm recording — calls STT API ────────────────────────────────────
  const handleConfirmRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    setEntryState('processing');
    const textAtConfirm = discussionText;

    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
      teardownAudio();

      const mimeType = audioChunksRef.current[0]?.type ?? 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];

      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioDataUri = reader.result as string;
        try {
          const res = await fetch(STT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioDataUri, locale: lang }),
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => '');
            throw new Error(`STT API returned ${res.status}${detail ? `: ${detail}` : ''}`);
          }

          const data: { transcription: string } = await res.json();
          const separator = textAtConfirm.trim() ? ' ' : '';
          setDiscussionText(textAtConfirm + separator + data.transcription);
          setEntryState('idle');
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setSttError(`Speech recognition failed — ${msg}. Please try again or type your notes.`);
          setEntryState('idle');
        }
      };

      reader.readAsDataURL(blob);
    };

    mr.stop();
  };

  // ── Get Feedback ─────────────────────────────────────────────────────────
  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setIsFetchingFeedback(true);

    // MOCK INTERCEPT — remove this block when API is live
    const MOCK_TEXT = 'Information was provided regarding Swachh Saturday village cleanliness activities, Onagalu Day observance, and COVID-19 JN.1 precautionary measures.';
    if (discussionText.trim() === MOCK_TEXT) {
      const feedbackResult: FeedbackResult = {
        category: 'Public Health & Sanitation',
        category_reason: 'The agenda covers sanitation activities, public health observances, and disease precautionary measures.',
        feedback: [
          'The following information was given about Swachh Saturday —',
          'The following information was given about Village Sanitation —',
          'The following information was given about Onagalu Day —',
          'The following information was given about COVID JN.1 —',
          'The following information was given about precautionary measures —',
          'The meeting discussed the following key topics:',
        ],
        spans: [
          'Swachh Saturday village cleanliness activities',
          null,
          'Onagalu Day observance',
          'COVID-19 JN.1 precautionary measures',
          null,
          'Information was provided regarding',
        ],
      };
      setIsFetchingFeedback(false);
      navigate('/mom-entry/feedback', { state: { agenda, discussionText, feedbackResult } });
      return;
    }
    // END MOCK INTERCEPT

    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_id:      agenda ? String(agenda.id) : '1',
          agenda_subject: agenda?.heading || 'General Discussion',
          mom_discussion: discussionText,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Feedback API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }

      const feedbackResult: FeedbackResult = await res.json();
      navigate('/mom-entry/feedback', {
        state: { agenda, discussionText, feedbackResult },
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
    if (agenda) markCompleted(agenda.id);
    navigate('/agenda-list');
  };

  // Determine the active error message to show (STT takes priority)
  const activeError = sttError ?? feedbackError;

  return (
    <MeetingShellLayout stepperActiveState={2}>

      <div className="flex flex-col gap-[3px]">

        {/* Header bar */}
        <div className="bg-white pl-[20px] pr-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-full">
          <GoBackToPreviousPage
            label={t('go_back')}
            onClick={() => navigate('/agenda-list')}
          />
        </div>

        {/* Body */}
        <div className="bg-white flex gap-[32px] p-[30px] rounded-bl-[15px] rounded-br-[15px]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-[20px] flex-1 min-w-0">

            <SectionHeading text={t('mom_entry_heading')} className="shrink-0" />

            {/* Agenda card */}
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
                          <span className="font-normal text-sm text-[#212121] tracking-[0.25px]" style={{ fontFamily: 'Noto Sans' }}>
                            {t(key)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Discussion field + floating mic */}
            <div className="flex flex-col gap-[6px] items-start shrink-0 w-full relative pb-[33px]">
              <QuestionFieldsSmall
                type="mandatory"
                questionText={t('discussion_field_label')}
                className="shrink-0"
              />

              {/* Info / error box */}
              {activeError ? (
                <InfoBox
                  type="default"
                  text={activeError}
                  className="shrink-0 w-full"
                />
              ) : (
                <InfoBox
                  type="outlined"
                  text={t('discussion_field_info')}
                  className="shrink-0 w-full"
                />
              )}

              <TextAreaContainer
                state={isRecording || isProcessing ? 'recording' : hasText ? 'filled' : 'default'}
                placeholder={t('discussion_field_placeholder')}
                value={discussionText}
                onChange={setDiscussionText}
                onStopRecording={handleCancelRecording}
                onAcceptRecording={handleConfirmRecording}
                analyserNode={analyserNode ?? undefined}
                highlighted
                className="shrink-0 w-full"
              />

              {/* Mic button — floats centred below textarea */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <MicButton
                  pulse
                  isRecording={isRecording}
                  disabled={isProcessing || isFetchingFeedback}
                  onClick={handleMicClick}
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-[15px] items-start justify-end shrink-0 w-full">
              {isProcessing && (
                <span
                  className="text-sm text-[#727272] mr-2"
                  style={{ fontFamily: 'Noto Sans' }}
                >
                  Transcribing…
                </span>
              )}
              {isFetchingFeedback && (
                <span
                  className="text-sm text-[#727272] mr-2"
                  style={{ fontFamily: 'Noto Sans' }}
                >
                  {t('feedback_fetching')}
                </span>
              )}
              <Button
                variant="filled"
                state={isFeedbackEnabled ? 'default' : 'disabled'}
                iconPlacement="none"
                text={t('btn_get_feedback')}
                onClick={isFeedbackEnabled ? handleGetFeedback : undefined}
              />
              <Button
                variant="save"
                state={isSaveEnabled ? 'default' : 'disabled'}
                iconPlacement="none"
                text={t('btn_save')}
                onClick={isSaveEnabled ? handleSave : undefined}
              />
            </div>
          </div>

          {/* ── Right: feedback panel (empty state) ── */}
          <div className="bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] w-[360px] shrink-0 self-stretch">
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />
            <SmallDetailsText text={t('feedback_empty_state')} className="shrink-0" />
          </div>

        </div>
      </div>

    </MeetingShellLayout>
  );
}
