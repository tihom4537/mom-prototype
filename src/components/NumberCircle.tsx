export type NumberCircleType = 'agenda' | 'proceedings';

interface NumberCircleProps {
  type?: NumberCircleType;
  number?: string | number;
  className?: string;
}

export default function NumberCircle({ type = 'agenda', number = '1', className }: NumberCircleProps) {
  const isProceedings = type === 'proceedings';
  return (
    <div
      className={`flex flex-col items-center justify-center px-1 py-[6px] rounded-full border shrink-0
        ${isProceedings
          ? 'bg-[#efe0dc] border-[#6a3e31] size-[28px]'
          : 'bg-[#ff7468] border-[#ff7468] w-8'}
        ${className ?? ''}`}
    >
      <span
        className={`font-medium text-sm text-center leading-5 tracking-[0.1px] w-full
          ${isProceedings ? 'text-[#6a3e31]' : 'text-white font-extrabold'}`}
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {number}
      </span>
    </div>
  );
}
