// Group 1: Navigation
export { default as Navbar } from './Navbar';
export { default as Sidebar } from './Sidebar';
export { default as SideNavOptions } from './SideNavOptions';
export { default as DropdownOptionsInSidenav } from './DropdownOptionsInSidenav';
export { default as Breadcrumb } from './Breadcrumb';

// Group 2: Icons
export { default as Icon } from './Icon';

// Group 3: Dropdowns
export { default as DropdownBoxOfProfile } from './DropdownBoxOfProfile';
export { default as DropdownBoxOfIcon } from './DropdownBoxOfIcon';

// Group 4: Buttons & Tags
export { default as Button } from './Button';
export { default as CompletionTag } from './CompletionTag';
export { default as FeedbackCardTags } from './FeedbackCardTags';

// Group 5: Meeting / MoM Specific
export { default as MeetingDetailsCard } from './MeetingDetailsCard';
export { default as SectionHeading } from './SectionHeading';
export { default as SectionHolder } from './SectionHolder';
export { default as MeetingDetailsTag } from './MeetingDetailsTag';
export { default as SmallDetailsText } from './SmallDetailsText';
export { default as AgendaCard } from './AgendaCard';
export { default as AgendaListCard } from './AgendaListCard';
export { default as AgendaNoLabel } from './AgendaNoLabel';
export { default as NumberCircle } from './NumberCircle';
export { default as MoMEntryPopUp } from './MoMEntryPopUp';
export { default as GoBackToPreviousPage } from './GoBackToPreviousPage';

// Group 6: Other UI
export { default as Stepper } from './Stepper';
export { default as TextAreaContainer } from './TextAreaContainer';
export { default as InfoBox } from './InfoBox';
export { default as QuestionFieldsSmall } from './QuestionFieldsSmall';
export { default as MicButton } from './MicButton';
export { default as FeedbackCard } from './FeedbackCard';

// Group 7: Form inputs (new — from Figma All Components)
export { default as InputField } from './InputField';
export { default as DropdownField } from './DropdownField';
export { default as DatePicker } from './DatePicker';
export { default as TimePicker } from './TimePicker';
export { default as Checkbox } from './Checkbox';
export { default as Badge } from './Badge';
export { default as SearchInput } from './SearchInput';
export { default as CloseButton } from './CloseButton';

export { default as DescriptionField } from './DescriptionField';
export { default as DateTimePicker } from './DateTimePicker';

// Group 8: New components from Figma redesign
export { default as RadioButton } from './RadioButton';
export { default as StatusBadge } from './StatusBadge';
export { default as Pagination } from './Pagination';
export { default as TableCell } from './TableCell';
export { default as TableRow } from './TableRow';
export { default as Table } from './Table';
export { default as DatePickerTrigger } from './DatePickerTrigger';
export { default as TimePickerTrigger } from './TimePickerTrigger';
export { default as Footer } from './Footer';
export { default as AppDownloadCTA } from './AppDownloadCTA';

// Types
export type { NavbarVersion } from './Navbar';
export type { SectionHeadingVariant } from './SectionHeading';
export type { SectionHolderVariant } from './SectionHolder';
export type { SidebarState } from './Sidebar';
export type { SidenavDropdownState } from './DropdownOptionsInSidenav';
export type { SubNavItem } from './SideNavOptions';
export type { IconType } from './Icon';
export type { ButtonVariant, ButtonState, ButtonIconPlacement, ButtonSize } from './Button';
export type { CompletionState } from './CompletionTag';
export type { FeedbackTagType } from './FeedbackCardTags';
export type { AgendaStage } from './AgendaCard';
export type { AgendaNoLabelType } from './AgendaNoLabel';
export type { NumberCircleType } from './NumberCircle';
export type { InfoBoxType } from './InfoBox';
export type { QuestionFieldType } from './QuestionFieldsSmall';
export type { TextAreaState, HighlightSpan } from './TextAreaContainer';
export type { FeedbackCardType, Segment } from './FeedbackCard';
export type { StepperActiveState } from './Stepper';
export type { MoMPopUpState } from './MoMEntryPopUp';
export type { InputFieldState } from './InputField';
export type { CheckboxColor, CheckboxChecked } from './Checkbox';
export type { BadgeVariant, BadgeSize } from './Badge';
export type { CloseButtonVariant, CloseButtonSize } from './CloseButton';
export type { RadioButtonState } from './RadioButton';
export type { StatusBadgeVariant } from './StatusBadge';
export type { PaginationPosition } from './Pagination';
export type { TableCellAlign, TableCellType } from './TableCell';
export type { TableColumn } from './Table';
export type { FooterVariant } from './Footer';
export type { AppDownloadCTAVariant } from './AppDownloadCTA';
export type { DescriptionFieldState } from './DescriptionField';

