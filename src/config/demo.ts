// Set to true to always include a pre-populated demo meeting in the list.
// Demo meeting (id 99) has agendas with proceedings already saved — useful for
// showing the full flow without manually entering data.
export const DEMO_MODE = true;

export const DEMO_PROCEEDINGS: Record<number, string> = {
  1: 'The minutes of the previous GP General Body Meeting held on 15/12/2025 were read out by the Secretary. Members reviewed the record of discussions and decisions. After deliberation, the minutes were confirmed as accurate and adopted unanimously by the members present. No corrections or amendments were raised.',
  2: 'The following government circulars received since the last meeting were read out: (1) RD/GP/2026/01 — Guidelines on 15th Finance Commission grant utilisation; (2) RDPR/SBM/2026/04 — Revised ODF-Plus targets for 2025–26; (3) RD/MGNREGS/2026/07 — Timely wage payment instructions. Members took note of each circular and directed the Secretary to file compliance reports for circulars 1 and 3 by the end of the month.',
  3: 'The PDO presented the quarterly status of PMGSY road construction on the Kakanur–Hosakote stretch. The contractor has completed 68% of the work. Delays attributed to monsoon disruption and material supply issues. The meeting resolved to issue a formal notice to the contractor directing completion by 31 March 2026. A progress review will be conducted at the next meeting. Ward members from Ward 3 and Ward 5 raised concerns about road access during construction — PDO directed to coordinate temporary diversion.',
  4: 'The Secretary presented a list of 8 applications received for new job cards under MGNREGS. After verification of eligibility, 6 applications were approved. 2 applications were held pending document re-submission. Ward member Lakshmi Devi raised a concern about delayed wage payments for the previous quarter — PDO directed to escalate with the Taluk office and report back within one week.',
};
