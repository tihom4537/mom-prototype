export type AgendaCategory =
  | 'Issue / Grievance'
  | 'Review / Status'
  | 'Planning / Preparatory'
  | 'Information / Intimation'
  | 'Multi-Topic / Miscellaneous'
  | 'Other';

export const CATEGORY_FIELDS: Record<AgendaCategory, string[]> = {
  'Issue / Grievance':           ['Issue / grievance raised', 'Discussion / response', 'Decision / resolution', 'Responsible person', 'Timeline / next step'],
  'Review / Status':             ['Subject reviewed', 'Current status', 'Delays / gaps / concerns', 'Instructions issued', 'Further review required?'],
  'Planning / Preparatory':      ['Activity / event being planned', 'Preparatory steps discussed', 'Responsible person / coordinator', 'Tentative timeline / target', 'Final or subject to approval?'],
  'Information / Intimation':    ['Information / update shared', 'Source', 'Clarification / explanation provided', 'Action points (if any)'],
  'Multi-Topic / Miscellaneous': ['Topics covered', 'Key decisions / outcomes', 'Unclear / ambiguous points', 'Follow-up required'],
  'Other':                       ['Subject / topic', 'Discussion / information / action', 'Decision / approval / resolution', 'Issues / concerns raised', 'Follow-up / timeline / responsible person'],
};

export function classifyAgenda(title: string, description: string): AgendaCategory {
  const text = `${title} ${description}`.toLowerCase();
  if (/grievance|complaint|application|petition|redress|dispute|objection/.test(text)) return 'Issue / Grievance';
  if (/review|status|progress|update|inspection|audit|compliance|pending|completion/.test(text)) return 'Review / Status';
  if (/plan|prepar|propos|schedul|upcoming|organis|arrang|coordinat|tender|estimate/.test(text)) return 'Planning / Preparatory';
  if (/circular|notification|intimat|inform|communic|read out|government order|instruction/.test(text)) return 'Information / Intimation';
  if (/various|miscellaneous|other|general|multiple|several|agenda items/.test(text)) return 'Multi-Topic / Miscellaneous';
  return 'Other';
}

export type StructuredProceedings = Record<string, string>;

/** Serialise structured proceedings to flat string for APIs / feedback */
export function flattenProceedings(data: StructuredProceedings): string {
  return Object.entries(data)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join('\n');
}

/** Parse flat string back to structured if it was saved in key: value format */
export function parseProceedings(text: string, fields: string[]): StructuredProceedings {
  const result: StructuredProceedings = {};
  for (const field of fields) {
    const prefix = `${field}: `;
    const line = text.split('\n').find(l => l.startsWith(prefix));
    result[field] = line ? line.slice(prefix.length) : '';
  }
  return result;
}
