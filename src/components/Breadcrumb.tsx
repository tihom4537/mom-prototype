import Icon from './Icon';

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
              <Icon name="chevron_right" size="small" color="#727272" />
            )}
          </div>
        );
      })}
    </div>
  );
}
