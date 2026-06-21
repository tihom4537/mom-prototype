/**
 * Narrative page summaries for the Screen Reader feature.
 * Each summary is a plain-language description of what the page shows,
 * intended to give a citizen a meaningful overview rather than a mechanical
 * list of table cells. Keyed by React Router pathname.
 */
export const PAGE_SUMMARIES: Record<string, string> = {
  '/citizen': `Welcome to the Panchatantra citizen dashboard. This page gives you a snapshot of all service applications across Karnataka's gram panchayats. At the top, you'll see summary cards showing the total number of applications, how many have been approved, how many are pending, and how many were rejected. Below that, a district-wise chart compares application volumes across all districts — you can switch between a bar chart, a donut chart, and a map view. Further down, a service-wise breakdown shows which gram panchayat services receive the most applications. Both sections include detailed tables so you can explore the numbers further.`,

  '/finance': `This is the Finance and Accounting page. It shows income, expenditure, budget allocations, and fund utilisation records across Karnataka's gram panchayats. The main chart displays a district-by-district comparison of completed and pending financial transactions as a stacked bar chart. You can filter by year, month, and district using the dropdowns at the top. A detailed table below the chart lets you browse individual records, with pagination controls to move through the data.`,

  '/revenue': `This is the Revenue Collection page. It tracks tax, fee, and levy collection across all gram panchayats in Karnataka. The chart shows collected revenue versus outstanding demand for each district as a stacked bar chart. Use the filters at the top to narrow down by year, month, or a specific district. Below the chart, a table lists detailed revenue records, and you can page through them using the pagination controls at the bottom.`,

  '/homepage': `This is the Panchatantra home page. It introduces the citizen portal and highlights the main public-access modules — including Finance, Revenue, Human Resources, Meetings, and more. Each module card describes what information is available and links you into that module's data views.`,

  '/homepage-v2': `This is the Panchatantra home page. It introduces the citizen portal and highlights the main public-access modules — including Finance, Revenue, Human Resources, Meetings, and more. Each module card describes what information is available and links you into that module's data views.`,

  '/homepage-v3': `This is the Panchatantra home page. It introduces the citizen portal and highlights the main public-access modules — including Finance, Revenue, Human Resources, Meetings, and more. Each module card describes what information is available and links you into that module's data views.`,

  '/documents': `This page provides access to official gram panchayat documents — resolutions, proceedings, orders, and other public records. You can search and filter documents by type, date, or district. Each document can be downloaded directly.`,

  '/contact-directory': `This is the Contact Directory. It lists gram panchayat officials and staff across Karnataka, along with their contact information. You can search by name, district, or designation. Use this page to find the right point of contact for any gram panchayat.`,

  '/meetings': `This page shows gram panchayat meeting records — including agendas, proceedings, and resolutions from Gram Sabhas and General Body meetings. You can filter by district or date range. Each meeting entry links to its full minutes of meeting document.`,

  '/hrms': `This is the Human Resource Management page. It shows staff records, service history, and attendance data for gram panchayat employees across Karnataka. Use the filters to look up staff by district, designation, or name.`,

  '/helplinesScreen': `This page lists gram panchayat helpline numbers and support contacts across Karnataka. Use it to find emergency contacts, grievance lines, and citizen support numbers for your district.`,

  '/panchamitra': `This is the Panchamitra page. It connects citizens with nominated gram panchayat volunteers and community representatives who can assist with service requests and information.`,
};

export function getPageSummary(pathname: string): string {
  return PAGE_SUMMARIES[pathname] ?? `You are viewing a Panchatantra citizen portal page. Screen reader summary is not available for this page.`;
}
