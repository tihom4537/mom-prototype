// Backward-compat map for old `type` prop values that differ from Material Icons names
const TYPE_ALIAS: Record<string, string> = {
  arrow_drop_down_up: 'arrow_drop_up',
};

export type IconSize = 'small' | 'medium' | 'large';

// Keep IconType exported for any existing TypeScript imports
export type IconType = 'arrow_drop_down' | 'arrow_drop_down_up' | 'file_copy' | 'menu' | 'people_alt' | 'home';

const SIZE_PX: Record<IconSize, number> = {
  small:  18,
  medium: 24,
  large:  36,
};

interface IconProps {
  /** Material Icons icon name, e.g. "home", "settings", "people_alt" */
  name?: string;
  /** Kept for backward compatibility with existing usages — prefer name. */
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
