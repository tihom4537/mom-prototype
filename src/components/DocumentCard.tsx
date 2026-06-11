import Button from './Button';
import Icon from './Icon';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

interface DocumentCardProps {
  documentName: string;
  onDownload?: () => void;
  onView?: () => void;
  className?: string;
}

export default function DocumentCard({ documentName, onDownload, onView, className }: DocumentCardProps) {
  return (
    <div
      className={`bg-white border border-[#dddddd] flex items-center gap-[10px] px-[20px] py-[10px] h-[100px] rounded-[10px] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.05)] ${className ?? 'w-full'}`}
    >
      {/* Left */}
      <div className="flex items-center gap-[14px] flex-1 min-w-0">
        <div className="bg-[#f7f0ee] flex items-center justify-center rounded-[8px] size-[40px] shrink-0">
          <Icon name="description" size="medium" color="#6a3e31" />
        </div>
        <p className="font-medium text-[14px] leading-[20px] text-[#212121]" style={NS}>
          {documentName}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[10px] shrink-0">
        <Button
          variant="outlined"
          size="small"
          iconPlacement="left"
          iconName="visibility"
          text="View"
          onClick={onView}
        />
        <Button
          variant="filled"
          size="small"
          iconPlacement="left"
          iconName="download"
          text="Download"
          onClick={onDownload}
        />
      </div>
    </div>
  );
}
