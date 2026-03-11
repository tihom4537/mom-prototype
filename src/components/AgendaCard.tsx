import NumberCircle from './NumberCircle';
import CompletionTag from './CompletionTag';
import Button from './Button';

export type AgendaStage = 'default' | 'completed' | 'inside';

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
  const isInside = stage === 'inside';
  const isCompleted = stage === 'completed';

  return (
    <div
      className={`border border-[rgba(106,62,49,0.32)] flex flex-col items-end rounded-[15px]
        ${isInside ? 'bg-[#f7f0ee] p-[15px] w-[810px]' : 'bg-white gap-4 p-[25px] w-full'}
        ${className ?? ''}`}
    >
      {/* Header row */}
      <div className={`flex items-start pt-[3px] shrink-0 w-full ${!isInside ? 'justify-between' : ''}`}>
        <div className={`flex gap-[15px] items-start max-w-[780px] ${isInside ? 'shrink-0 w-[780px]' : 'flex-1 min-h-px min-w-px'}`}>
          <NumberCircle
            type={isInside ? 'proceedings' : 'agenda'}
            number={agendaNumber}
          />
          <div className="flex flex-col gap-[9px] items-start justify-center shrink-0 w-[727px] py-[3px]">
            <p
              className="font-medium leading-6 text-[#6a3e31] text-lg w-full"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {agendaHeading}
            </p>
            <p
              className="font-normal leading-[21px] text-[#3b3b3b] text-sm w-full"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {agendaDescription}
            </p>
          </div>
        </div>

        {/* Completion tag (not shown for inside stage) */}
        {!isInside && (
          <CompletionTag state={isCompleted ? 'completed' : 'pending'} className="shrink-0" />
        )}
      </div>

      {/* Actions row */}
      {stage === 'default' && (
        <Button
          variant="filled"
          iconPlacement="left"
          text={addProceedingsText}
          onClick={onAddProceedings}
          className="shrink-0"
        />
      )}
      {isCompleted && (
        <div className="flex gap-4 items-start justify-end shrink-0">
          <Button
            variant="outlined"
            iconPlacement="left"
            text={viewProceedingsText}
            onClick={onViewProceedings}
            className="shrink-0"
          />
          <Button
            variant="filled"
            iconPlacement="left"
            text={editProceedingsText}
            onClick={onEditProceedings}
            className="shrink-0"
          />
        </div>
      )}
    </div>
  );
}
