import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import HomepageScreen from './screens/HomepageScreen';
import FinanceScreen from './screens/FinanceScreen';
import RevenueScreen from './screens/RevenueScreen';
import HRMSScreen from './screens/HRMSScreen';
import MeetingListScreen from './screens/MeetingListScreen';
import MeetingOverviewScreen from './screens/MeetingOverviewScreen';
import AgendaListScreen from './screens/AgendaListScreen';
import MoMEntryDefaultScreen from './screens/MoMEntryDefaultScreen';
import MoMEntryDefaultScreenLegacy from './screens/MoMEntryDefaultScreenLegacy';
import MoMEntryPostRecordingScreen from './screens/MoMEntryPostRecordingScreen';
import MoMEntryFeedbackScreen from './screens/MoMEntryFeedbackScreen';
import CreateMeetingScreen from './screens/CreateMeetingScreen';
import CreateMeetingAgendaScreen from './screens/CreateMeetingAgendaScreen';
import SignNoticeScreen from './screens/SignNoticeScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import AttendanceScreenV2 from './screens/AttendanceScreenV2';
import ProceedingsReviewScreen from './screens/ProceedingsReviewScreen';
import SendToPresidentScreen from './screens/SendToPresidentScreen';
import MeetingCalendarScreen from './screens/MeetingCalendarScreen';
import MeetingConclusionScreen from './screens/MeetingConclusionScreen';
import ViewMeetingScreen from './screens/ViewMeetingScreen';
import OfficialHomeScreen from './screens/OfficialHomeScreen';
import HelplinesScreen from './screens/HelplinesScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import PublicAttendanceScreen from './screens/PublicAttendanceScreen';
import ContactDirectoryScreen from './screens/ContactDirectoryScreen';
import HomepageScreenV3 from './screens/HomepageScreenV3';
import CitizenScreen from './screens/CitizenScreen';
import CitizenDashboardScreen from './screens/CitizenDashboardScreen';
import CitizenMeetingScreen from './screens/CitizenMeetingScreen';
import PanchamitraScreen from './screens/PanchamitraScreen';

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/finance"                    element={<FinanceScreen />} />
      <Route path="/revenue"                    element={<RevenueScreen />} />
      <Route path="/hrms"                       element={<HRMSScreen />} />
      <Route path="/citizen"                    element={<CitizenScreen />} />
      <Route path="/citizen/dashboard"          element={<CitizenDashboardScreen />} />
      <Route path="/citizen/meetings"           element={<CitizenMeetingScreen />} />
      <Route path="/panchamitra"               element={<PanchamitraScreen />} />
      <Route path="/official-home"              element={<OfficialHomeScreen />} />
      <Route path="/helplines"                  element={<HelplinesScreen />} />
      <Route path="/documents"                  element={<DocumentsScreen />} />
      <Route path="/attendance-public"          element={<PublicAttendanceScreen />} />
      <Route path="/contact-directory"          element={<ContactDirectoryScreen />} />
      <Route path="/homepage"                  element={<HomepageScreen heroVariant="centered" />} />
      <Route path="/homepage-v2"               element={<HomepageScreen heroVariant="map" />} />
      <Route path="/homepage-v3"               element={<HomepageScreenV3 />} />
      <Route path="/"                          element={<MeetingOverviewScreen />} />
      <Route path="/meetings"                  element={<MeetingOverviewScreen />} />
      <Route path="/meetings/overview"         element={<MeetingOverviewScreen />} />
      <Route path="/meetings/list"             element={<MeetingListScreen />} />
      <Route path="/meetings/create"           element={<CreateMeetingScreen />} />
      <Route path="/meetings/create/agenda"       element={<CreateMeetingAgendaScreen />} />
      <Route path="/meetings/create/sign-notice" element={<SignNoticeScreen />} />
      <Route path="/meetings/attendance"       element={<AttendanceScreen />} />
      <Route path="/meetings/attendance-v2"    element={<AttendanceScreenV2 />} />
      <Route path="/meetings/closure-attendance" element={<AttendanceScreenV2 />} />
      <Route path="/meetings/proceedings-review" element={<ProceedingsReviewScreen />} />
      <Route path="/meetings/send-to-president"  element={<SendToPresidentScreen />} />
      <Route path="/meetings/conclusion"          element={<MeetingConclusionScreen />} />
      <Route path="/meetings/calendar"           element={<MeetingCalendarScreen />} />
      <Route path="/meetings/view/:id"           element={<ViewMeetingScreen />} />
      <Route path="/agenda-list"              element={<AgendaListScreen />} />
      <Route path="/mom-entry"                element={<MoMEntryDefaultScreen />} />
      <Route path="/mom-entry/legacy"         element={<MoMEntryDefaultScreenLegacy />} />
      <Route path="/mom-entry/post-recording" element={<MoMEntryPostRecordingScreen />} />
      <Route path="/mom-entry/feedback"       element={<MoMEntryFeedbackScreen />} />
    </Routes>
    </>
  );
}
