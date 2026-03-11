const imgChevronRight = "https://www.figma.com/api/mcp/asset/330e1a80-64c7-42e2-bcf2-5a4948cb5dc3";

interface GoBackToPreviousPageProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

export default function GoBackToPreviousPage({
  label = 'Go back to agenda list',
  onClick,
  className,
}: GoBackToPreviousPageProps) {
  return (
    <button
      onClick={onClick}
      className={`flex gap-2 items-center cursor-pointer bg-transparent border-none p-0 ${className ?? ''}`}
    >
      {/* Back arrow (rotated chevron) */}
      <div className="flex items-center justify-center shrink-0">
        <div className="rotate-180">
          <div className="relative size-[14px]">
            <img alt="" className="absolute block max-w-none size-full" src={imgChevronRight} />
          </div>
        </div>
      </div>
      <span
        className="font-medium text-sm text-[#212121] leading-5 tracking-[0.1px] whitespace-nowrap"
        style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
      >
        {label}
      </span>
    </button>
  );
}
