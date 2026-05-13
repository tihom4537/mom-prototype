import NumberCircle from './NumberCircle';
import CompletionTag from './CompletionTag';
import Button from './Button';
import { useLanguage } from '../i18n/LanguageContext';

export type AgendaStage = 'default' | 'completed' | 'inside' | 'subpage' | 'review-pending' | 'review-done';

interface AgendaCardProps {
  stage?: AgendaStage;
  agendaNumber?: string | number;
  agendaHeading?: string;
  agendaDescription?: string;
  addProceedingsText?: string;
  viewProceedingsText?: string;
  editProceedingsText?: string;
  addReviewText?: string;
  completionTagLabel?: string;
  onAddProceedings?: () => void;
  onViewProceedings?: () => void;
  onEditProceedings?: () => void;
  onAddReview?: () => void;
  className?: string;
}

export default function AgendaCard({
  stage = 'default',
  agendaNumber = '1',
  agendaHeading = '',
  agendaDescription = '',
  addProceedingsText,
  viewProceedingsText,
  editProceedingsText,
  addReviewText,
  completionTagLabel,
  onAddProceedings,
  onViewProceedings,
  onEditProceedings,
  onAddReview,
  className,
}: AgendaCardProps) {
  const { t } = useLanguage();
  const _addProceedingsText  = addProceedingsText  ?? t('btn_add_proceedings_list');
  const _viewProceedingsText = viewProceedingsText ?? t('btn_view_proceedings');
  const _editProceedingsText = editProceedingsText ?? t('btn_edit_proceedings');
  const _addReviewText       = addReviewText       ?? t('proceedings_review_add_review');
  const isDefault       = stage === 'default';
  const isCompleted     = stage === 'completed';
  const isInside        = stage === 'inside';
  const isSubpage       = stage === 'subpage';
  const isReviewPending = stage === 'review-pending';
  const isReviewDone    = stage === 'review-done';
  const isCompact       = isInside || isSubpage;

  const containerCls = isSubpage
    ? 'border border-[rgba(106,62,49,0.24)] px-[15px] pt-[8px] pb-[10px] rounded-[8px]'
    : isInside
    ? 'bg-[#f7f0ee] px-[15px] pt-[8px] pb-[10px] rounded-[8px]'
    : 'bg-white border border-[rgba(106,62,49,0.32)] px-[25px] py-[20px] gap-[10px] rounded-[15px]';

  const circleType = isInside ? 'proceedings' : 'subpage';
  const headingColor = isSubpage ? 'text-[#4b4b4b]' : 'text-[#6a3e31]';

  return (
    <div className={`flex flex-col items-end w-full ${containerCls} ${className ?? ''}`}>

      {/* ── Header row ── */}
      <div className={`flex items-start shrink-0 w-full ${isCompact ? 'pt-[3px]' : 'justify-between'}`}>

        {/* Left: circle + text */}
        <div className="flex gap-[15px] items-start flex-1 min-w-0">

          <NumberCircle type={circleType} number={agendaNumber} />

          <div className={`flex flex-col items-start ${isCompact ? 'justify-center flex-1 min-w-0' : 'flex-1 min-w-0 justify-center gap-[5px] py-[3px]'}`}>
            <p
              className={`font-medium w-full ${isCompact ? 'text-[14px] leading-[24px]' : 'text-[16px] leading-[24px] tracking-[0.15px]'} ${headingColor}`}
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              {agendaHeading}
            </p>
            {agendaDescription && (
              <p
                className={`w-full text-[#3b3b3b] ${isCompact ? 'font-normal text-[12px] leading-[20px]' : 'font-normal text-[14px] leading-[20px] tracking-[0.1px]'}`}
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {agendaDescription}
              </p>
            )}
          </div>
        </div>

        {/* Completion tag — default/completed/review */}
        {!isCompact && (
          <CompletionTag
            state={isCompleted || isReviewDone ? 'completed' : 'pending'}
            label={completionTagLabel}
            className="shrink-0 ml-[15px]"
          />
        )}
      </div>

      {/* ── CTA — default: Add Proceedings ── */}
      {isDefault && (
        <Button
          variant="filled"
          size="small"
          iconPlacement="left"
          iconName="add"
          text={_addProceedingsText}
          onClick={onAddProceedings}
          className="shrink-0"
        />
      )}

      {/* ── CTA — review-pending: Add Review ── */}
      {isReviewPending && (
        <Button
          variant="filled"
          size="small"
          iconPlacement="left"
          iconName="add"
          text={_addReviewText}
          onClick={onAddReview}
          className="shrink-0"
        />
      )}

      {/* ── CTA — review-done: View + Edit ── */}
      {isReviewDone && (
        <div className="flex gap-[10px] items-center justify-end shrink-0">
          <Button
            variant="outlined"
            size="small"
            iconPlacement="left"
            iconName="visibility"
            text={_viewProceedingsText}
            onClick={onViewProceedings}
            className="shrink-0"
          />
          <Button
            variant="filled"
            size="small"
            iconPlacement="left"
            iconName="edit"
            text={_editProceedingsText}
            onClick={onEditProceedings}
            className="shrink-0"
          />
        </div>
      )}

      {/* ── CTA — completed: View + Edit ── */}
      {isCompleted && (
        <div className="flex gap-[10px] items-center justify-end shrink-0">
          <Button
            variant="outlined"
            size="small"
            iconPlacement="left"
            iconName="visibility"
            text={_viewProceedingsText}
            onClick={onViewProceedings}
            className="shrink-0"
          />
          <Button
            variant="filled"
            size="small"
            iconPlacement="left"
            iconName="edit"
            text={_editProceedingsText}
            onClick={onEditProceedings}
            className="shrink-0"
          />
        </div>
      )}

    </div>
  );
}
