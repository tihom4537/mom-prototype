import { useState, useRef, useLayoutEffect } from 'react';
import Icon from './Icon';
import MicButton from './MicButton';

export type DescriptionFieldState = 'empty' | 'filled' | 'error' | 'success' | 'warning';

interface DescriptionFieldProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  labelIcon?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  state?: DescriptionFieldState;
  onMicClick?: () => void;
  micRecording?: boolean;
  micAnalyserNode?: AnalyserNode;
  actionSlot?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const BORDER: Record<string, string> = {
  empty:   'border-[#c6c6c6]',
  filled:  'border-[#c6c6c6]',
  hover:   'border-[#6a3e31]',
  focused: 'border-[#ae6651] shadow-[0px_0px_0px_4px_rgba(106,62,49,0.32)]',
  error:   'border-[#ec5042]',
  success: 'border-[#389314]',
  warning: 'border-[#bb772b]',
};

export default function DescriptionField({
  label = 'Label',
  placeholder = 'Placeholder',
  required = false,
  labelIcon = false,
  value = '',
  onChange,

  state,
  onMicClick,
  micRecording = false,
  micAnalyserNode,
  actionSlot,
  disabled = false,
  autoFocus = false,
  className,
}: DescriptionFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on every value change including initial mount
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // Move cursor to end when autoFocus
  useLayoutEffect(() => {
    if (!autoFocus) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [autoFocus]);

  const isEmpty = value.length === 0;

  // Derive visual state: explicit prop overrides auto-detection
  const visualState =
    state ??
    (focused ? 'focused' : hovered ? 'hover' : isEmpty ? 'empty' : 'filled');

  const borderClass = BORDER[visualState] ?? BORDER.empty;

  return (
    <div className={`flex flex-col gap-1 items-start w-full ${className ?? ''}`}>
      {/* Label row */}
      <div className="flex gap-1 items-center shrink-0 w-full">
        <div className="flex gap-1 items-center justify-center">
          <p
            className="font-medium text-sm text-[#212121] leading-5 tracking-[0.1px] whitespace-nowrap"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {label}
          </p>
          {required && (
            <p
              className="font-medium text-sm text-[#b7131a] leading-5 tracking-[0.1px]"
              style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            >
              *
            </p>
          )}
        </div>
        {labelIcon && (
          <Icon name="info_outline" size="small" color="#727272" />
        )}
      </div>

      {/* Textarea box */}
      <div
        className={`relative bg-white border rounded-lg w-full transition-all duration-150 ${borderClass} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange?.(e.target.value)}
          rows={1}
          className="w-full min-h-[20px] resize-none px-3 pt-2 pb-0 text-sm text-[#212121] placeholder-[#727272] leading-5 tracking-[0.25px] bg-transparent border-none outline-none overflow-hidden"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        />

        {/* Bottom bar — always full-width row, text never overlaps */}
        {(onMicClick || actionSlot) && !disabled && (
          <div className="flex items-center justify-end gap-2 px-2 pt-1 pb-[8px] w-full">
            {actionSlot}
            {onMicClick && (
              <MicButton
                onClick={onMicClick}
                isRecording={micRecording}
                analyserNode={micAnalyserNode}
                pulse={false}
                className={micRecording ? '' : 'size-[36px] shadow-none'}
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
}
