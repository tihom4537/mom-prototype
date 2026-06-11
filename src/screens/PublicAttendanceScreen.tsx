import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AccessibilityBar,
  Navbar,
  AppDownloadCTA,
  Footer,
  RadioButton,
  DropdownField,
  InfoBox,
  Button,
  Icon,
  EyebrowPill,
} from '../components';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

type PanchayatType = 'zp' | 'tp' | 'gp';
type AttendanceToggle = 'entry' | 'exit';

const NAV_LINKS = [
  { label: 'Home',                  route: '/homepage' },
  { label: 'About Us',              route: null },
  { label: 'Attendance',            route: '/attendance-public', active: true },
  { label: 'Documents and Notices', route: '/documents' },
  { label: 'Helplines',             route: '/helplines' },
  { label: 'Contact Directory',      route: '/contact-directory' },
  { label: 'Feedback',              route: null },
];

export default function PublicAttendanceScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [panchayatType, setPanchayatType] = useState<PanchayatType>('gp');
  const [zilla, setZilla]       = useState('');
  const [taluk, setTaluk]       = useState('');
  const [gp, setGp]             = useState('');
  const [category, setCategory] = useState('');
  const [employee, setEmployee] = useState('');
  const [toggle, setToggle]     = useState<AttendanceToggle>('entry');
  const [date, setDate]         = useState('');
  const [time, setTime]         = useState('');

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">

      <AccessibilityBar />

      <Navbar version="home-page-identity" />

      <Navbar
        version="home-page-nav-menu"
        navLinks={NAV_LINKS.map(l => ({
          label: l.label,
          active: l.active,
          onClick: l.route ? () => navigate(l.route!) : undefined,
        }))}
        onLoginClick={() => {}}
      />

      <main className="flex flex-col gap-[40px] items-start pb-[80px] pt-[60px] px-[200px] w-full">

        {/* Section heading */}
        <div className="flex flex-col gap-[8px] items-center w-full">
          <EyebrowPill text={t('pub_attend_eyebrow')} variant="filled" />
          <p className="font-bold text-[28px] leading-[38px] text-[#6a3e31] text-center w-full" style={NS}>
            {t('pub_attend_heading')}
          </p>
          <p className="font-normal text-[14px] leading-[22px] text-[#525c66] text-center w-full" style={NS}>
            {t('pub_attend_subheading')}
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-[30px] w-full">

          {/* Panchayat type */}
          <div className="flex flex-col gap-[12px]">
            <p className="font-semibold text-[16px] leading-[20px] text-[#6a3e31]" style={NS}>
              {t('pub_attend_type_label')}
            </p>
            <div className="flex items-center gap-[24px]">
              <RadioButton
                label={t('pub_attend_type_zp')}
                selected={panchayatType === 'zp'}
                onChange={() => setPanchayatType('zp')}
              />
              <RadioButton
                label={t('pub_attend_type_tp')}
                selected={panchayatType === 'tp'}
                onChange={() => setPanchayatType('tp')}
              />
              <RadioButton
                label={t('pub_attend_type_gp')}
                selected={panchayatType === 'gp'}
                onChange={() => setPanchayatType('gp')}
              />
            </div>
          </div>

          <div className="bg-[#c6c6c6] h-px w-full" />

          {/* Location details */}
          <div className="flex flex-col gap-[20px]">
            <p className="font-semibold text-[16px] leading-[20px] text-[#6a3e31]" style={NS}>
              {t('pub_attend_location_label')}
            </p>

            <div className="flex gap-[15px] w-full">
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('pub_attend_select_zilla')}
                  placeholder={t('pub_attend_select_zilla')}
                  value={zilla}
                  onChange={setZilla}
                  options={[]}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('pub_attend_select_taluk')}
                  placeholder={t('pub_attend_select_taluk')}
                  value={taluk}
                  onChange={setTaluk}
                  options={[]}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('pub_attend_select_gp')}
                  placeholder={t('pub_attend_select_gp')}
                  value={gp}
                  onChange={setGp}
                  options={[]}
                />
              </div>
            </div>

            <div className="flex gap-[15px] w-full">
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('pub_attend_select_category')}
                  placeholder={t('pub_attend_select_category')}
                  value={category}
                  onChange={setCategory}
                  options={[]}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('pub_attend_select_employee')}
                  placeholder={t('pub_attend_select_employee')}
                  value={employee}
                  onChange={setEmployee}
                  options={[]}
                />
              </div>
            </div>

            <InfoBox type="plain" text={t('pub_attend_biometric_note')} />
          </div>

          <div className="bg-[#c6c6c6] h-px w-full" />

          {/* Attendance Entry */}
          <div className="flex flex-col gap-[25px]">
            <p className="font-semibold text-[16px] leading-[20px] text-[#6a3e31]" style={NS}>
              {t('pub_attend_entry_label')}
            </p>

            <div className="flex flex-col gap-[25px]">

              {/* Toggle: Entry / Exit */}
              <div className="flex flex-col gap-[7px]">
                <p className="font-medium text-[14px] leading-[20px] tracking-[0.1px] text-[#525c66]" style={NS}>
                  {t('pub_attend_type_toggle_label')}
                </p>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setToggle('entry')}
                    className={`flex items-center justify-center px-[18px] py-[10px] border border-[#b0b0b0] rounded-tl-[8px] rounded-bl-[8px] border-r-0 text-[16px] font-medium tracking-[0.15px] leading-[24px] cursor-pointer transition-colors
                      ${toggle === 'entry'
                        ? 'bg-[rgba(106,62,49,0.16)] text-[#727272]'
                        : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                    style={NS}
                  >
                    {t('pub_attend_toggle_entry')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setToggle('exit')}
                    className={`flex items-center justify-center px-[18px] py-[10px] border border-[#b0b0b0] rounded-tr-[8px] rounded-br-[8px] text-[16px] font-medium tracking-[0.15px] leading-[24px] cursor-pointer transition-colors
                      ${toggle === 'exit'
                        ? 'bg-[rgba(106,62,49,0.16)] text-[#727272]'
                        : 'bg-white text-[#727272] hover:bg-[rgba(106,62,49,0.08)]'}`}
                    style={NS}
                  >
                    {t('pub_attend_toggle_exit')}
                  </button>
                </div>
              </div>

              {/* Date + Time */}
              <div className="flex gap-[16px]">
                <div className="w-[358px]">
                  <DatePicker
                    label={t('pub_attend_date_label')}
                    value={date}
                    onChange={setDate}
                    placeholder={t('pub_attend_date_label')}
                  />
                </div>
                <div className="w-[358px]">
                  <TimePicker
                    label={toggle === 'exit' ? t('pub_attend_exit_time_label') : t('pub_attend_time_label')}
                    value={time}
                    onChange={setTime}
                    placeholder={toggle === 'exit' ? t('pub_attend_exit_time_label') : t('pub_attend_time_label')}
                  />
                </div>
              </div>

              {/* Biometric card */}
              <div className="flex flex-col gap-[3px]">
                <p className="font-medium text-[13px] text-[#6a3e31]" style={NS}>
                  {t('pub_attend_biometric_section')}
                </p>
                <div className="bg-[rgba(106,62,49,0.16)] border border-[rgba(176,176,176,0.6)] flex items-center justify-between px-[20px] py-[16px] rounded-[10px] h-[80px] w-[648px]">
                  <div className="flex items-center gap-[14px]">
                    <div className="bg-[#f7f0ee] flex items-center justify-center rounded-full size-[44px] shrink-0">
                      <Icon name="fingerprint" size="medium" color="rgba(106,62,49,0.7)" />
                    </div>
                    <div className="flex flex-col gap-[3px]">
                      <p className="font-semibold text-[13px] text-[rgba(33,33,33,0.8)] whitespace-nowrap" style={NS}>
                        {t('pub_attend_biometric_prompt')}
                      </p>
                      <p className="font-normal text-[11px] text-[rgba(82,92,102,0.6)] whitespace-nowrap" style={NS}>
                        {t('pub_attend_biometric_waiting')}
                      </p>
                    </div>
                  </div>
                  <Button variant="outlined" size="small" text={t('pub_attend_verify')} />
                </div>
              </div>

            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-[12px]">
            <Button variant="outlined" text={t('pub_attend_reset')} />
            <Button variant="filled" text={t('pub_attend_submit')} />
          </div>

        </div>
      </main>

      <AppDownloadCTA />
      <Footer />

    </div>
  );
}
