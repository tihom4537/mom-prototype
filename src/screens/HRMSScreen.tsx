import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AccessibilityBar from '../components/AccessibilityBar';
import AccessibilityFab from '../components/AccessibilityFab';
import Navbar from '../components/Navbar';
import ScaleToFit from '../components/ScaleToFit';
import SectionTopper from '../components/SectionTopper';
import Card from '../components/Card';
import AppDownloadCTA from '../components/AppDownloadCTA';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import GoBackToPreviousPage from '../components/GoBackToPreviousPage';
import Breadcrumb from '../components/Breadcrumb';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const HRMS_ILLUS = '/Illustrations/hrms.svg';

const ALL_MODULES = [
  {
    id: 'finance',
    title: 'Finance and Accounting',
    description: 'Access income, expenditure, budget allocations, and fund utilisation records for any Gram Panchayat.',
    illustration: '/Illustrations/finance.svg',
    route: '/finance',
  },
  {
    id: 'revenue',
    title: 'Revenue Collection',
    description: 'View tax, fee, and levy collection records — what was collected, when, and against what demand.',
    illustration: '/Illustrations/revenue.svg',
    route: '/revenue',
  },
  {
    id: 'meetings',
    title: 'Meeting Management',
    description: 'Access meeting agendas, proceedings, resolutions, and attendance records for any GP.',
    illustration: '/Illustrations/meetings.svg',
    route: '/meetings/overview',
  },
  {
    id: 'citizen',
    title: 'Citizen Services',
    description: 'See applications submitted, entitlements accessed, and grievances filed through the GP.',
    illustration: '/Illustrations/citizen.svg',
    route: '/citizen',
  },
  {
    id: 'planning',
    title: 'Planning',
    description: 'Browse development plans, scheme allocations, and capital works records across Karnataka GPs.',
    illustration: '/Illustrations/finance.svg',
    route: null,
  },
];

interface SubModule {
  titleKey: string;
  descKey: string;
  icon: string;
}

const SUB_MODULES: SubModule[] = [
  {
    titleKey: 'hrms_sub_staff_reg_title',
    descKey:  'hrms_sub_staff_reg_desc',
    icon:     'badge',
  },
  {
    titleKey: 'hrms_sub_elected_reg_title',
    descKey:  'hrms_sub_elected_reg_desc',
    icon:     'how_to_vote',
  },
  {
    titleKey: 'hrms_sub_eo_approval_title',
    descKey:  'hrms_sub_eo_approval_desc',
    icon:     'approval',
  },
  {
    titleKey: 'hrms_sub_salary_report_title',
    descKey:  'hrms_sub_salary_report_desc',
    icon:     'payments',
  },
  {
    titleKey: 'hrms_sub_attendance_report_title',
    descKey:  'hrms_sub_attendance_report_desc',
    icon:     'fact_check',
  },
  {
    titleKey: 'hrms_sub_mobile_attendance_title',
    descKey:  'hrms_sub_mobile_attendance_desc',
    icon:     'smartphone',
  },
];

export default function HRMSScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [moduleSlide, setModuleSlide] = useState(0);

  const visibleModules = ALL_MODULES.slice(moduleSlide, moduleSlide + 3);
  const canPrev = moduleSlide > 0;
  const canNext = moduleSlide + 3 < ALL_MODULES.length;

  return (
    <ScaleToFit>
    <div className="flex flex-col min-h-screen w-full bg-white">
      <AccessibilityBar />
      <Navbar version="home-page-identity" />
      <Navbar version="home-page-nav-menu" />

      {/* Back nav + breadcrumb */}
      <div className="px-[200px] pt-[32px] flex items-center justify-between">
        <GoBackToPreviousPage label={t('hrms_back_to_home')} onClick={() => navigate('/homepage')} />
        <Breadcrumb
          level={3}
          items={[t('finance_breadcrumb_home'), t('finance_breadcrumb_modules'), t('hrms_breadcrumb_hrms')]}
        />
      </div>

      {/* SectionTopper */}
      <div className="px-[200px] pt-[20px]">
        <SectionTopper
          variant="variant3"
          heading={t('hrms_section_heading')}
          subheading={t('hrms_section_subheading')}
          illustration={HRMS_ILLUS}
          className="rounded-[10px]"
        />
      </div>

      {/* Sub-modules grid */}
      <div id="main-content" tabIndex={-1} className="flex flex-col gap-[32px] px-[200px] pt-[48px] pb-[60px] w-full">
        <div className="grid grid-cols-3 gap-[24px] w-full">
          {SUB_MODULES.map(sub => (
            <div key={sub.titleKey} className="flex-1 min-w-0">
              <Card
                variant="illustration"
                title={t(sub.titleKey)}
                subtitle={t(sub.descKey)}
                text={t('hrms_submodule_cta')}
                illustration={
                  <div className="flex items-center justify-center size-[56px] rounded-[12px] bg-[#f7f0ee]">
                    <Icon name={sub.icon} size="medium" color="#6a3e31" />
                  </div>
                }
                onClick={() => {}}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Browse other modules */}
      <div className="flex flex-col gap-[32px] items-center px-[200px] py-[60px] w-full bg-[rgba(106,62,49,0.08)]">
        <p className="font-semibold text-[28px] text-[#212121]" style={NS}>
          {t('finance_browse_modules')}
        </p>
        <div className="flex items-center gap-[20px] w-full">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setModuleSlide(s => s - 1)}
            className="flex items-center justify-center size-[40px] rounded-full border border-[#c6c6c6] bg-white shrink-0 cursor-pointer disabled:opacity-30 hover:bg-[#f7f0ee] transition-colors"
            aria-label="Previous modules"
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
                  text={t('homepage_module_cta')}
                  illustration={
                    <img
                      src={mod.illustration}
                      alt={mod.title}
                      className="block max-h-[88px] max-w-[96px] w-auto h-auto"
                      style={{ objectFit: 'contain', flexShrink: 0 }}
                    />
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
            aria-label="Next modules"
          >
            <Icon name="chevron_right" size="small" color="#212121" />
          </button>
        </div>
      </div>

      <AppDownloadCTA variant="cta-option-2" />
      <Footer variant="dark" />      <AccessibilityFab />
    </div>
    </ScaleToFit>
  );
}
