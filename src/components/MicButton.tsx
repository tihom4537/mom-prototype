import Icon from './Icon';

interface MicButtonProps {
  onClick?: () => void;
  pulse?: boolean;
  /** Intensifies the ring animation to signal active recording */
  isRecording?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function MicButton({
  onClick,
  pulse = false,
  isRecording = false,
  disabled = false,
  className,
}: MicButtonProps) {
  // Ring sizing and speed vary between idle-pulse and active-recording
  const ringInset   = isRecording ? '-11px' : '-8px';
  const gapInset    = isRecording ? '-4px'  : '-3px';
  const pingInset   = isRecording ? '-7px'  : '-5px';
  const spinSpeed   = isRecording ? '1.1s'  : '2.5s';
  const pingSpeed   = isRecording ? '0.9s'  : '1.8s';
  const gradient    = isRecording
    ? 'conic-gradient(from 0deg, #ff4433 0%, #ff7468 25%, #ff9a6c 50%, #ff4433 75%, #ff7468 100%)'
    : 'conic-gradient(from 0deg, #ff7468 0%, #ff9a6c 35%, rgba(255,180,150,0.12) 65%, #ff7468 100%)';
  const pingColor   = isRecording ? 'rgba(255,68,51,0.35)' : 'rgba(255,116,104,0.28)';

  return (
    <div className="relative inline-flex items-center justify-center">

      {(pulse || isRecording) && (
        <>
          {/* Rotating conic-gradient ring */}
          <span
            className="absolute animate-spin pointer-events-none"
            style={{
              inset: ringInset,
              borderRadius: '50%',
              background: gradient,
              animationDuration: spinSpeed,
              animationTimingFunction: 'linear',
            }}
          />
          {/* White gap */}
          <span
            className="absolute pointer-events-none"
            style={{ inset: gapInset, borderRadius: '50%', background: 'white' }}
          />
          {/* Ping pulse */}
          <span
            className="absolute animate-ping pointer-events-none"
            style={{
              inset: pingInset,
              borderRadius: '50%',
              background: pingColor,
              animationDuration: pingSpeed,
            }}
          />
        </>
      )}

      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`bg-[#ff7468] flex gap-2 items-center justify-center overflow-clip p-2 rounded-full
          shadow-[0px_1px_10.3px_0px_#ff7468] size-[51px] border-none relative
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className ?? ''}`}
        aria-label={isRecording ? 'Recording…' : 'Start recording'}
      >
        <Icon name="mic" size="medium" color="white" />
      </button>

    </div>
  );
}
