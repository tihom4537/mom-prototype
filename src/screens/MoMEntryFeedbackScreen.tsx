// Placeholder — will be fully implemented in the next step.
// Receives: location.state = { agenda, discussionText, feedbackResult: { category, category_reason, feedback[] } }
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { AgendaItem } from '../context/AgendaContext';
import type { FeedbackResult } from './MoMEntryPostRecordingScreen';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

export default function MoMEntryFeedbackScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    agenda?: AgendaItem;
    discussionText?: string;
    feedbackResult?: FeedbackResult;
  } | null;

  return (
    <MeetingShellLayout stepperActiveState={2}>
      <div className="bg-white p-6 rounded-[15px] text-sm text-[#727272]" style={{ fontFamily: 'Noto Sans' }}>
        <p className="font-semibold text-[#6a3e31] text-base mb-3">Post One Round of Feedback — coming next</p>

        {state?.feedbackResult && (
          <>
            <p className="mb-1 font-medium text-[#212121]">Category: {state.feedbackResult.category}</p>
            <p className="mb-3 text-xs text-[#3b3b3b]">{state.feedbackResult.category_reason}</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#212121]">
              {state.feedbackResult.feedback.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}

        <button
          className="mt-4 underline text-[#ff7468] cursor-pointer bg-transparent border-none text-sm"
          onClick={() => navigate('/mom-entry/post-recording', {
            state: { agenda: state?.agenda, discussionText: state?.discussionText, feedbackCompleted: true },
          })}
        >
          ← {t('go_back')}
        </button>
      </div>
    </MeetingShellLayout>
  );
}
