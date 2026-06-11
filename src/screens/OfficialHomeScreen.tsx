import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

const MODULES = [
  { id: 'revenue',    titleKey: 'official_module_revenue_title',    descKey: 'official_module_revenue_desc',    illustration: '/Illustrations/revenue.svg',         route: null },
  { id: 'finance',   titleKey: 'official_module_finance_title',    descKey: 'official_module_finance_desc',    illustration: '/Illustrations/finance.svg', route: null },
  { id: 'hrms',      titleKey: 'official_module_hrms_title',       descKey: 'official_module_hrms_desc',       illustration: '/Illustrations/hrms.svg',             route: null },
  { id: 'meeting',   titleKey: 'official_module_meetings_title',   descKey: 'official_module_meetings_desc',   illustration: '/Illustrations/hrms.svg',             route: '/meetings/overview' },
  { id: 'citizen',   titleKey: 'official_module_citizen_title',    descKey: 'official_module_citizen_desc',    illustration: '/Illustrations/citizen.svg', route: null },
  { id: 'planning',  titleKey: 'official_module_planning_title',   descKey: 'official_module_planning_desc',   illustration: '/Illustrations/finance.svg', route: null },
  { id: 'bsk',       titleKey: 'official_module_bsk_title',        descKey: 'official_module_bsk_desc',        illustration: '/Illustrations/hrms.svg',             route: null },
  { id: 'other-dept',titleKey: 'official_module_other_dept_title', descKey: 'official_module_other_dept_desc', illustration: '/Illustrations/hrms.svg',             route: null },
  { id: 'learning',  titleKey: 'official_module_learning_title',   descKey: 'official_module_learning_desc',   illustration: '/Illustrations/learning.svg',         route: null },
];

export default function OfficialHomeScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f1f2f2]">

      {/* Navbar */}
      <div className="shrink-0 relative z-40">
        <Navbar version="default-with-welcome" showHome={false} />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-[55px] items-center py-[70px] px-[150px] w-full">

        {/* Welcome + search row */}
        <div className="flex gap-[45px] items-end justify-between w-full">
          <div className="flex flex-col gap-[5px]">
            <p className="font-light text-[24px] text-[#6a3e31]" style={NS}>{t('official_home_welcome')}</p>
            <p className="font-semibold text-[32px] text-[#6a3e31] leading-tight" style={NS}>
              {t('official_home_question')}
            </p>
          </div>
          {/* Search */}
          <div className="bg-white border border-[#ddd] flex items-center h-[56px] rounded-[8px] w-[358px] shrink-0 overflow-hidden">
            <div className="flex items-center justify-center px-[4px]">
              <div className="flex items-center justify-center p-[8px] rounded-[8px]">
                <Icon name="search" size="medium" color="rgba(33,33,33,0.48)" />
              </div>
            </div>
            <input
              type="text"
              placeholder={t('official_home_search_placeholder')}
              className="flex-1 min-w-0 font-normal text-[16px] text-[rgba(33,33,33,0.48)] placeholder-[rgba(33,33,33,0.48)] bg-transparent border-none outline-none tracking-[0.5px] pr-[4px]"
              style={NS}
            />
            <div className="flex items-center justify-center px-[4px]">
              <div className="flex items-center justify-center p-[8px] rounded-[8px]">
                <Icon name="mic" size="medium" color="rgba(33,33,33,0.48)" />
              </div>
            </div>
          </div>
        </div>

        {/* Module grid — 3 columns */}
        <div className="flex flex-col gap-[34px] w-full">
          {Array.from({ length: Math.ceil(MODULES.length / 3) }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-[34px] items-stretch w-full">
              {MODULES.slice(rowIdx * 3, rowIdx * 3 + 3).map(mod => (
                <div
                  key={mod.id}
                  className="bg-white border border-[#c6c6c6] flex flex-1 flex-col justify-between min-w-0 p-[20px] rounded-[10px] cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#c99080] transition-all"
                  onClick={() => mod.route ? navigate(mod.route) : undefined}
                >
                  <div className="flex flex-col gap-[20px]">
                    {/* Illustration */}
                    <div className="h-[88px] w-[96px] overflow-hidden shrink-0">
                      <img
                        src={mod.illustration}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col gap-[14px]">
                      <p className="font-semibold text-[20px] text-[#6a3e31] leading-[24px]" style={NS}>
                        {t(mod.titleKey)}
                      </p>
                      <p className="font-normal text-[14px] text-[#3b3b3b] leading-[21px]" style={NS}>
                        {t(mod.descKey)}
                      </p>
                    </div>
                  </div>
                  {/* CTA */}
                  <div className="flex items-center gap-[5px] mt-[20px]">
                    <span className="font-normal text-[14px] text-[#212121]" style={NS}>
                      {t('official_home_module_cta')}
                    </span>
                    <Icon name="arrow_forward" size="small" color="#212121" />
                  </div>
                </div>
              ))}
              {/* Fill empty cells in last row */}
              {MODULES.slice(rowIdx * 3, rowIdx * 3 + 3).length < 3 &&
                Array.from({ length: 3 - MODULES.slice(rowIdx * 3, rowIdx * 3 + 3).length }).map((_, i) => (
                  <div key={i} className="flex-1 min-w-0" />
                ))
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
