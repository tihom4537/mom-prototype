import React from 'react';
import TableRow from './TableRow';
import TableCell from './TableCell';
import type { TableCellType } from './TableCell';

/**
 * Figma: Table (Grid + Row + Cell components, nodes 110:13006, 110:13047, 110:13027)
 * Flex-column container. Header row + data rows separated by gap-px (border colour shows through).
 * First column is always the checkbox column (cellType="checkbox").
 */

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: React.ReactNode;
  width?: string;         // Tailwind width class e.g. 'w-[157px] shrink-0' or 'flex-1 min-w-0'
  cellType?: TableCellType; // default: 'default'
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  rows: T[];
  selectedIds?: Set<number | string>;
  getRowId?: (row: T) => number | string;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
  footerRow?: React.ReactNode[];
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  rows,
  selectedIds,
  getRowId,
  onRowClick,
  className = '',
  emptyMessage = 'No results found',
  footerRow,
}: TableProps<T>) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-[6px] border border-[#c6c6c6] ${className}`}>
      {/* Header */}
      <TableRow rowType="header">
        {columns.map((col, i) => (
          <TableCell
            key={col.key}
            cellType="header"
            className={`${col.width ?? 'flex-1 min-w-0'}
              ${i === 0 ? 'rounded-tl-[6px]' : ''}
              ${i === columns.length - 1 ? 'rounded-tr-[6px]' : ''}`}
          >
            {col.label}
          </TableCell>
        ))}
      </TableRow>

      {/* Data rows + footer inside same gap-px wrapper */}
      <div className="flex flex-col gap-px bg-[#c6c6c6] overflow-y-auto flex-1">
        {rows.length === 0 ? (
          <div className="bg-white flex items-center justify-center py-12 text-[14px] text-[#727272]"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
            {emptyMessage}
          </div>
        ) : rows.map((row, ri) => {
          const id = getRowId ? getRowId(row) : ri;
          const isSelected = selectedIds ? selectedIds.has(id) : false;
          return (
            <TableRow key={ri} rowType="data">
              {columns.map((col) => {
                const type = col.cellType ?? 'default';
                return (
                  <TableCell
                    key={col.key}
                    cellType={type}
                    className={col.width ?? 'flex-1 min-w-0'}
                    selected={isSelected}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : <span>{String(row[col.key] ?? '')}</span>}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}

        {/* Footer / totals row — inside gap-px so it gets the same 1px separator */}
        {footerRow && (
          <div className="flex" style={{ background: '#f3f3f3' }}>
            {footerRow.map((cell, i) => (
              <div
                key={i}
                className={`${columns[i]?.width ?? 'flex-1 min-w-0'} px-[12px] py-[10px] text-[14px] font-semibold text-[#212121] whitespace-nowrap`}
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {cell}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
