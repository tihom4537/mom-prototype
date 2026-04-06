import SectionHeading from './SectionHeading';
import AgendaCard from './AgendaCard';
import QuestionFieldsSmall from './QuestionFieldsSmall';
import InfoBox from './InfoBox';
import TextAreaContainer from './TextAreaContainer';
import MicButton from './MicButton';
import Button from './Button';

import Icon from './Icon';

export type MoMPopUpState = 'default' | 'after-1-entry' | 'audio-recording';

interface MoMEntryPopUpProps {
  state?: MoMPopUpState;
  agendaHeading?: string;
  agendaDescription?: string;
  onClose?: () => void;
  onGetFeedback?: () => void;
  onStartRecording?: () => void;
  className?: string;
}

export default function MoMEntryPopUp({
  state = 'default',
  agendaHeading = 'Reading and reporting on the proceedings of the previous meeting',
  agendaDescription = 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.',
  onClose,
  onGetFeedback,
  onStartRecording,
  className,
}: MoMEntryPopUpProps) {
  const isRecording = state === 'audio-recording';

  return (
    <div className={`bg-white flex flex-col gap-11 items-end p-[25px] rounded-[15px] w-[829px] ${className ?? ''}`}>
      {/* Top section */}
      <div className="flex flex-col gap-5 items-start shrink-0 w-full">
        {/* Title row */}
        <div className="flex items-end justify-between shrink-0 w-full">
          <SectionHeading text="Enter the Meeting Proceedings" className="shrink-0" />
          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center justify-center p-2 rounded-lg shrink-0 cursor-pointer bg-transparent border-none"
          >
            <Icon name="close" size="medium" color="#212121" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-[25px] items-end shrink-0 w-full">
          {/* Agenda card */}
          <AgendaCard
            stage="inside"
            agendaNumber="1"
            agendaHeading={agendaHeading}
            agendaDescription={agendaDescription}
            className="shrink-0 w-full"
          />

          <div className="flex flex-col gap-[25px] items-start shrink-0 w-full">
            {/* Action input */}
            <div className="flex flex-col gap-[6px] items-start shrink-0 w-full">
              <QuestionFieldsSmall
                type="mandatory"
                questionText="Select the Action taken for this Agenda"
                className="shrink-0 w-full"
              />
              <Button
                variant="outlined"
                iconPlacement="right"
                text="Select Action Assigned"
                className="shrink-0"
              />
            </div>

            {/* Discussion input */}
            <div className="flex flex-col gap-[6px] items-start shrink-0 w-full relative">
              <div className="flex gap-1 items-center shrink-0 w-full">
                <QuestionFieldsSmall
                  type="mandatory"
                  questionText="Enter the Agenda discussion points"
                  className="shrink-0"
                />
              </div>
              <InfoBox type="outlined" className="shrink-0 w-full" />
              <TextAreaContainer
                state={isRecording ? 'recording' : 'default'}
                className="shrink-0 w-full"
              />
              {/* Floating mic button */}
              <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '-25px' }}>
                <MicButton onClick={onStartRecording} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-start justify-end shrink-0 mt-6">
        <Button
          variant="filled"
          state="disabled"
          text="Get Feedback"
          onClick={onGetFeedback}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
