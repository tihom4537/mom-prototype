import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Navbar,
  Sidebar,
  Breadcrumb,
  Stepper,
  MeetingDetailsCard,
  Button,
  DropdownBoxOfProfile,
  DropdownBoxOfIcon,
} from '../components';
import type { StepperActiveState } from '../components';

interface MeetingShellLayoutProps {
  children: React.ReactNode;
  stepperActiveState?: StepperActiveState;
}

export default function MeetingShellLayout({
  children,
  stepperActiveState = 2,
}: MeetingShellLayoutProps) {
  const { lang, setLang, t } = useLanguage();
  const [sidebarState, setSidebarState] = useState<'full' | 'shortened'>('full');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleSidebar = () =>
    setSidebarState(s => (s === 'full' ? 'shortened' : 'full'));

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f6f7fb]">

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

      {/* ── Row 2: Language tab (fixed) ── */}
      <div className="shrink-0 bg-white border-b border-[#eeeeee] flex gap-2 items-center px-6 py-2">
        <Button
          variant={lang === 'en' ? 'filled' : 'outlined'}
          state="default"
          iconPlacement="none"
          text={t('lang_english')}
          onClick={() => setLang('en')}
        />
        <Button
          variant={lang === 'kn' ? 'filled' : 'outlined'}
          state="default"
          iconPlacement="none"
          text={t('lang_kannada')}
          onClick={() => setLang('kn')}
        />
      </div>

      {/* ── Row 3: Sidebar + main column ── */}
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
          <div className="shrink-0 flex flex-col gap-5 px-6 pt-6 pb-5 shadow-[0_4px_12px_0_rgba(0,0,0,0.06)]">
            <Breadcrumb
              level={3}
              items={[
                t('breadcrumb_module'),
                t('breadcrumb_meetings'),
                t('breadcrumb_start_meeting'),
              ]}
            />
            <Stepper
              activeState={stepperActiveState}
              stepLabels={[t('step_1'), t('step_2'), t('step_3'), t('step_4')]}
            />
          </div>

          {/* Scrollable lower section — meeting card + screen-specific content */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            <div className="flex flex-col gap-5">
              <MeetingDetailsCard
                venue={`${t('meeting_venue_label')} HOSAKOTE GP office (1522007034027)`}
                participants={`${t('meeting_participants_label')} 16`}
              />
              {children}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
