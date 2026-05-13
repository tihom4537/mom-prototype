import Button from './Button';
import DashboardStatusBadge from './DashboardStatusBadge';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type ActionItemStatus = 'open' | 'in-progress' | 'done';

interface ActionItemCardProps {
  taskDescription: string;
  sourceMeeting: string;
  daysSinceAssigned: string;
  status?: ActionItemStatus;
  statusOpenLabel?: string;
  statusInProgressLabel?: string;
  statusDoneLabel?: string;
  markDoneLabel?: string;
  onMarkDone?: () => void;
  className?: string;
}

export default function ActionItemCard({
  taskDescription,
  sourceMeeting,
  daysSinceAssigned,
  status = 'open',
  statusOpenLabel = 'Open',
  statusInProgressLabel = 'In Progress',
  statusDoneLabel = 'Done',
  markDoneLabel = 'Mark as Done',
  onMarkDone,
  className,
}: ActionItemCardProps) {
  const isDone = status === 'done';

  return (
    <div
      className={`border border-[rgba(106,62,49,0.16)] rounded-[10px] px-[20px] py-[16px] flex flex-col gap-[10px]
        ${isDone ? 'bg-[#f3f3f3] opacity-65' : 'bg-white'}
        ${className ?? 'w-full'}`}
    >
      {/* Row 1: task + source */}
      <div className="flex flex-col gap-[4px]">
        <p
          className={`font-semibold text-[14px] leading-[20px] tracking-[0.1px] ${isDone ? 'text-[#525c66]' : 'text-[#212121]'}`}
          style={NS}
        >
          {taskDescription}
        </p>
        <p className="font-normal text-[12px] leading-[16px] text-[#5e5e5e] tracking-[0.25px] whitespace-nowrap" style={NS}>
          {sourceMeeting}
        </p>
      </div>

      {/* Row 2: meta + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <p className="font-normal text-[12px] leading-[16px] text-[#5e5e5e] tracking-[0.3px] whitespace-nowrap" style={NS}>
            {daysSinceAssigned}
          </p>
          <div className="w-px h-[12px] bg-[rgba(221,221,221,0.8)]" />
          {status === 'open'        && <DashboardStatusBadge label={statusOpenLabel}        variant="blue" />}
          {status === 'in-progress' && <DashboardStatusBadge label={statusInProgressLabel} variant="yellow" />}
          {status === 'done'        && <DashboardStatusBadge label={statusDoneLabel}        variant="green" />}
        </div>
        <Button
          variant="filled"
          size="small"
          iconPlacement="none"
          state={isDone ? 'disabled' : 'default'}
          text={markDoneLabel}
          onClick={onMarkDone}
        />
      </div>
    </div>
  );
}
