import { useState, useRef, useEffect } from 'react';
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
import { FEEDBACK_API } from '../config/api';
import type { FeedbackResult } from '../types/feedback';
import { startLiveTranscription, joinText, microphoneErrorMessage, type LiveTranscriptionSession } from '../utils/liveTranscription';

type EntryState = 'idle' | 'recording' | 'processing';

// Re-exported for the screens that historically imported the type from here.
export type { FeedbackResult } from '../types/feedback';

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
  const sttSessionRef    = useRef<LiveTranscriptionSession | null>(null);
  const sttBaseTextRef   = useRef<string>('');
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const updatedTextRef   = useRef<string>(discussionText);
  const fileInputRef     = useRef<HTMLInputElement | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    updatedTextRef.current = discussionText;
  }, [discussionText]);

  // Abort any live session on unmount
  useEffect(() => {
    return () => {
      sttSessionRef.current?.cancel();
      sttSessionRef.current = null;
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
      await handleConfirmRecording();
      return;
    }

    if (entryState !== 'idle') return;
    setSttError(null);

    // Text already in the field stays; the live transcript is appended after it.
    const base = discussionText;
    sttBaseTextRef.current = base;
    try {
      const session = await startLiveTranscription({
        locale: lang,
        onText: (committed, partial) => {
          const next = joinText(base, committed, partial);
          updatedTextRef.current = next;
          setDiscussionText(next);
        },
        onError: msg => setSttError(`Speech recognition error — ${msg}`),
      });
      sttSessionRef.current = session;
      analyserRef.current = session.analyser;
      setEntryState('recording');
    } catch (err) {
      setSttError(microphoneErrorMessage(err));
    }
  };

  // ── Cancel recording ─────────────────────────────────────────────────────
  const handleCancelRecording = async () => {
    const session = sttSessionRef.current;
    if (!session) return;

    session.cancel();
    sttSessionRef.current = null;
    analyserRef.current = null;

    // Discard whatever was transcribed during this session.
    const base = sttBaseTextRef.current;
    updatedTextRef.current = base;
    setDiscussionText(base);

    setEntryState('idle');
    setSttError(null);
  };

  // ── Confirm recording — flush the live transcript ────────────────────────
  const handleConfirmRecording = async () => {
    const session = sttSessionRef.current;
    if (!session) return;

    setEntryState('processing');
    setSttError(null);

    try {
      await session.stop();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSttError(`Speech recognition failed — ${msg}`);
    }

    sttSessionRef.current = null;
    analyserRef.current = null;
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
        status: 'feedback',
        message: null,
        feedback: [
          { text: 'Add the date, location and number of participants of the Swachh Saturday village cleanliness activities.', highlight: 'date, location and number of participants' },
          { text: 'Mention what village sanitation work was carried out and who was responsible.', highlight: 'who was responsible' },
          { text: 'Record the date of the Onagalu Day observance and the activities conducted.', highlight: 'date of the Onagalu Day observance' },
          { text: 'Name the authority or circular that issued the COVID-19 JN.1 advisory.', highlight: 'authority or circular' },
          { text: 'List the specific precautionary measures that were communicated to members.', highlight: 'specific precautionary measures' },
          { text: 'Good detail on the range of topics covered in the meeting.', highlight: null },
        ],
        rewrite: 'Information was provided regarding the Swachh Saturday village cleanliness activities conducted on [date] in [location/ward] with [number of participants] participants, the Onagalu Day observance held on [date], and the COVID-19 JN.1 precautionary measures advised by [name of authority/circular].',
      };
      setIsFetchingFeedback(false);
      navigate('/mom-entry/simple-v4', { state: { agenda, discussionText, feedbackResult, feedbackCompleted: true, meetingId } });
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
      navigate('/mom-entry/simple-v4', {
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
