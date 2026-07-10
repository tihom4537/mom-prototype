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
  Button,
  Icon,
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
  /** Override the "Previous step" link label — e.g. "Back to Meetings" on Step 1 */
  backLabel?: string;
  /** Fill viewport height — no scroll; children must manage their own overflow */
  fillHeight?: boolean;
  /** Override the 3-item breadcrumb trail — defaults to module / meetings / start-meeting */
  breadcrumbItems?: string[];
  /** Set false to hide the Stepper row (e.g. screens outside the 5-step flow) */
  showStepper?: boolean;
  /** Set false to hide the Exit Meeting button + confirm modal (e.g. MoM entry sub-pages) */
  showExitButton?: boolean;
}

export default function MeetingShellLayout({
  children,
  stepperActiveState = 2,
  backRoute,
  showBack = true,
  backLabel,
  fillHeight = false,
  breadcrumbItems,
  showStepper = true,
  showExitButton = true,
}: MeetingShellLayoutProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const meetingId: number | undefined = (location.state as { meetingId?: number } | null)?.meetingId;
  const resolvedBackRoute = backRoute ?? STEP_ROUTES[stepperActiveState - 1];
  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('shortened');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

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
          <div
            className="absolute right-[88px] top-full shadow-lg z-50"
            onMouseLeave={() => setProfileOpen(false)}
          >
            <DropdownBoxOfProfile
              isOpen={true}
              onToggle={() => setProfileOpen(false)}
              menuLabel="Switch Profile"
              items={['PDO — kakanur GP', 'Secretary — Hosakote GP', 'Log out']}
              onItemClick={item => {
                setProfileOpen(false);
                if (item === 'Log out') navigate('/homepage');
              }}
              className="w-[293px]"
            />
          </div>
        )}

        {/* Settings dropdown */}
        {settingsOpen && (
          <div
            className="absolute right-[26px] top-full shadow-lg z-50"
            onMouseLeave={() => setSettingsOpen(false)}
          >
            <DropdownBoxOfIcon
              isOpen={true}
              onToggle={() => setSettingsOpen(false)}
              items={['Help & Support', 'Log out']}
              onItemClick={item => {
                setSettingsOpen(false);
                if (item === 'Log out') navigate('/homepage');
              }}
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
              items={breadcrumbItems ?? [
                t('breadcrumb_module'),
                t('breadcrumb_meetings'),
                t('breadcrumb_start_meeting'),
              ]}
            />
            {showStepper && (
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
            )}
          </div>

          {/* Lower section */}
          <div className={`flex-1 min-h-0 px-6 pt-4 pb-6 ${fillHeight ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
            <div className={`flex flex-col gap-5 ${fillHeight ? 'flex-1 min-h-0' : ''}`}>
              <StepNavBar onBack={showBack && resolvedBackRoute ? () => navigate(resolvedBackRoute, { state: { meetingId } }) : undefined} backLabel={backLabel ?? t('nav_previous_step')} />
              {children}
              {showStepper && showExitButton && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outlined"
                    iconPlacement="left"
                    iconName="logout"
                    text={t('btn_exit_to_meetings')}
                    onClick={() => setExitConfirmOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Exit confirmation modal ── */}
      {exitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[440px] shadow-2xl flex flex-col">
            <div className="bg-white flex items-center justify-between gap-[15px] px-[25px] py-[20px] rounded-tl-[20px] rounded-tr-[20px] border-b border-[#c6c6c6] shrink-0">
              <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31]" style={{ fontFamily: 'Noto Sans' }}>
                {t('exit_confirm_title')}
              </span>
              <button type="button" onClick={() => setExitConfirmOpen(false)} className="flex items-center justify-center size-[30px] rounded hover:bg-[#f5ede9] transition-colors shrink-0">
                <Icon name="close" size="small" color="#6a3e31" />
              </button>
            </div>
            <div className="bg-white rounded-bl-[20px] rounded-br-[20px] px-[25px] pt-[20px] pb-[25px] flex flex-col gap-[20px]">
              <p className="text-[14px] leading-[22px] text-[#3b3b3b]" style={{ fontFamily: 'Noto Sans' }}>
                <span className="font-semibold text-[#2e7d32]">{t('exit_confirm_body_highlight')}</span>{' '}
                {t('exit_confirm_body_rest')}
              </p>
              <div className="flex items-center justify-end gap-[12px]">
                <Button
                  variant="outlined"
                  iconPlacement="none"
                  text={t('exit_confirm_no')}
                  onClick={() => setExitConfirmOpen(false)}
                />
                <Button
                  variant="filled"
                  iconPlacement="none"
                  text={t('exit_confirm_yes')}
                  onClick={() => navigate('/meetings/list')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
