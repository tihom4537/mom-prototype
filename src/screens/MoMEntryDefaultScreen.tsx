import { useState, useRef, useCallback, useEffect } from 'react';
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
  TextAreaContainer,
  SmallDetailsText,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { FEEDBACK_API } from '../config/api';
import { WebSocketSTTClient } from '../utils/websocketSttClient';
import { PcmAudioRecorder } from '../utils/pcmAudioRecorder';

type EntryState = 'idle' | 'recording' | 'processing';

export default function MoMEntryDefaultScreen() {
  const { lang, t } = useLanguage();
  const { saveProceedings } = useAgenda();
  const { saveMeetingProceedings } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();

  type RouteState = { agenda?: AgendaItem; discussionText?: string; feedbackCompleted?: boolean; meetingId?: number } | null;
  const routeState = location.state as RouteState;
  const agenda = routeState?.agenda;
  const meetingId = routeState?.meetingId;

  const [discussionText, setDiscussionText]         = useState(routeState?.discussionText ?? '');
  const [entryState, setEntryState]                 = useState<EntryState>('idle');
  const [sttError, setSttError]                     = useState<string | null>(null);
  const [feedbackError, setFeedbackError]           = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [feedbackCompleted, setFeedbackCompleted]   = useState(routeState?.feedbackCompleted ?? false);
  const [actionOpen, setActionOpen]                 = useState(false);
  const [selectedAction, setSelectedAction]         = useState<'action_option_approval' | 'action_option_discussion' | 'action_option_information' | null>(null);

  const pcmRecorderRef   = useRef<PcmAudioRecorder | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const wsClientRef      = useRef<WebSocketSTTClient | null>(null);

  const teardownAudio = useCallback(() => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const isRecording      = entryState === 'recording';
  const isProcessing     = entryState === 'processing';
  const isIdle           = entryState === 'idle';
  const hasText          = discussionText.trim().length > 0;
  const isFeedbackEnabled = hasText && isIdle && !isFetchingFeedback;
  const isSaveEnabled     = hasText && feedbackCompleted;

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      const wsClient = wsClientRef.current;
      if (wsClient) {
        wsClient.close().catch(err => console.error('[MoM] Cleanup error:', err));
        wsClientRef.current = null;
      }
    };
  }, []);

  // ── Start recording ────────────────────────────────────────────────────────
  const handleMicClick = async () => {
    console.log('[MoM] handleMicClick called, entryState:', entryState);
    if (entryState !== 'idle') {
      console.log('[MoM] Ignoring click - not idle');
      return;
    }
    setSttError(null);

    let stream: MediaStream;
    if (!navigator.mediaDevices?.getUserMedia) {
      setSttError('Microphone is not available. This feature requires a secure (HTTPS) connection.');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const isNotAllowed = err instanceof DOMException && err.name === 'NotAllowedError';
      setSttError(isNotAllowed
        ? 'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        : 'Could not access the microphone. Please check your browser permissions and try again.'
      );
      return;
    }

    // Initialize PCM recorder for raw audio capture (WAV-compatible format)
    const pcmRecorder = new PcmAudioRecorder();
    pcmRecorderRef.current = pcmRecorder;

    try {
      await pcmRecorder.start();
      setEntryState('recording');
      console.log('[MoM] PCM recording started');
    } catch (err) {
      console.error('[MoM] PCM recorder failed:', err);
      setSttError('Failed to initialize audio recorder. Please check microphone access.');
      pcmRecorderRef.current = null;
    }
  };

  // ── Cancel recording ───────────────────────────────────────────────────────
  const handleCancelRecording = async () => {
    console.log('[MoM] handleCancelRecording called');
    const recorder = pcmRecorderRef.current;
    if (!recorder) return;

    recorder.stop();
    pcmRecorderRef.current = null;
    teardownAudio();

    // Close WebSocket if it's open
    const wsClient = wsClientRef.current;
    if (wsClient) {
      try {
        await wsClient.close();
      } catch (err) {
        console.error('[MoM] Error closing WebSocket:', err);
      }
      wsClientRef.current = null;
    }

    setEntryState('idle');
    setSttError(null);
  };

  // ── On stop button click — immediately process the recording ────────────────
  const handleStopRecording = async () => {
    console.log('[MoM] Stop button clicked - transitioning to confirm recording');
    // When user clicks stop, immediately trigger the confirmation flow
    // This processes the recorded audio and sends it to the server
    await handleConfirmRecording();
  };

  // ── Confirm recording — stream audio via WebSocket ──────────────────────────
  const handleConfirmRecording = async () => {
    console.log('[MoM] handleConfirmRecording called');
    const recorder = pcmRecorderRef.current;
    if (!recorder) {
      console.error('[MoM] No recorder found!');
      return;
    }

    setEntryState('processing');
    setSttError(null);

    let wsClient: WebSocketSTTClient | null = null;

    try {
      // Create and connect WebSocket client
      wsClient = new WebSocketSTTClient(lang);
      wsClientRef.current = wsClient;

      await wsClient.connect();
      console.log('[MoM] WebSocket connected');

      // Stop recording and get final audio FIRST (before setting up listeners)
      const audioData = recorder.stop();
      pcmRecorderRef.current = null;
      teardownAudio();
      console.log('[MoM] Recording stopped. Audio data:', audioData.length, 'bytes');
      console.log('[MoM] Audio type:', audioData.constructor.name);
      if (audioData.length === 0) {
        throw new Error('No audio data captured');
      }

      // Setup promise for waiting on transcript (MUST be created BEFORE sending)
      let transcriptReceived = false;
      let transcriptPromiseResolve: (() => void) | null = null;
      const transcriptPromise = new Promise<void>(resolve => {
        transcriptPromiseResolve = resolve;
      });

      // Register event listeners BEFORE sending audio
      wsClient.on('transcript', (text: string) => {
        console.log('[MoM] Transcript event fired with text:', text);
        transcriptReceived = true;
        if (text.trim()) {
          setDiscussionText(prev => {
            const separator = prev.trim() ? ' ' : '';
            return prev + separator + text;
          });
        }
        // Resolve promise immediately
        if (transcriptPromiseResolve) {
          transcriptPromiseResolve();
          transcriptPromiseResolve = null;
        }
      });

      wsClient.on('error', (msg: string) => {
        console.error('[MoM] WebSocket error event:', msg);
        setSttError(`Speech recognition error: ${msg}`);
      });

      // Send audio in chunks if large, or all at once if small
      console.log('[MoM] Sending audio data...', 'size:', audioData.length, 'type:', audioData.constructor.name);
      try {
        await wsClient.send(audioData);
        console.log('[MoM] Audio sent successfully. Sending end signal...');
      } catch (sendErr) {
        console.error('[MoM] Failed to send audio:', sendErr);
        throw sendErr;
      }

      // Signal end of stream
      await wsClient.end();
      console.log('[MoM] End signal sent. Waiting for transcript...');

      // Wait for transcript response from server (with longer timeout for REST API processing)
      const transcriptTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => {
          console.error('[MoM] Transcript timeout - no response after 60 seconds');
          reject(new Error('Transcript response timeout'));
        }, 60000)
      );

      try {
        await Promise.race([transcriptPromise, transcriptTimeout]);
        console.log('[MoM] Transcript received successfully');
      } catch (timeoutErr) {
        console.error('[MoM] Promise race failed:', timeoutErr);
        if (!transcriptReceived) {
          console.warn('[MoM] Warning: Transcript event never fired');
        }
        throw timeoutErr;
      }

      // Now safe to close the connection
      console.log('[MoM] Closing WebSocket...');
      if (wsClient) {
        await wsClient.close();
        console.log('[MoM] WebSocket closed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[MoM] Error in handleConfirmRecording:', msg);
      setSttError(`Speech recognition failed — ${msg}. Please try again or type your notes.`);
      setEntryState('idle');

      // Attempt to close the connection if still open
      if (wsClient) {
        try {
          await wsClient.close();
        } catch (closeErr) {
          console.error('[MoM] Error closing WebSocket:', closeErr);
        }
      }

      // Stop the recorder if it's still going
      const recorder = pcmRecorderRef.current;
      if (recorder) {
        recorder.stop();
        pcmRecorderRef.current = null;
        teardownAudio();
      }

      return;
    }

    wsClientRef.current = null;

    // Navigate to post-recording screen (only if successful)
    navigate('/mom-entry/post-recording', {
      state: { agenda, discussionText, meetingId },
    });
  };

  // ── Get Feedback ──────────────────────────────────────────────────────────
  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setSttError(null);
    setFeedbackCompleted(true);
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
      navigate('/mom-entry/feedback', { state: { agenda, discussionText, feedbackResult, feedbackCompleted: true, meetingId } });
      return;
    }
    // END MOCK INTERCEPT

    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_id:         agenda ? String(agenda.id) : '1',
          agenda_subject:    agenda?.heading || 'General Discussion',
          mom_discussion:    discussionText,
          feedback_language: /[\u0C80-\u0CFF]/.test(discussionText) ? 'kn' : 'en',
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Feedback API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }

      const feedbackResult: FeedbackResult = await res.json();
      navigate('/mom-entry/feedback', {
        state: { agenda, discussionText, feedbackResult, feedbackCompleted: true, meetingId },
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
      if (meetingId != null) {
        saveMeetingProceedings(meetingId, agenda.id, discussionText);
      } else {
        saveProceedings(agenda.id, discussionText);
      }
    }
    navigate('/agenda-list', { state: { meetingId } });
  };

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

            {/* Discussion field */}
            <div className="flex flex-col gap-[6px] items-start w-full">
              <QuestionFieldsSmall
                type="mandatory"
                questionText={t('discussion_field_label')}
                className="shrink-0"
              />

              {sttError ? (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={{ fontFamily: 'Noto Sans' }}>
                  We were unable to record your voice at the moment. Please try again in sometime.
                </p>
              ) : (
                <InfoBox
                  type="plain"
                  text={t('discussion_field_info')}
                  className="shrink-0 w-full"
                />
              )}

              <TextAreaContainer
                state={isRecording ? 'recording' : (isProcessing ? 'recording' : 'default')}
                placeholder={t('discussion_field_placeholder')}
                value={discussionText}
                onChange={setDiscussionText}
                onMicClick={handleMicClick}
                onStopClick={handleStopRecording}
                scanPhotoLabel={t('btn_scan_photo')}
                uploadAudioLabel={t('btn_upload_audio')}
                analyserNode={analyserRef.current ?? undefined}
                isProcessing={isProcessing}
                highlighted
                className="w-full"
                style={{ minHeight: 'clamp(100px, calc(100vh - 760px), 400px)', maxHeight: '400px' }}
              />

              {feedbackError && (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={{ fontFamily: 'Noto Sans' }}>
                  {feedbackError}
                </p>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-[15px] items-start justify-end shrink-0 w-full mt-[10px]">
              {isFetchingFeedback && (
                <span className="text-sm text-[#727272] mr-2" style={{ fontFamily: 'Noto Sans' }}>
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

          {/* ── Right: feedback card ── */}
          <div className="bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] w-[360px] shrink-0 self-stretch overflow-y-auto">
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />
            <SmallDetailsText text={t('feedback_empty_state')} className="shrink-0" />
          </div>

        </div>
      </div>

    </MeetingShellLayout>
  );
}
