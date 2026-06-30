import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import SideNavOptions from './SideNavOptions';
import { useLanguage } from '../i18n/LanguageContext';

export type SidebarState = 'full' | 'shortened';

interface SidebarProps {
  state?: SidebarState;
  onMenuClick?: () => void;
  className?: string;
}

type NavId = 'meetings' | 'reports' | 'committee';

export default function Sidebar({ state = 'full', onMenuClick, className }: SidebarProps) {
  const isFull = state === 'full';
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useLanguage();

  const getInitialOpenItem = (): NavId | null => {
    // Overview is the module home — no nav item selected
    if (['/meetings/overview', '/meetings', '/'].includes(location.pathname)) return null;
    if (location.pathname.startsWith('/meetings')) return 'meetings';
    if (location.pathname === '/agenda-list' || location.pathname.startsWith('/mom-entry')) return 'meetings';
    return null;
  };

  const [openItem, setOpenItem]       = useState<NavId | null>(getInitialOpenItem);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // Structured nav items — defined inside component so they close over navigate/showToast/t
  const NAV_ITEMS: Array<{
    id: NavId;
    label: string;
    icon: string;
    onParentClick?: () => void;
    subItems: Array<{ label: string; onClick: () => void; isActive: boolean }>;
  }> = [
    {
      id: 'meetings',
      label: t('nav_meetings'),
      icon: 'people_alt',
      onParentClick: () => navigate('/meetings/overview'),
      subItems: [
        {
          label: t('nav_create_meeting'),
          onClick: () => navigate('/meetings/create'),
          isActive: location.pathname === '/meetings/create',
        },
        {
          label: t('nav_meeting_list'),
          onClick: () => navigate('/meetings/list'),
          isActive: location.pathname === '/meetings/list',
        },
        {
          label: t('nav_add_participants'),
          onClick: () => navigate('/meetings/participants'),
          isActive: location.pathname === '/meetings/participants',
        },
      ],
    },
    {
      id: 'reports',
      label: t('nav_reports'),
      icon: 'bar_chart',
      subItems: [
        { label: t('nav_summary_report'),    onClick: showToast, isActive: false },
        { label: t('nav_meeting_report'),    onClick: showToast, isActive: false },
        { label: t('nav_attendance_report'), onClick: showToast, isActive: false },
      ],
    },
    {
      id: 'committee',
      label: t('nav_committee_mapping'),
      icon: 'account_tree',
      subItems: [],
    },
  ];

  // The parent group whose child is currently active — always kept open
  const activeNavId = NAV_ITEMS.find(nav => nav.subItems.some(s => s.isActive))?.id ?? null;

  const handleNavClick = (id: NavId) => {
    const item = NAV_ITEMS.find(n => n.id === id);
    item?.onParentClick?.();
    setOpenItem(prev => (prev === id ? null : id));
  };

  // A nav group is open if the user explicitly opened it
  const isEffectivelyOpen = (id: NavId) => openItem === id;

  return (
    <div
      className={`bg-white border border-[rgba(204,204,204,0.15)] flex flex-col justify-between pb-4 pt-[15px] px-4 rounded-br-[15px] rounded-tr-[15px]
        ${isFull ? 'w-[220px] items-start' : 'w-20 items-center'}
        ${className ?? 'h-[969px]'}`}
    >
      {/* Top section */}
      <div className={`flex flex-col gap-[15px] items-${isFull ? 'start' : 'center'} w-full shrink-0`}>

        {/* Menu toggle */}
        <div className={`flex h-[29px] items-center w-full ${isFull ? 'justify-end' : 'justify-center'}`}>
          <button
            onClick={onMenuClick}
            title="Toggle sidebar"
            className="bg-transparent border-none p-0 cursor-pointer flex items-center"
          >
            <Icon name="menu" size="medium" color="#6a3e31" />
          </button>
        </div>

        {/* Nav items */}
        <div className={`flex flex-col gap-2 w-full ${isFull ? 'items-start' : 'items-center'}`}>
          {isFull ? (
            // ── Expanded sidebar ──
            NAV_ITEMS.map(item => (
              <SideNavOptions
                key={item.id}
                icon={item.icon}
                label={item.label}
                subItems={item.subItems}
                isOpen={isEffectivelyOpen(item.id)}
                isActive={activeNavId === item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex flex-col items-start shrink-0 w-[188px]"
              />
            ))
          ) : (
            // ── Collapsed sidebar — icon only with tooltip ──
            NAV_ITEMS.map(item => {
              const isActive = activeNavId === item.id || openItem === item.id;
              return (
                <div key={item.id} className="flex flex-col items-center shrink-0">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    title={item.label}
                    className={`flex items-center justify-center px-3 py-[9px] rounded-2xl shrink-0 border-none cursor-pointer transition-colors
                      ${isActive ? 'bg-[#efe0dc]' : 'bg-transparent hover:bg-[#efe0dc]'}`}
                  >
                    <div className="flex h-[35px] items-center shrink-0">
                      <Icon name={item.icon} size="medium" color="#6a3e31" />
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* "Coming soon" toast — fixed bottom-center */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#212121] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg pointer-events-none">
          <span style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            {t('toast_coming_soon')}
          </span>
        </div>
      )}
    </div>
  );
}
