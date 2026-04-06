interface SmallDetailsTextProps {
  text?: string;
  /** When true, renders bold weight in primary colour — matches Figma weight=bold variant */
  bold?: boolean;
  className?: string;
}

export default function SmallDetailsText({
  text = 'Venue: HOSAKOTE GP office(1522007034027)',
  bold = false,
  className,
}: SmallDetailsTextProps) {
  return (
    <p
      className={`${bold ? 'font-bold text-[#6a3e31]' : 'font-medium text-[#3b3b3b]'} leading-6 text-xs ${className ?? ''}`}
      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
    >
      {text}
    </p>
  );
}
