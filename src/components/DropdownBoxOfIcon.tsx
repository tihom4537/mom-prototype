import { useState, useRef, useEffect, useId } from 'react';
import Icon from './Icon';

interface DropdownBoxOfIconProps {
  menuLabel?: string;
  items?: string[];
  isOpen?: boolean;
  onToggle?: () => void;
  onItemClick?: (item: string) => void;
  triggerIcon?: React.ReactNode;
  className?: string;
}

export default function DropdownBoxOfIcon({
  menuLabel,
  items = ['Label1', 'Label2', 'Label3', 'Label4', 'Label5'],
  isOpen,
  onToggle,
  onItemClick,
  triggerIcon,
  className,
}: DropdownBoxOfIconProps) {
  const [open, setOpen] = useState(isOpen ?? false);
  const toggle = onToggle ?? (() => setOpen(o => !o));
  const isExpanded = onToggle !== undefined ? isOpen : open;
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Move focus into the list when it opens.
  useEffect(() => {
    if (isExpanded) {
      setHighlightedIndex(0);
      const firstItem = listRef.current?.querySelector<HTMLElement>('[role="option"]');
      firstItem?.focus();
    }
  }, [isExpanded]);

  function handleListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(i => {
          const next = Math.min(i + 1, items.length - 1);
          listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[next]?.focus();
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(i => {
          const prev = Math.max(i - 1, 0);
          listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[prev]?.focus();
          return prev;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onItemClick?.(items[highlightedIndex]);
        onToggle?.();
        break;
      case 'Escape':
        e.preventDefault();
        onToggle?.();
        break;
      default:
        break;
    }
  }

  return (
    <div className={`flex flex-col items-start relative ${className ?? ''}`}>
      {/* Trigger icon (closed state) */}
      {!isExpanded && (
        <button
          className="flex items-center justify-center size-[38px] cursor-pointer"
          onClick={toggle}
          aria-label="Open dropdown"
          aria-haspopup="listbox"
          aria-expanded={false}
        >
          {triggerIcon ?? <Icon type="arrow_drop_down" className="relative overflow-clip size-6" />}
        </button>
      )}

      {/* Open state: header (optional) + items */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-[260px]" onKeyDown={handleListKeyDown}>
          {/* Header — only when menuLabel provided */}
          {menuLabel && (
            <button
              className="bg-white flex items-center justify-between px-6 py-[11px] rounded-tl-lg rounded-tr-lg w-full"
              onClick={toggle}
            >
              <span className="font-normal text-sm text-[#727272] tracking-[0.25px]" style={{ fontFamily: 'Noto Sans' }}>
                {menuLabel}
              </span>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleY(-1)' }}>
                <path d="M1 1l6 6 6-6" />
              </svg>
            </button>
          )}
          {/* Items */}
          <div id={listId} role="listbox" ref={listRef} className="bg-white flex flex-col rounded-lg overflow-hidden">
            {items.map((item, i) => (
              <button
                key={i}
                role="option"
                aria-selected={i === highlightedIndex}
                tabIndex={i === highlightedIndex ? 0 : -1}
                className={`bg-white flex items-center px-6 py-[11px] w-full hover:bg-[#f7f0ee] transition-colors text-sm text-left ${i === highlightedIndex ? 'bg-[#f7f0ee]' : ''}`}
                onClick={() => { onItemClick?.(item); onToggle?.(); }}
                onFocus={() => setHighlightedIndex(i)}
              >
                <span className="font-normal text-sm text-[#212121] tracking-[0.25px]" style={{ fontFamily: 'Noto Sans' }}>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
