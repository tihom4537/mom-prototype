import Icon from './Icon';

export type StepperActiveState = 1 | 2 | 3 | 4 | 5;
export type StepperVariant = 'mom-flow' | 'meeting-flow';

interface Step {
  label: string;
  status: 'completed' | 'active' | 'pending';
  number: number;
}

interface StepperProps {
  activeState?: StepperActiveState;
  stepLabels?: string[];
  variant?: StepperVariant;
  className?: string;
  /** Called with 1-based step number when a completed step circle is clicked */
  onStepClick?: (step: number) => void;
}

const MOM_STEPS = [
  'Meeting Attendence',
  'Meeting Proceedings Entry',
  'Proceedings review',
  'Send Proceeding for President Approval',
];

const MEETING_STEPS = [
  'Starting\nAttendance',
  'Meeting\nProceedings Entry',
  'Proceedings\nReview',
  'Closure\nAttendance',
  'Send for\nPresident Approval',
];

export default function Stepper({ activeState = 2, stepLabels, variant = 'mom-flow', className, onStepClick }: StepperProps) {
  const defaultLabels = variant === 'meeting-flow' ? MEETING_STEPS : MOM_STEPS;
  const labels = stepLabels ?? defaultLabels;

  const steps: Step[] = labels.map((label, i) => {
    const stepNumber = i + 1;
    if (stepNumber < activeState) return { label, status: 'completed', number: stepNumber };
    if (stepNumber === activeState) return { label, status: 'active', number: stepNumber };
    return { label, status: 'pending', number: stepNumber };
  });

  return (
    <div className={`bg-white flex items-center px-[10px] py-[5px] rounded-[15px] ${className ?? 'w-full'}`}>
      {steps.map((step, i) => (
        <>
          {/* Step pill — centred */}
          <div
            key={`step-${i}`}
            className={`group flex items-center justify-center gap-2 p-1 min-w-0 rounded-[10px] ${
              step.status === 'completed' && onStepClick ? 'cursor-pointer' : ''
            }`}
            onClick={step.status === 'completed' ? () => onStepClick?.(step.number) : undefined}
          >
            {/* Circle */}
            {step.status === 'completed' ? (
              <div className="bg-[#3c9718] flex items-center justify-center rounded-full shrink-0 size-8">
                <Icon name="check" size="small" color="white" />
              </div>
            ) : step.status === 'active' ? (
              <div className="border-2 border-[#3c9718] rounded-full shrink-0 size-8 flex items-center justify-center">
                <span
                  className="font-semibold text-[16px] text-[#212121] text-center leading-5 tracking-[0.1px]"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {step.number}
                </span>
              </div>
            ) : (
              <div className="bg-white border border-[#b0b0b0] flex items-center justify-center rounded-full shrink-0 size-8">
                <span
                  className="font-semibold text-[16px] text-[#727272] text-center leading-5 tracking-[0.1px]"
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {step.number}
                </span>
              </div>
            )}
            {/* Label */}
            <div className="flex flex-col">
              {step.label.split('\n').map((line, li) => (
                <span
                  key={li}
                  className={`font-semibold text-[14px] text-[#212121] leading-5 tracking-[0.5px] ${step.status === 'completed' && onStepClick ? 'group-hover:underline' : ''}`}
                  style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                >
                  {line}
                </span>
              ))}
            </div>
          </div>

          {/* Connector between steps */}
          {i < steps.length - 1 && (
            <div
              key={`conn-${i}`}
              className={`h-px flex-1 min-w-[8px] ${step.status === 'completed' ? 'bg-[#3c9718]' : 'bg-[#c6c6c6]'}`}
            />
          )}
        </>
      ))}
    </div>
  );
}
