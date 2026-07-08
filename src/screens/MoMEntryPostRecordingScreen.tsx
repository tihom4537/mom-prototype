import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda, type AgendaItem } from '../context/AgendaContext';
import { useMeetings } from '../context/MeetingsContext';
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
import { STT_API, FEEDBACK_API } from '../config/api';
import { WebSocketSTTClient } from '../utils/websocketSttClient';
import { PcmAudioRecorder } from '../utils/pcmAudioRecorder';

type EntryState = 'idle' | 'recording' | 'processing';

export interface FeedbackResult {
  category: string;
  category_reason: string;
  feedback: string[];
  /** Parallel array: the exact phrase in discussionText each feedback item refers to (null if no span) */
  spans?: (string | null)[];
  /** Parallel array: mode for each feedback item — REPLACE | APPEND | REPHRASE */
  modes?: string[];
  /** Special flag when minutes need no changes or are invalid */
  flag?: 'good_to_go' | 'poor_quality' | 'agenda_copy' | 'mismatch' | string | null;
  /** Human-readable message to show when flag is set */
  flag_message?: string | null;
}

export default function MoMEntryPostRecordingScreen() {
  const { lang, t } = useLanguage();
  const { markCompleted, saveProceedings } = useAgenda();
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
  const [ocrLoading, setOcrLoading]                 = useState(false);
  const [ocrError, setOcrError]                     = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [feedbackCompleted, setFeedbackCompleted]   = useState(routeState?.feedbackCompleted ?? false);
  const pcmRecorderRef   = useRef<PcmAudioRecorder | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const wsClientRef      = useRef<WebSocketSTTClient | null>(null);
  const updatedTextRef   = useRef<string>(discussionText);
  const fileInputRef     = useRef<HTMLInputElement | null>(null);

  const teardownAudio = useCallback(() => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    updatedTextRef.current = discussionText;
  }, [discussionText]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      const wsClient = wsClientRef.current;
      if (wsClient) {
        wsClient.close().catch(err => console.error('[PostRecording] Cleanup error:', err));
        wsClientRef.current = null;
      }
      const recorder = pcmRecorderRef.current;
      if (recorder) {
        recorder.stop();
        pcmRecorderRef.current = null;
      }
    };
  }, []);

  const isRecording  = entryState === 'recording';
  const isProcessing = entryState === 'processing';
  const isIdle       = entryState === 'idle';
  const hasText      = discussionText.trim().length > 0;

  const isFeedbackEnabled = hasText && isIdle && !isFetchingFeedback;
  const isSaveEnabled     = hasText && feedbackCompleted;

  // ── Start recording ──────────────────────────────────────────────────────
  const handleMicClick = async () => {
    if (entryState === 'recording') {
      // Stop button clicked - process the recording
      console.log('[PostRecording] Stop button clicked - transitioning to process audio');
      await handleConfirmRecording();
      return;
    }

    if (entryState !== 'idle') return;
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

    const pcmRecorder = new PcmAudioRecorder();
    pcmRecorderRef.current = pcmRecorder;

    try {
      await pcmRecorder.start();
      setEntryState('recording');
      console.log('[PostRecording] PCM recording started');
    } catch (err) {
      console.error('[PostRecording] PCM recorder failed:', err);
      setSttError('Failed to initialize audio recorder. Please check microphone access.');
      pcmRecorderRef.current = null;
    }
  };

  // ── Cancel recording ─────────────────────────────────────────────────────
  const handleCancelRecording = async () => {
    const recorder = pcmRecorderRef.current;
    if (!recorder) return;

    recorder.stop();
    pcmRecorderRef.current = null;
    teardownAudio();

    const wsClient = wsClientRef.current;
    if (wsClient) {
      try {
        await wsClient.close();
      } catch (err) {
        console.error('[PostRecording] Error closing WebSocket:', err);
      }
      wsClientRef.current = null;
    }

    setEntryState('idle');
    setSttError(null);
  };

  // ── Confirm recording — calls WebSocket STT ──────────────────────────────
  const handleConfirmRecording = async () => {
    const recorder = pcmRecorderRef.current;
    if (!recorder) {
      console.error('[PostRecording] No recorder found!');
      return;
    }

    setEntryState('processing');
    setSttError(null);

    let wsClient: WebSocketSTTClient | null = null;

    try {
      const audioData = recorder.stop();
      pcmRecorderRef.current = null;
      teardownAudio();
      console.log('[PostRecording] Recording stopped. Audio data:', audioData.length, 'bytes');

      if (audioData.length === 0) {
        throw new Error('No audio data captured');
      }

      wsClient = new WebSocketSTTClient(lang);
      wsClientRef.current = wsClient;

      await wsClient.connect();
      console.log('[PostRecording] WebSocket connected');

      let transcriptReceived = false;
      let transcriptPromiseResolve: (() => void) | null = null;
      const transcriptPromise = new Promise<void>(resolve => {
        transcriptPromiseResolve = resolve;
      });

      wsClient.on('transcript', (text: string) => {
        console.log('[PostRecording] Transcript received:', text);
        transcriptReceived = true;
        if (text.trim()) {
          const newText = updatedTextRef.current + (updatedTextRef.current.trim() ? ' ' : '') + text;
          updatedTextRef.current = newText;
          setDiscussionText(newText);
        }
        if (transcriptPromiseResolve) {
          transcriptPromiseResolve();
          transcriptPromiseResolve = null;
        }
      });

      wsClient.on('error', (msg: string) => {
        console.error('[PostRecording] WebSocket error:', msg);
        setSttError(`Speech recognition error: ${msg}`);
      });

      console.log('[PostRecording] Sending audio...');
      await wsClient.send(audioData);
      console.log('[PostRecording] Audio sent. Sending end signal...');

      await wsClient.end();

      const transcriptTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => {
          console.error('[PostRecording] Transcript timeout');
          reject(new Error('Transcript response timeout'));
        }, 60000)
      );

      try {
        await Promise.race([transcriptPromise, transcriptTimeout]);
        console.log('[PostRecording] Transcript received successfully');
      } catch (timeoutErr) {
        console.error('[PostRecording] Promise race failed:', timeoutErr);
        if (!transcriptReceived) {
          console.warn('[PostRecording] Warning: Transcript event never fired');
        }
        throw timeoutErr;
      }

      if (wsClient) {
        await wsClient.close();
        console.log('[PostRecording] WebSocket closed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[PostRecording] Error:', msg);
      setSttError(`Speech recognition failed — ${msg}`);

      if (wsClient) {
        try {
          await wsClient.close();
        } catch (closeErr) {
          console.error('[PostRecording] Error closing WebSocket:', closeErr);
        }
      }
    }

    wsClientRef.current = null;
    setEntryState('idle');
  };

  // ── Scan Photo ───────────────────────────────────────────────────────────
  const handleScanPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrError(null);
    setOcrLoading(true);

    try {
      // Validate file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setOcrError('Please select a JPG or PNG image.');
        setOcrLoading(false);
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setOcrError('Image is too large. Maximum size is 5MB.');
        setOcrLoading(false);
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = (e.target?.result as string).split(',')[1];

          console.log('[PostRecording] Sending image to OCR endpoint...');
          const response = await fetch('/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64String,
              format: file.type,
            }),
          });

          if (!response.ok) {
            const error = await response.text().catch(() => '');
            throw new Error(`OCR API returned ${response.status}${error ? `: ${error}` : ''}`);
          }

          const result = await response.json();

          if (result.error) {
            setOcrError(result.error);
            setOcrLoading(false);
            return;
          }

          if (result.extracted_text.trim()) {
            const newText = discussionText + (discussionText.trim() ? ' ' : '') + result.extracted_text;
            setDiscussionText(newText);
            updatedTextRef.current = newText;
            console.log('[PostRecording] OCR text added:', result.extracted_text);
          } else {
            setOcrError('No text found in the image. Please try a clearer image.');
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.error('[PostRecording] OCR error:', msg);
          setOcrError(`Failed to extract text — ${msg}`);
        } finally {
          setOcrLoading(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        setOcrError('Failed to read the image file.');
        setOcrLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[PostRecording] Photo processing error:', msg);
      setOcrError(`Failed to process image — ${msg}`);
      setOcrLoading(false);
    }
  };

  // ── Get Feedback ─────────────────────────────────────────────────────────
  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
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

  // Determine the active error message to show (STT takes priority, then OCR, then feedback)
  const activeError = sttError ?? ocrError ?? feedbackError;

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

            {/* Discussion field + floating mic */}
            <div className="flex flex-col gap-[6px] items-start w-full">
              <QuestionFieldsSmall
                type="mandatory"
                questionText={t('discussion_field_label')}
                className="shrink-0"
              />

              {/* Error messages: STT or OCR */}
              {sttError || ocrError ? (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={{ fontFamily: 'Noto Sans' }}>
                  {sttError || ocrError}
                </p>
              ) : (
                <InfoBox
                  type="plain"
                  text={t('discussion_field_info')}
                  className="shrink-0 w-full"
                />
              )}

              <TextAreaContainer
                state={isRecording ? 'recording' : (isProcessing ? 'recording' : hasText ? 'filled' : 'default')}
                placeholder={t('discussion_field_placeholder')}
                value={discussionText}
                onChange={setDiscussionText}
                onMicClick={handleMicClick}
                onStopClick={handleMicClick}
                onScanPhoto={handleScanPhotoClick}
                scanPhotoLabel={t('btn_scan_photo')}
                analyserNode={analyserRef.current ?? undefined}
                isProcessing={isProcessing || ocrLoading}
                highlighted
                className="w-full"
                style={{ minHeight: 'clamp(100px, calc(100vh - 760px), 400px)', maxHeight: '400px' }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoSelected}
                style={{ display: 'none' }}
                aria-label="Scan photo"
              />

              {/* Feedback error — below textarea */}
              {feedbackError && (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={{ fontFamily: 'Noto Sans' }}>
                  {feedbackError}
                </p>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-[15px] items-start justify-end shrink-0 w-full mt-[10px]">
              {isFetchingFeedback && (
                <span
                  className="text-sm text-[#727272] mr-2"
                  style={{ fontFamily: 'Noto Sans' }}
                >
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

          {/* ── Right: feedback panel (empty state) ── */}
          <div className="bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] w-[360px] shrink-0 self-stretch overflow-y-auto">
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />
            <SmallDetailsText text={t('feedback_empty_state')} className="shrink-0" />
          </div>

        </div>
      </div>

    </MeetingShellLayout>
  );
}
