/**
 * Data-driven onion-peel narrative builders.
 * Pure functions — no React, no side effects.
 *
 * Layer 1 (context)      — what the page shows + live top data point
 * Layer 2 (key insights) — computed observations from live data
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

function pct(part: number, total: number, dp = 1): string {
  if (!total) return '0%';
  return ((part / total) * 100).toFixed(dp) + '%';
}

// ─── CitizenDashboard ─────────────────────────────────────────────────────────

interface DataPoint { name: string; value: number }

interface CDBSnapshot {
  totalReceived: number;
  totalDelivered: number;
  inProcessDept: number;
  inProcessApplicant: number;
  rejected: number;
  pendingSLA: number;
}

export function buildCitizenDashboardNarrative(
  distData: DataPoint[],
  svcData: DataPoint[],
  snap: CDBSnapshot,
): string {
  const parts: string[] = [];

  // ── Layer 1: context ────────────────────────────────────────────────────────
  parts.push(
    `You are on the Citizen Services Dashboard for Karnataka gram panchayats.` +
    ` It tracks service application data across ${fmt(snap.totalReceived)} total applications received.`
  );

  // Top district
  const sortedDist = [...distData].sort((a, b) => b.value - a.value);
  if (sortedDist.length > 0) {
    const top = sortedDist[0];
    parts.push(
      `District-wise, ${top.name} leads with ${fmt(top.value)} applications,` +
      ` which is ${pct(top.value, snap.totalReceived)} of the statewide total.`
    );
  }

  // Top service
  const sortedSvc = [...svcData].sort((a, b) => b.value - a.value);
  if (sortedSvc.length > 0) {
    const topSvc = sortedSvc[0];
    parts.push(
      `By service type, "${topSvc.name}" has the highest demand with ${fmt(topSvc.value)} applications.`
    );
  }

  // ── Layer 2: key insights ───────────────────────────────────────────────────
  const deliveryRate = pct(snap.totalDelivered, snap.totalReceived);
  parts.push(
    `\nKey insights: The overall delivery rate stands at ${deliveryRate} —` +
    ` ${fmt(snap.totalDelivered)} applications have been successfully delivered.`
  );

  // Pending breakdown
  const totalPending = snap.inProcessDept + snap.inProcessApplicant;
  parts.push(
    `${fmt(totalPending)} applications are still in progress:` +
    ` ${fmt(snap.inProcessDept)} are pending with the department, and` +
    ` ${fmt(snap.inProcessApplicant)} are awaiting response from the applicant.`
  );

  // SLA breach
  if (snap.pendingSLA > 0) {
    parts.push(
      `${fmt(snap.pendingSLA)} applications have breached their SLA deadline, indicating areas needing urgent attention.`
    );
  }

  // Rejection rate
  const rejRate = pct(snap.rejected, snap.totalReceived);
  parts.push(
    `${fmt(snap.rejected)} applications were rejected — a rejection rate of ${rejRate}.`
  );

  // District spread insight
  if (sortedDist.length > 1) {
    const bottom = sortedDist[sortedDist.length - 1];
    parts.push(
      `There is a significant regional gap: ${sortedDist[0].name} handles ${fmt(sortedDist[0].value)} applications` +
      ` while ${bottom.name} has only ${fmt(bottom.value)},` +
      ` highlighting unequal service demand across districts.`
    );
  }

  return parts.join(' ');
}

// ─── FinanceScreen ────────────────────────────────────────────────────────────

interface FinanceNarrativeInput {
  totalGPs: number;
  completedGPs: number;
  topTaluk: string;
  topTalukPct: number;
  bottomTaluk: string;
  bottomTalukPct: number;
}

export function buildFinanceNarrative(input: FinanceNarrativeInput): string {
  const { totalGPs, completedGPs, topTaluk, topTalukPct, bottomTaluk, bottomTalukPct } = input;
  const parts: string[] = [];

  const overallPct = pct(completedGPs, totalGPs);

  parts.push(
    `You are on the Finance and Accounting page.` +
    ` It tracks budget utilisation and financial completion across gram panchayats in Karnataka.`
  );

  parts.push(
    `Statewide, ${fmt(completedGPs)} out of ${fmt(totalGPs)} gram panchayats have completed their financial reporting — an overall completion rate of ${overallPct}.`
  );

  parts.push(
    `\nKey insights: ${topTaluk} taluk leads with ${topTalukPct.toFixed(1)}% completion,` +
    ` while ${bottomTaluk} taluk lags behind at ${bottomTalukPct.toFixed(1)}%.` +
    ` This gap signals where financial capacity building or follow-up may be needed.`
  );

  return parts.join(' ');
}

// ─── RevenueScreen ───────────────────────────────────────────────────────────

interface RevenueNarrativeInput {
  totalDemand: number;
  totalCollected: number;
  topTaluk: string;
  topTalukPct: number;
  bottomTaluk: string;
  bottomTalukPct: number;
}

export function buildRevenueNarrative(input: RevenueNarrativeInput): string {
  const { totalDemand, totalCollected, topTaluk, topTalukPct, bottomTaluk, bottomTalukPct } = input;
  const parts: string[] = [];

  const collectionRate = pct(totalCollected, totalDemand);

  parts.push(
    `You are on the Revenue page.` +
    ` It tracks property tax and revenue collection across Karnataka's gram panchayats.`
  );

  parts.push(
    `The statewide revenue collection rate stands at ${collectionRate} —` +
    ` ${fmt(totalCollected)} collected out of a total demand of ${fmt(totalDemand)}.`
  );

  parts.push(
    `\nKey insights: ${topTaluk} taluk has the highest collection at ${topTalukPct.toFixed(1)}%,` +
    ` while ${bottomTaluk} taluk is at ${bottomTalukPct.toFixed(1)}%.` +
    ` The gap between top and bottom performers suggests scope for targeted revenue recovery drives.`
  );

  return parts.join(' ');
}

// ─── CitizenMeetingScreen ─────────────────────────────────────────────────────

interface MeetingNarrativeInput {
  totalMeetings: number;
  conducted: number;
  notConducted: number;
  topDistrict: string;
  topDistrictCount: number;
  bottomDistrict: string;
  bottomDistrictCount: number;
}

export function buildMeetingNarrative(input: MeetingNarrativeInput): string {
  const { totalMeetings, conducted, notConducted, topDistrict, topDistrictCount, bottomDistrict, bottomDistrictCount } = input;
  const parts: string[] = [];

  const conductedRate = pct(conducted, totalMeetings);

  parts.push(
    `You are on the Meeting Records page.` +
    ` It shows Gram Sabha and General Body meeting data across Karnataka's gram panchayats.`
  );

  parts.push(
    `Out of ${fmt(totalMeetings)} scheduled meetings, ${fmt(conducted)} were conducted — a completion rate of ${conductedRate}.` +
    ` ${fmt(notConducted)} meetings were not held.`
  );

  parts.push(
    `\nKey insights: ${topDistrict} district conducted the most meetings with ${fmt(topDistrictCount)},` +
    ` while ${bottomDistrict} district had the fewest at ${fmt(bottomDistrictCount)}.` +
    ` Districts with low meeting counts may indicate governance gaps that warrant follow-up.`
  );

  return parts.join(' ');
}

// ─── HRMSScreen ──────────────────────────────────────────────────────────────

export function buildHRMSNarrative(): string {
  return (
    `You are on the Human Resource Management page for Karnataka gram panchayats. ` +
    `It provides access to staff registration, service records, attendance, and payroll data for GP employees across the state. ` +
    `Key areas available: Staff Registration, Service Book, Attendance Tracking, and Salary Management. ` +
    `Use the sub-module cards to navigate into each area. ` +
    `You can also browse other modules such as Finance, Revenue, and Meetings from the carousel at the top.`
  );
}

// ─── PanchamitraScreen ────────────────────────────────────────────────────────

export function buildPanchamitraNarrative(): string {
  return (
    `You are on the Panchamitra page. ` +
    `Panchamitra connects citizens with nominated gram panchayat volunteers and community representatives across Karnataka. ` +
    `You can filter by level — Gram Panchayat or Zilla Panchayat — and then select a district, taluk, or specific GP ` +
    `to find the Panchamitra volunteer assigned to that area. ` +
    `Each volunteer's name, contact, and role are shown once you select a location.`
  );
}

// ─── DocumentsScreen ─────────────────────────────────────────────────────────

export function buildDocumentsNarrative(activeTab: string, docCount: number): string {
  const tabLabel: Record<string, string> = {
    guidelines:     'Administrative Guidelines',
    notifications:  'Notifications and Circulars',
    events:         'Events',
    initiatives:    'Government Initiatives',
    other:          'Other Documents',
    questionnaires: 'State Finance Commission Questionnaires',
  };
  const label = tabLabel[activeTab] ?? activeTab;

  return (
    `You are on the Public Documents page. ` +
    `It provides official gram panchayat documents organised by category. ` +
    `You are currently viewing the "${label}" tab, which has ${docCount} ${docCount === 1 ? 'document' : 'documents'} available. ` +
    `Other available categories: Guidelines, Notifications, Events, Initiatives, Questionnaires, and Other. ` +
    `Each document can be downloaded. Switch tabs using the navigation bar on the left.`
  );
}

// ─── MeetingOverviewScreen ────────────────────────────────────────────────────

export function buildMeetingOverviewNarrative(draftCount: number, upcomingCount: number): string {
  const parts: string[] = [];

  parts.push(
    `You are on the Meeting Overview page for the Meeting Management module. ` +
    `This is the starting point for managing gram panchayat meetings.`
  );

  parts.push(
    draftCount > 0
      ? `You have ${draftCount} draft ${draftCount === 1 ? 'meeting' : 'meetings'} in progress that need to be completed.`
      : `There are no draft meetings at this time.`
  );

  parts.push(
    `There ${upcomingCount === 1 ? 'is' : 'are'} ${upcomingCount} upcoming scheduled ${upcomingCount === 1 ? 'meeting' : 'meetings'}. ` +
    `Key actions: Create a new meeting, view the full meeting list, or browse the calendar. ` +
    `The mandatory meetings section tracks compliance with required Gram Sabha, Ward Sabha, and Standing Committee schedules.`
  );

  return parts.join(' ');
}

// ─── MeetingListScreen ────────────────────────────────────────────────────────

interface MeetingListNarrativeInput {
  todayCount: number;
  upcomingCount: number;
  pastCount: number;
  draftCount: number;
  cancelledCount: number;
  activeTab: string;
  activeTabCount: number;
}

export function buildMeetingListNarrative(input: MeetingListNarrativeInput): string {
  const { todayCount, upcomingCount, pastCount, draftCount, cancelledCount, activeTab, activeTabCount } = input;
  const tabLabel: Record<string, string> = {
    today: 'Today', upcoming: 'Upcoming', past: 'Past', drafts: 'Drafts', cancelled: 'Cancelled',
  };

  const parts: string[] = [];

  parts.push(
    `You are on the Meeting List page. It shows all gram panchayat meetings organised by status. ` +
    `You are viewing the "${tabLabel[activeTab] ?? activeTab}" tab with ${activeTabCount} ${activeTabCount === 1 ? 'meeting' : 'meetings'}.`
  );

  parts.push(
    `Across all tabs: ${todayCount} today, ${upcomingCount} upcoming, ${pastCount} past, ${draftCount} draft, ${cancelledCount} cancelled.`
  );

  if (activeTab === 'today' && activeTabCount > 0) {
    parts.push(`Select a meeting to begin the attendance and proceedings flow.`);
  } else if (activeTab === 'drafts' && activeTabCount > 0) {
    parts.push(`Draft meetings are incomplete — open one to continue before scheduling.`);
  }

  return parts.join(' ');
}

// ─── CreateMeetingScreen ──────────────────────────────────────────────────────

export function buildCreateMeetingNarrative(meetingType: string, noticeDays: number): string {
  const parts: string[] = [];

  parts.push(`You are on the Create Meeting page.`);

  if (meetingType) {
    parts.push(
      `You are scheduling a "${meetingType}". ` +
      `This meeting type requires ${noticeDays} days notice — the earliest selectable date is ${noticeDays} days from today.`
    );
  } else {
    parts.push(
      `Fill in the meeting type, date, time, mode, venue, and at least 5 participants to proceed. ` +
      `The notice period and earliest selectable date are announced when you select a meeting type and open the date picker.`
    );
  }

  parts.push(
    `This page has two sections: Meeting Details and Participants. ` +
    `After completing both, you can proceed to set the agenda.`
  );

  return parts.join(' ');
}
