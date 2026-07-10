import { useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMeetings } from '../context/MeetingsContext';
import type { AttendanceRow, BiometricStatus, MarkStatus } from '../context/MeetingsContext';
import {
  MeetingDetailsCard,
  SectionHolder,
  SearchInput,
  DropdownField,
  Button,
  Icon,
  QuorumBar,
  AttendancePill,
  InfoBox,
} from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';
import { useMediaQuery } from '../hooks/useMediaQuery';

const QUORUM_PERCENT   = 51;
const NO_BIOMETRIC_MAX = 2;

const ELECTED_DESIGNATIONS = ['President', 'Vice President', 'Ward Member'];
const isElected = (designation: string) =>
  ELECTED_DESIGNATIONS.some(d => designation.toLowerCase().startsWith(d.toLowerCase()));

const INITIAL: AttendanceRow[] = [
  { id: 1,  name: 'Ramesh Kumar',    designation: 'PDO',            gpName: 'Kakanur GP',  phone: '9876543210', email: 'ramesh@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 2,  name: 'Savitha Gowda',   designation: 'Secretary',      gpName: 'Kakanur GP',  phone: '9845123456', email: 'savitha@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 3,  name: 'Manjunath B.',    designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9741230987', email: 'manju@kgp.gov.in',    status: 'unmarked', biometric: 'none', reason: '' },
  { id: 4,  name: 'Lakshmi Devi',    designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9632014785', email: 'lakshmi@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 5,  name: 'Suresh Patil',    designation: 'President',      gpName: 'Kakanur GP',  phone: '9512345678', email: 'suresh@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 6,  name: 'Anitha Rao',      designation: 'Vice President', gpName: 'Kakanur GP',  phone: '9423567890', email: 'anitha@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 7,  name: 'Prakash Hegde',   designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9334512678', email: 'prakash@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 8,  name: 'Kaveri S.',       designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9245631089', email: 'kaveri@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 9,  name: 'Nagesh M.',       designation: 'Ward Member',    gpName: 'Kakanur GP',  phone: '9156789023', email: 'nagesh@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
  { id: 10, name: 'Bhavana Naik',    designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '9067891234', email: 'bhavana@kgp.gov.in',  status: 'unmarked', biometric: 'none', reason: '' },
  { id: 11, name: 'Raju Chandra',    designation: 'Ward Member',    gpName: 'Kakanur GP',  phone: '8978012345', email: 'raju@kgp.gov.in',     status: 'unmarked', biometric: 'none', reason: '' },
  { id: 12, name: 'Geetha Kumari',   designation: 'Ward Member',    gpName: 'Hosakote GP', phone: '8889123456', email: 'geetha@kgp.gov.in',   status: 'unmarked', biometric: 'none', reason: '' },
];

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

// ─── Biometric cell (same as V2) ─────────────────────────────────────────────
function BiometricCell({ status, biometric, onTake, tBioTake, tBioTaken, tBioPending, tBioFailed, tRetry }: {
  status: MarkStatus;
  biometric: BiometricStatus;
  onTake: () => void;
  tBioTake: string;
  tBioTaken: string;
  tBioPending: string;
  tBioFailed: string;
  tRetry: string;
}) {
  if (status !== 'present') return <span className="text-[12px] text-[#c6c6c6]" style={NS}>—</span>;

  if (biometric === 'none') {
    return (
      <button type="button" onClick={onTake}
        className="text-[13px] text-[#6a3e31] underline decoration-[#6a3e31] underline-offset-[2px] hover:text-[#ae6651] transition-colors"
        style={NS}>
        {tBioTake}
      </button>
    );
  }
  if (biometric === 'taken') return (
    <div className="flex items-center gap-[5px]">
      <Icon name="fingerprint" size="small" color="#2e7d32" />
      <span className="text-[13px] font-medium text-[#2e7d32]" style={NS}>{tBioTaken}</span>
    </div>
  );
  if (biometric === 'pending') return (
    <div className="flex items-center gap-[5px]">
      <Icon name="fingerprint" size="small" color="#f57f17" />
      <span className="text-[13px] font-medium text-[#f57f17]" style={NS}>{tBioPending}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-[5px]">
      <Icon name="fingerprint" size="small" color="#c62828" />
      <span className="text-[13px] font-medium text-[#c62828]" style={NS}>{tBioFailed}</span>
      <button type="button" onClick={onTake} className="flex items-center justify-center ml-[2px] hover:opacity-70 transition-opacity" title={tRetry}>
        <Icon name="refresh" size="small" color="#ae6651" />
      </button>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AttendanceScreen() {
  const { t, tDesignation } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const meetingId: number | undefined = (location.state as { meetingId?: number } | null)?.meetingId;
  const { meetings, updateMeeting, setOpeningAbsentIds, attendanceRows, setAttendanceRows } = useMeetings();
  const currentMeeting = meetingId != null ? meetings.find(m => m.id === meetingId) : undefined;
  // Once attendance has been proceeded past (stepsCompleted >= 1), never celebrate again on revisit.
  const celebrationLocked = (currentMeeting?.stepsCompleted ?? 0) >= 1;
  // GP and Email columns only fit comfortably at wider laptop/desktop viewports —
  // below this, the table starts clipping/overflowing its container.
  const showWideColumns = useMediaQuery('(min-width: 1366px)');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [permissionFiles, setPermissionFiles] = useState<Record<number, File | null>>({});
  const permFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const rows = attendanceRows ?? INITIAL;
  function setRows(updater: AttendanceRow[] | ((prev: AttendanceRow[]) => AttendanceRow[])) {
    const next = typeof updater === 'function' ? updater(rows) : updater;
    setAttendanceRows(next);
  }

  const total    = rows.length;
  const present  = rows.filter(r => r.status === 'present').length;
  const absent   = rows.filter(r => r.status === 'absent').length;
  const unmarked = rows.filter(r => r.status === 'unmarked').length;
  const noBiometricCount = rows.filter(r => r.status === 'present' && r.biometric === 'none').length;
  const electedRows = rows.filter(r => isElected(r.designation));
  const electedTotal   = electedRows.length;
  const electedPresent = electedRows.filter(r => r.status === 'present').length;
  const quorumPct = electedTotal > 0 ? Math.round((electedPresent / electedTotal) * 100) : 0;
  const quorumMet = quorumPct >= QUORUM_PERCENT;
  const atBiometricLimit = noBiometricCount >= NO_BIOMETRIC_MAX;
  const canProceed = quorumMet && noBiometricCount <= NO_BIOMETRIC_MAX;

  function update(id: number, patch: Partial<AttendanceRow>) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  function markStatus(id: number, s: 'present' | 'absent') {
    const row = rows.find(r => r.id === id);
    if (row?.status === s) {
      // toggle off → unmarked
      update(id, { status: 'unmarked', biometric: 'none', reason: '' });
    } else {
      update(id, { status: s, biometric: 'none', reason: '' });
    }
  }

  function handleTakeBiometric(id: number) {
    const row = rows.find(r => r.id === id)!;
    if (row.biometric === 'none') {
      const noBioOthers = rows.filter(r => r.id !== id && r.status === 'present' && (r.biometric === 'pending' || r.biometric === 'failed')).length;
      const result: BiometricStatus = noBioOthers >= NO_BIOMETRIC_MAX ? 'taken' : id % 3 === 0 ? 'failed' : id % 2 === 0 ? 'pending' : 'taken';
      update(id, { biometric: result });
    } else if (row.biometric === 'failed') {
      update(id, { biometric: 'taken' });
    }
  }

  const allPresent = rows.every(r => r.status === 'present');
  function markAllPresent() {
    setRows(prev => prev.map(r => ({ ...r, status: 'present' as MarkStatus, biometric: 'none' as BiometricStatus, reason: '' })));
  }
  function unmarkAll() {
    setRows(prev => prev.map(r => ({ ...r, status: 'unmarked' as MarkStatus, biometric: 'none' as BiometricStatus, reason: '' })));
  }

  function showReason(row: AttendanceRow) {
    return row.status === 'absent' || (row.status === 'present' && (row.biometric === 'failed' || row.biometric === 'pending'));
  }

  const F_PRESENT      = t('attendance_filter_present');
  const F_ABSENT       = t('attendance_filter_absent');
  const F_NO_BIOMETRIC = t('attendance_filter_no_biometric');
  const filterOptions  = [t('attendance_filter_all'), F_PRESENT, F_ABSENT, F_NO_BIOMETRIC];

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === F_PRESENT)      list = list.filter(r => r.status === 'present');
    if (filter === F_ABSENT)       list = list.filter(r => r.status === 'absent');
    if (filter === F_NO_BIOMETRIC) list = list.filter(r => r.status === 'present' && (r.biometric === 'pending' || r.biometric === 'failed'));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.designation.toLowerCase().includes(q) || r.gpName.toLowerCase().includes(q));
    }
    return list;
  }, [rows, filter, search, F_PRESENT, F_ABSENT, F_NO_BIOMETRIC]);

  return (
    <MeetingShellLayout
      stepperActiveState={1}
      backRoute="/meetings/list"
      backLabel={t('nav_back_to_meetings')}
      breadcrumbItems={[t('breadcrumb_module'), t('breadcrumb_meetings'), t('breadcrumb_attendance')]}
    >
              <MeetingDetailsCard
                variant="default-shortened"
                meetingTitle={t('mock_meeting_title')}
                modeOfMeeting={t('meeting_type_in_person')}
                date="19/03/2026"
                time="10:00 a.m"
                venue="Kakanur GP Office (1501001003)"
                participants={`${total} ${t('meeting_participants_label')}`}
              />

              <SectionHolder
                variant="with-tag"
                title={t('attendance_section_title')}
                tagText={`${total} ${t('review_viz_participants')}`}
                bodyClassName="px-[25px] pt-[20px] pb-[30px] flex flex-col gap-[16px]"
              >
                <InfoBox type="plain" text={t('attendance_hint')} />

                <QuorumBar
                  total={electedTotal} present={electedPresent} absent={electedRows.filter(r => r.status === 'absent').length} unmarked={electedRows.filter(r => r.status === 'unmarked').length}
                  noBiometricCount={noBiometricCount} quorumPct={quorumPct} quorumMet={quorumMet}
                  quorumRequired={QUORUM_PERCENT}
                  celebrationLocked={celebrationLocked}
                />

                <div className="flex items-center justify-between w-full">
                  <SearchInput value={search} onChange={setSearch} placeholder={t('attendance_search_placeholder')} className="w-[240px]" />
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[12px] font-medium leading-[16px] tracking-[0.5px] text-[#6f6f6f] whitespace-nowrap" style={NS}>{t('attendance_filter_label')}</span>
                    <DropdownField value={filter} onChange={setFilter} options={filterOptions} placeholder="All" className="w-[150px]" />
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-[6px] border border-[#c6c6c6] overflow-hidden">
                <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'auto' }}>

                  <thead>
                    <tr className="bg-[#ddd]">
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle whitespace-nowrap" style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid', borderLeftColor: '#dddddd' }}>
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_sl')}</span>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle" style={{ width: '150px' }}>
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal whitespace-nowrap" style={NS}>{t('attendance_col_name_designation')}</span>
                      </th>
                      {showWideColumns && (
                        <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle whitespace-nowrap">
                          <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal whitespace-nowrap" style={NS}>{t('attendance_col_gp')}</span>
                        </th>
                      )}
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle whitespace-nowrap">
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal whitespace-nowrap" style={NS}>{t('attendance_col_phone')}</span>
                      </th>
                      {showWideColumns && (
                        <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle whitespace-nowrap">
                          <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal whitespace-nowrap" style={NS}>{t('attendance_col_email')}</span>
                        </th>
                      )}
                      <th className="px-[12px] py-[8px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <div className="flex flex-col items-start gap-[6px]">
                          <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_attendance')}</span>
                          <button
                            type="button"
                            onClick={allPresent ? unmarkAll : markAllPresent}
                            className="flex items-center gap-[3px] px-[6px] py-[3px] rounded-[5px] border border-[#388e3c] text-[#388e3c] text-[10px] font-medium bg-white hover:bg-[#e8f5e9] transition-colors whitespace-nowrap"
                            style={NS}
                          >
                            <Icon name="check" size="small" color="#388e3c" />
                            {allPresent ? t('attendance_clear_all') : t('attendance_mark_all_present')}
                          </button>
                        </div>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-r border-[#c6c6c6] align-middle">
                        <div className="flex flex-col gap-[2px]">
                          <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_biometric')}</span>
                          <span className={`text-[10px] leading-[13px] whitespace-nowrap font-normal ${atBiometricLimit ? 'text-[#c62828]' : 'text-[#727272]'}`} style={NS}>{t('attendance_biometric_limit')}</span>
                        </div>
                      </th>
                      <th className="px-[12px] h-[43px] text-left border-b border-[#c6c6c6] align-middle w-full">
                        <span className="text-[12px] leading-[16px] text-[#4b4b4b] tracking-[0.4px] font-normal" style={NS}>{t('attendance_col_reason')}</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={showWideColumns ? 8 : 6} className="py-10 text-center text-[12px] text-[#727272] bg-white" style={NS}>
                          {t('attendance_no_match')}
                        </td>
                      </tr>
                    ) : filtered.map((row, idx) => {
                      const accentCol = row.status === 'present' ? '#2e7d32' : row.status === 'absent' ? '#FFAC9A' : 'white';
                      const bb = idx < filtered.length - 1 ? 'border-b border-[#e8e8e8]' : '';
                      return (
                      <tr key={row.id} className="bg-white transition-colors hover:bg-[#f5f5f5]">
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle whitespace-nowrap ${bb}`} style={{ borderLeftWidth: '5px', borderLeftStyle: 'solid', borderLeftColor: accentCol }}>
                          <span className="text-[12px] text-[#4b4b4b]" style={NS}>{row.id}</span>
                        </td>
                        <td className={`px-[12px] py-[8px] border-r border-[#e8e8e8] align-middle ${bb}`} style={{ width: '150px' }}>
                          <span className="text-[12px] font-medium text-[#212121] leading-5 block" style={NS}>{row.name}</span>
                          <span className="text-[11px] text-[#727272] leading-4 block" style={NS}>{tDesignation(row.designation)}</span>
                        </td>
                        {showWideColumns && (
                          <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle whitespace-nowrap ${bb}`}>
                            <span className="text-[12px] text-[#4b4b4b]" style={NS}>{row.gpName}</span>
                          </td>
                        )}
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle whitespace-nowrap ${bb}`}>
                          <span className="text-[12px] text-[#4b4b4b]" style={NS}>{row.phone}</span>
                        </td>
                        {showWideColumns && (
                          <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle ${bb}`}>
                            <span className="text-[12px] text-[#4b4b4b] truncate block w-full overflow-hidden" style={NS}>{row.email}</span>
                          </td>
                        )}
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle ${bb}`}>
                          <AttendancePill
                            status={row.status === 'absent' ? 'absent' : row.status === 'present' ? 'present' : 'unmarked'}
                            onMark={(s) => markStatus(row.id, s)}
                          />
                        </td>
                        <td className={`px-[12px] h-[50px] border-r border-[#e8e8e8] align-middle ${bb}`}>
                          <BiometricCell
                            status={row.status}
                            biometric={row.biometric}
                            onTake={() => handleTakeBiometric(row.id)}
                            tBioTake={t('attendance_biometric_take')}
                            tBioTaken={t('attendance_biometric_taken')}
                            tBioPending={t('attendance_biometric_pending')}
                            tBioFailed={t('attendance_biometric_failed')}
                            tRetry={t('attendance_biometric_retry')}
                          />
                        </td>
                        <td className={`px-[8px] align-middle ${bb}`}>
                          {showReason(row) ? (
                            <div className="flex flex-col gap-[4px] py-[6px]">
                              {row.status === 'absent' ? (
                                <>
                                  <DropdownField
                                    value={row.reason === 'with_permission' ? t('attendance_absent_with_permission') : row.reason === 'without_permission' ? t('attendance_absent_without_permission') : ''}
                                    onChange={val => update(row.id, { reason: val === t('attendance_absent_with_permission') ? 'with_permission' : val === t('attendance_absent_without_permission') ? 'without_permission' : '' })}
                                    options={[t('attendance_absent_with_permission'), t('attendance_absent_without_permission')]}
                                    placeholder={t('attendance_absent_select')}
                                  />
                                  {row.reason === 'with_permission' && (
                                    <div className="flex items-center gap-[6px]">
                                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" ref={el => { permFileRefs.current[row.id] = el; }} onChange={e => { const file = e.target.files?.[0] ?? null; setPermissionFiles(prev => ({ ...prev, [row.id]: file })); }} />
                                      <button type="button" onClick={() => permFileRefs.current[row.id]?.click()} className="flex items-center gap-[4px] text-[11px] text-[#6a3e31] border border-[#6a3e31] rounded-[6px] px-[8px] py-[3px] hover:bg-[#f7f0ee] transition-colors" style={NS}>
                                        <Icon name="upload" size="small" color="#6a3e31" />
                                        {permissionFiles[row.id] ? permissionFiles[row.id]!.name : t('attendance_upload_permission')}
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <DropdownField
                                  value={row.reason === 'device_failure' ? t('no_bio_reason_device_failure') : row.reason === 'technical_issue' ? t('no_bio_reason_technical_issue') : row.reason === 'member_exempt' ? t('no_bio_reason_member_exempt') : row.reason === 'other' ? t('no_bio_reason_other') : ''}
                                  onChange={val => update(row.id, { reason: val === t('no_bio_reason_device_failure') ? 'device_failure' : val === t('no_bio_reason_technical_issue') ? 'technical_issue' : val === t('no_bio_reason_member_exempt') ? 'member_exempt' : val === t('no_bio_reason_other') ? 'other' : '' })}
                                  options={[t('no_bio_reason_device_failure'), t('no_bio_reason_technical_issue'), t('no_bio_reason_member_exempt'), t('no_bio_reason_other')]}
                                  placeholder={t('attendance_reason_no_biometric')}
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#c6c6c6] px-[4px]" style={NS}>—</span>
                          )}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
                </div>

                {!canProceed && (
                  <InfoBox type="plain" text={t('attendance_quorum_fail')} />
                )}

              </SectionHolder>

              <div className="flex justify-center mt-[20px]">
                <Button
                  variant="filled"
                  iconPlacement="right"
                  iconName="arrow_forward"
                  text={t('btn_proceed_next')}
                  state={canProceed ? 'default' : 'disabled'}
                  onClick={canProceed ? () => {
                    const absentIds = new Set(rows.filter(r => r.status === 'absent').map(r => r.id));
                    setOpeningAbsentIds(absentIds);
                    if (meetingId != null && (currentMeeting?.stepsCompleted ?? 0) < 1) {
                      updateMeeting(meetingId, { stepsCompleted: 1 });
                    }
                    navigate('/agenda-list', { state: { meetingId } });
                  } : undefined}
                />
              </div>
    </MeetingShellLayout>
  );
}
