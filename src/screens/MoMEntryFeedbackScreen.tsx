import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda, type AgendaItem } from '../context/AgendaContext';
import { useMeetings } from '../context/MeetingsContext';
import { PcmAudioRecorder } from '../utils/pcmAudioRecorder';
import { WebSocketSTTClient } from '../utils/websocketSttClient';
import type { FeedbackResult } from './MoMEntryPostRecordingScreen';
import {
  GoBackToPreviousPage,
  SectionHeading,
  AgendaCard,
  QuestionFieldsSmall,
  Button,
  InfoBox,
  TextAreaContainer,
  FeedbackCard,
} from '../components';
import type { HighlightSpan, Segment } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { FEEDBACK_API } from '../config/api';
import { WebSocketSTTClient } from '../utils/websocketSttClient';

type MainEntryState = 'idle' | 'recording' | 'processing';
type CardRecordingState = 'idle' | 'recording' | 'processing';

interface CardState {
  id: string;
  suggestion: string;
  type: 'fill-blanks' | 'rephrase';
  mode: 'REPLACE' | 'APPEND' | 'REPHRASE';
  spanText: string | null;
  dismissed: boolean;
  accepted: boolean;
  segments: Segment[];
  inputText?: string;
  recordingState?: CardRecordingState;
  micError?: string | null;
}

