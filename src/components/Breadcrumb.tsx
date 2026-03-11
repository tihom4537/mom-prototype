const imgChevronRight = "https://www.figma.com/api/mcp/asset/2123c961-4d39-444a-9572-b219cf8e5cb9";

interface BreadcrumbProps {
  level?: 3 | 4;
  items?: string[];
  className?: string;
}

export default function Breadcrumb({ level = 3, items, className }: BreadcrumbProps) {
  const defaultItems3 = ['Meeting Management Module', 'Meetings', 'Start Meeting'];
  const defaultItems4 = ['Meeting Management Module', 'Meetings', 'Meetings', 'Start Meeting'];
  const crumbs = items ?? (level === 4 ? defaultItems4 : defaultItems3);

  return (
    <div className={`flex gap-2 items-center ${className ?? ''}`}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`text-sm leading-5 whitespace-nowrap ${
                isLast
                  ? 'font-medium text-[#212121] tracking-[0.1px]'
                  : 'font-normal text-[#727272] tracking-[0.25px]'
              }`}
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {crumb}
            </span>
            {!isLast && (
              <div className="relative shrink-0 size-[6px]">
                <img alt="›" className="absolute block max-w-none size-full" src={imgChevronRight} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
