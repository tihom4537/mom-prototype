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
                style={{ ...NS, color: '#b7131a', borderBottom: '2px solid #cccccc', paddingBottom: '1px' }}
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
            <Button variant="outlined" size="small" iconPlacement="none" text={rejectLabel} onClick={onReject} />
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

export default function MoMEntrySimpleScreenV3() {
  const { lang, t } = useLanguage();
  const { saveProceedings } = useAgenda();
  const { saveMeetingProceedings, meetingAgendas } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();

  type RouteState = { agenda?: AgendaItem; discussionText?: string; feedbackCompleted?: boolean; meetingId?: number } | null;
  const routeState = location.state as RouteState;
  const agenda = routeState?.agenda;
  const meetingId = routeState?.meetingId;

  const [discussionText,     setDiscussionText]     = useState(routeState?.discussionText ?? '');
  const [entryState,         setEntryState]         = useState<EntryState>('idle');
  const [sttError,           setSttError]           = useState<string | null>(null);
  const [feedbackError,      setFeedbackError]      = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [feedbackCompleted,  setFeedbackCompleted]  = useState(routeState?.feedbackCompleted ?? false);
  const [feedbackResult,     setFeedbackResult]     = useState<SimpleFeedbackResult | null>(null);
  const [rewriteAccepted,    setRewriteAccepted]    = useState(false);
  const [rewriteRejected,    setRewriteRejected]    = useState(false);
  const [goodToGo,           setGoodToGo]           = useState(false);
  const pcmRecorderRef = useRef<PcmAudioRecorder | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const wsClientRef    = useRef<WebSocketSTTClient | null>(null);
  const updatedTextRef = useRef<string>(discussionText);

  useEffect(() => { updatedTextRef.current = discussionText; }, [discussionText]);

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
  const isSaveEnabled     = hasText && !hasMissing && feedbackCompleted;

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

  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setRewriteAccepted(false);
    setRewriteRejected(false);
    setGoodToGo(false);
    setIsFetchingFeedback(true);

    const currentText = updatedTextRef.current.trim();

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
    <MeetingShellLayout stepperActiveState={2} showBack={false}>
      <div className="flex flex-col gap-[3px]">

        {/* Header bar */}
        <div className="bg-white pl-[20px] pr-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-full">
          <GoBackToPreviousPage
            label={t('go_back')}
            onClick={() => navigate('/agenda-list', { state: { meetingId } })}
          />
        </div>

        {/* Single column */}
        <div className="bg-white flex flex-col gap-[24px] p-[30px] rounded-bl-[15px] rounded-br-[15px]">

          <SectionHeading text={t('mom_entry_heading')} />

          <AgendaCard
            stage="subpage"
            agendaNumber={agenda ? String(agenda.id) : '1'}
            agendaHeading={agenda?.heading ?? 'Reading and reporting on the proceedings of the previous meeting'}
            agendaDescription={agenda?.description ?? 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.'}
            className="w-full"
          />

          {/* Discussion field */}
          <div className="flex flex-col gap-[6px] w-full">
            <QuestionFieldsSmall type="mandatory" questionText={t('discussion_field_label')} />
            {sttError ? (
              <p className="text-[12px] text-[#b7131a] w-full" style={NS}>
                We were unable to record your voice at the moment. Please try again.
              </p>
            ) : (
              <InfoBox type="plain" text={t('discussion_field_info')} className="w-full" />
            )}
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
              style={{ minHeight: '180px', maxHeight: '340px' }}
            />
            {feedbackError && (
              <p className="text-[12px] text-[#b7131a] w-full" style={NS}>{feedbackError}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-[15px] items-center justify-end w-full">
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

          {/* ── Feedback panel — below textarea ── */}
          {(fr || goodToGo) && (
            <div className="flex flex-col gap-[20px] bg-[rgba(134,134,134,0.08)] rounded-[15px] px-[24px] py-[20px] w-full">
              <SectionHeading text={t('feedback_heading')} />

              {/* Good to go banner */}
              {goodToGo && (
                <div className="flex items-center gap-[14px] rounded-[12px] px-[16px] py-[14px] w-full bg-white border border-[#ddd]">
                  <div className="rounded-full size-[32px] flex items-center justify-center shrink-0" style={{ background: '#2e7d32' }}>
                    <Icon name="check" size="small" color="#fff" />
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-semibold text-[14px]" style={{ ...NS, color: '#5e5e5e' }}>All details covered</span>
                    <span className="text-[12px]" style={{ ...NS, color: '#5e5e5e' }}>{t('feedback_good_to_go')}</span>
                  </div>
                </div>
              )}

              {fr && (
                <>
                  {fr.flag_message && (
                    <InfoBox type="default" text={fr.flag_message} className="w-full" />
                  )}

                  {/* Horizontal layout: pointers left, rewrite right */}
                  <div className="flex gap-[24px] items-start w-full overflow-hidden">

                    {/* Pointers */}
                    {fr.feedback.length > 0 && (
                      <div className="flex flex-col gap-[12px]" style={{ flex: '0 0 40%', minWidth: 0 }}>
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

                    {/* Vertical divider */}
                    {fr.rewrite && fr.feedback.length > 0 && (
                      <div className="w-px bg-[rgba(106,62,49,0.15)] self-stretch shrink-0" />
                    )}

                    {/* Rewrite card */}
                    {fr.rewrite && (
                      <div className="flex flex-col gap-[10px] overflow-hidden" style={{ flex: '1 1 60%', minWidth: 0 }}>
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

                  </div>
                </>
              )}

              {!fr && !goodToGo && (
                <SmallDetailsText text={t('feedback_empty_state')} />
              )}
            </div>
          )}

        </div>
      </div>
    </MeetingShellLayout>
  );
}
