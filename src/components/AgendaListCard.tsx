import Button from './Button';
import SectionHeading from './SectionHeading';
import AgendaNoLabel from './AgendaNoLabel';

interface AgendaListCardProps {
  heading: string;
  countLabel: string;
  /** Label for the right-side toggle button */
  viewToggleLabel: string;
  /** Icon name for the right-side toggle button */
  viewToggleIcon?: string;
  onViewToggle?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function AgendaListCard({
  heading,
  countLabel,
  viewToggleLabel,
  viewToggleIcon = 'format_list_bulleted',
  onViewToggle,
  children,
  className,
}: AgendaListCardProps) {
  return (
    <div className={`flex flex-col gap-[3px] items-start w-full ${className ?? ''}`}>

      {/* ── List header ── */}
      <div className="bg-white flex flex-col px-[25px] py-[15px] rounded-tl-[20px] rounded-tr-[20px] shrink-0 w-full">
        <div className="flex items-center justify-between w-full">
          {/* Left: heading + count badge */}
          <div className="flex items-center gap-[17px]">
            <SectionHeading text={heading} />
            <AgendaNoLabel text={countLabel} />
          </div>
          {/* Right: view toggle button */}
          <Button
            variant="filled"
            iconPlacement="left"
            iconName={viewToggleIcon}
            text={viewToggleLabel}
            onClick={onViewToggle}
            className="shrink-0"
          />
        </div>
      </div>

      {/* ── List body ── */}
      <div className="bg-white flex flex-col gap-[15px] pb-[30px] pt-[25px] px-[25px] rounded-bl-[20px] rounded-br-[20px] shrink-0 w-full">
        {children}
      </div>

    </div>
  );
}
