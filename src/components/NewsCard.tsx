import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type NewsCardType = 'initiatives' | 'events' | 'guidelines' | 'notifications';

// ── Shared sub-components ──────────────────────────────────────────────────

function StatusTag({ label }: { label: string }) {
  return (
    <div className="bg-[#e3f2d9] flex items-start overflow-clip px-[10px] py-[3px] rounded-[100px] shrink-0">
      <span className="font-medium text-[11px] text-[#2e7d32] tracking-[0.5px] whitespace-nowrap leading-normal" style={NS}>
        {label}
      </span>
    </div>
  );
}

function DateRange({ startDate, endDate }: { startDate: string; endDate: string }) {
  return (
    <div className="bg-[#fdf0e8] flex gap-[6px] items-center overflow-clip px-[10px] py-[6px] rounded-[6px] shrink-0 whitespace-nowrap leading-normal">
      <span className="font-normal text-[11px] text-[#5E5E5E]" style={NS}>Start:</span>
      <span className="font-medium text-[12px] text-[#212121]" style={NS}>{startDate}</span>
      <span className="font-bold text-[11px] text-[#ff7468]" style={NS}>→</span>
      <span className="font-normal text-[11px] text-[#5E5E5E]" style={NS}>End:</span>
      <span className="font-medium text-[12px] text-[#212121]" style={NS}>{endDate}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-[4px] items-center overflow-clip shrink-0">
      <span className="font-normal text-[11px] text-[#727272] whitespace-nowrap" style={NS}>{label}</span>
      <span className="font-medium text-[12px] text-[#212121] whitespace-nowrap" style={NS}>{value}</span>
    </div>
  );
}

function DatePill({ date }: { date: string }) {
  return (
    <div className="bg-[#fae1d1] flex gap-[4px] items-center overflow-clip px-[5px] py-[2px] rounded-[8px] shrink-0 whitespace-nowrap">
      <span className="font-normal text-[11px] text-[#727272]" style={NS}>Date:</span>
      <span className="font-medium text-[12px] text-[#212121]" style={NS}>{date}</span>
    </div>
  );
}

function DownloadButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      className="bg-[#6a3e31] flex gap-[8px] items-center justify-center overflow-clip pl-[12px] pr-[16px] py-[8px] rounded-[8px] shrink-0 cursor-pointer hover:bg-[#7d4a3a] transition-colors"
      onClick={onClick}
    >
      <Icon name="download" size="small" color="#ffffff" />
      <span className="font-medium text-[12px] text-white tracking-[0.5px] whitespace-nowrap leading-[16px]" style={NS}>
        Download
      </span>
    </button>
  );
}

// ── Card shell ─────────────────────────────────────────────────────────────

const cardBase =
  'bg-white border border-[#dddddd] flex flex-col gap-[10px] items-start p-[16px] rounded-[15px] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)]';
const cardBaseWide =
  'bg-white border border-[#dddddd] flex flex-col gap-[20px] items-end p-[16px] rounded-[15px] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)]';

// ── Initiatives Card ────────────────────────────────────────────────────────

export interface InitiativesCardProps {
  status?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  region?: string;
  posted?: string;
  className?: string;
}

export function InitiativesCard({
  status = 'PUBLISHED',
  title = 'NCORD AWARENESS MEETING',
  startDate = '30-Mar-2026',
  endDate = '30-Mar-2026',
  region = 'KOLALA (1525003023)',
  posted = '1 Day ago',
  className,
}: InitiativesCardProps) {
  return (
    <div className={`${cardBase} ${className ?? ''}`}>
      <div className="flex items-center justify-between w-full shrink-0">
        <StatusTag label={status} />
        <div className="flex gap-[4px] items-center overflow-clip shrink-0">
          <span className="font-normal text-[11px] text-[#727272] whitespace-nowrap" style={NS}>Posted:</span>
          <span className="font-normal text-[11px] text-[#727272] whitespace-nowrap" style={NS}>{posted}</span>
        </div>
      </div>
      <p className="font-semibold text-[15px] text-[#6a3e31] leading-normal w-full" style={NS}>{title}</p>
      <DateRange startDate={startDate} endDate={endDate} />
      <MetaRow label="Region:" value={region} />
    </div>
  );
}

