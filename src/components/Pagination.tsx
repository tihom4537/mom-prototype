import Icon from './Icon';

export type PaginationPosition = 'first' | 'middle' | 'last';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  position?: PaginationPosition;
  itemControl?: boolean;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (count: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  position,
  itemControl = true,
  itemsPerPage = 10,
  itemsPerPageOptions = [10, 25, 50, 100],
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  className,
}: PaginationProps) {
  const derivedPosition: PaginationPosition =
    position ?? (currentPage === 1 ? 'first' : currentPage === totalPages ? 'last' : 'middle');

  const isFirst = derivedPosition === 'first';
  const isLast  = derivedPosition === 'last';

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const showingText = totalItems != null
    ? `Showing ${itemsPerPage} of ${totalItems} items`
    : null;

  return (
    <div className={`flex items-center justify-center w-full ${className ?? ''}`}>

      {/* Left: prev + page numbers + next */}
      <div className="flex items-center gap-[2px]">

        {/* Prev */}
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="flex items-center justify-center p-[8px] rounded-[4px] disabled:opacity-50 hover:bg-[#f7f0ee] transition-colors"
          aria-label="Previous page"
        >
          <Icon name="chevron_left" size="small" color="#212121" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-[8px] py-[6px] text-[14px] leading-[20px] text-[#727272] font-normal tracking-[0.25px]"
              style={NS}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p as number)}
              className={`px-[8px] py-[6px] rounded-[8px] text-[14px] leading-[20px] tracking-[0.1px] transition-colors cursor-pointer ${
                p === currentPage
                  ? 'bg-white border border-[#6a3e31] font-medium text-[#212121]'
                  : 'font-normal text-[#727272] hover:bg-[#f7f0ee]'
              }`}
              style={NS}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          disabled={isLast}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="flex items-center justify-center p-[8px] rounded-[4px] disabled:opacity-50 hover:bg-[#f7f0ee] transition-colors"
          aria-label="Next page"
        >
          <Icon name="chevron_right" size="small" color="#212121" />
        </button>
      </div>

      {/* Right: items control or showing text */}
      {itemControl ? (
        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] leading-[16px] text-[#727272] tracking-[0.4px]" style={NS}>
            Showing
          </span>
          <select
            value={itemsPerPage}
            onChange={e => onItemsPerPageChange?.(Number(e.target.value))}
            className="bg-white border border-[#b0b0b0] rounded-[8px] pl-[8px] pr-[24px] py-[8px] text-[12px] text-[#727272] tracking-[0.4px] cursor-pointer appearance-none"
            style={NS}
          >
            {itemsPerPageOptions.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {showingText ? (
            <span className="text-[12px] leading-[16px] text-[#727272] tracking-[0.4px]" style={NS}>
              of {totalItems} items
            </span>
          ) : (
            <span className="text-[12px] leading-[16px] text-[#727272] tracking-[0.4px]" style={NS}>
              of {totalPages * itemsPerPage} items
            </span>
          )}
        </div>
      ) : showingText ? (
        <span className="text-[12px] leading-[16px] text-[#727272] tracking-[0.4px]" style={NS}>
          {showingText}
        </span>
      ) : null}

    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}
