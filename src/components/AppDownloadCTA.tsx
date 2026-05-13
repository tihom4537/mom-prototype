const imgLogo = '/karnataka-emblem.png';

export type AppDownloadCTAVariant = 'default' | 'cta-option-2';

interface AppDownloadCTAProps {
  variant?: AppDownloadCTAVariant;
  className?: string;
}

export default function AppDownloadCTA({ variant = 'default', className }: AppDownloadCTAProps) {
  if (variant === 'cta-option-2') {
    return (
      <section
        className={`w-full bg-[#f7f0ee] flex flex-col items-center justify-center gap-8 px-10 py-16 ${className ?? ''}`}
      >
        <div className="flex flex-col items-center gap-4 max-w-[600px] text-center">
          <img src={imgLogo} alt="Karnataka Logo" className="h-16 w-auto object-contain" />
          <h2
            className="font-semibold text-2xl text-[#6a3e31] leading-8"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            Panchatantra on the go
          </h2>
          <p
            className="font-light text-sm text-[#424242] leading-6"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            Manage meetings, track minutes, and collaborate with your Gram Panchayat from anywhere.
            Download the Panchatantra app today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StoreButton store="google" />
          <StoreButton store="apple" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={`w-full bg-white flex items-center justify-between gap-12 px-[80px] py-[60px] ${className ?? ''}`}
    >
      {/* Left: text */}
      <div className="flex flex-col gap-6 max-w-[560px]">
        <div className="flex flex-col gap-3">
          <h2
            className="font-semibold text-[32px] text-[#6a3e31] leading-10"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            Download the Panchatantra App
          </h2>
          <p
            className="font-light text-sm text-[#424242] leading-6"
            style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            Access Gram Panchayat meetings, minutes, and records anytime, anywhere.
            Available on Android and iOS.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StoreButton store="google" />
          <StoreButton store="apple" />
        </div>
      </div>

      {/* Right: illustration */}
      <div className="flex items-center justify-center shrink-0">
        <div className="size-[280px] rounded-2xl bg-[#f7f0ee] flex items-center justify-center">
          <img src={imgLogo} alt="App preview" className="h-24 w-auto object-contain opacity-60" />
        </div>
      </div>
    </section>
  );
}

function StoreButton({ store }: { store: 'google' | 'apple' }) {
  const label = store === 'google' ? 'Get it on Google Play' : 'Download on the App Store';
  const icon = store === 'google' ? 'android' : 'apple';

  return (
    <button
      type="button"
      className="flex items-center gap-3 bg-[#212121] text-white rounded-xl px-5 py-3 cursor-pointer border-none hover:bg-[#424242] transition-colors"
    >
      <span className="material-icons text-white text-2xl">{icon}</span>
      <div className="flex flex-col items-start">
        <span
          className="text-[10px] text-white opacity-80 leading-none"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {store === 'google' ? 'GET IT ON' : 'DOWNLOAD ON THE'}
        </span>
        <span
          className="text-sm font-semibold text-white leading-5"
          style={{ fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
        >
          {store === 'google' ? 'Google Play' : 'App Store'}
        </span>
      </div>
      <span className="sr-only">{label}</span>
    </button>
  );
}
