import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda, type AgendaItem } from '../context/AgendaContext';
import type { FeedbackResult } from './MoMEntryPostRecordingScreen';
import {
  GoBackToPreviousPage,
  SectionHeading,
  AgendaCard,
  QuestionFieldsSmall,
  Button,
  InfoBox,
  TextAreaContainer,
  MicButton,
  FeedbackCard,
} from '../components';
import type { HighlightSpan, Segment } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { STT_API, FEEDBACK_API } from '../config/api';

type MainEntryState = 'idle' | 'recording' | 'processing';

interface CardState {
  id: string;
  suggestion: string;
  type: 'fill-blanks' | 'rephrase';
  spanText: string | null;
  dismissed: boolean;
  accepted: boolean;
  segments: Segment[];
}

/** Detect language from text — checks for Kannada Unicode block (U+0C80–U+0CFF) */
function detectLang(text: string): 'en' | 'kn' {
  return /[\u0C80-\u0CFF]/.test(text) ? 'kn' : 'en';
}

// ── Segment parsing helpers ──────────────────────────────────────────────────

function parseSegments(text: string): Segment[] {
  const segs: Segment[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ kind: 'text', content: text.slice(last, m.index) });
    segs.push({ kind: 'blank', hint: m[1], value: '' });
    last = re.lastIndex;
  }
  if (last < text.length) segs.push({ kind: 'text', content: text.slice(last) });
  return segs;
}

function hasBlanks(text: string): boolean {
  return /\[[^\]]+\]/.test(text);
}

