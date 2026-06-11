import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AccessibilityBar,
  Navbar,
  AppDownloadCTA,
  Footer,
  DropdownField,
  InfoBox,
  Button,
  EyebrowPill,
} from '../components';
import SectionHeading from '../components/SectionHeading';
import Table, { type TableColumn } from '../components/Table';
import Pagination from '../components/Pagination';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

const NAV_LINKS = [
  { label: 'Home',                  route: '/homepage' },
  { label: 'About Us',              route: null },
  { label: 'Attendance',            route: '/attendance-public' },
  { label: 'Documents and Notices', route: '/documents' },
  { label: 'Helplines',             route: '/helplines' },
  { label: 'Contact Directory',     route: '/contact-directory', active: true },
  { label: 'Feedback',              route: null },
];

interface StaffRow extends Record<string, unknown> {
  sr: string;
  name: string;
  gender: string;
  designation: string;
  mobile: string;
  email: string;
  zilla: string;
  taluk: string;
  gp: string;
  village: string;
}

const MOCK_STAFF: StaffRow[] = [
  { sr: '1', name: 'Satish Iranna Makond',    gender: 'Male',   designation: 'Administrator', mobile: '8951389481', email: 'eotpbadami001@gmail.com',   zilla: 'BAGALKOTE(1501)', taluk: 'BADAMI(1501001)', gp: '-', village: '-' },
  { sr: '2', name: 'Shidlingappa Pujar',       gender: 'Male',   designation: 'Administrator', mobile: '7022116808', email: 'katarkigp@gmail.com',        zilla: 'BAGALKOTE(1501)', taluk: 'BADAMI(1501001)', gp: '-', village: '-' },
  { sr: '3', name: 'MAHANTESH M MALIMATH',    gender: 'Male',   designation: 'Administrator', mobile: '9886684893', email: 'sulikerigp@gmail.com',       zilla: 'BAGALKOTE(1501)', taluk: 'BADAMI(1501001)', gp: '-', village: '-' },
  { sr: '4', name: 'HEMALATA SHINDE',         gender: 'Female', designation: 'Administrator', mobile: '7019292123', email: 'haligeri.bdm.bgk@gmail.com', zilla: 'BAGALKOTE(1501)', taluk: 'BADAMI(1501001)', gp: '-', village: '-' },
  { sr: '5', name: 'BALANAGOUDA PATIL',       gender: 'Male',   designation: 'Administrator', mobile: '9886376028', email: 'kainkatti.bdm.bgk@gmail.com',zilla: 'BAGALKOTE(1501)', taluk: 'BADAMI(1501001)', gp: '-', village: '-' },
  { sr: '6', name: 'Dr SHRIKANTH SABANIS',    gender: 'Male',   designation: 'Administrator', mobile: '9449564364', email: 'kittali.bdm.bgk@gmail.com',  zilla: 'BAGALKOTE(1501)', taluk: 'BADAMI(1501001)', gp: '-', village: '-' },
];

function buildColumns(t: (k: string) => string): TableColumn<StaffRow>[] {
  return [
    { key: 'sr',          label: t('contact_dir_col_sr'),          width: 'w-[60px] shrink-0' },
    { key: 'name',        label: t('contact_dir_col_name'),        width: 'flex-1 min-w-[140px]' },
    { key: 'gender',      label: t('contact_dir_col_gender'),      width: 'w-[80px] shrink-0' },
    { key: 'designation', label: t('contact_dir_col_designation'), width: 'flex-1 min-w-[120px]' },
    { key: 'mobile',      label: t('contact_dir_col_mobile'),      width: 'w-[120px] shrink-0' },
    { key: 'email',       label: t('contact_dir_col_email'),       width: 'flex-1 min-w-[160px]' },
    { key: 'zilla',       label: t('contact_dir_col_zilla'),       width: 'flex-1 min-w-[120px]' },
    { key: 'taluk',       label: t('contact_dir_col_taluk'),       width: 'flex-1 min-w-[120px]' },
    { key: 'gp',          label: t('contact_dir_col_gp'),          width: 'flex-1 min-w-[140px]' },
    { key: 'village',     label: t('contact_dir_col_village'),     width: 'flex-1 min-w-[120px]' },
  ];
}

