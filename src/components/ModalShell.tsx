import { useEffect, useRef } from 'react';
import CloseButton from './CloseButton';
import { useFocusTrap } from '../hooks/useFocusTrap';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface ModalShellProps {
  title: string;
  titleColor?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export default function ModalShell({
  title,
  titleColor = '#6a3e31',
  onClose,
  children,
  width = 'w-[520px]',
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  useFocusTrap(dialogRef, true, closeButtonRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex flex-col ${width} max-w-[90vw] max-h-[85vh] rounded-[20px] shadow-2xl`}
      >
        {/* Header */}
        <div className="bg-white flex items-center justify-between px-[25px] py-[15px] border-b border-[#e0e0e0] shrink-0 rounded-t-[20px]">
          <p
            id={titleId}
            className="text-[20px] font-semibold leading-[24px]"
            style={{ ...NS, color: titleColor }}
          >
            {title}
          </p>
          <CloseButton ref={closeButtonRef} onClick={onClose} />
        </div>

        {/* Body */}
        <div className="bg-white flex flex-col gap-[20px] px-[25px] pt-[20px] pb-[25px] rounded-b-[20px]">
          {children}
        </div>
      </div>
    </div>
  );
}
