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
  Tooltip,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { FEEDBACK_API } from '../config/api';
import { WebSocketSTTClient } from '../utils/websocketSttClient';
import { PcmAudioRecorder } from '../utils/pcmAudioRecorder';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

// ── Types ────────────────────────────────────────────────────────────────────

type Segment = { kind: 'text'; content: string } | { kind: 'blank'; hint: string };

function parseSegments(text: string): Segment[] {
  const segs: Segment[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ kind: 'text', content: text.slice(last, m.index) });
    segs.push({ kind: 'blank', hint: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) segs.push({ kind: 'text', content: text.slice(last) });
  return segs;
}

function hasUnfilledBlanks(text: string) {
  return /_{2,}/.test(text);
}

interface SimpleFeedbackResult {
  category: string;
  category_reason: string;
  feedback: string[];
  highlights?: string[];
  rewrite?: string;
  flag_message?: string | null;
}

type EntryState = 'idle' | 'recording' | 'processing';

// ── Rewrite card with styled blanks ─────────────────────────────────────────
// Blanks: grey box + red hint text above, non-editable

function RewriteCard({
  segments,
  accepted,
  rejected,
  onAccept,
  onReject,
  rejectLabel,
  acceptedLabel,
}: {
  segments: Segment[];
  accepted: boolean;
  rejected: boolean;
  onAccept: () => void;
  onReject: () => void;
  rejectLabel: string;
  acceptedLabel: string;
}) {
  const { t: tCard } = useLanguage();
  if (rejected) return null;
  return (
    <div className="rounded-[8px] overflow-hidden flex flex-col">
      {/* Tag */}
      <div className="bg-white px-[16px] pt-[14px] pb-[10px]">
        <div className="inline-flex items-center px-[5px] py-[3px] rounded-[5px] bg-[#e8f5e9]">
          <span className="font-medium text-xs leading-6 tracking-[0.15px] text-[#2e7d32]" style={NS}>
            Suggested Rewrite
          </span>
        </div>
      </div>
      {/* Body */}
      <div className="bg-white px-[16px] pb-[16px]">
        <p className="text-[13px] text-[#212121] leading-[26px]" style={NS}>
          {segments.map((seg, i) => {
            if (seg.kind === 'text') return <span key={i}>{seg.content}</span>;
            return (
              <span
                key={i}
                className="text-[13px] font-medium italic whitespace-nowrap"
                style={{
                  ...NS,
                  color: '#b7131a',
                  borderBottom: '2px solid #cccccc',
                  paddingBottom: '1px',
                }}
              >
                {seg.hint}
              </span>
            );
          })}
        </p>
      </div>
      {/* Footer */}
      {!accepted ? (
        <div className="bg-white flex flex-col px-[16px]">
          <div className="w-full h-px bg-[#eeeeee]" />
          <div className="py-[16px] flex justify-end gap-2">
            <Button
              variant="outlined"
              size="small"
              iconPlacement="none"
              text={rejectLabel}
              onClick={onReject}
            />
            <button
              type="button"
              onClick={onAccept}
              className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[16px] py-[8px] border-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-[#6a3e31] text-[12px] font-medium leading-5" style={NS}>{tCard('btn_accept')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white px-[16px] pb-[14px] flex items-center gap-[6px]">
          <span className="material-icons text-[16px] text-[#2e7d32]">check_circle</span>
          <span className="text-[12px] text-[#2e7d32] font-medium" style={NS}>{acceptedLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MoMEntrySimpleScreenV4() {
  const { lang, t } = useLanguage();
  const { saveProceedings } = useAgenda();
  const { saveMeetingProceedings, meetingAgendas } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();

  type RouteState = { agenda?: AgendaItem; discussionText?: string; feedbackCompleted?: boolean; meetingId?: number; isFeedbackApplicable?: boolean } | null;
  const routeState = location.state as RouteState;
  const agenda    = routeState?.agenda;
  const meetingId = routeState?.meetingId;
  // AI feedback only applies to GP General Body Meeting proceedings — set by AgendaListScreen.
  const isFeedbackApplicable = routeState?.isFeedbackApplicable ?? true;

  const [discussionText,    setDiscussionText]    = useState(routeState?.discussionText ?? '');
  const [entryState,        setEntryState]        = useState<EntryState>('idle');
  const [sttError,          setSttError]          = useState<string | null>(null);
  const [feedbackError,     setFeedbackError]     = useState<string | null>(null);
  const [isFetchingFeedback,setIsFetchingFeedback]= useState(false);
  const [feedbackCompleted, setFeedbackCompleted] = useState(routeState?.feedbackCompleted ?? false);
  const [feedbackResult,    setFeedbackResult]    = useState<SimpleFeedbackResult | null>(null);
  const [rewriteAccepted,   setRewriteAccepted]   = useState(false);
  const [rewriteRejected,   setRewriteRejected]   = useState(false);
  const [goodToGo,          setGoodToGo]          = useState(false);
  // Once feedback has been fetched, the right column hugs its own content height
  // instead of being clamped to the viewport, and the left column grows to match.
  const hasFeedbackContent = !!feedbackResult || goodToGo;
  const pcmRecorderRef = useRef<PcmAudioRecorder | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const wsClientRef    = useRef<WebSocketSTTClient | null>(null);
  const updatedTextRef = useRef<string>(discussionText);
  const leftColRef     = useRef<HTMLDivElement>(null);
  const rightColRef    = useRef<HTMLDivElement>(null);
  const gridRef        = useRef<HTMLDivElement>(null);
  // Everything in the left column above/below the textarea (heading, agenda
  // card, labels, footer buttons) — measured so the textarea can be sized to
  // exactly fill the remainder needed to match the feedback column's height.
  const leftExtraTopRef    = useRef<HTMLDivElement>(null);
  const leftExtraBottomRef = useRef<HTMLDivElement>(null);
  // Post-feedback: the discussion textarea's height is set so the LEFT COLUMN'S
  // TOTAL height (heading + agenda card + labels + textarea + footer buttons)
  // matches the feedback column's natural content height — content beyond that
  // scrolls inside the textarea rather than growing the page.
  const [textareaHeight, setTextareaHeight] = useState<number | null>(null);

  useEffect(() => { updatedTextRef.current = discussionText; }, [discussionText]);

  // Before feedback: clamp both columns to fit the viewport (right column height
  // driven by left, or by available viewport space, whichever is taller) — the
  // discussion textarea fills that space, overflow scrolls inside it.
  // After feedback: right column hugs its own natural content height instead;
  // the discussion textarea's height is locked to match it (see textareaHeight).
  useEffect(() => {
    const left  = leftColRef.current;
    const right = rightColRef.current;
    const grid  = gridRef.current;
    if (!left || !right || !grid) return;

    if (hasFeedbackContent) {
      right.style.height = '';
      left.style.minHeight = '';
      const GAP = 20; // matches the left column's flex gap-[20px] on either side of the textarea
      // Defer to the next frame — right.style.height was just cleared above,
      // and the feedback cards may not have finished laying out yet this tick.
      let raf = 0;
      let raf2 = 0;
      const sync = () => {
        raf = requestAnimationFrame(() => {
          const rightH = right.getBoundingClientRect().height;
          const topH    = leftExtraTopRef.current?.getBoundingClientRect().height ?? 0;
          const bottomH = leftExtraBottomRef.current?.getBoundingClientRect().height ?? 0;
          setTextareaHeight(Math.max(100, rightH - topH - bottomH - GAP * 2));

          // Self-correct: the estimate above can be off by a few px (borders,
          // sub-pixel rounding). Measure the actual rendered left column after
          // it applies and nudge the textarea by the leftover delta.
          raf2 = requestAnimationFrame(() => {
            const leftH = left.getBoundingClientRect().height;
            const delta = rightH - leftH;
            if (Math.abs(delta) >= 1) {
              setTextareaHeight(prev => Math.max(100, (prev ?? 0) + delta));
            }
          });
        });
      };
      const ro = new ResizeObserver(sync);
      ro.observe(right);
      window.addEventListener('resize', sync);
      sync();
      return () => { cancelAnimationFrame(raf); cancelAnimationFrame(raf2); ro.disconnect(); window.removeEventListener('resize', sync); };
    }

    setTextareaHeight(null);
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
  }, [hasFeedbackContent]);

  useEffect(() => {
    return () => { wsClientRef.current?.close().catch(() => {}); };
  }, []);

  const teardownAudio = useCallback(() => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const isRecording  = entryState === 'recording';
  const isProcessing = entryState === 'processing';
  const hasText      = discussionText.trim().length > 0;
  const hasMissing   = hasUnfilledBlanks(discussionText);
  const isFeedbackEnabled = hasText && entryState === 'idle' && !isFetchingFeedback;
  // Save blocked while unfilled blanks (underscores) remain in text.
  // When feedback isn't applicable to this meeting type, saving doesn't require a feedback round.
  const isSaveEnabled = hasText && !hasMissing && (isFeedbackApplicable ? feedbackCompleted : true);

  // ── Mic ───────────────────────────────────────────────────────────────────
  const handleMicClick = async () => {
    if (entryState !== 'idle') return;
    setSttError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setSttError('Microphone is not available. This feature requires a secure (HTTPS) connection.');
      return;
    }
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (err) {
      const isNotAllowed = err instanceof DOMException && err.name === 'NotAllowedError';
      setSttError(isNotAllowed
        ? 'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
        : 'Could not access the microphone. Please check your browser permissions and try again.'
      );
      return;
    }
    const pcmRecorder = new PcmAudioRecorder();
    pcmRecorderRef.current = pcmRecorder;
    try { await pcmRecorder.start(); setEntryState('recording'); }
    catch { setSttError('Failed to initialize audio recorder.'); pcmRecorderRef.current = null; }
  };

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
        new Promise<void>((_, rej) => setTimeout(() => { if (!resolved) rej(new Error('Timeout')); }, 60000)),
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

  // ── Feedback ──────────────────────────────────────────────────────────────
  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setRewriteAccepted(false);
    setRewriteRejected(false);
    setGoodToGo(false);
    setIsFetchingFeedback(true);

    const currentText = updatedTextRef.current.trim();

    // Mock trigger
    if (currentText.toLowerCase() === 'test feedback') {
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
          highlights: ['ನಿಖರವಾದ ಕಾಲಮಿತಿಯನ್ನು', 'ಸದಸ್ಯರ ಹೆಸರುಗಳನ್ನು', 'ಅಂದಾಜು ವೆಚ್ಚದ ವ್ಯಾಪ್ತಿಯನ್ನು', 'ವಾರ್ಡ್ ಸಂಖ್ಯೆ ಅಥವಾ ಸ್ಥಳವನ್ನು'],
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
          highlights: ['concrete timeline', 'names of members assigned', 'estimated cost range', 'ward number or location'],
          rewrite: 'Members discussed the issue of potholes on the main street in [ward number or location]. It was resolved to prepare an estimate for road repair and submit a proposal to the district office by [concrete timeline]. [Names of members assigned] were assigned to prepare the estimate. The approximate cost was discussed as [estimated cost range], subject to confirmation.',
          flag_message: null,
        });
      }
      setFeedbackCompleted(true);
      setIsFetchingFeedback(false);
      return;
    }

    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_id:         agenda ? String(agenda.id) : '1',
          agenda_subject:    agenda?.heading || 'General Discussion',
          mom_discussion:    currentText,
          feedback_language: /[ಀ-೿]/.test(currentText) ? 'kn' : 'en',
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Feedback API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }
      const result: SimpleFeedbackResult = await res.json();
      // Good to go: API returned no feedback points and no rewrite
      if (result.feedback.length === 0 && !result.rewrite) {
        setGoodToGo(true);
        setFeedbackResult(null);
      } else {
        setGoodToGo(false);
        setFeedbackResult(result);
        setRewriteAccepted(false);
        setRewriteRejected(false);
      }
      setFeedbackCompleted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFeedbackError(`Failed to get feedback — ${msg}. Please try again.`);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const handleAcceptRewrite = () => {
    if (!feedbackResult?.rewrite) return;
    const withBlanks = feedbackResult.rewrite.replace(/\[([^\]]+)\]/g, (_, hint: string) =>
      '_'.repeat(Math.max(6, hint.length))
    );
    setDiscussionText(withBlanks);
    updatedTextRef.current = withBlanks;
    setRewriteAccepted(true);
  };

  const handleSave = () => {
    if (!isSaveEnabled) return;
    if (agenda) {
      const hasUserAgendas = meetingId != null && (meetingAgendas[meetingId]?.length ?? 0) > 0;
      if (hasUserAgendas) saveMeetingProceedings(meetingId!, agenda.id, discussionText);
      else saveProceedings(agenda.id, discussionText);
    }
    navigate('/agenda-list', { state: { meetingId } });
  };

  const rewriteSegments = feedbackResult?.rewrite ? parseSegments(feedbackResult.rewrite) : [];
  const fr = feedbackResult;

  return (
    <MeetingShellLayout stepperActiveState={2} showBack={false} showExitButton={false}>
      <div className="flex flex-col gap-[3px]">

        {/* Header bar */}
        <div className="bg-white pl-[20px] pr-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-full">
          <GoBackToPreviousPage
            label={t('go_back')}
            onClick={() => navigate('/agenda-list', { state: { meetingId } })}
          />
        </div>

        <div ref={gridRef} className="bg-white grid gap-[32px] p-[30px] rounded-bl-[15px] rounded-br-[15px]" style={{ gridTemplateColumns: isFeedbackApplicable ? '1fr 460px' : '1fr', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div ref={leftColRef} className="flex flex-col gap-[20px] min-w-0">

            <div ref={leftExtraTopRef} className="flex flex-col gap-[20px] w-full">
              <SectionHeading text={t('mom_entry_heading')} className="shrink-0" />

              <AgendaCard
                stage="subpage"
                agendaNumber={agenda ? String(agenda.id) : '1'}
                agendaHeading={agenda?.heading ?? 'Reading and reporting on the proceedings of the previous meeting'}
                agendaDescription={agenda?.description ?? 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.'}
                className="shrink-0 w-full"
              />

              {/* Discussion field label + info */}
              <div className="flex flex-col gap-[6px] items-start w-full mt-[20px]">
                <QuestionFieldsSmall type="mandatory" questionText={t('discussion_field_label')} className="shrink-0" />
                <InfoBox type="plain" text={t('discussion_field_info')} className="shrink-0 w-full" />
              </div>
            </div>

            <TextAreaContainer
              state={isRecording ? 'recording' : (isProcessing ? 'recording' : 'default')}
              placeholder={t('discussion_field_placeholder')}
              value={discussionText}
              onChange={v => { setDiscussionText(v); setRewriteAccepted(false); setGoodToGo(false); }}
              onMicClick={handleMicClick}
              onStopClick={handleStopRecording}
              analyserNode={analyserRef.current ?? undefined}
              isProcessing={isProcessing}
              className="w-full"
              style={textareaHeight != null
                ? { height: `${textareaHeight}px`, maxHeight: `${textareaHeight}px` }
                : { minHeight: 'clamp(100px, calc(100vh - 760px), 400px)', maxHeight: '400px' }}
            />

            {/* Footer buttons */}
            <div ref={leftExtraBottomRef} className="flex gap-[15px] items-start justify-end shrink-0 w-full mt-[10px]">
              {isFeedbackApplicable && (
                <Button
                  variant="outlined"
                  state={isFeedbackEnabled ? 'default' : 'disabled'}
                  iconPlacement="none"
                  text={t('btn_get_feedback')}
                  onClick={isFeedbackEnabled ? handleGetFeedback : undefined}
                />
              )}
              {/* Save — tooltip only when blanks remain */}
              {hasMissing ? (
                <Tooltip text={t('feedback_save_blocked_tooltip')} direction="top" dark>
                  <Button variant="filled" state="disabled" iconPlacement="none" text={t('btn_save')} />
                </Tooltip>
              ) : (
                <Button
                  variant="filled"
                  state={isSaveEnabled ? 'default' : 'disabled'}
                  iconPlacement="none"
                  text={t('btn_save')}
                  onClick={isSaveEnabled ? handleSave : undefined}
                />
              )}
            </div>


          </div>

          {/* ── Right: feedback panel — only for meeting types where AI feedback applies ── */}
          {isFeedbackApplicable && (
          <div ref={rightColRef} className={`bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] ${hasFeedbackContent ? '' : 'overflow-y-auto'}`}>
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />

            {/* Status messages — loading, errors */}
            {isFetchingFeedback && (
              <span className="text-[13px] text-[#727272]" style={NS}>{t('feedback_fetching')}</span>
            )}
            {sttError && (
              <p className="text-[12px] text-[#b7131a]" style={NS}>Voice recording failed. Please try again.</p>
            )}
            {feedbackError && (
              <p className="text-[12px] text-[#b7131a]" style={NS}>{feedbackError}</p>
            )}

            <div className="flex flex-col gap-[20px]">

              {!feedbackResult && !goodToGo && (
                <SmallDetailsText text={t('feedback_empty_state')} className="shrink-0" />
              )}
              {fr && (
                <>
                  {fr.flag_message && (
                    <InfoBox type="default" text={fr.flag_message ?? undefined} className="shrink-0 w-full" />
                  )}

                  {/* Pointer list */}
                  {fr.feedback.length > 0 && (
                    <div className="flex flex-col gap-[12px] shrink-0 w-full">
                      <span className="text-[13px] font-semibold text-[#6a3e31] leading-[18px]" style={NS}>
                        {t('feedback_pointers_heading')}
                      </span>
                      <ol className="flex flex-col gap-[10px] list-none m-0 p-0">
                        {fr.feedback.map((point, i) => {
                          const highlight = fr.highlights?.[i];
                          let content: React.ReactNode = point;
                          if (highlight) {
                            const idx = point.toLowerCase().indexOf(highlight.toLowerCase());
                            if (idx !== -1) {
                              content = (
                                <>
                                  {point.slice(0, idx)}
                                  <strong style={{ fontFamily: 'Noto Sans', color: '#b7131a' }}>
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
                  {fr.rewrite && fr.feedback.length > 0 && (
                    <div className="w-full h-px bg-[rgba(106,62,49,0.15)] shrink-0" />
                  )}

                  {/* Rewrite card — custom blank styling */}
                  {fr.rewrite && (
                    <div className="flex flex-col gap-[10px] shrink-0 w-full">
                      <span className="text-[12px] text-[#727272] leading-[18px]" style={NS}>
                        {t('feedback_rewrite_info')}
                      </span>
                      <RewriteCard
                        segments={rewriteSegments}
                        accepted={rewriteAccepted}
                        rejected={rewriteRejected}
                        onAccept={handleAcceptRewrite}
                        onReject={() => setRewriteRejected(true)}
                        rejectLabel={t('btn_reject')}
                        acceptedLabel={t('feedback_rewrite_accepted')}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Good to go banner */}
              {goodToGo && (
                <div className="flex items-center gap-[14px] rounded-[12px] px-[16px] py-[14px] w-full shrink-0 bg-white border border-[#ddd]">
                  <div className="rounded-full size-[32px] flex items-center justify-center shrink-0" style={{ background: '#2e7d32' }}>
                    <Icon name="check" size="small" color="#fff" />
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-semibold text-[14px]" style={{ ...NS, color: '#5e5e5e' }}>All details covered</span>
                    <span className="text-[12px]" style={{ ...NS, color: '#5e5e5e' }}>{t('feedback_good_to_go')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

        </div>
      </div>
    </MeetingShellLayout>
  );
}
