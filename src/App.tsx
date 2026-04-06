import { Routes, Route } from 'react-router-dom';
import MeetingListScreen from './screens/MeetingListScreen';
import AgendaListScreen from './screens/AgendaListScreen';
import MoMEntryDefaultScreen from './screens/MoMEntryDefaultScreen';
import MoMEntryPostRecordingScreen from './screens/MoMEntryPostRecordingScreen';
import MoMEntryFeedbackScreen from './screens/MoMEntryFeedbackScreen';

export default function App() {
  return (
    <Routes>
      <Route path="/"                         element={<MeetingListScreen />} />
      <Route path="/meetings/list"            element={<MeetingListScreen />} />
      <Route path="/agenda-list"              element={<AgendaListScreen />} />
      <Route path="/mom-entry"                element={<MoMEntryDefaultScreen />} />
      <Route path="/mom-entry/post-recording" element={<MoMEntryPostRecordingScreen />} />
      <Route path="/mom-entry/feedback"       element={<MoMEntryFeedbackScreen />} />
    </Routes>
  );
}