// ── Events Card ─────────────────────────────────────────────────────────────

export interface EventsCardProps {
  status?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  totalAssignGp?: string;
  posted?: string;
  className?: string;
}

export function EventsCard({
  status = 'PUBLISHED',
  title = 'NCORD AWARENESS MEETING',
  startDate = '30-Mar-2026',
  endDate = '30-Mar-2026',
  totalAssignGp = '1',
  posted = '1 Day ago',
  className,
}: EventsCardProps) {
  return (
    <div className={`${cardBase} ${className ?? ''}`}>
      <div className="flex items-center justify-between w-full shrink-0">
        <StatusTag label={status} />
        <div className="flex gap-[4px] items-center overflow-clip shrink-0">
          <span className="font-normal text-[11px] text-[#727272] whitespace-nowrap" style={NS}>Posted:</span>
          <span className="font-normal text-[11px] text-[#727272] whitespace-nowrap" style={NS}>{posted}</span>
        </div>
      </div>
      <p className="font-semibold text-[15px] text-[#6a3e31] leading-normal w-full" style={NS}>{title}</p>
      <DateRange startDate={startDate} endDate={endDate} />
      <MetaRow label="Total Assign GP:" value={totalAssignGp} />
    </div>
  );
}

// ── Guidelines Card ──────────────────────────────────────────────────────────

export interface GuidelinesCardProps {
  date?: string;
  title?: string;
  description?: string;
  showDescription?: boolean;
  onDownload?: () => void;
  className?: string;
}

export function GuidelinesCard({
  date = '14/07/2021',
  title = 'Operational guidelines for the implementation of the 15th Finance commission',
  description = 'recommendations on rural local bodies grants during the period 2021-2022 to 2025-2026',
  showDescription = true,
  onDownload,
  className,
}: GuidelinesCardProps) {
  return (
    <div className={`${cardBaseWide} ${className ?? ''}`}>
      <div className="flex flex-col gap-[15px] items-start w-full">
        <DatePill date={date} />
        <div className="flex flex-col gap-[5px] items-start w-full">
          <p className="font-semibold text-[14px] text-[#6a3e31] leading-normal w-full" style={NS}>{title}</p>
          {showDescription && (
            <p className="font-normal text-[12px] text-[rgba(75,75,75,0.8)] leading-normal w-full" style={NS}>
              {description}
            </p>
          )}
        </div>
      </div>
      <DownloadButton onClick={onDownload} />
    </div>
  );
}

// ── Notifications Card ───────────────────────────────────────────────────────

export interface NotificationsCardProps {
  date?: string;
  title?: string;
  description?: string;
  showDescription?: boolean;
  onDownload?: () => void;
  className?: string;
}

export function NotificationsCard({
  date = '14/07/2021',
  title = 'Panchatantra 2.0 Updates - 05.10.2023',
  description = 'Description content here',
  showDescription = true,
  onDownload,
  className,
}: NotificationsCardProps) {
  return (
    <div className={`${cardBaseWide} ${className ?? ''}`}>
      <div className="flex flex-col gap-[15px] items-start w-full">
        <DatePill date={date} />
        <div className="flex flex-col gap-[5px] items-start w-full">
          <p className="font-semibold text-[14px] text-[#6a3e31] leading-normal w-full" style={NS}>{title}</p>
          {showDescription && (
            <p className="font-normal text-[12px] text-[rgba(75,75,75,0.8)] leading-normal w-full" style={NS}>
              {description}
            </p>
          )}
        </div>
      </div>
      <DownloadButton onClick={onDownload} />
    </div>
  );
}

// ── Default export (generic switch) ─────────────────────────────────────────

interface NewsCardProps {
  type: NewsCardType;
  className?: string;
  status?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  region?: string;
  totalAssignGp?: string;
  posted?: string;
  date?: string;
  description?: string;
  showDescription?: boolean;
  onDownload?: () => void;
}

export default function NewsCard({ type, ...props }: NewsCardProps) {
  if (type === 'initiatives') return <InitiativesCard {...props} />;
  if (type === 'events') return <EventsCard {...props} />;
  if (type === 'guidelines') return <GuidelinesCard {...props} />;
  if (type === 'notifications') return <NotificationsCard {...props} />;
  return null;
}