export default function ContactDirectoryScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [level, setLevel]         = useState('');
  const [zilla, setZilla]         = useState('');
  const [taluk, setTaluk]         = useState('');
  const [gp, setGp]               = useState('');
  const [page, setPage]           = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(MOCK_STAFF.length / itemsPerPage);
  const pagedRows  = MOCK_STAFF.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const summaryParts = [
    zilla || 'Zilla',
    taluk || 'Taluk',
    gp    || 'GP',
    'All Categories',
    '24-25',
  ];

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
          <EyebrowPill text={t('contact_dir_eyebrow')} variant="filled" />
          <p className="font-bold text-[28px] leading-[38px] text-[#6a3e31] text-center w-full" style={NS}>
            {t('contact_dir_heading')}
          </p>
          <p className="font-normal text-[14px] leading-[22px] text-[#525c66] text-center w-full" style={NS}>
            {t('contact_dir_subheading')}
          </p>
        </div>

        {/* Filters + table */}
        <div className="flex flex-col gap-[22px] w-full">

          {/* Location filters */}
          <div className="flex flex-col gap-[20px]">
            <p className="font-semibold text-[16px] leading-[20px] text-[#6a3e31]" style={NS}>
              {t('contact_dir_location_label')}
            </p>
            <div className="flex gap-[22px] w-full">
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('contact_dir_select_level')}
                  placeholder={t('contact_dir_select_level')}
                  value={level}
                  onChange={setLevel}
                  options={[]}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('contact_dir_select_zilla')}
                  placeholder={t('contact_dir_select_zilla')}
                  value={zilla}
                  onChange={setZilla}
                  options={['Bengaluru Urban', 'Mysuru', 'Belagavi', 'Dharwad']}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('contact_dir_select_taluk')}
                  placeholder={t('contact_dir_select_taluk')}
                  value={taluk}
                  onChange={setTaluk}
                  options={['Anekal', 'Bengaluru South', 'Bengaluru North']}
                />
              </div>
              <div className="flex-1 min-w-0">
                <DropdownField
                  label={t('contact_dir_select_gp')}
                  placeholder={t('contact_dir_select_gp')}
                  value={gp}
                  onChange={setGp}
                  options={['Anekal GP', 'Jigani GP', 'Huskur GP']}
                />
              </div>
            </div>
            <InfoBox type="plain" text={t('contact_dir_info')} />
          </div>

          {/* Card with summary bar + table */}
          <div className="bg-white border border-[#c6c6c6] rounded-[10px] w-full overflow-hidden">

            {/* Summary bar */}
            <SectionHeading
              variant="with-box"
              text={summaryParts.join('  |  ')}
              fullWidth
              className="border-b border-[#c6c6c6]"
            />

            {/* Table */}
            <div className="px-[20px] pb-[20px] pt-[30px] flex flex-col gap-[16px]">
              <Table columns={buildColumns(t)} rows={pagedRows} />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={MOCK_STAFF.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
                onItemsPerPageChange={n => { setItemsPerPage(n); setPage(1); }}
              />
            </div>

            <div className="h-px bg-[#c6c6c6] w-full" />

            {/* Bottom CTAs */}
            <div className="flex justify-center gap-[16px] py-[20px]">
              <Button
                variant="filled"
                iconPlacement="left"
                iconName="download"
                text={t('contact_dir_download')}
              />
              <Button
                variant="filled"
                iconPlacement="left"
                iconName="share"
                text={t('contact_dir_share')}
              />
            </div>

          </div>
        </div>

      </main>

      <AppDownloadCTA />
      <Footer />

    </div>
  );
}
