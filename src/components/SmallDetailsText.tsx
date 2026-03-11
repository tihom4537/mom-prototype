interface SmallDetailsTextProps {
  text?: string;
  className?: string;
}

export default function SmallDetailsText({
  text = 'Venue: HOSAKOTE GP office(1522007034027)',
  className,
}: SmallDetailsTextProps) {
  return (
    <p
      className={`font-medium leading-6 text-[#3b3b3b] text-xs ${className ?? ''}`}
      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
    >
      {text}
    </p>
  );
}
