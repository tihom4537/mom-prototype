import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AccessibilityBar from '../components/AccessibilityBar';
import Navbar from '../components/Navbar';
import SectionTopper from '../components/SectionTopper';
import Card from '../components/Card';
import AppDownloadCTA from '../components/AppDownloadCTA';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import GoBackToPreviousPage from '../components/GoBackToPreviousPage';
import Breadcrumb from '../components/Breadcrumb';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const CITIZEN_ILLUS = '/Illustrations/citizen.svg';

const ALL_MODULES = [
  { id: 'finance',  title: 'Finance and Accounting',           description: 'Access income, expenditure, budget allocations, and fund utilisation records for any Gram Panchayat.', illustration: '/Illustrations/finance.svg',  route: '/finance' },
  { id: 'revenue',  title: 'Revenue Collection',               description: 'View tax, fee, and levy collection records — what was collected, when, and against what demand.',       illustration: '/Illustrations/revenue.svg',  route: '/revenue' },
  { id: 'hrms',     title: 'Human Resource Management System', description: 'Browse staff records, attendance logs, and service history for GP employees across the state.',         illustration: '/Illustrations/hrms.svg',     route: '/hrms' },
  { id: 'meetings', title: 'Meeting Management',               description: 'Access meeting agendas, proceedings, resolutions, and attendance records for any GP.',                  illustration: '/Illustrations/meetings.svg', route: '/citizen/meetings' },
  { id: 'planning', title: 'Planning',                         description: 'Browse development plans, scheme allocations, and capital works records across Karnataka GPs.',         illustration: '/Illustrations/finance.svg',  route: null },
];

const SUB_MODULES = [
  { key: 'dashboard',         title: 'Dashboard',                icon: 'dashboard',      desc: 'Overview of all BSK service applications — snapshot stats, district-wise and service-wise breakdowns.',  route: '/citizen/dashboard' },
  { key: 'service-report',    title: 'Service Report',           icon: 'assignment',     desc: 'Detailed report on each of the 20+ services offered through Bapuji Seva Kendra across Karnataka GPs.',   route: null },
  { key: 'applicant-report',  title: 'Applicant / Citizen Report', icon: 'people_alt',  desc: 'View applicant-level data — who applied, for which service, and current status of their application.',    route: null },
];

export default function CitizenScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [moduleSlide, setModuleSlide] = useState(0);

  const visibleModules = ALL_MODULES.slice(moduleSlide, moduleSlide + 3);
  const canPrev = moduleSlide > 0;
  const canNext = moduleSlide + 3 < ALL_MODULES.length;

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar version="home-page-nav-menu" />

      <div className="px-[200px] pt-[32px] flex items-center justify-between">
        <GoBackToPreviousPage label="Back to Home" onClick={() => navigate('/homepage')} />
        <Breadcrumb level={3} items={['Home', 'Modules', 'Citizen Services']} />
      </div>

      <div className="px-[200px] pt-[20px]">
        <SectionTopper
          variant="variant3"
          heading="Citizen Services"
          subheading="Track BSK service applications, delivery status, and citizen engagement across Karnataka gram panchayats."
          illustration={CITIZEN_ILLUS}
          className="rounded-[10px]"
        />
      </div>

      {/* Sub-modules grid */}
      <div className="flex flex-col gap-[32px] px-[200px] pt-[48px] pb-[60px] w-full">
        <div className="grid grid-cols-3 gap-[24px] w-full">
          {SUB_MODULES.map(sub => (
            <div key={sub.key} className="flex-1 min-w-0">
              <Card
                variant="illustration"
                title={sub.title}
                subtitle={sub.desc}
                text="View Data"
                illustration={
                  <div className="flex items-center justify-center size-[56px] rounded-[12px] bg-[#f7f0ee]">
                    <Icon name={sub.icon} size="medium" color="#6a3e31" />
                  </div>
                }
                onClick={sub.route ? () => navigate(sub.route!) : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Browse other modules */}
      <div className="flex flex-col gap-[32px] items-center px-[200px] py-[60px] w-full bg-[rgba(106,62,49,0.08)]">
        <p className="font-semibold text-[28px] text-[#212121]" style={NS}>Browse Other Modules</p>
        <div className="flex items-center gap-[20px] w-full">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setModuleSlide(s => s - 1)}
            className="flex items-center justify-center size-[40px] rounded-full border border-[#c6c6c6] bg-white shrink-0 cursor-pointer disabled:opacity-30 hover:bg-[#f7f0ee] transition-colors"
          >
            <Icon name="chevron_left" size="small" color="#212121" />
          </button>
          <div className="flex gap-[24px] flex-1 min-w-0">
            {visibleModules.map(mod => (
              <div key={mod.id} className="flex-1 min-w-0">
                <Card
                  variant="illustration"
                  title={mod.title}
                  subtitle={mod.description}
                  text="View Data"
                  illustration={
                    <img src={mod.illustration} alt={mod.title} className="block max-h-[88px] max-w-[96px] w-auto h-auto" style={{ objectFit: 'contain', flexShrink: 0 }} />
                  }
                  onClick={mod.route ? () => navigate(mod.route!) : undefined}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setModuleSlide(s => s + 1)}
            className="flex items-center justify-center size-[40px] rounded-full border border-[#c6c6c6] bg-white shrink-0 cursor-pointer disabled:opacity-30 hover:bg-[#f7f0ee] transition-colors"
          >
            <Icon name="chevron_right" size="small" color="#212121" />
          </button>
        </div>
      </div>

      <AppDownloadCTA variant="cta-option-2" />
      <Footer variant="dark" />
    </div>
  );
}
