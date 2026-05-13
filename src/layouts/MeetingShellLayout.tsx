import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Navbar,
  Sidebar,
  Breadcrumb,
  Stepper,
  DropdownBoxOfProfile,
  DropdownBoxOfIcon,
  StepNavBar,
} from '../components';
import type { StepperActiveState } from '../components';

const STEP_ROUTES: Record<number, string> = {
  1: '/meetings/attendance',
  2: '/agenda-list',
  3: '/meetings/proceedings-review',
  4: '/meetings/closure-attendance',
  5: '/meetings/send-to-president',
};

interface MeetingShellLayoutProps {
  children: React.ReactNode;
  stepperActiveState?: StepperActiveState;
  /** Override back route — defaults to one step back */
  backRoute?: string;
  /** Set false to hide the Previous step link (e.g. sub-pages within a step) */
  showBack?: boolean;
  /** Fill viewport height — no scroll; children must manage their own overflow */
  fillHeight?: boolean;
}

export default function MeetingShellLayout({
  children,
  stepperActiveState = 2,
  backRoute,
  showBack = true,
  fillHeight = false,
}: MeetingShellLayoutProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const meetingId: number | undefined = (location.state as { meetingId?: number } | null)?.meetingId;
  const resolvedBackRoute = backRoute ?? STEP_ROUTES[stepperActiveState - 1];
  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleSidebar = () =>
    setSidebarState(s => (s === 'full' ? 'shortened' : 'full'));

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f1f2f2]">

      {/* ── Row 1: Navbar (fixed) ── */}
      <div className="shrink-0 relative z-40">
        <Navbar
          version="default-with-welcome"
          onProfileClick={() => {
            setProfileOpen(o => !o);
            setSettingsOpen(false);
          }}
          onSettingsClick={() => {
            setSettingsOpen(o => !o);
            setProfileOpen(false);
          }}
        />

        {/* Profile dropdown */}
        {profileOpen && (
          <div className="absolute right-[88px] top-full shadow-lg">
            <DropdownBoxOfProfile
              isOpen={true}
              onToggle={() => setProfileOpen(false)}
              menuLabel="Switch Profile"
              items={['PDO — kakanur GP', 'Secretary — Hosakote GP', 'Log out']}
              className="w-[293px]"
            />
          </div>
        )}

        {/* Settings dropdown */}
        {settingsOpen && (
          <div className="absolute right-[26px] top-full shadow-lg">
            <DropdownBoxOfIcon
              isOpen={true}
              onToggle={() => setSettingsOpen(false)}
              menuLabel="Settings"
              items={['Settings', 'Help & Support', 'Log out']}
            />
          </div>
        )}
      </div>

      {/* ── Row 2: Sidebar + main column ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar (fixed left column) */}
        <Sidebar
          state={sidebarState}
          onMenuClick={toggleSidebar}
          className="shrink-0 h-full"
        />

        {/* Main column */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">

          {/* Fixed upper section: breadcrumb + stepper */}
          <div className="shrink-0 flex flex-col gap-5 px-6 pt-5 pb-[10px] bg-[#f1f2f2]">
            <Breadcrumb
              level={3}
              items={[
                t('breadcrumb_module'),
                t('breadcrumb_meetings'),
                t('breadcrumb_start_meeting'),
              ]}
            />
            <Stepper
              variant="meeting-flow"
              activeState={stepperActiveState}
              stepLabels={[
                t('meeting_flow_step_1'),
                t('meeting_flow_step_2'),
                t('meeting_flow_step_3'),
                t('meeting_flow_step_4'),
                t('meeting_flow_step_5'),
              ]}
              onStepClick={step => { if (STEP_ROUTES[step]) navigate(STEP_ROUTES[step], { state: { meetingId } }); }}
            />
          </div>

          {/* Lower section */}
          <div className={`flex-1 min-h-0 px-6 pt-4 pb-6 ${fillHeight ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
            <div className={`flex flex-col gap-5 ${fillHeight ? 'flex-1 min-h-0' : ''}`}>
              <StepNavBar onBack={showBack && resolvedBackRoute ? () => navigate(resolvedBackRoute, { state: { meetingId } }) : undefined} backLabel={t('nav_previous_step')} />
              {children}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
