import Button from './Button';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface DocumentCardProps {
  documentName: string;
  onDownload?: () => void;
  className?: string;
}

export default function DocumentCard({ documentName, onDownload, className }: DocumentCardProps) {
  return (
    <div
      className={`bg-white border border-[rgba(106,62,49,0.24)] flex items-center justify-between px-[20px] py-[16px] h-[100px] rounded-[10px] ${className ?? 'w-full'}`}
    >
      {/* Left */}
      <div className="flex items-center gap-[14px] flex-1 min-w-0">
        <div className="bg-[#f7f0ee] flex items-center justify-center rounded-[8px] size-[40px] shrink-0">
          <span className="font-normal text-[16px] text-[rgba(106,62,49,0.7)]" style={NS}>⊞</span>
        </div>
        <p className="font-medium text-[14px] leading-[20px] text-[#212121] truncate" style={NS}>
          {documentName}
        </p>
      </div>

      <Button
        variant="outlined"
        size="small"
        iconPlacement="none"
        text="Download"
        onClick={onDownload}
      />
    </div>
  );
}
