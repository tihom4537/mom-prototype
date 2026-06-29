/**
 * Notice period rules per meeting type (Karnataka Panchayat Raj Act).
 * Keys match i18n translation keys from translations.js.
 */

export interface NoticePeriodRule {
  days: number;
  reason: string;
}

const FOURTEEN_DAYS: NoticePeriodRule = {
  days: 14,
  reason: '14-day notice required under Karnataka Panchayat Raj Act',
};

const SEVEN_DAYS: NoticePeriodRule = {
  days: 7,
  reason: '7-day notice required for special and emergency meetings',
};

/**
 * Maps i18n key → notice period rule.
 * Pass the resolved English string or the i18n key — both are handled below.
 */
const RULES_BY_KEY: Record<string, NoticePeriodRule> = {
  meeting_type_gp_general_body:         FOURTEEN_DAYS,
  meeting_type_gram_sabha_ordinary:     FOURTEEN_DAYS,
  meeting_type_gram_sabha_special_budget: FOURTEEN_DAYS,
  meeting_type_ward_sabha_ordinary:     FOURTEEN_DAYS,
  meeting_type_habitation_ordinary:     FOURTEEN_DAYS,
  meeting_type_kdp:                     FOURTEEN_DAYS,
  meeting_type_makkala_sabha:           FOURTEEN_DAYS,
  meeting_type_mahila_sabha:            FOURTEEN_DAYS,
  meeting_type_finance_committee:       FOURTEEN_DAYS,
  meeting_type_general_standing:        FOURTEEN_DAYS,
  meeting_type_social_justice:          FOURTEEN_DAYS,
  // Special / emergency — 7 days
  meeting_type_gram_sabha_special:      SEVEN_DAYS,
  meeting_type_ward_sabha_special:      SEVEN_DAYS,
  meeting_type_habitation_special:      SEVEN_DAYS,
  meeting_type_habitation_emergency:    SEVEN_DAYS,
};

/**
 * Map from resolved English display label → rule.
 * Allows lookup by whatever string is currently in the meetingType dropdown value.
 */
const RULES_BY_LABEL: Record<string, NoticePeriodRule> = {
  'GP General Body Meeting - Ordinary':                    FOURTEEN_DAYS,
  'Grama Sabha - Ordinary':                                FOURTEEN_DAYS,
  'Grama Sabha - Special Budget':                          FOURTEEN_DAYS,
  'Ward Sabha - Ordinary':                                 FOURTEEN_DAYS,
  'Habitation Sabha - Ordinary':                           FOURTEEN_DAYS,
  'KDP Meeting':                                           FOURTEEN_DAYS,
  'Makkala Sabha':                                         FOURTEEN_DAYS,
  'Mahila Sabha':                                          FOURTEEN_DAYS,
  'Finance, Audit and Planning Standing Committee':        FOURTEEN_DAYS,
  'General Standing Committee':                            FOURTEEN_DAYS,
  'Social Justice Standing Committee':                     FOURTEEN_DAYS,
  // Special / emergency
  'Grama Sabha - Special':                                 SEVEN_DAYS,
  'Ward Sabha - Special':                                  SEVEN_DAYS,
  'Habitation Sabha - Special':                            SEVEN_DAYS,
  'Habitation Sabha - Emergency':                          SEVEN_DAYS,
};

const DEFAULT_RULE: NoticePeriodRule = FOURTEEN_DAYS;

/** Returns the notice period rule for a given meeting type label or i18n key. */
export function getNoticePeriod(meetingTypeOrKey: string): NoticePeriodRule {
  return (
    RULES_BY_LABEL[meetingTypeOrKey] ??
    RULES_BY_KEY[meetingTypeOrKey] ??
    DEFAULT_RULE
  );
}

/** Adds noticeDays to today and returns the resulting Date (time zeroed). */
export function getEarliestDate(noticeDays: number, today: Date = new Date()): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + noticeDays);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Formats a Date as "Wednesday, 24 June 2026". */
export function formatDateVerbose(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Builds the spoken narration for the date picker.
 * Called when picker opens (if screen reader active) and used for aria-describedby.
 */
export function buildDatePickerNarration(meetingType: string, today: Date = new Date()): string {
  const rule = getNoticePeriod(meetingType);
  const earliest = getEarliestDate(rule.days, today);
  const earliestLabel = formatDateVerbose(earliest);

  if (!meetingType) {
    return `Date picker. Select a meeting type first to see the applicable notice period.`;
  }

  return (
    `Date picker for ${meetingType}. ` +
    `${rule.reason}. ` +
    `The earliest selectable date is ${earliestLabel}, which is ${rule.days} days from today. ` +
    `Dates before this are blocked. Use arrow keys or Tab to navigate the calendar.`
  );
}

/**
 * Builds the aria-label for a single calendar day button.
 */
export function buildDayAriaLabel(
  y: number, m: number, d: number,
  isBlocked: boolean,
  isSelected: boolean,
  isToday: boolean,
  noticeDays: number,
): string {
  const date = new Date(y, m, d);
  const label = formatDateVerbose(date);
  if (isSelected) return `${label}, selected`;
  if (isToday) return `${label}, today${isBlocked ? `, blocked — within ${noticeDays}-day notice period` : ', available'}`;
  if (isBlocked) return `${label}, blocked — within ${noticeDays}-day notice period`;
  return `${label}, available`;
}
