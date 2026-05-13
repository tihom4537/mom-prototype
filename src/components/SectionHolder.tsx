import SectionHeading from './SectionHeading';
import AgendaNoLabel from './AgendaNoLabel';
import Icon from './Icon';

/**
 * SectionHolder variants (from Figma node 246:23837):
 *
 * - "default"          — heading only, white body card
 * - "mandatory"        — heading with mandatory (*) asterisk
 * - "with-description" — heading + subtitle text below
 * - "with-outline"     — heading, body card has visible border
 * - "with-tag"         — heading + AgendaNoLabel badge inline
 * - "tag-and-desc"     — heading + badge + subtitle text
 * - "closeable"        — heading + close (×) button, no badge/desc
 * - "closeable-desc"   — heading + subtitle + close button
 */
export type SectionHolderVariant =
  | 'default'
  | 'mandatory'
  | 'with-description'
  | 'with-outline'
  | 'with-tag'
  | 'tag-and-desc'
  | 'closeable'
  | 'closeable-desc';

export type SectionHolderGap = 'default' | 'modal' | 'none';

interface SectionHolderProps {
  title?: string;
  subtitle?: string;
  tagText?: string;
  variant?: SectionHolderVariant;
  gap?: SectionHolderGap;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** @deprecated use gap="modal" */
  modalGap?: boolean;
}

export default function SectionHolder({
  title = 'Enter all mandatory Meeting details',
  subtitle = 'These are the meetings scheduled for today.',
  tagText = '4 Agendas',
  variant = 'default',
  gap: gapProp,
  onClose,
  children,
  className,
  bodyClassName,
  modalGap = false,
}: SectionHolderProps) {
  const gap = gapProp ?? (modalGap ? 'modal' : 'default');

  const isMandatory    = variant === 'mandatory';
  const hasDescription = variant === 'with-description' || variant === 'tag-and-desc' || variant === 'closeable-desc';
  const hasTag         = variant === 'with-tag' || variant === 'tag-and-desc';
  const hasClose       = variant === 'closeable' || variant === 'closeable-desc';
  const hasOutline     = variant === 'with-outline';

  const headingVariant = isMandatory ? 'mandatory' : 'default';

  const gapClass =
    gap === 'none'  ? 'gap-0' :
    gap === 'modal' ? 'gap-0' :
                      'gap-[3px]';

  const showDivider = gap === 'none' || gap === 'modal';

  // When gap=none the two panels must join flush — remove inner radii at the join
  const headerBottomRadius = gap === 'none' ? '' : 'rounded-tl-[20px] rounded-tr-[20px]';
  const headerTopRadius    = 'rounded-tl-[20px] rounded-tr-[20px]';
  const bodyTopRadius      = gap === 'none' ? '' : '';
  const bodyRadius         = gap === 'none'
    ? 'rounded-bl-[20px] rounded-br-[20px]'
    : 'rounded-bl-[20px] rounded-br-[20px]';

  return (
    <div className={`flex flex-col ${gapClass} items-start w-full ${className ?? ''}`}>
      {/* Header */}
      <div
        className={`bg-white w-full pt-5 px-[25px] flex flex-col items-start gap-[6px]
          rounded-tl-[20px] rounded-tr-[20px]
          ${hasOutline ? 'border border-[#dddddd]' : ''}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-[15px]">
            <SectionHeading text={title} variant={headingVariant} />
            {hasTag && (
              <AgendaNoLabel text={tagText} />
            )}
          </div>
          {hasClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-[#f5f5f5] transition-colors"
              aria-label="Close section"
            >
              <Icon name="close" size="small" color="#212121" />
            </button>
          )}
        </div>
        {hasDescription && (
          <p
            className="font-semibold text-[14px] leading-[24px] text-[#454545]"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {subtitle}
          </p>
        )}
        <div className={showDivider ? 'w-full h-px bg-[#e0e0e0] mt-[15px]' : 'pb-[15px] w-full'} />
      </div>

      {/* Body card */}
      <div
        className={`bg-white w-full rounded-bl-[20px] rounded-br-[20px]
          ${hasOutline ? 'border border-[#dddddd]' : ''}
          ${bodyClassName ?? ''}`}
      >
        {children}
      </div>
    </div>
  );
}