// Group 9: Dashboard components (Meeting Management Dashboard)
export { default as UrgencyBanner } from './UrgencyBanner';
export { default as DashboardStatusBadge } from './DashboardStatusBadge';
export { default as ActionItemCard } from './ActionItemCard';
export { default as UpcomingMeetingRow } from './UpcomingMeetingRow';
export { default as QuickActionCard } from './QuickActionCard';
export { default as ComplianceCard } from './ComplianceCard';
export { default as AgendaTag } from './AgendaTag';
export { default as Chip } from './Chip';
export { default as TimelineRow } from './TimelineRow';
export { default as TaskRow } from './TaskRow';
export { default as DocumentCard } from './DocumentCard';
export { default as TabOptions } from './TabOptions';
export { default as HelplineCard } from './HelplineCard';
export { default as DashboardMenuBarItem } from './DashboardMenuBarItem';
export { default as QuorumBar } from './QuorumBar';
export { default as AttendancePill } from './AttendancePill';
export { default as Tooltip } from './Tooltip';
export { default as ViewProceedingsModal } from './ViewProceedingsModal';
export type { AttendanceStatus } from './AttendancePill';
export type { TooltipDirection } from './Tooltip';

export type { UrgencyBannerStatus } from './UrgencyBanner';
export type { DashboardBadgeVariant } from './DashboardStatusBadge';
export type { ActionItemStatus } from './ActionItemCard';
export type { NoticeBadgeVariant } from './UpcomingMeetingRow';
export type { ComplianceStatus } from './ComplianceCard';
export type { DashboardMenuBarItemState } from './DashboardMenuBarItem';
export { default as StepNavBar } from './StepNavBar';

// Group 12: Karnataka Map
export { default as KarnatakaMap, KarnatakaMapTooltip } from './KarnatakaMap';
export type { KarnatakaMapProps } from './KarnatakaMap';
export { default as KarnatakaLeafletMap, TALUK_NAME_MAP, toGeoTalukName } from './KarnatakaLeafletMap';
export type { KarnatakaLeafletMapProps } from './KarnatakaLeafletMap';
export { default as MapLegend } from './MapLegend';

// Group 11: Homepage content components
export { default as DashboardMetricCard } from './DashboardMetricCard';
export type { MetricCardTrend } from './DashboardMetricCard';
export { default as PageSectionHeading } from './PageSectionHeading';
export { default as SearchSuggestions } from './SearchSuggestions';

// Group 10b: Homepage chrome components
export { default as AccessibilityBar } from './AccessibilityBar';
export { default as EyebrowPill } from './EyebrowPill';
export { default as LangToggle } from './LangToggle';
export type { LangToggleSelected } from './LangToggle';
export { default as HomepageSearch } from './HomepageSearch';
export type { HomepageSearchState } from './HomepageSearch';

// Group 10: Landing page / public-facing components
export { default as Card } from './Card';
export type { CardVariant } from './Card';
export { default as LiveCounterStrip } from './LiveCounterStrip';
export { default as OrientationStrip } from './OrientationStrip';
export { default as NewsCard } from './NewsCard';
export { InitiativesCard, EventsCard, GuidelinesCard, NotificationsCard } from './NewsCard';
export type { NewsCardType, InitiativesCardProps, EventsCardProps, GuidelinesCardProps, NotificationsCardProps } from './NewsCard';
export { default as EcosystemAppCard } from './EcosystemAppCard';
export { default as VariantSwitcherPill } from './VariantSwitcherPill';
export { default as AboutStakeholdersCard } from './AboutStakeholdersCard';
export type { AboutStakeholdersCardProps } from './AboutStakeholdersCard';
export { default as ModuleCardV3 } from './ModuleCardV3';
export type { ModuleCardV3Props } from './ModuleCardV3';
export { default as Reveal } from './Reveal';
