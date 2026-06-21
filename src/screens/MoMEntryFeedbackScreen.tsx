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
  SmallDetailsText,
  Icon,
  MicButton,
  FeedbackCard,
  TextAreaContainer,
} from '../components';
import type { Segment } from '../components';
import { buildSegments, type HighlightSpan } from '../components/TextAreaContainer';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { STT_API, FEEDBACK_API } from '../config/api';
import {
  classifyAgenda,
  CATEGORY_FIELDS,
  flattenProceedings,
  parseProceedings,
  type StructuredProceedings,
} from '../utils/agendaClassifier';

type FieldRecordingState = 'idle' | 'recording' | 'processing';
type CardRecordingState = 'idle' | 'recording' | 'processing';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface CardState {
  id: string;
  suggestion: string;
  type: 'fill-blanks' | 'rephrase';
  mode: 'REPLACE' | 'APPEND' | 'REPHRASE';
  spanText: string | null;
  spanField: string | null;
  dismissed: boolean;
  segments: Segment[];
  recordingState: CardRecordingState;
  micError: string | null;
}

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

function assembleFromSegments(segments: Segment[]): string {
  return segments
    .map(seg => (seg.kind === 'text' ? seg.content : seg.value.trim()))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function MoMEntryFeedbackScreen() {
  const { lang, t } = useLanguage();
  const { saveProceedings } = useAgenda();
  const { saveMeetingProceedings, meetingAgendas } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();

  type RouteState = {
    agenda?: AgendaItem;
    discussionText?: string;
    structuredProceedings?: StructuredProceedings;
    feedbackResult?: FeedbackResult;
    feedbackCompleted?: boolean;
    meetingId?: number;
    legacy?: boolean;
  } | null;
  const routeState = location.state as RouteState;
  const agenda = routeState?.agenda;
  const meetingId = routeState?.meetingId;
  const isLegacy = routeState?.legacy === true;

  // Legacy-mode state (plain textarea, not structured fields)
  const [legacyText, setLegacyText] = useState(routeState?.discussionText ?? '');
  const [legacyRecState, setLegacyRecState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [legacyAnalyser, setLegacyAnalyser] = useState<AnalyserNode | null>(null);
  const [legacySttError, setLegacySttError] = useState<string | null>(null);
  const legacyMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const legacyAudioChunksRef   = useRef<Blob[]>([]);
  const legacyAudioCtxRef      = useRef<AudioContext | null>(null);

  const category = agenda ? classifyAgenda(agenda.heading, agenda.description) : classifyAgenda('', '');
  const fields = CATEGORY_FIELDS[category];

  const initialStructured = (): StructuredProceedings => {
    const existing = routeState?.structuredProceedings ?? routeState?.discussionText;
    if (!existing) return Object.fromEntries(fields.map(f => [f, '']));
    if (typeof existing === 'object') return existing as StructuredProceedings;
    return parseProceedings(existing, fields);
  };

  const [fieldValues, setFieldValues] = useState<StructuredProceedings>(initialStructured);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'action_option_approval' | 'action_option_discussion' | 'action_option_information' | null>(null);

  const [fieldRecState, setFieldRecState] = useState<Record<string, FieldRecordingState>>({});
  const [fieldSttError, setFieldSttError] = useState<Record<string, string | null>>({});
  const mediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
  const audioChunksRef    = useRef<Record<string, Blob[]>>({});
  const audioCtxRef       = useRef<Record<string, AudioContext>>({});
  const analyserRef       = useRef<Record<string, AnalyserNode>>({});
  const [analyserNodes, setAnalyserNodes] = useState<Record<string, AnalyserNode | null>>({});
  const [speakingField, setSpeakingField] = useState<string | null>(null);
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const audioInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fieldTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    fields.forEach(f => autoResizeTextarea(fieldTextareaRefs.current[f]));
  }, [fieldValues, fields]);

  // ── Find which field contains a given span, for left↔right linking ──────
  const findFieldForSpan = useCallback((span: string | null): string | null => {
    if (!span) return null;
    for (const f of fields) {
      if ((fieldValues[f] ?? '').includes(span)) return f;
    }
    return null;
  }, [fields, fieldValues]);

  const buildCards = (feedbackResult: FeedbackResult): CardState[] => {
    const feedback = feedbackResult.feedback ?? [];
    const spans    = feedbackResult.spans ?? [];
    const modes    = feedbackResult.modes ?? [];
    return feedback.map((text, i) => {
      const mode = ((modes[i] ?? 'APPEND').toUpperCase()) as 'REPLACE' | 'APPEND' | 'REPHRASE';
      const isFill = mode !== 'REPHRASE' && hasBlanks(text);
      const spanText = spans[i] ?? null;
      return {
        id:             `card-${i}`,
        suggestion:     text,
        type:           isFill ? 'fill-blanks' : 'rephrase',
        mode,
        spanText,
        spanField:      findFieldForSpan(spanText),
        dismissed:      false,
        segments:       isFill ? parseSegments(text) : [],
        recordingState: 'idle',
        micError:       null,
      };
    });
  };

  const [cards, setCards] = useState<CardState[]>(() =>
    buildCards(routeState?.feedbackResult ?? { category: '', category_reason: '', feedback: [] })
  );
  const [flagMessage, setFlagMessage] = useState<string | null>(routeState?.feedbackResult?.flag_message ?? null);
  const [pinnedCardId, setPinnedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const activeCardId = pinnedCardId ?? hoveredCardId;

  const leftColRef   = useRef<HTMLDivElement>(null);
  const rightColRef  = useRef<HTMLDivElement>(null);
  const gridRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const left  = leftColRef.current;
    const right = rightColRef.current;
    const grid  = gridRef.current;
    if (!left || !right || !grid) return;
    const sync = () => {
      const gridRect  = grid.getBoundingClientRect();
      const viewportH = window.innerHeight;
      // grid p-[30px]: subtract top+bottom padding + scroll container pb-6 (24px)
      const availableH = viewportH - gridRect.top - 30 - 30 - 24;
      const leftH = left.getBoundingClientRect().height;
      const targetH = Math.max(leftH, availableH);
      left.style.minHeight  = `${availableH}px`;
      right.style.height = `${targetH}px`;
    };
    const ro = new ResizeObserver(sync);
    ro.observe(left);
    window.addEventListener('resize', sync);
    sync();
    return () => { ro.disconnect(); window.removeEventListener('resize', sync); };
  }, []);

  // Per-card audio refs keyed by card id
  const cardMediaRecordersRef = useRef<Record<string, MediaRecorder>>({});
  const cardAudioChunksRef    = useRef<Record<string, Blob[]>>({});
  const cardAudioCtxRef       = useRef<Record<string, AudioContext>>({});
  const cardAnalyserRef       = useRef<Record<string, AnalyserNode>>({});
  const [cardAnalyserNodes, setCardAnalyserNodes] = useState<Record<string, AnalyserNode | null>>({});

  const visibleCards = cards.filter(c => !c.dismissed);
  const activeCard = cards.find(c => c.id === activeCardId) ?? null;
  // Field that should show the active highlight border, driven by the active card's span
  const highlightedField = activeCard?.spanField ?? null;
  const highlightColor = activeCard?.type === 'fill-blanks' ? '#ff7468' : '#613af5';
  const wholePanelHighlight = false;

  // Inline text-span highlights per field, for bidirectional hover/click linking
  const highlightsByField: Record<string, HighlightSpan[]> = {};
  for (const field of fields) highlightsByField[field] = [];
  for (const c of visibleCards) {
    if (c.spanText === null || c.spanField === null) continue;
    highlightsByField[c.spanField]?.push({
      text:     c.spanText,
      type:     c.type === 'fill-blanks' ? 'add-missing-details' : 'rephrase',
      cardId:   c.id,
      isActive: activeCardId === c.id,
    });
  }

  // Legacy mode: highlights on plain text
  const legacyHighlights: HighlightSpan[] = visibleCards
    .filter(c => c.spanText !== null && legacyText.includes(c.spanText!))
    .map(c => ({
      text:     c.spanText!,
      type:     c.type === 'fill-blanks' ? 'add-missing-details' : 'rephrase',
      cardId:   c.id,
      isActive: activeCardId === c.id,
    } as HighlightSpan));

  const updateCard = useCallback((id: string, updates: Partial<CardState>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const updateSegment = useCallback((cardId: string, segIndex: number, value: string) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const segments = c.segments.map((s, i) => i === segIndex && s.kind === 'blank' ? { ...s, value } : s);
      return { ...c, segments };
    }));
  }, []);

  const hasAnyText = fields.some(f => (fieldValues[f] ?? '').trim().length > 0);
  const isFeedbackEnabled = hasAnyText && !isFetchingFeedback &&
    !Object.values(fieldRecState).some(s => s !== 'idle');

  const updateField = (field: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const teardownFieldAudio = useCallback((field: string) => {
    audioCtxRef.current[field]?.close();
    delete audioCtxRef.current[field];
    delete analyserRef.current[field];
    setAnalyserNodes(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleReadAloud = (field: string) => {
    if (speakingField === field) {
      window.speechSynthesis.cancel();
      setSpeakingField(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fieldValues[field] ?? '');
    utterance.onend = () => setSpeakingField(null);
    utterance.onerror = () => setSpeakingField(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingField(field);
  };

  const handleMicClick = async (field: string) => {
    if ((fieldRecState[field] ?? 'idle') !== 'idle') return;
    setFieldSttError(prev => ({ ...prev, [field]: null }));
    setActiveField(field);

    if (!navigator.mediaDevices?.getUserMedia) {
      setFieldSttError(prev => ({ ...prev, [field]: 'Microphone not available on this connection.' }));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const denied = err instanceof DOMException && err.name === 'NotAllowedError';
      setFieldSttError(prev => ({ ...prev, [field]: denied ? 'Microphone access denied.' : 'Could not access microphone.' }));
      return;
    }

    const audioCtx = new AudioContext();
    audioCtxRef.current[field] = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current[field] = analyser;
    setAnalyserNodes(prev => ({ ...prev, [field]: analyser }));

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecordersRef.current[field] = mr;
    audioChunksRef.current[field] = [];
    mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current[field]?.push(e.data); };
    mr.start();
    setFieldRecState(prev => ({ ...prev, [field]: 'recording' }));
  };

  const handleMicConfirm = (field: string) => {
    const mr = mediaRecordersRef.current[field];
    if (!mr) return;
    setFieldRecState(prev => ({ ...prev, [field]: 'processing' }));
    const existingText = fieldValues[field] ?? '';

    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      delete mediaRecordersRef.current[field];
      teardownFieldAudio(field);
      const chunks = audioChunksRef.current[field] ?? [];
      audioChunksRef.current[field] = [];
      const mimeType = chunks[0]?.type ?? 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch(STT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioDataUri: reader.result as string, locale: lang }),
          });
          if (!res.ok) throw new Error(`STT API ${res.status}`);
          const data: { transcription: string } = await res.json();
          const sep = existingText.trim() ? ' ' : '';
          updateField(field, existingText + sep + data.transcription);
          setFieldRecState(prev => ({ ...prev, [field]: 'idle' }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setFieldSttError(prev => ({ ...prev, [field]: `Speech recognition failed — ${msg}` }));
          setFieldRecState(prev => ({ ...prev, [field]: 'idle' }));
        }
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
  };

  // ── Legacy mode mic ────────────────────────────────────────────────────────
  const handleLegacyMicClick = async () => {
    if (legacyRecState !== 'idle') return;
    setLegacySttError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      legacyAudioCtxRef.current = audioCtx;
      setLegacyAnalyser(analyser);
      const mr = new MediaRecorder(stream);
      legacyAudioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) legacyAudioChunksRef.current.push(e.data); };
      mr.start(100);
      legacyMediaRecorderRef.current = mr;
      setLegacyRecState('recording');
    } catch {
      setLegacySttError('Microphone access denied.');
    }
  };

  const handleLegacyMicConfirm = () => {
    const mr = legacyMediaRecorderRef.current;
    if (!mr) return;
    setLegacyRecState('processing');
    const existing = legacyText;
    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      legacyAudioCtxRef.current?.close();
      legacyAudioCtxRef.current = null;
      setLegacyAnalyser(null);
      const chunks = legacyAudioChunksRef.current;
      legacyAudioChunksRef.current = [];
      const blob = new Blob(chunks, { type: chunks[0]?.type ?? 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch(STT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioDataUri: reader.result as string, locale: lang }),
          });
          if (!res.ok) throw new Error(`STT ${res.status}`);
          const data: { transcription: string } = await res.json();
          setLegacyText(existing + (existing.trim() ? ' ' : '') + data.transcription);
        } catch (err) {
          setLegacySttError(`Speech recognition failed — ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        setLegacyRecState('idle');
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
  };

  // ── Card mic (fill-blanks cards only) ──────────────────────────────────────
  const teardownCardAudio = useCallback((cardId: string) => {
    cardAudioCtxRef.current[cardId]?.close();
    delete cardAudioCtxRef.current[cardId];
    delete cardAnalyserRef.current[cardId];
    setCardAnalyserNodes(prev => { const n = { ...prev }; delete n[cardId]; return n; });
  }, []);

  const handleCardMicClick = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.recordingState !== 'idle') return;
    updateCard(cardId, { micError: null });

    if (!navigator.mediaDevices?.getUserMedia) {
      updateCard(cardId, { micError: 'Microphone not available on this connection.' });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const denied = err instanceof DOMException && err.name === 'NotAllowedError';
      updateCard(cardId, { micError: denied ? 'Microphone access denied.' : 'Could not access microphone.' });
      return;
    }

    const audioCtx = new AudioContext();
    cardAudioCtxRef.current[cardId] = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    cardAnalyserRef.current[cardId] = analyser;
    setCardAnalyserNodes(prev => ({ ...prev, [cardId]: analyser }));

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const mr = new MediaRecorder(stream, { mimeType });
    cardMediaRecordersRef.current[cardId] = mr;
    cardAudioChunksRef.current[cardId] = [];
    mr.ondataavailable = e => { if (e.data.size > 0) cardAudioChunksRef.current[cardId]?.push(e.data); };
    mr.start();
    updateCard(cardId, { recordingState: 'recording' });
  };

  const handleCardMicCancel = (cardId: string) => {
    const mr = cardMediaRecordersRef.current[cardId];
    if (mr) {
      mr.onstop = null;
      mr.stop();
      mr.stream.getTracks().forEach(t => t.stop());
      delete cardMediaRecordersRef.current[cardId];
    }
    cardAudioChunksRef.current[cardId] = [];
    teardownCardAudio(cardId);
    updateCard(cardId, { recordingState: 'idle', micError: null });
  };

  const handleCardMicConfirm = (cardId: string) => {
    const mr = cardMediaRecordersRef.current[cardId];
    if (!mr) return;
    updateCard(cardId, { recordingState: 'processing' });
    const card = cards.find(c => c.id === cardId);
    const blankIdx = card?.segments.findIndex(s => s.kind === 'blank' && !s.value.trim()) ?? -1;

    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      delete cardMediaRecordersRef.current[cardId];
      teardownCardAudio(cardId);
      const chunks = cardAudioChunksRef.current[cardId] ?? [];
      cardAudioChunksRef.current[cardId] = [];
      const mimeType = chunks[0]?.type ?? 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch(STT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioDataUri: reader.result as string, locale: lang }),
          });
          if (!res.ok) throw new Error(`STT API ${res.status}`);
          const data: { transcription: string } = await res.json();
          if (blankIdx !== -1) updateSegment(cardId, blankIdx, data.transcription);
          updateCard(cardId, { recordingState: 'idle' });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          updateCard(cardId, { micError: `Speech recognition failed — ${msg}`, recordingState: 'idle' });
        }
      };
      reader.readAsDataURL(blob);
    };
    mr.stop();
  };

  // ── Card actions ──────────────────────────────────────────────────────────
  const applyCardText = (card: CardState, text: string) => {
    if (isLegacy) {
      if (card.mode === 'REPLACE' && card.spanText) {
        setLegacyText(prev => prev.replace(card.spanText!, text));
      } else {
        setLegacyText(prev => prev + (prev.trim() ? ' ' : '') + text);
      }
      return;
    }
    const field = card.spanField ?? activeField ?? fields[0];
    const existing = fieldValues[field] ?? '';
    if (card.mode === 'REPLACE' && card.spanText) {
      updateField(field, existing.replace(card.spanText, text));
    } else {
      const sep = existing.trim() ? ' ' : '';
      updateField(field, existing + sep + text);
    }
  };

  const clearCardActive = (cardId: string) => {
    setPinnedCardId(prev => prev === cardId ? null : prev);
    setHoveredCardId(prev => prev === cardId ? null : prev);
  };

  const handlePushText = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const text = card.type === 'fill-blanks' ? assembleFromSegments(card.segments) : card.suggestion;
    if (text.trim()) applyCardText(card, text);
    updateCard(cardId, { dismissed: true });
    clearCardActive(cardId);
  };

  const handleCardAccept = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card?.type === 'rephrase') applyCardText(card, card.suggestion);
    updateCard(cardId, { dismissed: true });
    clearCardActive(cardId);
  };

  const handleCardReject = (cardId: string) => {
    updateCard(cardId, { dismissed: true });
    clearCardActive(cardId);
  };

  const handleCardClick = (cardId: string) => {
    setPinnedCardId(prev => prev === cardId ? null : cardId);
  };

  // ── Span hover/click (left side), mirrors card hover/click (right side) ──
  const handleSpanHoverEnter = (cardId: string) => setHoveredCardId(cardId);
  const handleSpanHoverLeave = (cardId: string) => setHoveredCardId(prev => prev === cardId ? null : prev);
  const handleSpanClick = (cardId: string) => setPinnedCardId(prev => prev === cardId ? null : cardId);

  // ── Get Feedback (re-run) ────────────────────────────────────────────────
  const handleGetFeedback = async () => {
    if (!isFeedbackEnabled) return;
    setFeedbackError(null);
    setFlagMessage(null);
    setIsFetchingFeedback(true);
    const flatText = flattenProceedings(fieldValues);
    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_id:         agenda ? String(agenda.id) : '1',
          agenda_subject:    agenda?.heading || 'General Discussion',
          mom_discussion:    flatText,
          feedback_language: /[ಀ-೿]/.test(flatText) ? 'kn' : 'en',
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Feedback API returned ${res.status}${detail ? `: ${detail}` : ''}`);
      }
      const feedbackResult: FeedbackResult = await res.json();
      setFlagMessage(feedbackResult.flag_message ?? null);
      setCards(buildCards(feedbackResult));
      setPinnedCardId(null);
      setHoveredCardId(null);
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
      const hasUserAgendas = meetingId != null && (meetingAgendas[meetingId]?.length ?? 0) > 0;
      const saveData = isLegacy ? legacyText : fieldValues;
      if (hasUserAgendas) saveMeetingProceedings(meetingId!, agenda.id, saveData);
      else saveProceedings(agenda.id, saveData as any);
    }
    navigate('/agenda-list', { state: { meetingId } });
  };

  return (
    <MeetingShellLayout stepperActiveState={2} showBack={false}>
      <div className="flex flex-col gap-[3px]">

        <div className="bg-white pl-[20px] pr-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-full">
          <GoBackToPreviousPage
            label={t('go_back')}
            onClick={() => isLegacy
              ? navigate('/mom-entry/legacy', { state: { agenda, discussionText: legacyText, meetingId } })
              : navigate('/mom-entry', { state: { agenda, discussionText: fieldValues, meetingId } })
            }
          />
        </div>

        <div ref={gridRef} className="bg-white grid gap-[32px] p-[30px] rounded-bl-[15px] rounded-br-[15px]" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div ref={leftColRef} className="flex flex-col gap-[20px] min-w-0">

            <SectionHeading text={t('mom_entry_heading')} className="shrink-0" />

            {isLegacy && (<>
              <AgendaCard
                stage="subpage"
                agendaNumber={agenda ? String(agenda.id) : '1'}
                agendaHeading={agenda?.heading ?? 'Reading and reporting on the proceedings of the previous meeting'}
                agendaDescription={agenda?.description ?? ''}
                className="shrink-0 w-full"
              />
              {/* Action field */}
              <div className="flex flex-col gap-[6px] items-start shrink-0 w-full">
                <QuestionFieldsSmall type="mandatory" questionText={t('action_field_label')} className="shrink-0 w-full" />
                <div className="relative shrink-0">
                  {actionOpen && <div className="fixed inset-0 z-10" onClick={() => setActionOpen(false)} />}
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
                          <button key={key}
                            className="bg-white flex items-center px-4 py-2 w-full hover:bg-[#f7f0ee] transition-colors text-left"
                            onClick={() => { setSelectedAction(key); setActionOpen(false); }}
                          >
                            <span className="font-normal text-sm text-[#212121] tracking-[0.25px]" style={NS}>{t(key)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-[6px] items-start w-full">
                <QuestionFieldsSmall type="mandatory" questionText={t('discussion_field_label')} className="shrink-0" />
                <InfoBox type="plain" text={t('discussion_field_info')} className="shrink-0 w-full" />
                {legacySttError && <InfoBox type="default" text={legacySttError} className="shrink-0 w-full" />}
                <TextAreaContainer
                  state={legacyRecState === 'recording' ? 'recording' : legacyText ? 'filled' : 'default'}
                  value={legacyText}
                  onChange={v => setLegacyText(v)}
                  onMicClick={legacyRecState === 'recording' ? handleLegacyMicConfirm : handleLegacyMicClick}
                  highlights={legacyHighlights}
                  onSpanHoverEnter={handleSpanHoverEnter}
                  onSpanHoverLeave={handleSpanHoverLeave}
                  onSpanClick={handleSpanClick}
                  analyserNode={legacyAnalyser ?? undefined}
                  isProcessing={legacyRecState === 'processing'}
                  className="w-full"
                />
              </div>
              <div className="flex gap-[15px] items-start justify-end shrink-0 w-full mt-[10px]">
                <Button variant="outlined" state="disabled" iconPlacement="none" text={t('btn_get_feedback')} />
                <Button variant="filled" state="default" iconPlacement="none" text={t('btn_save')} onClick={handleSave} />
              </div>
            </>)}

            {!isLegacy && <>

            <AgendaCard
              stage="subpage"
              agendaNumber={agenda ? String(agenda.id) : '1'}
              agendaHeading={agenda?.heading ?? 'Reading and reporting on the proceedings of the previous meeting'}
              agendaDescription={agenda?.description ?? 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.'}
              className="shrink-0 w-full"
            />

            {/* Action field */}
            <div className="flex flex-col gap-[6px] items-start shrink-0 w-full">
              <QuestionFieldsSmall type="mandatory" questionText={t('action_field_label')} className="shrink-0 w-full" />
              <div className="relative shrink-0">
                {actionOpen && <div className="fixed inset-0 z-10" onClick={() => setActionOpen(false)} />}
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
                          <span className="font-normal text-sm text-[#212121] tracking-[0.25px]" style={NS}>{t(key)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Structured field rows */}
            <div className="flex flex-col gap-[6px] items-start w-full">
              <QuestionFieldsSmall type="mandatory" questionText={t('discussion_field_label')} className="shrink-0" />
              <InfoBox type="plain" text={t('discussion_field_info')} className="shrink-0 w-full" />

              {feedbackError && (
                <p className="text-[12px] text-[#b7131a] shrink-0 w-full" style={NS}>{feedbackError}</p>
              )}

              <div className="w-full flex flex-col rounded-[12px] border border-[rgba(106,62,49,0.24)] overflow-hidden">
                {fields.map((field, idx) => {
                  const isActive = activeField === field;
                  const isHighlighted = highlightedField === field;
                  const recState = fieldRecState[field] ?? 'idle';
                  const isRecording = recState === 'recording';
                  const isProcessing = recState === 'processing';
                  const err = fieldSttError[field];
                  const borderColor = isHighlighted ? highlightColor : (isActive ? '#ED8243' : undefined);
                  const isFirst = idx === 0;
                  const isLast = idx === fields.length - 1;

                  return (
                    <div
                      key={field}
                      className={`flex transition-colors ${!isLast ? 'border-b border-[rgba(106,62,49,0.18)]' : ''} bg-white`}
                      style={isHighlighted ? {
                        boxShadow: `inset 0 0 0 2px ${highlightColor}`,
                        borderRadius: `${isFirst ? '11px' : '0'} ${isFirst ? '11px' : '0'} ${isLast ? '11px' : '0'} ${isLast ? '11px' : '0'}`,
                      } : undefined}
                      onClick={() => { setActiveField(field); setPinnedCardId(null); setHoveredCardId(null); }}
                    >
                      <div
                        className={`w-[180px] shrink-0 flex items-start px-[16px] py-[14px] border-r transition-colors ${!borderColor ? 'border-[rgba(106,62,49,0.18)]' : ''} bg-[#faf7f6]`}
                        style={borderColor ? { borderColor } : undefined}
                      >
                        <span className="text-[14px] font-semibold leading-[20px] text-[#6a3e31]" style={NS}>{field}</span>
                      </div>

                      <div
                        className={`flex-1 flex flex-col min-w-0 transition-colors ${isActive || isHighlighted ? 'border-l-2' : ''}`}
                        style={isActive || isHighlighted ? { borderColor: borderColor ?? '#ED8243' } : undefined}
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-[8px] px-[14px] py-[14px] flex-1">
                            <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6" stroke="#ffa199" strokeWidth="2" strokeOpacity="0.3" />
                              <path d="M8 2a6 6 0 0 1 6 6" stroke="#ff7468" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="text-[12px] text-[#6a3e31] font-medium" style={NS}>Transcribing…</span>
                          </div>
                        ) : highlightsByField[field]?.length > 0 ? (
                          <div className="relative flex-1 min-h-[52px]">
                            <textarea
                              ref={el => { fieldTextareaRefs.current[field] = el; autoResizeTextarea(el); }}
                              value={fieldValues[field] ?? ''}
                              onChange={e => { updateField(field, e.target.value); autoResizeTextarea(e.target); }}
                              onFocus={() => { setActiveField(field); setPinnedCardId(null); setHoveredCardId(null); }}
                              placeholder={`Enter ${field.toLowerCase()}…`}
                              className="absolute inset-0 w-full h-full resize-none bg-transparent border-none outline-none px-[14px] py-[14px] text-[14px] leading-[20px] placeholder:text-[#bdbdbd] text-transparent caret-[#212121] z-10"
                              style={NS}
                            />
                            <div
                              className="w-full px-[14px] py-[14px] text-[14px] text-[#212121] leading-[20px] whitespace-pre-wrap break-words pointer-events-none"
                              style={NS}
                            >
                              {buildSegments(fieldValues[field] ?? '', highlightsByField[field]).map((seg, i) =>
                                seg.highlight ? (
                                  <span
                                    key={i}
                                    className="pointer-events-auto"
                                    style={{
                                      backgroundColor: seg.highlight.isActive
                                        ? (seg.highlight.type === 'add-missing-details' ? 'rgba(255,116,104,0.5)' : 'rgba(97,58,245,0.4)')
                                        : (seg.highlight.type === 'add-missing-details' ? 'rgba(255,116,104,0.2)' : 'rgba(97,58,245,0.18)'),
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      padding: '0 2px',
                                      transition: 'background-color 0.15s',
                                    }}
                                    onMouseEnter={() => handleSpanHoverEnter(seg.highlight!.cardId)}
                                    onMouseLeave={() => handleSpanHoverLeave(seg.highlight!.cardId)}
                                    onClick={() => handleSpanClick(seg.highlight!.cardId)}
                                  >
                                    {seg.text}
                                  </span>
                                ) : (
                                  <span key={i}>{seg.text}</span>
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <textarea
                            ref={el => { fieldTextareaRefs.current[field] = el; autoResizeTextarea(el); }}
                            value={fieldValues[field] ?? ''}
                            onChange={e => { updateField(field, e.target.value); autoResizeTextarea(e.target); }}
                            onFocus={() => { setActiveField(field); setPinnedCardId(null); setHoveredCardId(null); }}
                            placeholder={`Enter ${field.toLowerCase()}…`}
                            rows={1}
                            className="w-full resize-none bg-transparent border-none outline-none px-[14px] py-[14px] text-[14px] text-[#212121] leading-[20px] placeholder:text-[#bdbdbd] overflow-hidden"
                            style={{ ...NS, minHeight: '52px' }}
                          />
                        )}

                        {err && <p className="text-[11px] text-[#b7131a] px-[14px] pb-[6px]" style={NS}>{err}</p>}

                        {isActive && !isProcessing && (
                          <div className="flex items-center justify-between px-[10px] pb-[10px]">
                            <input
                              type="file" accept="image/*" className="hidden"
                              ref={el => { photoInputRefs.current[field] = el; }}
                              onChange={e => { const file = e.target.files?.[0]; if (file) updateField(field, (fieldValues[field] ?? '') + ` [Photo: ${file.name}]`); }}
                            />
                            <input
                              type="file" accept="audio/*" className="hidden"
                              ref={el => { audioInputRefs.current[field] = el; }}
                              onChange={e => { const file = e.target.files?.[0]; if (file) updateField(field, (fieldValues[field] ?? '') + ` [Audio: ${file.name}]`); }}
                            />
                            <div className="flex items-center gap-[8px]">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); photoInputRefs.current[field]?.click(); }}
                                className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[10px] py-[6px] border-none cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <Icon name="photo_camera" size="small" color="#6a3e31" />
                                <span className="text-[#6a3e31] text-[12px] font-medium leading-5" style={NS}>{t('btn_scan_photo')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); audioInputRefs.current[field]?.click(); }}
                                className="flex items-center gap-[6px] bg-[#dfc2b9] rounded-[8px] px-[10px] py-[6px] border-none cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <Icon name="upload_file" size="small" color="#6a3e31" />
                                <span className="text-[#6a3e31] text-[12px] font-medium leading-5" style={NS}>{t('btn_upload_audio')}</span>
                              </button>
                            </div>
                            <div className="flex items-center gap-[8px]">
                              {(fieldValues[field] ?? '').trim().length > 0 && !isRecording && (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); handleReadAloud(field); }}
                                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f0ebe9] transition-colors border-none bg-transparent cursor-pointer"
                                >
                                  <Icon name={speakingField === field ? 'stop_circle' : 'volume_up'} size="medium" color="#6a3e31" />
                                </button>
                              )}
                              <MicButton
                                isRecording={isRecording}
                                onClick={() => isRecording ? handleMicConfirm(field) : handleMicClick(field)}
                                analyserNode={analyserNodes[field] ?? undefined}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {flagMessage && <InfoBox type="default" text={flagMessage} className="shrink-0 w-full" />}

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
                state="default"
                iconPlacement="none"
                text={t('btn_save')}
                onClick={handleSave}
              />
            </div>
            </>}
          </div>

          {/* ── Right: feedback cards ── */}
          <div ref={rightColRef} className="bg-[rgba(134,134,134,0.08)] flex flex-col gap-[20px] pb-[30px] pt-[20px] px-[20px] rounded-[15px] overflow-y-auto">
            <SectionHeading text={t('feedback_heading')} className="shrink-0" />

            {visibleCards.length > 0 ? (
              <>
                <InfoBox type="plain" text={t('feedback_info')} className="shrink-0 w-full" />
                <div className="flex flex-col gap-[15px] items-start w-full pb-[30px] pr-3" style={{ scrollbarGutter: 'stable' }}>
                  {visibleCards.map(card => (
                    <FeedbackCard
                      key={card.id}
                      type={card.type}
                      segments={card.segments}
                      onSegmentChange={(i, v) => updateSegment(card.id, i, v)}
                      originalText={card.suggestion}
                      isActive={activeCardId === card.id}
                      onHoverEnter={() => setHoveredCardId(card.id)}
                      onHoverLeave={() => setHoveredCardId(prev => prev === card.id ? null : prev)}
                      onClick={() => handleCardClick(card.id)}
                      onAccept={() => handleCardAccept(card.id)}
                      onReject={() => handleCardReject(card.id)}
                      onPushText={() => handlePushText(card.id)}
                      isMicRecording={card.recordingState === 'recording'}
                      isMicProcessing={card.recordingState === 'processing'}
                      onMicClick={() => handleCardMicClick(card.id)}
                      onMicCancel={() => handleCardMicCancel(card.id)}
                      onMicConfirm={() => handleCardMicConfirm(card.id)}
                      micAnalyserNode={cardAnalyserNodes[card.id] ?? undefined}
                      micError={card.micError}
                      className="w-full"
                    />
                  ))}
                </div>
              </>
            ) : (
              <SmallDetailsText text={t('feedback_empty_state')} className="shrink-0" />
            )}
          </div>

        </div>
      </div>
    </MeetingShellLayout>
  );
}