/** Assembles a sentence from segments, removing empty blanks and their leading prepositions. */
function assembleFromSegments(segments: Segment[]): string {
  const PREP = /\s+(by|on|at|to|within|for|of|with|from|and|as)\s*$/i;
  let out = '';
  for (const seg of segments) {
    if (seg.kind === 'text') {
      out += seg.content;
    } else if (seg.value.trim()) {
      out += seg.value.trim();
    } else {
      // Blank skipped — strip the trailing preposition so sentence stays grammatical
      out = out.replace(PREP, ' ');
    }
  }
  return out
    .replace(/\s*,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/,\s*\./g, '.')
    .trim();
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MoMEntryFeedbackScreen() {
  const { lang, t } = useLanguage();
  const { markCompleted } = useAgenda();
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = location.state as {
    agenda?: AgendaItem;
    discussionText?: string;
    feedbackResult?: FeedbackResult;
  } | null;

  const agenda = routeState?.agenda;

  const [discussionText, setDiscussionText]         = useState(routeState?.discussionText ?? '');
  const [mainEntryState, setMainEntryState]         = useState<MainEntryState>('idle');
  const [mainSttError, setMainSttError]             = useState<string | null>(null);
  const [feedbackError, setFeedbackError]           = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [mainAnalyserNode, setMainAnalyserNode]     = useState<AnalyserNode | null>(null);
  const [actionOpen, setActionOpen]                 = useState(false);
  const [selectedAction, setSelectedAction]         = useState<'action_option_approval' | 'action_option_discussion' | 'action_option_information' | null>(null);

  const mainMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mainAudioChunksRef   = useRef<Blob[]>([]);
  const mainAudioCtxRef      = useRef<AudioContext | null>(null);

  // ── Build initial cards from route state ─────────────────────────────────

  const buildCards = (feedbackResult: FeedbackResult): CardState[] => {
    const feedback = feedbackResult.feedback ?? [];
    const spans    = feedbackResult.spans ?? [];
    return feedback.map((text, i) => {
      const blanks = hasBlanks(text);
      return {
        id:         `card-${i}`,
        suggestion: text,
        type:       blanks ? 'fill-blanks' : 'rephrase',
        spanText:   spans[i] ?? null,
        dismissed:  false,
        accepted:   false,
        segments:   blanks ? parseSegments(text) : [],
      };
    });
  };

  const [cards, setCards] = useState<CardState[]>(() =>
    routeState?.feedbackResult ? buildCards(routeState.feedbackResult) : []
  );

  const [activeCardId, setActiveCardId]   = useState<string | null>(null);
  const feedbackListRef                   = useRef<HTMLDivElement>(null);
  const cardRefsMap                       = useRef<Map<string, HTMLDivElement>>(new Map());

  const visibleCards    = cards.filter(c => !c.dismissed);
  const isMainRecording = mainEntryState === 'recording';
  const isMainProcessing = mainEntryState === 'processing';
  const hasText         = discussionText.trim().length > 0;

  // ── Card helpers ──────────────────────────────────────────────────────────

  const updateCard = useCallback((id: string, updates: Partial<CardState>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const updateSegment = useCallback((cardId: string, segIndex: number, value: string) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const segments = c.segments.map((s, i) =>
        i === segIndex && s.kind === 'blank' ? { ...s, value } : s
      );
      return { ...c, segments };
    }));
  }, []);

  const teardownMainAudio = useCallback(() => {
    mainAudioCtxRef.current?.close();
    mainAudioCtxRef.current = null;
    setMainAnalyserNode(null);
  }, []);

  // ── Main mic ──────────────────────────────────────────────────────────────

  const handleMainMicClick = async () => {
    if (mainEntryState !== 'idle') return;
    setMainSttError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMainSttError('Microphone access was denied. Please allow microphone access and try again.');
      return;
    }
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const mr = new MediaRecorder(stream, { mimeType });
    mainMediaRecorderRef.current = mr;
    mainAudioChunksRef.current = [];
    mr.ondataavailable = e => { if (e.data.size > 0) mainAudioChunksRef.current.push(e.data); };
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    mainAudioCtxRef.current = audioCtx;
    setMainAnalyserNode(analyser);
    mr.start();
    setMainEntryState('recording');
  };

  const handleMainCancelRecording = () => {
    const mr = mainMediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = null;
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    mainMediaRecorderRef.current = null;
    mainAudioChunksRef.current = [];
    teardownMainAudio();
    setMainEntryState('idle');
  };

  const handleMainConfirmRecording = () => {
    const mr = mainMediaRecorderRef.current;
    if (!mr) return;
    setMainEntryState('processing');
    const textAtConfirm = discussionText;
    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      mainMediaRecorderRef.current = null;
      teardownMainAudio();
      const mimeType = mainAudioChunksRef.current[0]?.type ?? 'audio/webm';
      const blob = new Blob(mainAudioChunksRef.current, { type: mimeType });
      mainAudioChunksRef.current = [];
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
          const sep = textAtConfirm.trim() ? ' ' : '';
          setDiscussionText(textAtConfirm + sep + data.transcription);
          setMainEntryState('idle');
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setMainSttError(`Speech recognition failed — ${msg}. Please try again.`);
          setMainEntryState('idle');
        }
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
  };

  // ── Card actions ──────────────────────────────────────────────────────────

  /** fill-blanks: assemble filled sentence and append to discussion */
  const handlePushText = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const textToAdd = assembleFromSegments(card.segments);
    if (textToAdd) {
      const sep = discussionText.trim() ? ' ' : '';
      setDiscussionText(prev => prev + sep + textToAdd);
    }
    updateCard(cardId, { dismissed: true, accepted: true });
    if (activeCardId === cardId) setActiveCardId(null);
  };

  /** rephrase: replace the span in discussion text with the improved sentence */
  const handleCardAccept = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card?.type === 'rephrase' && card.spanText) {
      setDiscussionText(prev => prev.replace(card.spanText!, card.suggestion));
    }
    updateCard(cardId, { dismissed: true, accepted: true });
    if (activeCardId === cardId) setActiveCardId(null);
  };

  const handleCardReject = (cardId: string) => {
    updateCard(cardId, { dismissed: true });
    if (activeCardId === cardId) setActiveCardId(null);
  };

  const handleCardClick = (cardId: string) => {
    setActiveCardId(prev => prev === cardId ? null : cardId);
  };

  const handleSpanHoverEnter = (cardId: string) => setActiveCardId(cardId);
  const handleSpanHoverLeave = (cardId: string) => {
    setActiveCardId(prev => prev === cardId ? null : prev);
  };
  const handleSpanClick = (cardId: string) => {
    setActiveCardId(prev => prev === cardId ? null : cardId);
    const cardWrapperEl = cardRefsMap.current.get(cardId);
    const listEl = feedbackListRef.current;
    if (cardWrapperEl && listEl) {
      listEl.scrollTo({ top: cardWrapperEl.offsetTop, behavior: 'smooth' });
    }
  };

  // ── Get Feedback ──────────────────────────────────────────────────────────

  const isFeedbackEnabled = hasText && mainEntryState === 'idle' && !isFetchingFeedback;

  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setIsFetchingFeedback(true);

    // MOCK INTERCEPT — remove when API is live
    const MOCK_TEXT = 'Information was provided regarding Swachh Saturday village cleanliness activities, Onagalu Day observance, and COVID-19 JN.1 precautionary measures.';
    if (discussionText.trim() === MOCK_TEXT) {
      const feedbackResult: FeedbackResult = {
        category: 'Information / Intimation',
        category_reason: 'The agenda shares updates on sanitation, observances, and health.',
        feedback: [
          'With regard to Swachh Saturday village cleanliness activities, [details of activities] were undertaken in [ward/location] on [date].',
          'With regard to Onagalu Day observance, [information shared] was presented by [name of presenter] on [date] at [location/venue].',
          'With regard to COVID-19 JN.1 precautionary measures, [precautionary information] was communicated by [name of officer] and members were advised to [action to be taken].',
        ],
        spans: [
          'Swachh Saturday village cleanliness activities',
          'Onagalu Day observance',
          'COVID-19 JN.1 precautionary measures',
        ],
      };
      setCards(buildCards(feedbackResult));
      setActiveCardId(null);
      setIsFetchingFeedback(false);
      return;
    }
    // END MOCK INTERCEPT

    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_id:        agenda ? String(agenda.id) : '1',
          agenda_subject:   agenda?.heading || 'General Discussion',
          mom_discussion:   discussionText,
          feedback_language: detectLang(discussionText),
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Feedback API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }
      const feedbackResult: FeedbackResult = await res.json();
      setCards(buildCards(feedbackResult));
      setActiveCardId(null);
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

  // ── Highlights for TextAreaContainer ─────────────────────────────────────

  const highlights: HighlightSpan[] = visibleCards
    .filter(c => c.spanText !== null)
    .map(c => ({
      text:     c.spanText!,
      type:     c.type === 'fill-blanks' ? 'add-missing-details' : 'rephrase',
      cardId:   c.id,
      isActive: activeCardId === c.id,
    }));

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

            {/* Discussion field + mic */}
            <div className="flex flex-col gap-[6px] items-start shrink-0 w-full relative pb-[33px]">
              <QuestionFieldsSmall
                type="mandatory"
                questionText={t('discussion_field_label')}
                className="shrink-0"
              />

              {(mainSttError ?? feedbackError) ? (
                <InfoBox type="default" text={(mainSttError ?? feedbackError)!} className="shrink-0 w-full" />
              ) : (
                <InfoBox type="outlined" text={t('discussion_field_info')} className="shrink-0 w-full" />
              )}

              <TextAreaContainer
                state={isMainRecording || isMainProcessing ? 'recording' : hasText ? 'filled' : 'default'}
                placeholder={t('discussion_field_placeholder')}
                value={discussionText}
                onChange={setDiscussionText}
                onStopRecording={handleMainCancelRecording}
                onAcceptRecording={handleMainConfirmRecording}
                analyserNode={mainAnalyserNode ?? undefined}
                highlights={highlights}
                onSpanHoverEnter={handleSpanHoverEnter}
                onSpanHoverLeave={handleSpanHoverLeave}
                onSpanClick={handleSpanClick}
                highlighted
                className="shrink-0 w-full"
              />

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <MicButton
                  pulse
                  isRecording={isMainRecording}
                  disabled={isMainProcessing}
                  onClick={handleMainMicClick}
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-[15px] items-start justify-end shrink-0 w-full">
              {isMainProcessing && (
                <span className="text-sm text-[#727272] mr-2" style={{ fontFamily: 'Noto Sans' }}>
                  Transcribing…
                </span>
              )}
              {isFetchingFeedback && (
                <span className="text-sm text-[#727272] mr-2" style={{ fontFamily: 'Noto Sans' }}>
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
                state="default"
                iconPlacement="none"
                text={t('btn_save')}
                onClick={handleSave}
              />
            </div>
          </div>

          {/* ── Right: feedback panel ── */}
          <div className="w-[360px] shrink-0 self-stretch relative">
            <div className="absolute inset-0 bg-[rgba(134,134,134,0.08)] flex flex-col pt-5 px-5 rounded-[15px] overflow-hidden">

              <div className="flex gap-4 items-center shrink-0 flex-wrap pb-5">
                <SectionHeading text={t('feedback_heading')} className="shrink-0" />
                {visibleCards.length > 0 && (
                  <div className="bg-[#ff7468] flex items-center justify-center px-2 rounded-[5px] shrink-0">
                    <span
                      className="font-medium text-sm leading-6 text-white whitespace-nowrap"
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >
                      {visibleCards.length} {t('feedback_suggestions_label')}
                    </span>
                  </div>
                )}
                {visibleCards.length === 0 && (
                  <p
                    className="font-normal text-xs leading-[18px] text-[#3b3b3b] shrink-0 w-full"
                    style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                  >
                    {t('feedback_empty_state')}
                  </p>
                )}
              </div>

              {visibleCards.length > 0 && (
                <div
                  ref={feedbackListRef}
                  className="flex flex-col gap-[15px] items-start w-full overflow-y-auto pb-[30px] flex-1 relative pr-3"
                  style={{ scrollbarGutter: 'stable' }}
                >
                  {visibleCards.map(card => (
                    <div
                      key={card.id}
                      ref={el => {
                        if (el) cardRefsMap.current.set(card.id, el);
                        else cardRefsMap.current.delete(card.id);
                      }}
                      className="w-full shrink-0"
                    >
                      <FeedbackCard
                        type={card.type}
                        segments={card.segments}
                        onSegmentChange={(i, v) => updateSegment(card.id, i, v)}
                        originalText={card.suggestion}
                        isActive={activeCardId === card.id}
                        onHoverEnter={() => setActiveCardId(card.id)}
                        onHoverLeave={() => setActiveCardId(prev => prev === card.id ? null : prev)}
                        onClick={() => handleCardClick(card.id)}
                        onAccept={() => handleCardAccept(card.id)}
                        onReject={() => handleCardReject(card.id)}
                        onPushText={card.type === 'fill-blanks' ? () => handlePushText(card.id) : undefined}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

    </MeetingShellLayout>
  );
}
