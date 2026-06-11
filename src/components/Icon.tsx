const TYPE_ALIAS: Record<string, string> = {
  arrow_drop_down_up: 'arrow_drop_up',
};

/**
 * All UX4G / Material Icons names used or available in this project.
 * Add new names here as needed — they map 1:1 to Material Icons ligature strings.
 */
export type IconName =
  // Navigation & layout
  | 'menu'
  | 'close'
  | 'chevron_right'
  | 'chevron_left'
  | 'expand_more'
  | 'expand_less'
  | 'arrow_back'
  | 'arrow_forward'
  | 'arrow_drop_down'
  | 'arrow_drop_up'
  | 'more_vert'
  | 'more_horiz'
  | 'home'
  | 'dashboard'
  // Actions
  | 'add'
  | 'add_circle'
  | 'add_circle_outline'
  | 'remove'
  | 'delete'
  | 'delete_outline'
  | 'edit'
  | 'edit_note'
  | 'save'
  | 'save_alt'
  | 'download'
  | 'upload'
  | 'upload_file'
  | 'file_upload'
  | 'file_download'
  | 'search'
  | 'filter_list'
  | 'sort'
  | 'refresh'
  | 'sync'
  | 'done'
  | 'done_all'
  | 'check'
  | 'check_circle'
  | 'check_circle_outline'
  | 'cancel'
  | 'block'
  | 'copy_all'
  | 'content_copy'
  | 'file_copy'
  | 'print'
  | 'share'
  | 'open_in_new'
  | 'link'
  // Status & feedback
  | 'info'
  | 'info_outline'
  | 'warning'
  | 'warning_amber'
  | 'error'
  | 'error_outline'
  | 'help'
  | 'help_outline'
  | 'report_problem'
  | 'notifications'
  | 'notifications_none'
  // People & accounts
  | 'person'
  | 'person_outline'
  | 'people'
  | 'people_alt'
  | 'account_circle'
  | 'manage_accounts'
  | 'badge'
  | 'group'
  | 'group_add'
  // Meeting / document specific
  | 'event'
  | 'calendar_today'
  | 'calendar_month'
  | 'schedule'
  | 'access_time'
  | 'location_on'
  | 'place'
  | 'video_call'
  | 'videocam'
  | 'mic'
  | 'mic_none'
  | 'mic_off'
  | 'record_voice_over'
  | 'description'
  | 'article'
  | 'note'
  | 'notes'
  | 'list'
  | 'list_alt'
  | 'task'
  | 'task_alt'
  | 'assignment'
  | 'assignment_turned_in'
  | 'folder'
  | 'folder_open'
  | 'attach_file'
  | 'attachment'
  | 'document_scanner'
  | 'feed'
  | 'grading'
  | 'summarize'
  | 'format_list_numbered'
  | 'format_list_bulleted'
  | 'table_chart'
  | 'table_rows'
  // Settings & admin
  | 'settings'
  | 'tune'
  | 'admin_panel_settings'
  | 'lock'
  | 'lock_open'
  | 'logout'
  | 'login'
  | 'visibility'
  | 'visibility_off'
  // Communication
  | 'chat'
  | 'comment'
  | 'feedback'
  | 'rate_review'
  | 'message'
  | 'send'
  | 'forum'
  // Misc UI
  | 'star'
  | 'star_outline'
  | 'bookmark'
  | 'bookmark_border'
  | 'label'
  | 'tag'
  | 'circle'
  | 'radio_button_checked'
  | 'radio_button_unchecked'
  | 'check_box'
  | 'check_box_outline_blank'
  | 'toggle_on'
  | 'toggle_off'
  | 'drag_indicator'
  | 'drag_handle'
  | 'reorder'
  | 'swap_vert'
  | 'unfold_more'
  | 'unfold_less'
  // Accessibility & display
  | 'contrast'
  | 'accessibility'
  | 'accessibility_new'
  | 'invert_colors'
  | 'format_size'
  | 'text_increase'
  | 'text_decrease'
  // Finance & civic
  | 'account_balance'
  | 'payments'
  | 'account_tree'
  | 'school'
  | 'groups'
  // Analytics & data
  | 'analytics'
  | 'bar_chart'
  | 'pie_chart'
  | 'trending_up'
  | 'trending_down'
  | 'trending_flat'
  | 'show_chart'
  | 'leaderboard'
  // Map
  | 'map'
  | 'public'
  | 'language';

// Keep for backward compat
export type IconType = IconName;

export type IconSize = 'small' | 'medium' | 'large';

const SIZE_PX: Record<IconSize, number> = {
  small:  18,
  medium: 24,
  large:  36,
};

interface IconProps {
  name?: IconName | (string & Record<never, never>);
  type?: string;
  size?: IconSize;
  color?: string;
  className?: string;
}

export default function Icon({
  name,
  type,
  size = 'medium',
  color = 'currentColor',
  className,
}: IconProps) {
  const resolvedName = name ?? (type ? (TYPE_ALIAS[type] ?? type) : 'help_outline');

  return (
    <span
      className={`material-icons-outlined select-none${className ? ` ${className}` : ''}`}
      style={{ fontSize: SIZE_PX[size], color, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {resolvedName}
    </span>
  );
}
