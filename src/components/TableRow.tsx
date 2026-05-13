import React from 'react';

/**
 * Figma: Row component (node 110:13047)
 * Flex row with gap-px between cells (gap renders as #c6c6c6 background showing through).
 * rowType="header"  → header cells row (no interaction)
 * rowType="data"    → data cells row (clickable)
 */

interface TableRowProps {
  children?: React.ReactNode;
  rowType?: 'header' | 'data';
  className?: string;
}

export default function TableRow({ children, rowType = 'data', className = '' }: TableRowProps) {
  return (
    <div
      className={`flex gap-px w-full shrink-0 ${rowType === 'header' ? 'bg-[#c6c6c6]' : 'bg-[#c6c6c6] group'} ${className}`}
    >
      {children}
    </div>
  );
}
