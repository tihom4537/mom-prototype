import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Navbar,
  Sidebar,
  Breadcrumb,
  Button,
  Icon,
  StatusBadge,
  AgendaNoLabel,
} from '../components';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

// ── Types ─────────────────────────────────────────────────────────────────────

type MeetingStatus = 'past' | 'today' | 'upcoming' | 'draft';

interface CalendarMeeting {
  id: string;
  title: string;
  time: string;
  type: string;
  status: MeetingStatus;
  participants: number;
  day: number;
  month: number; // 0-indexed
  year: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MEETINGS: CalendarMeeting[] = [
  { id: 'm1',  title: 'GP General Body Meeting — January 2026',       time: '11:00 AM', type: 'Ordinary',           status: 'past',     participants: 14, day: 15, month: 0, year: 2026 },
  { id: 'm2',  title: 'Finance Standing Committee — January 2026',    time: '2:00 PM',  type: 'Standing Committee', status: 'past',     participants: 8,  day: 22, month: 0, year: 2026 },
  { id: 'm3',  title: 'GP General Body Meeting — February 2026',      time: '11:00 AM', type: 'Ordinary',           status: 'past',     participants: 12, day: 18, month: 1, year: 2026 },
  { id: 'm4',  title: 'Social Justice Standing Committee — Feb 2026', time: '10:00 AM', type: 'Standing Committee', status: 'past',     participants: 7,  day: 25, month: 1, year: 2026 },
  { id: 'm5',  title: 'GP General Body Meeting — March 2026',         time: '11:00 AM', type: 'Ordinary',           status: 'past',     participants: 15, day: 12, month: 2, year: 2026 },
  { id: 'm6',  title: 'General Standing Committee — March 2026',      time: '3:00 PM',  type: 'Standing Committee', status: 'past',     participants: 9,  day: 20, month: 2, year: 2026 },
  { id: 'm7',  title: 'GP General Body Meeting — April 2026',         time: '11:00 AM', type: 'Ordinary',           status: 'past',     participants: 13, day: 14, month: 3, year: 2026 },
  { id: 'm8',  title: 'Finance Standing Committee — April 2026',      time: '2:30 PM',  type: 'Standing Committee', status: 'past',     participants: 8,  day: 28, month: 3, year: 2026 },
  // Today (May 9, 2026)
  { id: 'm9',  title: 'Finance Standing Committee Meeting',           time: '11:30 AM', type: 'Standing Committee', status: 'today',    participants: 12, day: 9,  month: 4, year: 2026 },
  // Upcoming
  { id: 'm11', title: 'Finance Standing Committee — May 2026',        time: '10:30 AM', type: 'Standing Committee', status: 'upcoming', participants: 8,  day: 5,  month: 4, year: 2026 },
  { id: 'm12', title: 'Grama Sabha — Ordinary',                       time: '9:00 AM',  type: 'Semi-annual',        status: 'upcoming', participants: 40, day: 20, month: 4, year: 2026 },
  { id: 'm13', title: 'GP General Body Meeting — May 2026',           time: '11:00 AM', type: 'Ordinary',           status: 'upcoming', participants: 14, day: 28, month: 4, year: 2026 },
  { id: 'm14', title: 'General Standing Committee — June 2026',       time: '2:00 PM',  type: 'Standing Committee', status: 'upcoming', participants: 9,  day: 10, month: 5, year: 2026 },
  { id: 'm15', title: 'GP General Body Meeting — June 2026',          time: '11:00 AM', type: 'Ordinary',           status: 'upcoming', participants: 14, day: 25, month: 5, year: 2026 },
  // Draft
  { id: 'm16', title: 'Makkala Sabha 2026 (Draft)',                   time: 'TBD',      type: 'Annual',             status: 'draft',    participants: 0,  day: 15, month: 6, year: 2026 },
  { id: 'm17', title: 'KDP Meeting — July 2026 (Draft)',              time: '10:00 AM', type: 'Quarterly',          status: 'draft',    participants: 0,  day: 8,  month: 6, year: 2026 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<MeetingStatus, { variant: 'green' | 'yellow' | 'red' | 'blue' | 'brown'; labelKey: string }> = {
  past:     { variant: 'brown',  labelKey: 'calendar_status_past'     },
  today:    { variant: 'blue',   labelKey: 'calendar_status_today'    },
  upcoming: { variant: 'green',  labelKey: 'calendar_status_upcoming' },
  draft:    { variant: 'yellow', labelKey: 'calendar_status_draft'    },
};

const DOT_COLOR: Record<MeetingStatus, string> = {
  past:     'bg-[#6a3e31]',
  today:    'bg-[#1976d2]',
  upcoming: 'bg-[#2e7d32]',
  draft:    'bg-[#f57f17]',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MeetingCalendarScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const TODAY = { day: 9, month: 4, year: 2026 };

  const [viewYear,  setViewYear]  = useState(TODAY.year);
  const [viewMonth, setViewMonth] = useState(TODAY.month);
  const [selectedDate, setSelectedDate] = useState<{ day: number; month: number; year: number } | null>(
    { day: TODAY.day, month: TODAY.month, year: TODAY.year }
  );

  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');

  const toggleSidebar = () => setSidebarState(s => s === 'full' ? 'shortened' : 'full');

  const MONTH_KEYS = [
    'calendar_month_jan', 'calendar_month_feb', 'calendar_month_mar',
    'calendar_month_apr', 'calendar_month_may', 'calendar_month_jun',
    'calendar_month_jul', 'calendar_month_aug', 'calendar_month_sep',
    'calendar_month_oct', 'calendar_month_nov', 'calendar_month_dec',
  ];
  const DAY_KEYS = [
    'calendar_day_sun', 'calendar_day_mon', 'calendar_day_tue',
    'calendar_day_wed', 'calendar_day_thu', 'calendar_day_fri', 'calendar_day_sat',
  ];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const totalCells      = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else                 { setViewMonth(m => m - 1); }
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else                  { setViewMonth(m => m + 1); }
  }

  const monthMeetings = MEETINGS.filter(m => m.month === viewMonth && m.year === viewYear);

  function meetingsForDay(day: number): CalendarMeeting[] {
    return monthMeetings.filter(m => m.day === day);
  }

  const selectedMeetings = selectedDate
    ? MEETINGS.filter(m => m.day === selectedDate.day && m.month === selectedDate.month && m.year === selectedDate.year)
    : [];

  function isToday(day: number) {
    return day === TODAY.day && viewMonth === TODAY.month && viewYear === TODAY.year;
  }
  function isSelected(day: number) {
    return selectedDate?.day === day && selectedDate?.month === viewMonth && selectedDate?.year === viewYear;
  }

  const legendItems: Array<{ key: MeetingStatus; labelKey: string }> = [
    { key: 'past',     labelKey: 'calendar_legend_past'     },
    { key: 'today',    labelKey: 'calendar_legend_today'    },
    { key: 'upcoming', labelKey: 'calendar_legend_upcoming' },
    { key: 'draft',    labelKey: 'calendar_legend_draft'    },
  ];

  const selectedLabel = selectedDate
    ? `${t(MONTH_KEYS[selectedDate.month])} ${selectedDate.day}, ${selectedDate.year}`
    : '';

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f1f2f2]">

      {/* ── Navbar ── */}
      <div className="shrink-0 relative z-40">
        <Navbar version="default-with-welcome" />
      </div>

      {/* ── Sidebar + main ── */}
      <div className="flex flex-1 min-h-0">
        <Sidebar state={sidebarState} onMenuClick={toggleSidebar} className="shrink-0 h-full" />

        <div className="flex flex-col flex-1 min-h-0 min-w-0">

          {/* Breadcrumb */}
          <div className="shrink-0 px-6 pt-6 pb-5 bg-[#f1f2f2]">
            <Breadcrumb
              level={3}
              items={[
                t('breadcrumb_module'),
                t('breadcrumb_meetings'),
                t('breadcrumb_calendar'),
              ]}
            />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-[50px]">
            <div className="flex flex-col gap-[20px]">

              {/* ── Calendar Section ── */}
              <div className="flex flex-col gap-[3px]">

                {/* Section header */}
                <div className="bg-white rounded-tl-[20px] rounded-tr-[20px] px-[25px] py-[20px] flex items-center justify-between">
                  <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={NS}>
                    {t('calendar_section_title')}
                  </span>
                  <div className="flex items-center gap-[16px]">
                    {legendItems.map(item => (
                      <div key={item.key} className="flex items-center gap-[6px]">
                        <div className={`size-[8px] rounded-full shrink-0 ${DOT_COLOR[item.key]}`} />
                        <span className="font-medium text-[12px] leading-[16px] text-[#525c66]" style={NS}>
                          {t(item.labelKey)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section body: calendar + sidebar */}
                <div className="bg-white rounded-bl-[20px] rounded-br-[20px] flex min-h-0">

                  {/* ── Calendar grid ── */}
                  <div className="flex-1 px-[30px] pt-[24px] pb-[30px] flex flex-col gap-[16px] border-r border-[rgba(106,62,49,0.10)]">

                    {/* Month navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={prevMonth}
                        className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-[rgba(106,62,49,0.08)] transition-colors cursor-pointer"
                      >
                        <Icon name="chevron_left" size="small" color="#6a3e31" />
                      </button>
                      <span className="font-semibold text-[18px] leading-[24px] text-[#4b4b4b]" style={NS}>
                        {t(MONTH_KEYS[viewMonth])} {viewYear}
                      </span>
                      <button
                        onClick={nextMonth}
                        className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-[rgba(106,62,49,0.08)] transition-colors cursor-pointer"
                      >
                        <Icon name="chevron_right" size="small" color="#6a3e31" />
                      </button>
                    </div>

                    {/* Grid: day headers + date cells as one bordered table */}
                    <div className="border border-[rgba(106,62,49,0.12)] rounded-[12px] overflow-hidden">

                      {/* Day-of-week header row */}
                      <div className="grid grid-cols-7 border-b border-[rgba(106,62,49,0.12)] bg-[#ddd]">
                        {DAY_KEYS.map((key, idx) => (
                          <div
                            key={key}
                            className={`py-[10px] text-center ${idx < 6 ? 'border-r border-[rgba(106,62,49,0.08)]' : ''}`}
                          >
                            <span className="font-semibold text-[11px] leading-[16px] tracking-[0.5px] text-[#727272] uppercase" style={NS}>
                              {t(key)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Date cells grid */}
                      <div className="grid grid-cols-7">
                        {Array.from({ length: totalCells }, (_, i) => {
                          const cellIndex   = i - firstDayOfMonth + 1;
                          const isPrevMonth = cellIndex < 1;
                          const isNextMonth = cellIndex > daysInMonth;
                          const displayDay  = isPrevMonth
                            ? daysInPrevMonth + cellIndex
                            : isNextMonth
                            ? cellIndex - daysInMonth
                            : cellIndex;

                          const isCurrentMonth = !isPrevMonth && !isNextMonth;
                          const dayMeetings    = isCurrentMonth ? meetingsForDay(cellIndex) : [];
                          const todayCell      = isCurrentMonth && isToday(cellIndex);
                          const selectedCell   = isCurrentMonth && isSelected(cellIndex);

                          // border: right for all but last col, bottom for all but last row
                          const col       = i % 7;
                          const row       = Math.floor(i / 7);
                          const totalRows = totalCells / 7;
                          const borderR   = col < 6 ? 'border-r' : '';
                          const borderB   = row < totalRows - 1 ? 'border-b' : '';

                          return (
                            <button
                              key={i}
                              onClick={() => {
                                if (!isCurrentMonth) return;
                                setSelectedDate({ day: cellIndex, month: viewMonth, year: viewYear });
                              }}
                              disabled={!isCurrentMonth}
                              className={`
                                relative flex flex-col items-center gap-[4px] py-[10px] px-[4px] min-h-[80px]
                                border-[rgba(106,62,49,0.08)] ${borderR} ${borderB}
                                transition-colors
                                ${!isCurrentMonth ? 'cursor-default bg-[rgba(0,0,0,0.02)]' : 'cursor-pointer'}
                                ${selectedCell
                                  ? 'bg-[rgba(106,62,49,0.16)]'
                                  : todayCell
                                  ? 'bg-[rgba(106,62,49,0.05)] hover:bg-[rgba(106,62,49,0.10)]'
                                  : isCurrentMonth
                                  ? 'hover:bg-[rgba(106,62,49,0.04)]'
                                  : ''}
                              `}
                            >
                              {/* Day number */}
                              <span
                                className={`
                                  font-semibold text-[14px] leading-[20px]
                                  ${selectedCell
                                    ? 'text-[#6a3e31]'
                                    : todayCell
                                    ? 'text-[#6a3e31]'
                                    : isCurrentMonth
                                    ? 'text-[#4b4b4b]'
                                    : 'text-[#c0c0c0]'}
                                `}
                                style={NS}
                              >
                                {displayDay}
                              </span>

                              {/* Today indicator ring */}
                              {todayCell && !selectedCell && (
                                <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[26px] h-[26px] rounded-full border-2 border-[#6a3e31] pointer-events-none" />
                              )}

                              {/* Selected indicator */}
                              {selectedCell && (
                                <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[26px] h-[26px] rounded-full bg-[#6a3e31] pointer-events-none flex items-center justify-center">
                                  <span className="font-semibold text-[14px] leading-[20px] text-white" style={NS}>
                                    {displayDay}
                                  </span>
                                </div>
                              )}

                              {/* Meeting dots */}
                              {dayMeetings.length > 0 && (
                                <div className="flex items-center gap-[3px] flex-wrap justify-center mt-[2px]">
                                  {dayMeetings.slice(0, 3).map(m => (
                                    <div
                                      key={m.id}
                                      className={`size-[5px] rounded-full shrink-0 ${DOT_COLOR[m.status]}`}
                                    />
                                  ))}
                                  {dayMeetings.length > 3 && (
                                    <span className="text-[12px] leading-[12px] font-medium text-[#727272]" style={NS}>
                                      +{dayMeetings.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Count label */}
                              {dayMeetings.length > 0 && (
                                <span
                                  className={`text-[12px] leading-[12px] font-medium ${selectedCell ? 'text-[#6a3e31]' : 'text-[#727272]'}`}
                                  style={NS}
                                >
                                  {dayMeetings.length === 1 ? '1 meeting' : `${dayMeetings.length} meetings`}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Month summary bar */}
                    <div className="flex items-center gap-[12px] pt-[4px]">
                      <span className="font-medium text-[13px] leading-[20px] text-[#727272]" style={NS}>
                        {t(MONTH_KEYS[viewMonth])}:
                      </span>
                      {monthMeetings.length === 0 ? (
                        <span className="font-medium text-[13px] leading-[20px] text-[#727272]" style={NS}>
                          {t('calendar_no_meetings')}
                        </span>
                      ) : (
                        <div className="flex items-center gap-[8px] flex-wrap">
                          {(['past', 'today', 'upcoming', 'draft'] as MeetingStatus[]).map(s => {
                            const count = monthMeetings.filter(m => m.status === s).length;
                            if (count === 0) return null;
                            const cfg = STATUS_BADGE[s];
                            return (
                              <AgendaNoLabel key={s} type="new-grey" text={`${count} ${t(cfg.labelKey)}`} />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Detail sidebar ── */}
                  <div className="w-[320px] shrink-0 flex flex-col px-[24px] pt-[24px] pb-[30px] gap-[16px] overflow-y-auto">

                    {/* Sidebar heading */}
                    <div className="flex items-center gap-[10px]">
                      <span className="font-semibold text-[15px] leading-[22px] text-[#6a3e31]" style={NS}>
                        {selectedDate ? `${t('calendar_meetings_on')} ${selectedLabel}` : t('calendar_sidebar_title')}
                      </span>
                      {selectedMeetings.length > 0 && (
                        <AgendaNoLabel type="default" text={`${selectedMeetings.length}`} />
                      )}
                    </div>

                    {/* Meeting cards or empty state */}
                    {!selectedDate || selectedMeetings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 gap-[10px] py-[40px]">
                        <div className="w-[44px] h-[44px] rounded-full bg-[rgba(106,62,49,0.08)] flex items-center justify-center">
                          <Icon name="calendar_month" size="medium" color="#6a3e31" />
                        </div>
                        <span className="font-medium text-[13px] leading-[20px] text-[#727272] text-center" style={NS}>
                          {selectedDate ? t('calendar_no_meetings') : t('calendar_sidebar_empty')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[10px]">
                        {selectedMeetings.map(meeting => {
                          const cfg = STATUS_BADGE[meeting.status];
                          const ctaKey = meeting.status === 'draft'
                            ? 'btn_edit'
                            : meeting.status === 'today'
                            ? 'btn_start_meeting'
                            : 'btn_view_meeting';
                          return (
                            <div
                              key={meeting.id}
                              className="flex flex-col gap-[10px] p-[16px] rounded-[16px] border border-[rgba(106,62,49,0.12)] bg-white hover:border-[rgba(106,62,49,0.24)] transition-colors"
                            >
                              <div className="flex items-center justify-between gap-[8px]">
                                <StatusBadge label={t(cfg.labelKey)} variant={cfg.variant} />
                                <span className="font-medium text-[12px] leading-[16px] text-[#727272]" style={NS}>
                                  {meeting.time}
                                </span>
                              </div>
                              <p className="font-semibold text-[13px] leading-[20px] text-[#2d2d2d]" style={NS}>
                                {meeting.title}
                              </p>
                              <div className="flex items-center gap-[8px]">
                                <span className="font-medium text-[11px] leading-[16px] text-[#727272] bg-[rgba(106,62,49,0.06)] rounded-[6px] px-[8px] py-[3px]" style={NS}>
                                  {meeting.type}
                                </span>
                                {meeting.participants > 0 && (
                                  <div className="flex items-center gap-[4px]">
                                    <Icon name="people_alt" size="small" color="#9e9e9e" />
                                    <span className="font-medium text-[11px] leading-[16px] text-[#727272]" style={NS}>
                                      {meeting.participants} {t('calendar_participants')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant={meeting.status === 'today' ? 'filled' : 'outlined'}
                                size="small"
                                text={t(ctaKey)}
                                iconPlacement="none"
                                onClick={() => navigate('/meetings/list')}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Bottom action row ── */}
              <div className="flex items-center justify-center gap-[10px]">
                <Button
                  variant="outlined"
                  iconPlacement="left"
                  iconName="arrow_back"
                  text={t('calendar_go_back')}
                  onClick={() => navigate('/meetings/overview')}
                />
                <Button
                  variant="filled"
                  iconPlacement="right"
                  iconName="arrow_forward"
                  text={t('calendar_view_list')}
                  onClick={() => navigate('/meetings/list')}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
