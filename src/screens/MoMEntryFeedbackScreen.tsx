import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import type { HighlightSpan } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { STT_API, FEEDBACK_API, TRANSLATE_API } from '../config/api';

type MainEntryState = 'idle' | 'recording' | 'processing';
type CardEntryState = 'idle' | 'recording' | 'processing';

interface CardState {
  id: string;
  text: string;
  type: 'add-missing-details' | 'rephrase';
  dismissed: boolean;
  accepted: boolean;
  /** Editable text — pre-populated with the API suggestion */
  inputText: string;
  /** The phrase in discussionText this card refers to (null if no span) */
  spanText: string | null;
  recordingState: CardEntryState;
  sttError: string | null;
}

/**
 * Classify each feedback string by its trailing character:
 * - Sentence starters ending with "—" or "–" → add-missing-details (secretary completes it)
 * - Complete improved sentences → rephrase
 */
function inferType(text: string): 'add-missing-details' | 'rephrase' {
  const trimmed = text.trimEnd();
  if (trimmed.endsWith('—') || trimmed.endsWith('–') || trimmed.endsWith('...')) {
    return 'add-missing-details';
  }
  return 'rephrase';
}

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

  // Main textarea state
  const [discussionText, setDiscussionText]     = useState(routeState?.discussionText ?? '');
  const [mainEntryState, setMainEntryState]     = useState<MainEntryState>('idle');
  const [mainSttError, setMainSttError]         = useState<string | null>(null);
  const [feedbackError, setFeedbackError]       = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [mainAnalyserNode, setMainAnalyserNode] = useState<AnalyserNode | null>(null);
  const [actionOpen, setActionOpen]             = useState(false);
  const [selectedAction, setSelectedAction]     = useState<'action_option_approval' | 'action_option_discussion' | null>(null);
  const [isTranslating, setIsTranslating]           = useState(false);
  const prevLangRef = useRef<string>(lang);
  const mainMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mainAudioChunksRef   = useRef<Blob[]>([]);
  const mainAudioCtxRef      = useRef<AudioContext | null>(null);

  // Feedback cards state
  const [cards, setCards] = useState<CardState[]>(() => {
    const feedback = routeState?.feedbackResult?.feedback ?? [];
    const spans    = routeState?.feedbackResult?.spans ?? [];
    return feedback.map((text, i) => ({
      id:             `card-${i}`,
      text,
      type:           inferType(text),
      dismissed:      false,
      accepted:       false,
      inputText:      text,           // pre-populate with API suggestion
      spanText:       spans[i] ?? null,
      recordingState: 'idle' as CardEntryState,
      sttError:       null,
    }));
  });

  // Bidirectional linking — span-level: only one active card/span at a time
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Refs for smooth scroll-to-top when a span is clicked
  const feedbackListRef = useRef<HTMLDivElement>(null);
  const cardRefsMap     = useRef<Map<string, HTMLDivElement>>(new Map());

  // Per-card recording refs (keyed by card id)
  const cardMediaRecordersRef = useRef<Map<string, MediaRecorder>>(new Map());
  const cardAudioChunksRef    = useRef<Map<string, Blob[]>>(new Map());
  const cardAudioCtxRef       = useRef<Map<string, AudioContext>>(new Map());
  const [cardAnalysers, setCardAnalysers] = useState<Map<string, AnalyserNode | null>>(new Map());

  const visibleCards = cards.filter(c => !c.dismissed);

  const isMainRecording  = mainEntryState === 'recording';
  const isMainProcessing = mainEntryState === 'processing';
  const hasText          = discussionText.trim().length > 0;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const teardownMainAudio = useCallback(() => {
    mainAudioCtxRef.current?.close();
    mainAudioCtxRef.current = null;
    setMainAnalyserNode(null);
  }, []);

  const teardownCardAudio = useCallback((cardId: string) => {
    cardAudioCtxRef.current.get(cardId)?.close();
    cardAudioCtxRef.current.delete(cardId);
    setCardAnalysers(prev => { const m = new Map(prev); m.set(cardId, null); return m; });
  }, []);

  // ── Translate discussion text when language tab switches ─────────────────

  useEffect(() => {
    const prevLang = prevLangRef.current;
    prevLangRef.current = lang;
    if (prevLang === lang || !discussionText.trim()) return;

    const doTranslate = async () => {
      setIsTranslating(true);
      try {
        const res = await fetch(TRANSLATE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: discussionText, from_locale: prevLang, to_locale: lang }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data: { translation: string } = await res.json();
        setDiscussionText(data.translation);
        // Clear feedback cards — their spans reference the old-language text
        setCards([]);
        setActiveCardId(null);
      } catch {
        setMainSttError(t('translation_error'));
      } finally {
        setIsTranslating(false);
      }
    };
    doTranslate();
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCard = useCallback((id: string, updates: Partial<CardState>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  // ── Main mic ─────────────────────────────────────────────────────────────

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

  // ── Card mic ─────────────────────────────────────────────────────────────

  const handleCardMicClick = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.recordingState !== 'idle') return;
    updateCard(cardId, { sttError: null });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      updateCard(cardId, { sttError: 'Microphone access was denied. Please allow microphone access and try again.' });
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const mr = new MediaRecorder(stream, { mimeType });
    cardMediaRecordersRef.current.set(cardId, mr);
    cardAudioChunksRef.current.set(cardId, []);

    mr.ondataavailable = e => {
      if (e.data.size > 0) {
        const existing = cardAudioChunksRef.current.get(cardId) ?? [];
        cardAudioChunksRef.current.set(cardId, [...existing, e.data]);
      }
    };

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    cardAudioCtxRef.current.set(cardId, audioCtx);
    setCardAnalysers(prev => new Map(prev).set(cardId, analyser));

    mr.start();
    updateCard(cardId, { recordingState: 'recording' });
  };

  const handleCardCancelRecording = (cardId: string) => {
    const mr = cardMediaRecordersRef.current.get(cardId);
    if (!mr) return;
    mr.onstop = null;
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    cardMediaRecordersRef.current.delete(cardId);
    cardAudioChunksRef.current.set(cardId, []);
    teardownCardAudio(cardId);
    updateCard(cardId, { recordingState: 'idle' });
  };

  const handleCardConfirmRecording = (cardId: string) => {
    const mr = cardMediaRecordersRef.current.get(cardId);
    if (!mr) return;
    const card = cards.find(c => c.id === cardId);
    const textAtConfirm = card?.inputText ?? '';
    updateCard(cardId, { recordingState: 'processing' });

    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      cardMediaRecordersRef.current.delete(cardId);
      teardownCardAudio(cardId);

      const chunks = cardAudioChunksRef.current.get(cardId) ?? [];
      const mimeType = chunks[0]?.type ?? 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      cardAudioChunksRef.current.set(cardId, []);

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
          updateCard(cardId, { inputText: textAtConfirm + sep + data.transcription, recordingState: 'idle' });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          updateCard(cardId, { sttError: `Recording failed — ${msg}. Please try again.`, recordingState: 'idle' });
        }
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
  };

  // ── Card actions ─────────────────────────────────────────────────────────

  /** add-missing-details accept: append edited card text to discussionText */
  const handlePushText = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    // Strip trailing em-dash (sentence starter left unfinished) before pushing
    const textToAdd = card.inputText.trim().replace(/\s*[—–]\s*$/, '').trim();
    if (textToAdd) {
      const sep = discussionText.trim() ? ' ' : '';
      setDiscussionText(prev => prev + sep + textToAdd);
    }
    updateCard(cardId, { dismissed: true, accepted: true });
    if (activeCardId === cardId) setActiveCardId(null);
  };

  /** rephrase accept: replace spanText in discussionText with card text */
  const handleCardAccept = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card?.type === 'rephrase' && card.spanText) {
      setDiscussionText(prev => prev.replace(card.spanText!, card.text));
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

  // ── Span-level hover/click handlers (from TextAreaContainer highlights) ───

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

  // ── Get Feedback (re-fetch, updates cards in place) ──────────────────────

  const isFeedbackEnabled = hasText && mainEntryState === 'idle' && !isFetchingFeedback;

  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setIsFetchingFeedback(true);

    const buildCards = (feedbackResult: FeedbackResult): CardState[] => {
      const feedback = feedbackResult.feedback ?? [];
      const spans    = feedbackResult.spans ?? [];
      return feedback.map((text, i) => ({
        id:             `card-${i}`,
        text,
        type:           inferType(text),
        dismissed:      false,
        accepted:       false,
        inputText:      text,
        spanText:       spans[i] ?? null,
        recordingState: 'idle' as CardEntryState,
        sttError:       null,
      }));
    };

    // MOCK INTERCEPT — remove this block when API is live
    const MOCK_TEXT = 'Information was provided regarding Swachh Saturday village cleanliness activities, Onagalu Day observance, and COVID-19 JN.1 precautionary measures.';
    if (discussionText.trim() === MOCK_TEXT) {
      const feedbackResult: FeedbackResult = {
        category: 'Information / Intimation',
        category_reason: 'The agenda shares updates and announcements regarding sanitation, observances, and health precautions.',
        feedback: [
          'The following information was shared regarding Swachh Saturday village cleanliness activities —',
          'The following information was shared regarding Onagalu Day observance —',
          'The following information was shared regarding COVID-19 JN.1 precautionary measures —',
          'Members were informed about the actions to be taken for —',
          'Information was provided to the Gram Sabha regarding the status of —',
          'The Gram Sabha acknowledged the information and resolved that —',
        ],
        spans: [
          'Swachh Saturday village cleanliness activities',
          'Onagalu Day observance',
          'COVID-19 JN.1 precautionary measures',
          null,
          'Information was provided regarding',
          null,
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
          agenda_id:      agenda ? String(agenda.id) : '1',
          agenda_subject: agenda?.heading ?? '',
          mom_discussion: discussionText,
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

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (agenda) markCompleted(agenda.id);
    navigate('/');
  };

  // ── Left card border glow + span highlights ──────────────────────────────

  const activeCard = activeCardId ? visibleCards.find(c => c.id === activeCardId) : null;
  const leftCardStyle: React.CSSProperties = activeCard?.type === 'add-missing-details'
    ? { border: '1px solid #ff7468', boxShadow: '0 0 0 3px rgba(255,116,104,0.2)' }
    : activeCard?.type === 'rephrase'
      ? { border: '1px solid #613af5', boxShadow: '0 0 0 3px rgba(97,58,245,0.15)' }
      : { border: '1px solid rgba(106,62,49,0.24)' };

  const highlights: HighlightSpan[] = visibleCards
    .filter(c => c.spanText !== null && c.spanText !== undefined)
    .map(c => ({
      text:     c.spanText!,
      type:     c.type === 'add-missing-details' ? 'add-missing-details' : 'rephrase',
      cardId:   c.id,
      isActive: activeCardId === c.id,
    }));

  return (
    <MeetingShellLayout stepperActiveState={2}>

      {/* ── Outer white card ── */}
      <div className="bg-white flex flex-col gap-5 p-5 rounded-[15px]">

        <GoBackToPreviousPage
          label={t('go_back')}
          onClick={() => navigate('/')}
        />

        {/* Two-column layout */}
        <div className="flex gap-5 items-start">

          {/* ── Left: entry card — border glows based on active feedback card type ── */}
          <div className="bg-white flex flex-col gap-9 items-start pb-[30px] pt-5 px-5 rounded-[15px] flex-1 min-w-0" style={{ transition: 'border 0.2s, box-shadow 0.2s', ...leftCardStyle }}>

            {/* Card body */}
            <div className="flex flex-col gap-5 items-start shrink-0 w-full">
              <SectionHeading text={t('mom_entry_heading')} className="shrink-0" />

              <div className="flex flex-col gap-[25px] items-end shrink-0 w-full">

                {/* Agenda card */}
                <AgendaCard
                  stage="inside"
                  agendaNumber={agenda ? String(agenda.id) : '1'}
                  agendaHeading={agenda?.heading ?? 'Reading and reporting on the proceedings of the previous meeting'}
                  agendaDescription={agenda?.description ?? 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.'}
                  className="shrink-0 w-full"
                />

                <div className="flex flex-col gap-[25px] items-start shrink-0 w-full">

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
                            {(['action_option_approval', 'action_option_discussion'] as const).map(key => (
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

                    {(mainSttError ?? feedbackError) ? (
                      <InfoBox type="default" text={(mainSttError ?? feedbackError)!} className="shrink-0 w-full" />
                    ) : (
                      <InfoBox type="outlined" text={t('discussion_field_info')} className="shrink-0 w-full" />
                    )}

                    <TextAreaContainer
                      state={isMainRecording || isMainProcessing ? 'recording' : hasText ? 'filled' : 'default'}
                      placeholder={t('discussion_field_placeholder')}
                      value={discussionText}
                      onChange={!isMainRecording && !isMainProcessing && highlights.length === 0 ? setDiscussionText : undefined}
                      onStopRecording={handleMainCancelRecording}
                      onAcceptRecording={handleMainConfirmRecording}
                      analyserNode={mainAnalyserNode ?? undefined}
                      highlights={highlights.length > 0 ? highlights : undefined}
                      onSpanHoverEnter={handleSpanHoverEnter}
                      onSpanHoverLeave={handleSpanHoverLeave}
                      onSpanClick={handleSpanClick}
                      className="shrink-0 w-full"
                    />

                    {/* Mic button — floats centred below textarea */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                      <MicButton
                        pulse
                        isRecording={isMainRecording}
                        disabled={isMainProcessing || isTranslating}
                        onClick={handleMainMicClick}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-[15px] items-center justify-end shrink-0 w-full">
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
              {isTranslating && (
                <span className="text-sm text-[#727272] mr-2" style={{ fontFamily: 'Noto Sans' }}>
                  {t('translating')}
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

          {/* ── Right: feedback panel ──
               Wrapper has zero intrinsic content (absolute child) so it
               never contributes to the flex row height. self-stretch makes
               it exactly as tall as the left card. The absolute inner panel
               fills the wrapper and scrolls its cards list internally.     */}
          <div className="w-[360px] shrink-0 self-stretch relative">
            <div className="absolute inset-0 bg-[rgba(134,134,134,0.08)] flex flex-col pt-5 px-5 rounded-[15px] overflow-hidden">

              {/* Heading + count badge — fixed, does not scroll */}
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

              {/* Feedback cards list — flex-1 fills remaining panel height,
                   overflow-y-auto scrolls within that bounded space.
                   relative makes it the offsetParent for card wrappers
                   so offsetTop calculations in handleSpanClick are correct. */}
              {visibleCards.length > 0 && (
                <div
                  ref={feedbackListRef}
                  className="flex flex-col gap-[15px] items-start w-full overflow-y-auto pb-[30px] flex-1 relative"
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
                        type={card.type === 'add-missing-details' ? 'add-details' : 'rephrase'}
                        originalText={card.text}
                        spanText={card.spanText}
                        isActive={activeCardId === card.id}
                        onHoverEnter={() => setActiveCardId(card.id)}
                        onHoverLeave={() => setActiveCardId(prev => prev === card.id ? null : prev)}
                        onClick={() => handleCardClick(card.id)}
                        onAccept={() => handleCardAccept(card.id)}
                        onReject={() => handleCardReject(card.id)}
                        addedText={card.inputText}
                        onAddedTextChange={card.type === 'add-missing-details'
                          ? text => updateCard(card.id, { inputText: text })
                          : undefined}
                        onPushText={card.type === 'add-missing-details'
                          ? () => handlePushText(card.id)
                          : undefined}
                        isMicRecording={card.recordingState === 'recording'}
                        isMicProcessing={card.recordingState === 'processing'}
                        onMicClick={card.type === 'add-missing-details' && card.recordingState === 'idle'
                          ? () => handleCardMicClick(card.id)
                          : undefined}
                        onCancelRecording={() => handleCardCancelRecording(card.id)}
                        onConfirmRecording={() => handleCardConfirmRecording(card.id)}
                        micAnalyserNode={cardAnalysers.get(card.id) ?? undefined}
                        micError={card.sttError}
                        addPlaceholder={t('feedback_card_placeholder')}
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
