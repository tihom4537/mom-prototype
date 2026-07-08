import SectionHeading from './SectionHeading';
import MeetingDetailsTag from './MeetingDetailsTag';
import SmallDetailsText from './SmallDetailsText';

export type MeetingDetailsCardVariant = 'default' | 'default-shortened';

interface MeetingDetailsCardProps {
  meetingTitle?: string;
  modeOfMeeting?: string;
  date?: string;
  time?: string;
  venue?: string;
  participants?: string;
  variant?: MeetingDetailsCardVariant;
  className?: string;
}

export default function MeetingDetailsCard({
  meetingTitle = '2nd GP General Body Meeting 2026',
  modeOfMeeting = 'IN PERSON',
  date = '7/02/2026',
  time = '11:15 a.m',
  venue = 'HOSAKOTE GP office(1522007034027)',
  participants = '16 Participants',
  variant = 'default',
  className,
}: MeetingDetailsCardProps) {
  const isShortened = variant === 'default-shortened';

  if (isShortened) {
    // Horizontal: heading left, details tag inline with venue+participants, venue+count on right
    return (
      <div className={`bg-white flex flex-col xl:flex-row xl:items-center xl:justify-between gap-[12px] px-5 py-[15px] rounded-[15px] ${className ?? 'w-full'}`}>
        <SectionHeading text={meetingTitle} className="shrink-0" />
        <MeetingDetailsTag
          modeOfMeeting={modeOfMeeting}
          date={date}
          time={time}
          venue={venue}
          participants={participants}
          showVenueParticipants
        />
      </div>
    );
  }

  return (
    <div className={`bg-white flex flex-col items-start px-5 py-[15px] rounded-[15px] ${className ?? 'w-full'}`}>
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
          <SmallDetailsText text={`Venue: ${venue}`} />
          <SmallDetailsText text={`Participants : ${participants}`} />
        </div>
      </div>
    </div>
  );
}
