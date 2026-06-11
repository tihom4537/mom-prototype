import { useState } from 'react';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export type AppDownloadCTAVariant = 'default' | 'cta-option-2';

interface AppDownloadCTAProps {
  variant?: AppDownloadCTAVariant;
  className?: string;
  onGetP2Link?: (mobile: string) => void;
  onGetBapujiLink?: (mobile: string) => void;
  onWhatsApp?: () => void;
}

function MobileInputSection({
  label,
  onSubmit,
  submitLabel = 'Get app link',
}: {
  label: string;
  onSubmit?: (val: string) => void;
  submitLabel?: string;
}) {
  const [value, setValue] = useState('');
  return (
    <div className="flex flex-col gap-[4px] flex-1 min-w-0">
      <label className="font-medium text-[14px] text-[#212121] leading-[20px] tracking-[0.1px]" style={NS}>
        {label}
      </label>
      <div className="flex gap-[10px] items-end">
        <div className="flex-1 min-w-0 bg-white border border-[#c6c6c6] rounded-[8px] px-[12px] py-[12px] h-[43px] flex items-center">
          <input
            type="tel"
            placeholder="Placeholder"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="flex-1 min-w-0 font-normal text-[14px] text-[#868686] bg-transparent border-none outline-none tracking-[0.25px]"
            style={NS}
          />
        </div>
        <button
          type="button"
          className="bg-[#6a3e31] text-white font-medium text-[12px] tracking-[0.5px] px-[16px] h-[32px] rounded-[8px] shrink-0 cursor-pointer border-none whitespace-nowrap"
          style={NS}
          onClick={() => onSubmit?.(value)}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function StoreButtons() {
  return (
    <div className="flex flex-col gap-[10px] items-start">
      <span className="font-normal text-[11px] text-[rgba(82,92,102,0.65)]" style={NS}>
        Also available on
      </span>
      <div className="flex gap-[5px] items-start">
        <StoreButton store="google" />
        <StoreButton store="apple" />
      </div>
    </div>
  );
}

function StoreButton({ store }: { store: 'google' | 'apple' }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 bg-[#212121] text-white rounded-[8px] px-[12px] py-[8px] cursor-pointer border-none h-[45px] w-[148px]"
    >
      <span className="material-icons text-white text-[20px]">{store === 'google' ? 'android' : 'apple'}</span>
      <div className="flex flex-col items-start">
        <span className="text-[9px] text-white opacity-80 leading-none" style={NS}>
          {store === 'google' ? 'GET IT ON' : 'DOWNLOAD ON THE'}
        </span>
        <span className="text-[12px] font-semibold text-white leading-[16px]" style={NS}>
          {store === 'google' ? 'Google Play' : 'App Store'}
        </span>
      </div>
    </button>
  );
}

export default function AppDownloadCTA({
  variant = 'default',
  className,
  onGetP2Link,
  onGetBapujiLink,
  onWhatsApp,
}: AppDownloadCTAProps) {
  const bgClass = variant === 'cta-option-2' ? 'bg-[#efe0dc]' : 'bg-[rgba(106,62,49,0.08)]';

  return (
    <section className={`${bgClass} flex flex-col items-center overflow-clip pb-[80px] pt-[70px] px-[150px] w-full ${className ?? ''}`}>
      <div className="flex gap-[32px] items-start rounded-[20px] w-full">

        {/* Column 1 — P2.0 App */}
        <div className="flex flex-col flex-1 min-w-0 pb-[32px] pt-[20px]">
          <div className="flex gap-[12px] h-[48px] items-center w-full">
            <div className="h-[48px] w-[48px] rounded-[8px] flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/karnataka-emblem.png" alt="Karnataka" className="w-full h-full object-contain" />
            </div>
            <p className="font-semibold text-[16px] text-[#6a3e31] tracking-[0.15px] whitespace-nowrap" style={NS}>
              Get the P2.0 App
            </p>
          </div>
          <div className="h-[10px]" />
          <p className="font-normal text-[13px] text-[#525c66] tracking-[0.2px] leading-normal" style={NS}>
            Download the mobile version of Panchatantra 2.0 to use all the features on your mobile phone
          </p>
          <div className="h-[28px]" />
          <MobileInputSection label="Enter your Mobile Number" onSubmit={onGetP2Link} />
          <div className="h-[10px]" />
          <p className="font-normal text-[13px] text-[#525c66] tracking-[0.2px] leading-normal" style={NS}>
            We will send you a link — open it on your phone to download the app.
          </p>
          <div className="h-[20px]" />
          <div className="bg-[#e0e0e0] h-px w-full" />
          <div className="h-[16px]" />
          <StoreButtons />
        </div>

        {/* Vertical divider */}
        <div className="bg-[#dfc2b9] self-stretch shrink-0 w-px" />

        {/* Column 2 — Bapuji Seva Kendra */}
        <div className="flex flex-col flex-1 min-w-0 pb-[32px] pt-[20px]">
          <div className="flex gap-[12px] items-center w-full">
            <div className="h-[54px] w-[98px] rounded-[8px] flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/bapuji_logo_kn.png" alt="Bapuji Seva Kendra" className="w-full h-full object-contain" />
            </div>
            <p className="font-semibold text-[16px] text-[#6a3e31] tracking-[0.15px] whitespace-nowrap" style={NS}>
              Bapuji Seva Kendra App
            </p>
          </div>
          <div className="h-[10px]" />
          <p className="font-normal text-[13px] text-[#525c66] tracking-[0.2px] leading-normal" style={NS}>
            Download the Bapuji Seva Kendra App to apply for all 17 services from the Rural development and Panchayati Raj department
          </p>
          <div className="h-[28px]" />
          <MobileInputSection label="Enter your Mobile Number" onSubmit={onGetBapujiLink} />
          <div className="h-[10px]" />
          <p className="font-normal text-[13px] text-[#525c66] tracking-[0.2px] leading-normal" style={NS}>
            We will send you a link — open it on your phone to download the app.
          </p>
          <div className="h-[20px]" />
          <div className="bg-[#e0e0e0] h-px w-full" />
          <div className="h-[16px]" />
          <StoreButtons />
        </div>

        {/* Vertical divider */}
        <div className="bg-[#dfc2b9] self-stretch shrink-0 w-px" />

        {/* Column 3 — Panchamitra WhatsApp */}
        <div className="flex flex-col flex-1 min-w-0 pb-[32px] pt-[20px]">
          <div className="flex gap-[12px] h-[48px] items-center w-full">
            <div className="size-[48px] flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-full h-full object-contain" />
            </div>
            <p className="font-semibold text-[16px] text-[#6a3e31] tracking-[0.15px] w-[209px]" style={NS}>
              Panchamitra on WhatsApp
            </p>
          </div>
          <div className="h-[10px]" />
          <p className="font-normal text-[13px] text-[#525c66] tracking-[0.2px] leading-normal" style={NS}>
            Use the Panchamitra bot on WhatsApp to access all information on your Gram Panchayat!
          </p>
          <div className="h-[28px]" />
          <div className="bg-white flex items-center justify-between px-[16px] py-[12px] rounded-[8px] h-[43px] w-full whitespace-nowrap">
            <span className="font-normal text-[12px] text-[#525c66]" style={NS}>WhatsApp Number</span>
            <span className="font-semibold text-[14px] text-[#212121]" style={NS}>+91 82775 06000</span>
          </div>
          <div className="h-[10px]" />
          <button
            type="button"
            className="bg-[#39be6a] flex items-center justify-center px-[16px] py-[12px] rounded-[8px] h-[43px] w-full cursor-pointer border-none"
            onClick={onWhatsApp}
          >
            <span className="font-medium text-[14px] text-white whitespace-nowrap" style={NS}>
              Open on WhatsApp
            </span>
          </button>
          <div className="h-[14px]" />
          <p className="font-normal text-[12px] text-[rgba(82,92,102,0.6)] tracking-[0.2px] leading-normal" style={NS}>
            No download needed. Save the number and start chatting.
          </p>
        </div>

      </div>
    </section>
  );
}
