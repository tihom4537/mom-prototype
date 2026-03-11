import SectionHeading from './SectionHeading';
import MeetingDetailsTag from './MeetingDetailsTag';
import SmallDetailsText from './SmallDetailsText';

interface MeetingDetailsCardProps {
  meetingTitle?: string;
  modeOfMeeting?: string;
  date?: string;
  time?: string;
  venue?: string;
  participants?: string;
  className?: string;
}

export default function MeetingDetailsCard({
  meetingTitle = '2nd GP General Body Meeting 2026',
  modeOfMeeting = 'IN PERSON',
  date = '7/02/2026',
  time = '11:15 a.m',
  venue = 'Venue: HOSAKOTE GP office(1522007034027)',
  participants = 'Participants : 16',
  className,
}: MeetingDetailsCardProps) {
  return (
    <div className={`bg-white flex flex-col items-start p-5 rounded-[15px] ${className ?? 'w-full'}`}>
      <div className="flex gap-3 items-end w-full">
        {/* Left: heading + tag */}
        <div className="flex flex-1 flex-col gap-[18px] items-start justify-end min-h-px min-w-px">
          <SectionHeading text={meetingTitle} className="shrink-0" />
          <MeetingDetailsTag
            modeOfMeeting={modeOfMeeting}
            date={date}
            time={time}
            className="shrink-0"
          />
        </div>
        {/* Right: venue + participants */}
        <div className="flex flex-col items-start shrink-0">
          <SmallDetailsText text={venue} />
          <SmallDetailsText text={participants} />
        </div>
      </div>
    </div>
  );
}
