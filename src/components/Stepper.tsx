const imgCheck = "https://www.figma.com/api/mcp/asset/c227c8a0-4ee7-4b2c-bf5d-a0a7f545e2f8";

export type StepperActiveState = 2 | 3;

interface Step {
  label: string;
  status: 'completed' | 'active' | 'pending';
  number?: number;
}

interface StepperProps {
  activeState?: StepperActiveState;
  stepLabels?: string[];
  className?: string;
}

const STEPS = [
  'Meeting Attendence',
  'Meeting Proceedings Entry',
  'Proceedings review',
  'Send Proceeding for President Approval',
];

export default function Stepper({ activeState = 2, stepLabels, className }: StepperProps) {
  const labels = stepLabels ?? STEPS;
  const steps: Step[] = labels.map((label, i) => {
    const stepNumber = i + 1;
    if (stepNumber < activeState) return { label, status: 'completed', number: stepNumber };
    if (stepNumber === activeState) return { label, status: 'active', number: stepNumber };
    return { label, status: 'pending', number: stepNumber };
  });

  return (
    <div className={`bg-white flex flex-col items-start px-[10px] py-[5px] rounded-[15px] ${className ?? 'w-full'}`}>
      <div className="flex gap-1 items-center justify-center w-full">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-0.5 items-center shrink-0">
            {/* Step */}
            <div className="flex gap-2 items-center p-1 shrink-0">
              {/* Circle */}
              <div className="flex items-center p-0 shrink-0">
                {step.status === 'completed' ? (
                  <div className="bg-[#3c9718] flex flex-col items-center justify-center px-1 py-[6px] rounded-full shrink-0 size-8">
                    <div className="relative shrink-0 size-5">
                      <img alt="✓" className="absolute block max-w-none size-full" src={imgCheck} />
                    </div>
                  </div>
                ) : step.status === 'active' ? (
                  <div className="border-2 border-[#3c9718] relative rounded-full shrink-0 size-8 flex items-center justify-center">
                    <span
                      className="font-medium text-sm text-[#212121] text-center leading-5 tracking-[0.1px]"
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >
                      {step.number}
                    </span>
                  </div>
                ) : (
                  <div className="bg-white border border-[#b0b0b0] flex flex-col items-center justify-center px-1 py-[6px] rounded-full shrink-0 w-8">
                    <span
                      className="font-medium text-sm text-[#727272] text-center leading-5 tracking-[0.1px] w-full"
                      style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
                    >
                      {step.number}
                    </span>
                  </div>
                )}
              </div>
              {/* Label */}
              <span
                className="font-medium text-xs text-[#212121] leading-4 tracking-[0.5px] whitespace-nowrap"
                style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
              >
                {step.label}
              </span>
            </div>
            {/* Divider (not after last) */}
            {i < steps.length - 1 && (
              <div
                className={`h-px shrink-0 w-16 ${step.status === 'completed' ? 'bg-[#3c9718]' : 'bg-[#c6c6c6]'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
