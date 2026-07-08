import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Icon,
  FeedbackCard,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { STT_API, FEEDBACK_API } from '../config/api';
import { WebSocketSTTClient } from '../utils/websocketSttClient';
import { PcmAudioRecorder } from '../utils/pcmAudioRecorder';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

function parseSegments(text: string): import('../components/FeedbackCard').Segment[] {
  const segs: import('../components/FeedbackCard').Segment[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ kind: 'text', content: text.slice(last, m.index) });
    segs.push({ kind: 'blank', hint: m[1], value: '' });
    last = re.lastIndex;
  }
  if (last < text.length) segs.push({ kind: 'text', content: text.slice(last) });
  return segs;
}

interface SimpleFeedbackResult {
  category: string;
  category_reason: string;
  feedback: string[];
  highlights?: string[]; // parallel to feedback[], phrase to bold+highlight in each pointer
  rewrite?: string;
  flag_message?: string | null;
}

type EntryState = 'idle' | 'recording' | 'processing';

export default function MoMEntrySimpleScreenV2() {
  const { lang, t } = useLanguage();
  const { saveProceedings } = useAgenda();
  const { saveMeetingProceedings, meetingAgendas } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();

  type RouteState = { agenda?: AgendaItem; discussionText?: string; feedbackCompleted?: boolean; meetingId?: number } | null;
  const routeState = location.state as RouteState;
  const agenda = routeState?.agenda;
  const meetingId = routeState?.meetingId;

  const [discussionText, setDiscussionText] = useState(routeState?.discussionText ?? '');
  const [entryState, setEntryState] = useState<EntryState>('idle');
  const [sttError, setSttError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [feedbackCompleted, setFeedbackCompleted] = useState(routeState?.feedbackCompleted ?? false);
  const [feedbackResult, setFeedbackResult] = useState<SimpleFeedbackResult | null>(null);
  const [rewriteAccepted, setRewriteAccepted] = useState(false);
  const [rewriteSegments, setRewriteSegments] = useState<import('../components/FeedbackCard').Segment[]>([]);

  const pcmRecorderRef  = useRef<PcmAudioRecorder | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const wsClientRef     = useRef<WebSocketSTTClient | null>(null);
  const updatedTextRef  = useRef<string>(discussionText);
  const leftColRef      = useRef<HTMLDivElement>(null);
  const rightColRef     = useRef<HTMLDivElement>(null);
  const gridRef         = useRef<HTMLDivElement>(null);

  // Keep ref in sync
  useEffect(() => { updatedTextRef.current = discussionText; }, [discussionText]);

  // Sync right column height to left column
  useEffect(() => {
    const left  = leftColRef.current;
    const right = rightColRef.current;
    const grid  = gridRef.current;
    if (!left || !right || !grid) return;
    const sync = () => {
      const gridRect   = grid.getBoundingClientRect();
      const availableH = window.innerHeight - gridRect.top - 30 - 30 - 24;
      const leftH      = left.getBoundingClientRect().height;
      const targetH    = Math.max(leftH, availableH);
      left.style.minHeight  = `${availableH}px`;
      right.style.height    = `${targetH}px`;
    };
    const ro = new ResizeObserver(sync);
    ro.observe(left);
    window.addEventListener('resize', sync);
    sync();
    return () => { ro.disconnect(); window.removeEventListener('resize', sync); };
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      const ws = wsClientRef.current;
      if (ws) ws.close().catch(() => {});
    };
  }, []);

  const teardownAudio = useCallback(() => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const isRecording  = entryState === 'recording';
  const isProcessing = entryState === 'processing';
  const hasText      = discussionText.trim().length > 0;
  const isFeedbackEnabled = hasText && entryState === 'idle' && !isFetchingFeedback;
  const isSaveEnabled     = hasText && feedbackCompleted;

  // ── Start recording ────────────────────────────────────────────────────────
  const handleMicClick = async () => {
    if (entryState !== 'idle') return;
    setSttError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setSttError('Microphone is not available. This feature requires a secure (HTTPS) connection.');
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
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
    } catch {
      setSttError('Failed to initialize audio recorder. Please check microphone access.');
      pcmRecorderRef.current = null;
    }
  };

  // ── Cancel recording ───────────────────────────────────────────────────────
  const handleCancelRecording = async () => {
    const recorder = pcmRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    pcmRecorderRef.current = null;
    teardownAudio();
    const ws = wsClientRef.current;
    if (ws) { try { await ws.close(); } catch {} wsClientRef.current = null; }
    setEntryState('idle');
    setSttError(null);
  };

  // ── Stop / confirm recording ───────────────────────────────────────────────
  const handleStopRecording = async () => {
    const recorder = pcmRecorderRef.current;
    if (!recorder) return;
    setEntryState('processing');
    setSttError(null);
    let wsClient: WebSocketSTTClient | null = null;
    try {
      wsClient = new WebSocketSTTClient(lang);
      wsClientRef.current = wsClient;
      await wsClient.connect();
      const audioData = recorder.stop();
      pcmRecorderRef.current = null;
      teardownAudio();
      if (audioData.length === 0) throw new Error('No audio data captured');

      let resolved = false;
      let resolvePromise: (() => void) | null = null;
      const transcriptPromise = new Promise<void>(res => { resolvePromise = res; });

      wsClient.on('transcript', (text: string) => {
        resolved = true;
        if (text.trim()) {
          const cur = updatedTextRef.current;
          const next = cur + (cur.trim() ? ' ' : '') + text;
          updatedTextRef.current = next;
          setDiscussionText(next);
        }
        resolvePromise?.();
      });
      wsClient.on('error', (msg: string) => { setSttError(`Speech recognition error: ${msg}`); });

      await wsClient.send(audioData);
      await wsClient.end();
      await Promise.race([
        transcriptPromise,
        new Promise<void>((_, rej) => setTimeout(() => { if (!resolved) rej(new Error('Transcript response timeout')); }, 60000)),
      ]);
      await wsClient.close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSttError(`Speech recognition failed — ${msg}. Please try again or type your notes.`);
      if (wsClient) { try { await wsClient.close(); } catch {} }
      const rec = pcmRecorderRef.current;
      if (rec) { rec.stop(); pcmRecorderRef.current = null; teardownAudio(); }
    }
    wsClientRef.current = null;
    setEntryState('idle');
  };

  // ── Get Feedback ──────────────────────────────────────────────────────────
  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setRewriteAccepted(false);
    setIsFetchingFeedback(true);

    // MOCK — type "test feedback" to trigger
    if (discussionText.trim().toLowerCase() === 'test feedback') {
      await new Promise(r => setTimeout(r, 800));
      if (lang === 'kn') {
        setFeedbackResult({
          category: 'ಮೂಲಸೌಕರ್ಯ',
          category_reason: 'ಕಾರ್ಯಸೂಚಿ ಭೌತಿಕ ಮೂಲಸೌಕರ್ಯ ಅಭಿವೃದ್ಧಿಗೆ ಸಂಬಂಧಿಸಿದೆ.',
          feedback: [
            'ಜಿಲ್ಲಾ ಕಚೇರಿಗೆ ಅಂದಾಜು ಸಲ್ಲಿಸಲು ನಿಖರವಾದ ಕಾಲಮಿತಿಯನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿ.',
            'ಅಂದಾಜು ತಯಾರಿಸಲು ನಿಯೋಜಿಸಲಾದ ಸದಸ್ಯರ ಹೆಸರುಗಳನ್ನು ದಾಖಲಿಸಿ.',
            'ಸಭೆಯಲ್ಲಿ ಚರ್ಚಿಸಿದ್ದರೆ ಅಂದಾಜು ವೆಚ್ಚದ ವ್ಯಾಪ್ತಿಯನ್ನು ಸೇರಿಸಿ.',
            'ದುರಸ್ತಿ ಅಗತ್ಯವಿರುವ ವಾರ್ಡ್ ಸಂಖ್ಯೆ ಅಥವಾ ಸ್ಥಳವನ್ನು ನಮೂದಿಸಿ.',
          ],
          highlights: [
            'ನಿಖರವಾದ ಕಾಲಮಿತಿಯನ್ನು',
            'ಸದಸ್ಯರ ಹೆಸರುಗಳನ್ನು',
            'ಅಂದಾಜು ವೆಚ್ಚದ ವ್ಯಾಪ್ತಿಯನ್ನು',
            'ವಾರ್ಡ್ ಸಂಖ್ಯೆ ಅಥವಾ ಸ್ಥಳವನ್ನು',
          ],
          rewrite: '[ವಾರ್ಡ್ ಸಂಖ್ಯೆ ಅಥವಾ ಸ್ಥಳ]ದ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ಗುಂಡಿಗಳ ಸಮಸ್ಯೆಯನ್ನು ಸದಸ್ಯರು ಚರ್ಚಿಸಿದರು. ರಸ್ತೆ ದುರಸ್ತಿಗಾಗಿ ಅಂದಾಜು ತಯಾರಿಸಿ ಜಿಲ್ಲಾ ಕಚೇರಿಗೆ [ಕಾಲಮಿತಿ]ರ ವೇಳೆಗೆ ಪ್ರಸ್ತಾವನೆ ಸಲ್ಲಿಸಲು ತೀರ್ಮಾನಿಸಲಾಯಿತು. [ನಿಯೋಜಿತ ಸದಸ್ಯರ ಹೆಸರು] ಅವರನ್ನು ಅಂದಾಜು ತಯಾರಿಸಲು ನಿಯೋಜಿಸಲಾಯಿತು. ಅಂದಾಜು ವೆಚ್ಚ [ಅಂದಾಜು ವೆಚ್ಚದ ವ್ಯಾಪ್ತಿ] ಎಂದು ಚರ್ಚಿಸಲಾಯಿತು, ದೃಢೀಕರಣಕ್ಕೆ ಒಳಪಟ್ಟಿದೆ.',
          flag_message: null,
        });
      } else {
        setFeedbackResult({
          category: 'Infrastructure',
          category_reason: 'Agenda pertains to physical infrastructure development.',
          feedback: [
            'Specify a concrete timeline for submitting the estimate to the district office.',
            'Document the names of members assigned to prepare the estimate.',
            'Include the estimated cost range if discussed during the meeting.',
            'Mention the ward number or location where the repair is needed.',
          ],
          highlights: [
            'concrete timeline',
            'names of members assigned',
            'estimated cost range',
            'ward number or location',
          ],
          rewrite: 'Members discussed the issue of potholes on the main street in [ward number or location]. It was resolved to prepare an estimate for road repair and submit a proposal to the district office by [concrete timeline]. [Names of members assigned] were assigned to prepare the estimate. The approximate cost was discussed as [estimated cost range], subject to confirmation.',
          flag_message: null,
        });
      }
      // parse segments for V2 editable card
      const rw = lang === 'kn'
        ? '[ವಾರ್ಡ್ ಸಂಖ್ಯೆ ಅಥವಾ ಸ್ಥಳ]ದ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ಗುಂಡಿಗಳ ಸಮಸ್ಯೆಯನ್ನು ಸದಸ್ಯರು ಚರ್ಚಿಸಿದರು. ರಸ್ತೆ ದುರಸ್ತಿಗಾಗಿ ಅಂದಾಜು ತಯಾರಿಸಿ ಜಿಲ್ಲಾ ಕಚೇರಿಗೆ [ಕಾಲಮಿತಿ]ರ ವೇಳೆಗೆ ಪ್ರಸ್ತಾವನೆ ಸಲ್ಲಿಸಲು ತೀರ್ಮಾನಿಸಲಾಯಿತು. [ನಿಯೋಜಿತ ಸದಸ್ಯರ ಹೆಸರು] ಅವರನ್ನು ಅಂದಾಜು ತಯಾರಿಸಲು ನಿಯೋಜಿಸಲಾಯಿತು. ಅಂದಾಜು ವೆಚ್ಚ [ಅಂದಾಜು ವೆಚ್ಚದ ವ್ಯಾಪ್ತಿ] ಎಂದು ಚರ್ಚಿಸಲಾಯಿತು, ದೃಢೀಕರಣಕ್ಕೆ ಒಳಪಟ್ಟಿದೆ.'
        : 'Members discussed the issue of potholes on the main street in [ward number or location]. It was resolved to prepare an estimate for road repair and submit a proposal to the district office by [concrete timeline]. [Names of members assigned] were assigned to prepare the estimate. The approximate cost was discussed as [estimated cost range], subject to confirmation.';
      setRewriteSegments(parseSegments(rw));
      setFeedbackCompleted(true);
      setIsFetchingFeedback(false);
      return;
    }
    // END MOCK

    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_id:         agenda ? String(agenda.id) : '1',
          agenda_subject:    agenda?.heading || 'General Discussion',
          mom_discussion:    discussionText,
          feedback_language: /[ಀ-೿]/.test(discussionText) ? 'kn' : 'en',
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Feedback API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }
      const result: SimpleFeedbackResult = await res.json();
      setFeedbackResult(result);
      if (result.rewrite) setRewriteSegments(parseSegments(result.rewrite));
      setFeedbackCompleted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFeedbackError(`Failed to get feedback — ${msg}. Please try again.`);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  // ── Accept rewrite — assemble filled segments ─────────────────────────────
  const handleAcceptRewrite = () => {
    const assembled = rewriteSegments
      .map(seg => (seg.kind === 'text' ? seg.content : seg.value.trim()))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (!assembled) return;
    setDiscussionText(assembled);
    updatedTextRef.current = assembled;
    setRewriteAccepted(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (agenda) {
      const hasUserAgendas = meetingId != null && (meetingAgendas[meetingId]?.length ?? 0) > 0;
      if (hasUserAgendas) saveMeetingProceedings(meetingId!, agenda.id, discussionText);
      else saveProceedings(agenda.id, discussionText);
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

        <div ref={gridRef} className="bg-white grid gap-[32px] p-[30px] rounded-bl-[15px] rounded-br-[15px]" style={{ gridTemplateColumns: '1fr 400px', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div ref={leftColRef} className="flex flex-col gap-[20px] min-w-0">

            <SectionHeading text={t('mom_entry_heading')} className="shrink-0" />

            <AgendaCard
              stage="subpage"
              agendaNumber={agenda ? String(agenda.id) : '1'}
              agendaHeading={agenda?.heading ?? 'Reading and reporting on the proceedings of the previous meeting'}
              agendaDescription={agenda?.description ?? 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.'}
              className="shrink-0 w-full"
            />

            {/* Discussion field */}
            <div className="flex flex-col gap-[6px] items-start w-full">
              <QuestionFieldsSmall type="mandatory" questionText={t('discussion_field_label')} className="shrink-0" />

              {sttError ? (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={NS}>
                  We were unable to record your voice at the moment. Please try again.
                </p>
              ) : (
                <InfoBox type="plain" text={t('discussion_field_info')} className="shrink-0 w-full" />
              )}

              <TextAreaContainer
                state={isRecording ? 'recording' : (isProcessing ? 'recording' : 'default')}
                placeholder={t('discussion_field_placeholder')}
                value={discussionText}
                onChange={v => { setDiscussionText(v); setRewriteAccepted(false); }}
                onMicClick={handleMicClick}
                onStopClick={handleStopRecording}
                analyserNode={analyserRef.current ?? undefined}
                isProcessing={isProcessing}
                className="w-full"
                style={{ minHeight: 'clamp(100px, calc(100vh - 760px), 400px)', maxHeight: '400px' }}
              />

              {feedbackError && (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={NS}>{feedbackError}</p>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-[15px] items-start justify-end shrink-0 w-full mt-[10px]">
              {isFetchingFeedback && (
                <span className="text-sm text-[#727272] mr-2" style={NS}>{t('feedback_fetching')}</span>
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

          {/* ── Right: feedback panel ── */}
          <div ref={rightColRef} className="bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] overflow-y-auto">
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />
            <div className="flex flex-col gap-[20px]">

            {!feedbackResult ? (
              <SmallDetailsText text={t('feedback_empty_state')} className="shrink-0" />
            ) : (
              <>
                {/* Flag message if present */}
                {feedbackResult.flag_message && (
                  <InfoBox type="default" text={feedbackResult.flag_message} className="shrink-0 w-full" />
                )}

                {/* Pointer list */}
                {feedbackResult.feedback.length > 0 && (
                  <div className="flex flex-col gap-[12px] shrink-0 w-full">
                    <span className="text-[13px] font-semibold text-[#6a3e31] leading-[18px]" style={NS}>
                      {t('feedback_pointers_heading')}
                    </span>
                    <ol className="flex flex-col gap-[10px] list-none m-0 p-0">
                      {feedbackResult.feedback.map((point, i) => {
                        const highlight = feedbackResult.highlights?.[i];
                        let content: React.ReactNode = point;
                        if (highlight) {
                          const idx = point.toLowerCase().indexOf(highlight.toLowerCase());
                          if (idx !== -1) {
                            content = (
                              <>
                                {point.slice(0, idx)}
                                <strong style={{ fontFamily: 'Noto Sans' }}>
                                  {point.slice(idx, idx + highlight.length)}
                                </strong>
                                {point.slice(idx + highlight.length)}
                              </>
                            );
                          }
                        }
                        return (
                          <li key={i} className="flex gap-[10px] items-start">
                            <span
                              className="shrink-0 w-[20px] h-[20px] rounded-full bg-[rgba(106,62,49,0.15)] flex items-center justify-center text-[#6a3e31] text-[11px] font-semibold mt-[1px]"
                              style={NS}
                            >
                              {i + 1}
                            </span>
                            <span className="text-[13px] text-[#212121] leading-[20px]" style={NS}>
                              {content}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                {/* Divider */}
                {feedbackResult.rewrite && feedbackResult.feedback.length > 0 && (
                  <div className="w-full h-px bg-[rgba(106,62,49,0.15)] shrink-0" />
                )}

                {/* Rewrite card */}
                {feedbackResult.rewrite && (
                  <div className="flex flex-col gap-[10px] shrink-0 w-full">
                    <span className="text-[12px] text-[#727272] leading-[18px]" style={NS}>
                      {t('feedback_rewrite_info')}
                    </span>
                    <FeedbackCard
                      type="fill-blanks"
                      tagOverride="suggested-rewrite"
                      segments={rewriteSegments}
                      onSegmentChange={(i, v) =>
                        setRewriteSegments(prev => prev.map((s, idx) =>
                          idx === i && s.kind === 'blank' ? { ...s, value: v } : s
                        ))
                      }
                      isActive={!rewriteAccepted}
                      onPushText={rewriteAccepted ? undefined : handleAcceptRewrite}
                      onReject={undefined}
                      hideFooter={rewriteAccepted}
                      confirmedMessage={rewriteAccepted ? t('feedback_rewrite_accepted') : undefined}
                      className="w-full"
                    />
                  </div>
                )}

              </>
            )}
            </div>
          </div>

        </div>
      </div>
    </MeetingShellLayout>
  );
}
