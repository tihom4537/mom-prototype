import Icon from './Icon';

interface MeetingDetailsTagProps {
  modeOfMeeting?: string;
  date?: string;
  time?: string;
  venue?: string;
  participants?: string;
  showVenueParticipants?: boolean;
  className?: string;
}

export default function MeetingDetailsTag({
  modeOfMeeting = 'IN PERSON',
  date = '7/02/2026',
  time = '11:15 a.m',
  venue,
  participants,
  showVenueParticipants = false,
  className,
}: MeetingDetailsTagProps) {
  return (
    <div
      className={`bg-[#f7f0ee] flex gap-3 items-end px-2 py-0.5 rounded-[5px] text-sm ${className ?? ''}`}
      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
    >
      <span className="font-bold text-black leading-6">{date}</span>
      <span className="font-normal text-[#ff7468] leading-6">•</span>
      <span className="font-normal text-black leading-6">{time}</span>
      <span className="font-normal text-[#ff7468] leading-6">•</span>
      <span className="font-normal text-black leading-6">{modeOfMeeting}</span>
      {showVenueParticipants && venue && (
        <>
          <span className="font-normal text-[#ff7468] leading-6">•</span>
          <span className="font-normal text-black leading-6">{venue}</span>
        </>
      )}
      {showVenueParticipants && participants && (
        <>
          <span className="font-normal text-[#ff7468] leading-6">•</span>
          <span className="font-normal text-black leading-6 flex items-center gap-[4px]">
            <Icon name="people" size="small" color="#212121" />
            {participants}
          </span>
        </>
      )}
    </div>
  );
}
