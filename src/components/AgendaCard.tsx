import NumberCircle from './NumberCircle';
import CompletionTag from './CompletionTag';
import Button from './Button';

export type AgendaStage = 'default' | 'completed' | 'inside' | 'subpage';

interface AgendaCardProps {
  stage?: AgendaStage;
  agendaNumber?: string | number;
  agendaHeading?: string;
  agendaDescription?: string;
  addProceedingsText?: string;
  viewProceedingsText?: string;
  editProceedingsText?: string;
  onAddProceedings?: () => void;
  onViewProceedings?: () => void;
  onEditProceedings?: () => void;
  className?: string;
}

export default function AgendaCard({
  stage = 'default',
  agendaNumber = '1',
  agendaHeading = 'Reading and reporting on the proceedings of the previous meeting',
  agendaDescription = 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.',
  addProceedingsText = 'Add Proceedings',
  viewProceedingsText = 'View Proceedings',
  editProceedingsText = 'Edit Proceedings',
  onAddProceedings,
  onViewProceedings,
  onEditProceedings,
  className,
}: AgendaCardProps) {
  const isDefault   = stage === 'default';
  const isCompleted = stage === 'completed';
  const isInside    = stage === 'inside';
  const isSubpage   = stage === 'subpage';
  const isCompact   = isInside || isSubpage;

  // ── Container styles ──────────────────────────────────────────────────────
  // default/completed: white card, 15px radius, px-25 py-20, border rgba(106,62,49,0.32)
  // inside:           #f7f0ee bg, 8px radius, px-15 pt-8 pb-10, NO border
  // subpage/grey:     #f8f8f8 bg, 8px radius, px-15 pt-8 pb-10, border #ddd
  const containerCls = isSubpage
    ? 'border border-[rgba(106,62,49,0.24)] px-[15px] pt-[8px] pb-[10px] rounded-[8px]'
    : isInside
    ? 'bg-[#f7f0ee] px-[15px] pt-[8px] pb-[10px] rounded-[8px]'
    : 'bg-white border border-[rgba(106,62,49,0.32)] px-[25px] py-[20px] gap-[16px] rounded-[15px]';

  // ── NumberCircle type ─────────────────────────────────────────────────────
  // default/completed/subpage: type5 — #efe0dc 32px NO border
  // inside:                    proceedings — #efe0dc 32px WITH border #6a3e31
  const circleType = isInside ? 'proceedings' : 'subpage';

  // ── Heading color ─────────────────────────────────────────────────────────
  // subpage/grey: #4b4b4b  |  all others: #6a3e31
  const headingColor = isSubpage ? 'text-[#4b4b4b]' : 'text-[#6a3e31]';

  return (
    <div className={`flex flex-col items-end w-full ${containerCls} ${className ?? ''}`}>

      {/* ── Header row ── */}
      <div className={`flex items-start pt-[3px] shrink-0 w-full ${!isCompact ? 'justify-between' : ''}`}>

        {/* Left: circle + text */}
        <div className={`flex gap-[15px] items-start ${isCompact ? 'w-full' : 'flex-1 min-h-px min-w-px'}`}>

          {/* Number circle — always 32px; inside adds border */}
          <NumberCircle type={circleType} number={agendaNumber} />

          {/* Text block */}
          {/* compact: no gap/padding between heading & desc */}
          {/* default/completed: gap-[9px] + py-[3px] on the block */}
          <div className={`flex flex-col items-start justify-center flex-1 min-w-0 ${!isCompact ? 'gap-[9px] py-[3px]' : ''}`}>
            <p
              className={`font-medium leading-6 w-full ${!isCompact ? 'text-[18px]' : 'text-[14px]'} ${headingColor}`}
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {agendaHeading}
            </p>
            <p
              className={`font-normal leading-[21px] text-[#3b3b3b] w-full ${!isCompact ? 'text-[14px]' : 'text-[12px]'}`}
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {agendaDescription}
            </p>
          </div>
        </div>

        {/* Completion tag — default/completed only */}
        {!isCompact && (
          <CompletionTag state={isCompleted ? 'completed' : 'pending'} className="shrink-0 ml-[15px]" />
        )}
      </div>

      {/* ── CTA — default: Add Proceedings ── */}
      {isDefault && (
        <Button
          variant="filled"
          iconPlacement="left"
          text={addProceedingsText}
          onClick={onAddProceedings}
          className="shrink-0"
        />
      )}

      {/* ── CTA — completed: View + Edit ── */}
      {isCompleted && (
        <div className="flex gap-[16px] items-center justify-end shrink-0">
          <Button
            variant="outlined"
            iconPlacement="left"
            iconName="visibility"
            text={viewProceedingsText}
            onClick={onViewProceedings}
            className="shrink-0"
          />
          <Button
            variant="filled"
            iconPlacement="left"
            iconName="edit_note"
            text={editProceedingsText}
            onClick={onEditProceedings}
            className="shrink-0"
          />
        </div>
      )}

    </div>
  );
}
