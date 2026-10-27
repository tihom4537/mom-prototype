/** One feedback point returned by POST /feedback. */
export interface FeedbackItem {
  text: string;
  /** Verbatim substring of `text` to emphasise, or null (e.g. praise bullets). */
  highlight: string | null;
}

/** Response contract of POST /feedback. */
export interface FeedbackResult {
  status: 'feedback' | 'good_to_go';
  /** Set only when status === 'good_to_go' (e.g. "Great, you are good to go!"). */
  message: string | null;
  /** Empty when good_to_go. */
  feedback: FeedbackItem[];
  /** Full rewrite with [[placeholder]] markers, or null. */
  rewrite: string | null;
  /** 1 for a fresh round, 2/3 for follow-ups. */
  round: number;
}

/** Split a feedback point into [before, highlight, after] for rendering; highlight may be null. */
export function splitHighlight(item: FeedbackItem): { before: string; highlight: string | null; after: string } {
  const { text, highlight } = item;
  if (!highlight) return { before: text, highlight: null, after: '' };
  const idx = text.indexOf(highlight);
  if (idx === -1) return { before: text, highlight: null, after: '' };
  return {
    before: text.slice(0, idx),
    highlight: text.slice(idx, idx + highlight.length),
    after: text.slice(idx + highlight.length),
  };
}
