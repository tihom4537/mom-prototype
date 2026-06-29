/**
 * Narrative page summaries — three-layer onion model:
 *   Layer 1 (context)     — what the page shows, top data point
 *   Layer 2 (key insights)— computed observations from live data
 *   Layer 3 (detail)      — user-driven (future: ask anything)
 *
 * Screens with live data register a narrator via registerPageNarrator().
 * Static fallbacks cover pages without live data.
 */

type NarratorFn = () => string;
const LIVE_NARRATORS: Map<string, NarratorFn> = new Map();

/** Called by screens to register a live data-driven narrator. */
export function registerPageNarrator(pathname: string, fn: NarratorFn) {
  LIVE_NARRATORS.set(pathname, fn);
}

/** Called by screens on unmount to clean up. */
export function unregisterPageNarrator(pathname: string) {
  LIVE_NARRATORS.delete(pathname);
}

/** Static fallbacks for pages without live data. */
const STATIC_SUMMARIES: Record<string, string> = {
  '/homepage': `This is the Panchatantra home page. It introduces the citizen portal and highlights the main public-access modules — Finance, Revenue, Human Resources, Meetings, and more. Each module card describes what information is available and links you into that data view.`,

  '/homepage-v2': `This is the Panchatantra home page. It introduces the citizen portal and highlights the main public-access modules — Finance, Revenue, Human Resources, Meetings, and more.`,

  '/homepage-v3': `This is the Panchatantra home page. It introduces the citizen portal and highlights the main public-access modules — Finance, Revenue, Human Resources, Meetings, and more.`,

  '/documents': `This page provides access to official gram panchayat documents — resolutions, proceedings, orders, and other public records. You can search and filter by type, date, or district. Each document can be downloaded directly.`,

  '/contact-directory': `This is the Contact Directory. It lists gram panchayat officials and staff across Karnataka with their contact information. Search by name, district, or designation to find the right point of contact.`,

  '/meetings': `This page shows gram panchayat meeting records — agendas, proceedings, and resolutions from Gram Sabhas and General Body meetings. You can filter by district or date range.`,

  '/hrms': `This is the Human Resource Management page. It shows staff records, service history, and attendance data for gram panchayat employees across Karnataka.`,

  '/helplinesScreen': `This page lists gram panchayat helpline numbers and support contacts across Karnataka — emergency contacts, grievance lines, and citizen support numbers by district.`,

  '/panchamitra': `This is the Panchamitra page. It connects citizens with nominated gram panchayat volunteers and community representatives who can assist with service requests.`,
};

/** Returns the best available summary for the current route. */
export function getPageSummary(pathname: string): string {
  const live = LIVE_NARRATORS.get(pathname);
  if (live) return live();
  return STATIC_SUMMARIES[pathname]
    ?? 'You are viewing a Panchatantra citizen portal page. Screen reader summary is not yet available for this page.';
}
