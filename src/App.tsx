import { Routes, Route } from 'react-router-dom';
import MeetingListScreen from './screens/MeetingListScreen';
import MeetingOverviewScreen from './screens/MeetingOverviewScreen';
import AgendaListScreen from './screens/AgendaListScreen';
import MoMEntryDefaultScreen from './screens/MoMEntryDefaultScreen';
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

export default function App() {
  return (
    <Routes>
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
      <Route path="/mom-entry/post-recording" element={<MoMEntryPostRecordingScreen />} />
      <Route path="/mom-entry/feedback"       element={<MoMEntryFeedbackScreen />} />
    </Routes>
  );
}