/** Detect language from text — checks for Kannada Unicode block (U+0C80–U+0CFF) */
function detectLang(text: string): 'en' | 'kn' {
  return /[ಀ-೿]/.test(text) ? 'kn' : 'en';
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

/**
 * Finds the start and end indices of the sentence in `text` that contains `span`.
 * Sentence boundaries: start/end of text, newline, period, Kannada danda (।).
 * Returns null if the span is not found in the text.
 */
function findSentenceBounds(text: string, span: string): { start: number; end: number } | null {
  const spanIdx = text.indexOf(span);
  if (spanIdx === -1) return null;

  const BOUNDARY = /[.\n।]/;

  // Walk left from spanIdx to find sentence start
  let start = spanIdx;
  while (start > 0 && !BOUNDARY.test(text[start - 1])) {
    start--;
  }
  // Skip leading whitespace
  while (start < spanIdx && text[start] === ' ') start++;

  // Walk right from end of span to find sentence end (include the boundary char)
  let end = spanIdx + span.length;
  while (end < text.length && !BOUNDARY.test(text[end])) {
    end++;
  }
  // Include the boundary character (. or । or \n) if present
  if (end < text.length && BOUNDARY.test(text[end])) {
    end++;
  }

  return { start, end };
}

/**
 * Replaces the sentence containing `span` in `text` with `replacement`.
 * Falls back to appending if span not found.
 *
 * Special case: if the sentence is a comma-separated list, preserve list items.
 */
function replaceSentence(text: string, span: string | null, replacement: string): string {
  if (!span) return text.trim() ? text + ' ' + replacement : replacement;
  const bounds = findSentenceBounds(text, span);
  if (!bounds) return text.trim() ? text + ' ' + replacement : replacement;

  const spanEnd = text.indexOf(span) + span.length;
  const afterSpan = text.slice(spanEnd, bounds.end);
  const trimmedAfter = afterSpan.trim();

  if (trimmedAfter.startsWith(',') && trimmedAfter.replace(/,/g, '').trim().length > 20) {
    let skipTo = spanEnd;
    while (skipTo < bounds.end && (text[skipTo] === ',' || text[skipTo] === ' ')) skipTo++;
    const before    = text.slice(0, bounds.start).trimEnd();
    const remaining = text.slice(skipTo).trimStart();
    const result    = [before, replacement].filter(Boolean).join(' ');
    return remaining ? result + '\n' + remaining : result;
  }

  const before = text.slice(0, bounds.start).trimEnd();
  const after  = text.slice(bounds.end).trimStart();
  const parts  = [before, replacement, after].filter(Boolean);
  return parts.join(' ');
}

/**
 * Inserts `insertion` immediately after the sentence containing `span` in `text`.
 * Falls back to appending if span not found.
 */
function insertAfterSentence(text: string, span: string | null, insertion: string): string {
  if (!span) return text.trim() ? text + ' ' + insertion : insertion;
  const bounds = findSentenceBounds(text, span);
  if (!bounds) return text.trim() ? text + ' ' + insertion : insertion;
  const before = text.slice(0, bounds.end).trimEnd();
  const after  = text.slice(bounds.end).trimStart();
  const parts  = [before, insertion, after].filter(Boolean);
  return parts.join(' ');
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MoMEntryFeedbackScreen() {
  const { lang, t } = useLanguage();
  const { saveProceedings } = useAgenda();
  const { saveMeetingProceedings } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = location.state as {
    agenda?: AgendaItem;
    discussionText?: string;
    feedbackResult?: FeedbackResult;
    meetingId?: number;
  } | null;

  const agenda = routeState?.agenda;
  const meetingId = routeState?.meetingId;

  const [discussionText, setDiscussionText]         = useState(routeState?.discussionText ?? '');
  const [mainEntryState, setMainEntryState]         = useState<MainEntryState>('idle');
  const [mainSttError, setMainSttError]             = useState<string | null>(null);
  const [feedbackError, setFeedbackError]           = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [actionOpen, setActionOpen]                 = useState(false);
  const [selectedAction, setSelectedAction]         = useState<'action_option_approval' | 'action_option_discussion' | 'action_option_information' | null>(null);

  const mainPcmRecorderRef   = useRef<PcmAudioRecorder | null>(null);
  const mainAudioCtxRef      = useRef<AudioContext | null>(null);
  const mainAnalyserRef      = useRef<AnalyserNode | null>(null);
  const mainWsClientRef      = useRef<WebSocketSTTClient | null>(null);

  // Per-card recording state (one WebSocket + MediaRecorder per card)
  const cardWsClientsRef     = useRef<Map<string, WebSocketSTTClient>>(new Map());
  const cardMediaRecordersRef = useRef<Map<string, MediaRecorder>>(new Map());
  const cardAudioCtxRef      = useRef<Map<string, AudioContext>>(new Map());
  const cardAnalysersRef     = useRef<Map<string, AnalyserNode>>(new Map());

  // ── Build initial cards from route state ─────────────────────────────────

  const buildCards = (feedbackResult: FeedbackResult): CardState[] => {
    const feedback = feedbackResult.feedback ?? [];
    const spans    = feedbackResult.spans ?? [];
    const modes    = feedbackResult.modes ?? [];
    return feedback.map((text, i) => {
      const mode = ((modes[i] ?? 'REPLACE').toUpperCase()) as 'REPLACE' | 'APPEND' | 'REPHRASE';
      const isFill = mode !== 'REPHRASE' && hasBlanks(text);
      return {
        id:              `card-${i}`,
        suggestion:      text,
        type:            isFill ? 'fill-blanks' : 'rephrase',
        mode,
        spanText:        spans[i] ?? null,
        dismissed:       false,
        accepted:        false,
        segments:        isFill ? parseSegments(text) : [],
        inputText:       '',
        recordingState:  'idle',
        micError:        null,
      };
    });
  };

  const MOCK_FEEDBACK: FeedbackResult = {
    category: 'Multi-Topic / Miscellaneous',
    category_reason: 'The minutes cover multiple unrelated subjects.',
    feedback: [
      'Specify the exact number of beneficiaries identified under PM Awas Yojana — provide [count] and [ward name].',
      'Mention the name of the KUWSDB official contacted regarding water supply disruptions in [ward number].',
      'The sentence about MGNREGS job cards is unclear — rephrase to clarify whether applications were approved or pending review.',
      'Include the resolution number and date for the decision on caste and income certificate delays.',
    ],
    spans: [null, null, null, null],
    modes: ['APPEND', 'APPEND', 'REPHRASE', 'APPEND'],
    flag: null,
    flag_message: null,
  };

  const [cards, setCards] = useState<CardState[]>(() =>
    buildCards(routeState?.feedbackResult ?? MOCK_FEEDBACK)
  );

  const [flagMessage, setFlagMessage]     = useState<string | null>(
    routeState?.feedbackResult?.flag_message ?? null
  );
  const [activeCardId, setActiveCardId]   = useState<string | null>(null);
  const feedbackListRef                   = useRef<HTMLDivElement>(null);
  const cardRefsMap                       = useRef<Map<string, HTMLDivElement>>(new Map());

  const visibleCards    = cards.filter(c => !c.dismissed);
  const isMainRecording = mainEntryState === 'recording';
  const isMainProcessing = mainEntryState === 'processing';
  const hasText         = discussionText.trim().length > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cardWsClientsRef.current.forEach(wsClient => {
        wsClient.close().catch(() => {});
      });
      cardWsClientsRef.current.clear();

      cardAudioCtxRef.current.forEach(ctx => ctx.close());
      cardAudioCtxRef.current.clear();

      mainWsClientRef.current?.close().catch(() => {});
    };
  }, []);

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
    mainAnalyserRef.current = null;
  }, []);

  // ── Main mic ──────────────────────────────────────────────────────────────

  const handleMainMicClick = async () => {
    if (mainEntryState !== 'idle') return;
    setMainSttError(null);

    try {
      const pcmRecorder = new PcmAudioRecorder();
      mainPcmRecorderRef.current = pcmRecorder;

      await pcmRecorder.start();
      console.log('[Feedback] Main PCM recording started');

      const audioCtx = (pcmRecorder as any).audioContext;
      if (audioCtx) {
        mainAudioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        mainAnalyserRef.current = analyser;
      }

      setMainEntryState('recording');
    } catch (err) {
      const isNotAllowed = err instanceof DOMException && err.name === 'NotAllowedError';
      setMainSttError(isNotAllowed
        ? 'Microphone access was denied. Please allow microphone access and try again.'
        : 'Could not access the microphone. Please check your browser permissions.'
      );
    }
  };

  const handleMainCancelRecording = async () => {
    const pcmRecorder = mainPcmRecorderRef.current;
    if (pcmRecorder) {
      pcmRecorder.stop();
      mainPcmRecorderRef.current = null;
    }
    teardownMainAudio();

    const wsClient = mainWsClientRef.current;
    if (wsClient) {
      try {
        await wsClient.close();
      } catch (err) {
        console.error('[Feedback] Error closing main WS:', err);
      }
      mainWsClientRef.current = null;
    }

    setMainEntryState('idle');
    setMainSttError(null);
  };

  const handleMainConfirmRecording = async () => {
    const pcmRecorder = mainPcmRecorderRef.current;
    if (!pcmRecorder) return;

    setMainEntryState('processing');
    setMainSttError(null);

    try {
      const wavData = pcmRecorder.stop();
      mainPcmRecorderRef.current = null;
      teardownMainAudio();

      if (wavData.length === 0) {
        setMainSttError('No audio captured. Please try again.');
        setMainEntryState('idle');
        return;
      }

      console.log('[Feedback] Main recording stopped, wav size:', wavData.length);

      const wsClient = new WebSocketSTTClient(lang);
      mainWsClientRef.current = wsClient;

      const updatedTextRef = useRef(discussionText);

      wsClient.on('transcript', (text: string) => {
        if (text.trim()) {
          setDiscussionText(prev => {
            updatedTextRef.current = prev;
            const separator = prev.trim() ? ' ' : '';
            return prev + separator + text;
          });
        }
      });

      wsClient.on('error', (msg: string) => {
        console.error('[Feedback] Main WS error:', msg);
        setMainSttError(`Speech recognition error: ${msg}`);
      });

      await wsClient.connect();
      console.log('[Feedback] Main WebSocket connected');

      await wsClient.send(wavData);
      console.log('[Feedback] Main audio sent');

      await wsClient.end();
      console.log('[Feedback] Main end signal sent');

      const transcriptPromise = new Promise<void>(resolve => {
        const originalResolve = wsClient.on('close', () => resolve());
      });

      const transcriptTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Transcript timeout')), 60000)
      );

      try {
        await Promise.race([transcriptPromise, transcriptTimeout]);
      } catch (err) {
        console.error('[Feedback] Transcript wait error:', err);
      }

      try {
        await wsClient.close();
      } catch (err) {
        console.error('[Feedback] Error closing main WS:', err);
      }

      mainWsClientRef.current = null;
      setMainEntryState('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Feedback] Main recording setup error:', msg);
      setMainSttError(`Speech recognition setup failed — ${msg}`);
      setMainEntryState('idle');
      mainWsClientRef.current = null;

      const pcmRecorder = mainPcmRecorderRef.current;
      if (pcmRecorder) {
        pcmRecorder.stop();
        mainPcmRecorderRef.current = null;
        teardownMainAudio();
      }
    }
  };

  // ── Card recording handlers ───────────────────────────────────────────────

  const handleCardMicClick = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.type !== 'fill-blanks' || card.recordingState !== 'idle') return;

    updateCard(cardId, { micError: null, recordingState: 'recording' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      cardAudioCtxRef.current.set(cardId, audioCtx);

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      cardAnalysersRef.current.set(cardId, analyser);

      const wsClient = new WebSocketSTTClient(lang);
      cardWsClientsRef.current.set(cardId, wsClient);

      await wsClient.connect();
      console.log(`[Feedback] Card WS connected: ${cardId}`);

      wsClient.on('transcript', (text: string) => {
        if (text.trim()) {
          updateCard(cardId, {
            inputText: (prev = '') => prev + (prev?.trim() ? ' ' : '') + text,
          } as any);
        }
      });

      wsClient.on('error', (msg: string) => {
        updateCard(cardId, { micError: msg });
      });

      const mr = new MediaRecorder(stream);
      cardMediaRecordersRef.current.set(cardId, mr);

      mr.ondataavailable = async (e) => {
        if (e.data.size > 0 && wsClient.connected()) {
          try {
            await wsClient.send(e.data);
          } catch (err) {
            updateCard(cardId, { micError: 'Failed to send audio' });
          }
        }
      };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        cardMediaRecordersRef.current.delete(cardId);

        const ctx = cardAudioCtxRef.current.get(cardId);
        if (ctx) {
          ctx.close();
          cardAudioCtxRef.current.delete(cardId);
        }
        cardAnalysersRef.current.delete(cardId);

        try {
          if (wsClient.connected()) {
            await wsClient.end();
            await new Promise(resolve => setTimeout(resolve, 500));
            await wsClient.close();
          }
        } catch (err) {
          console.error(`[Feedback] Error closing card WS ${cardId}:`, err);
        }

        cardWsClientsRef.current.delete(cardId);
        updateCard(cardId, { recordingState: 'idle' });
      };

      mr.start(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      updateCard(cardId, {
        recordingState: 'idle',
        micError: msg === 'NotAllowedError' ? 'Mic access denied' : 'Failed to record'
      });

      const wsClient = cardWsClientsRef.current.get(cardId);
      if (wsClient) {
        wsClient.close().catch(() => {});
        cardWsClientsRef.current.delete(cardId);
      }
    }
  };

  const handleCardCancelRecording = async (cardId: string) => {
    const mr = cardMediaRecordersRef.current.get(cardId);
    if (!mr) return;

    mr.onstop = null;
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    cardMediaRecordersRef.current.delete(cardId);

    const ctx = cardAudioCtxRef.current.get(cardId);
    if (ctx) {
      ctx.close();
      cardAudioCtxRef.current.delete(cardId);
    }
    cardAnalysersRef.current.delete(cardId);

    const wsClient = cardWsClientsRef.current.get(cardId);
    if (wsClient) {
      try {
        await wsClient.close();
      } catch (err) {
        console.error(`[Feedback] Error closing card WS ${cardId}:`, err);
      }
      cardWsClientsRef.current.delete(cardId);
    }

    updateCard(cardId, { recordingState: 'idle', micError: null });
  };

  const handleCardConfirmRecording = (cardId: string) => {
    const mr = cardMediaRecordersRef.current.get(cardId);
    if (!mr) return;

    updateCard(cardId, { recordingState: 'processing' });
    mr.stop();
  };

  const handleCardInputChange = (cardId: string, text: string) => {
    updateCard(cardId, { inputText: text });
  };

  // ── Card actions ──────────────────────────────────────────────────────────

  const handlePushText = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    let textToPush: string;
    if (card.type === 'fill-blanks') {
      textToPush = card.inputText?.trim() || assembleFromSegments(card.segments);
    } else {
      textToPush = card.suggestion;
    }

    if (textToPush) {
      if (card.mode === 'REPLACE') {
        setDiscussionText(prev => replaceSentence(prev, card.spanText, textToPush));
      } else {
        setDiscussionText(prev => insertAfterSentence(prev, card.spanText, textToPush));
      }
    }
    updateCard(cardId, { dismissed: true, accepted: true });
    if (activeCardId === cardId) setActiveCardId(null);
  };

  const handleCardAccept = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card?.type === 'rephrase') {
      setDiscussionText(prev => replaceSentence(prev, card.spanText, card.suggestion));
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
    setFlagMessage(null);
    setIsFetchingFeedback(true);

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
        modes: ['APPEND', 'APPEND', 'APPEND'],
        flag: null,
        flag_message: null,
      };
      setCards(buildCards(feedbackResult));
      setActiveCardId(null);
      setIsFetchingFeedback(false);
      return;
    }

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
        throw new Error(`API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }
      const feedbackResult: FeedbackResult = await res.json();
      setFlagMessage(feedbackResult.flag_message ?? null);
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
    if (agenda) {
      if (meetingId != null) {
        saveMeetingProceedings(meetingId, agenda.id, discussionText);
      } else {
        saveProceedings(agenda.id, discussionText);
      }
    }
    navigate('/agenda-list', { state: { meetingId } });
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
    <MeetingShellLayout stepperActiveState={2} showBack={false}>

      <div className="flex flex-col gap-[3px]">

        {/* ── Header bar ── */}
        <div className="bg-white pl-[20px] pr-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-full">
          <GoBackToPreviousPage
            label={t('go_back')}
            onClick={() => navigate('/mom-entry/post-recording', { state: { agenda, discussionText, meetingId } })}
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

              {mainSttError ? (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={{ fontFamily: 'Noto Sans' }}>
                  {mainSttError}
                </p>
              ) : (
                <InfoBox
                  type="plain"
                  text={t('discussion_field_info')}
                  className="shrink-0 w-full"
                />
              )}

              <TextAreaContainer
                state={isMainRecording ? 'recording' : 'filled'}
                placeholder={t('discussion_field_placeholder')}
                value={discussionText}
                onChange={setDiscussionText}
                onMicClick={handleMainMicClick}
                onStopClick={handleMainConfirmRecording}
                scanPhotoLabel={t('btn_scan_photo')}
                uploadAudioLabel={t('btn_upload_audio')}
                analyserNode={mainAnalyserRef.current ?? undefined}
                isProcessing={isMainProcessing}
                highlights={highlights}
                onSpanHoverEnter={handleSpanHoverEnter}
                onSpanHoverLeave={handleSpanHoverLeave}
                onSpanClick={handleSpanClick}
                highlighted
                className="w-full"
                style={{ minHeight: 'clamp(100px, calc(100vh - 760px), 400px)', maxHeight: '400px' }}
              />
            </div>

            {/* Flag message */}
            {flagMessage && (
              <InfoBox
                type="default"
                text={flagMessage}
                className="shrink-0 w-full"
              />
            )}

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
                state="default"
                iconPlacement="none"
                text={t('btn_save')}
                onClick={handleSave}
              />
            </div>
          </div>

          {/* ── Right: feedback cards ── */}
          <div className="bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] w-[360px] shrink-0 self-stretch overflow-y-auto">
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />

            {visibleCards.length > 0 && (
              <div
                ref={feedbackListRef}
                className="flex flex-col gap-[15px] items-start w-full pb-[30px] pr-3"
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
                      inputText={card.inputText ?? ''}
                      onInputChange={(text) => handleCardInputChange(card.id, text)}
                      recordingState={card.recordingState ?? 'idle'}
                      onMicClick={() => handleCardMicClick(card.id)}
                      onCancelRecording={() => handleCardCancelRecording(card.id)}
                      onConfirmRecording={() => handleCardConfirmRecording(card.id)}
                      micAnalyserNode={cardAnalysersRef.current.get(card.id) ?? undefined}
                      micError={card.micError ?? null}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            )}

            {visibleCards.length === 0 && (
              <p className="text-sm text-[#727272]" style={{ fontFamily: 'Noto Sans' }}>
                {t('feedback_empty_state')}
              </p>
            )}
          </div>

        </div>
      </div>

    </MeetingShellLayout>
  );
}
