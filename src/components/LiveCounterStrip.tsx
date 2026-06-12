const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface StatItem {
  value: string;
  label: string;
  suffix?: string;
}

interface LiveCounterStripProps {
  liveText?: string;
  liveSubtext?: string;
  stats?: StatItem[];
  valueColor?: string;
  className?: string;
}

const DEFAULT_STATS: StatItem[] = [
  { value: '5,963', label: 'Gram Panchayats', suffix: 'across Karnataka' },
  { value: '236', label: 'Taluks', suffix: 'covered' },
  { value: '31', label: 'Districts', suffix: 'covered' },
  { value: '31', label: 'Districts', suffix: 'covered' },
  { value: '84,200+', label: 'Meetings recorded', suffix: 'this financial year' },
];

export default function LiveCounterStrip({
  liveText = 'Live data',
  liveSubtext = 'Updated in real time from 5,963 Gram Panchayats across Karnataka',
  stats = DEFAULT_STATS,
  valueColor,
  className,
}: LiveCounterStripProps) {
  return (
    <div className={`bg-white flex flex-col items-start px-[80px] py-[32px] w-full ${className ?? ''}`}>
      {/* Live row */}
      <div className="flex gap-[6px] items-center justify-center overflow-clip w-full">
        <span className="inline-block size-[7px] rounded-full bg-[#309314] shrink-0" />
        <span
          className="font-medium text-[11px] text-[#6a3e31] tracking-[0.8px] whitespace-nowrap"
          style={NS}
        >
          {liveText}
        </span>
        <span className="font-normal text-[11px] text-[#6a3e31]" style={NS}> · </span>
        <span className="font-normal text-[11px] text-[#6a3e31] whitespace-nowrap" style={NS}>
          {liveSubtext}
        </span>
      </div>

      <div className="h-[14px] shrink-0 w-full" />

      {/* Stats row */}
      <div className="flex gap-[20px] h-[72px] items-center justify-center overflow-clip w-full">
        {stats.map((stat, i) => (
          <>
            {i > 0 && (
              <div key={`div-${i}`} className="bg-[#ED8243] h-[44px] shrink-0 w-px" />
            )}
            <div
              key={`stat-${i}`}
              className={`flex flex-col gap-[2px] items-start leading-normal overflow-clip whitespace-nowrap text-[#6a3e31] ${i === 0 ? 'pr-[28px]' : i === stats.length - 1 ? 'pl-[28px]' : 'px-[28px]'} shrink-0`}
            >
              <p className="font-bold text-[30px] tracking-[-0.5px] text-[#6a3e31]" style={NS}>{stat.value}</p>
              <div className="flex gap-[4px] items-center overflow-clip">
                <span className="font-medium text-[12px] text-[#ED8243]" style={NS}>{stat.label}</span>
                {stat.suffix && (
                  <>
                    <span className="font-normal text-[11px] text-[#ED8243]" style={NS}> · </span>
                    <span className="font-normal text-[12px] text-[#ED8243]" style={NS}>{stat.suffix}</span>
                  </>
                )}
              </div>
            </div>
          </>
        ))}
      </div>
    </div>
  );
}
