const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

const STOPS = [
  '#f7f0ee',
  '#efe0dc',
  '#dfc2b9',
  '#cfa396',
  '#bf8573',
  '#ae6651',
  '#8c5240',
  '#693d30',
];

interface MapLegendProps {
  lowLabel?: string;
  highLabel?: string;
}

export default function MapLegend({ lowLabel = 'Low', highLabel = 'High' }: MapLegendProps) {
  return (
    <div className="flex flex-col gap-[6px] items-center w-full max-w-[320px]">
      <div className="flex w-full h-[10px] overflow-hidden rounded-full">
        {STOPS.map((color, i) => (
          <div
            key={i}
            className="flex-1 h-full"
            style={{
              backgroundColor: color,
              borderRadius: i === 0 ? '9999px 0 0 9999px' : i === STOPS.length - 1 ? '0 9999px 9999px 0' : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between w-full">
        <span className="text-[11px] text-[#727272]" style={NS}>{lowLabel}</span>
        <span className="text-[11px] text-[#727272]" style={NS}>{highLabel}</span>
      </div>
    </div>
  );
}
