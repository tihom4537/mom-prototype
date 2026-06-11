import { useState, useEffect } from 'react';
import Icon from './Icon';
import { useLanguage } from '../i18n/LanguageContext';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const { t, lang, setLang } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.45)]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-transparent flex flex-col gap-[3px] w-[510px] max-h-[90vh] overflow-y-auto rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">

        {/* Header */}
        <div className="bg-white flex gap-[15px] items-center pb-[15px] pt-[20px] px-[25px] rounded-tl-[20px] rounded-tr-[20px]">
          <div className="flex flex-1 min-w-0 flex-col gap-[2px]">
            <div className="flex items-center gap-[5px]">
              <p className="font-semibold text-[17px] text-[#6a3e31] whitespace-nowrap" style={NS}>
                {t('login_modal_title')}
              </p>
              <span className="font-medium text-[14px] text-[#b7131a]" style={NS}>*</span>
            </div>
            <p className="font-semibold text-[14px] text-[#454545] leading-[24px]" style={NS}>
              {t('login_modal_subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] hover:bg-[#f7f0ee] cursor-pointer bg-transparent border-none shrink-0 transition-colors"
          >
            <Icon name="close" size="medium" color="#212121" />
          </button>
        </div>

        {/* Body */}
        <div className="bg-white flex flex-col gap-[10px] items-start pb-[35px] pt-[25px] px-[30px] rounded-bl-[20px] rounded-br-[20px]">

          {/* Language toggle */}
          <div className="flex items-center justify-end w-full">
            <div className="bg-[#f3f3f3] flex items-center p-[3px] rounded-[8px] gap-0">
              <button
                type="button"
                onClick={() => setLang('kn')}
                className={`flex items-center justify-center px-[20px] py-[10px] rounded-[8px] text-[14px] font-medium cursor-pointer border-none transition-colors
                  ${lang === 'kn' ? 'bg-white border border-[#c6c6c6] text-[#6a3e31]' : 'bg-transparent text-[#727272]'}`}
                style={NS}
              >
                {t('lang_kannada')}
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex items-center justify-center px-[20px] py-[10px] rounded-[8px] text-[14px] font-medium cursor-pointer border-none transition-colors
                  ${lang === 'en' ? 'bg-white border border-[#c6c6c6] text-[#6a3e31]' : 'bg-transparent text-[#727272]'}`}
                style={NS}
              >
                {t('lang_english')}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-[25px] w-full">
            {/* Fields */}
            <div className="flex flex-col gap-[20px] w-full">

              {/* Username */}
              <div className="flex flex-col gap-[4px] w-full">
                <label className="font-medium text-[14px] text-[#212121] tracking-[0.1px]" style={NS}>
                  {t('login_username_label')}
                </label>
                <div className="bg-white border border-[#c6c6c6] rounded-[8px] flex items-center px-[12px] h-[43px]">
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={t('login_username_placeholder')}
                    className="flex-1 min-w-0 font-normal text-[14px] text-[#212121] placeholder-[#868686] bg-transparent border-none outline-none tracking-[0.25px]"
                    style={NS}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-[4px] w-full">
                <label className="font-medium text-[14px] text-[#212121] tracking-[0.1px]" style={NS}>
                  {t('login_password_label')}
                </label>
                <div className="bg-white border border-[#c6c6c6] rounded-[8px] flex items-center px-[12px] h-[43px] gap-[8px]">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('login_password_placeholder')}
                    className="flex-1 min-w-0 font-normal text-[14px] text-[#212121] placeholder-[#868686] bg-transparent border-none outline-none tracking-[0.25px]"
                    style={NS}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="shrink-0 bg-transparent border-none cursor-pointer p-0 flex items-center"
                  >
                    <Icon name={showPassword ? 'visibility' : 'visibility_off'} size="small" color="#727272" />
                  </button>
                </div>
              </div>

              {/* Captcha row */}
              <div className="flex gap-[10px] items-end w-full">
                <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                  <label className="font-medium text-[14px] text-[#212121] tracking-[0.1px]" style={NS}>
                    {t('login_captcha_label')}
                  </label>
                  <div className="bg-white border border-[#c6c6c6] rounded-[8px] flex items-center px-[12px] h-[43px]">
                    <input
                      type="text"
                      value={captcha}
                      onChange={e => setCaptcha(e.target.value)}
                      placeholder={t('login_captcha_placeholder')}
                      className="flex-1 min-w-0 font-normal text-[14px] text-[#212121] placeholder-[#868686] bg-transparent border-none outline-none tracking-[0.25px]"
                      style={NS}
                    />
                  </div>
                </div>
                {/* Captcha image placeholder */}
                <div className="bg-[#f3f3f3] border border-[rgba(176,176,176,0.6)] h-[43px] w-[130px] rounded-[8px] shrink-0 flex items-center justify-center">
                  <span className="text-[11px] text-[#b0b0b0] font-mono select-none tracking-widest">A3k9Xm</span>
                </div>
                {/* Refresh captcha */}
                <button
                  type="button"
                  className="bg-[#f7f0ee] flex items-center justify-center px-[10px] h-[43px] rounded-[8px] shrink-0 cursor-pointer border-none hover:bg-[#efe0dc] transition-colors"
                >
                  <Icon name="refresh" size="small" color="#6a3e31" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="bg-[rgba(224,224,224,0.6)] h-px w-full" />

            <div className="flex flex-col gap-[20px] w-full">
              {/* Util row */}
              <div className="flex items-center justify-between">
                <button type="button" className="font-medium text-[12px] text-[#1a56a4] bg-transparent border-none cursor-pointer p-0" style={NS}>
                  {t('login_forgot_password')}
                </button>
                <div className="flex items-center gap-[4px]">
                  <span className="text-[12px] text-[rgba(106,62,49,0.7)]" style={NS}>ⓘ</span>
                  <span className="font-medium text-[11px] text-[rgba(106,62,49,0.8)]" style={NS}>
                    {t('login_biometric_setup')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-[15px] w-full">
                {/* Sign In */}
                <button
                  type="button"
                  onClick={onLogin}
                  className="bg-[#6a3e31] flex items-center justify-center h-[48px] w-full rounded-[8px] cursor-pointer border-none hover:bg-[#5a3328] transition-colors"
                >
                  <span className="font-medium text-[14px] text-white tracking-[0.1px]" style={NS}>
                    {t('login_btn_sign_in')}
                  </span>
                </button>

                {/* OR divider */}
                <div className="flex items-center gap-[10px]">
                  <div className="bg-[rgba(176,176,176,0.5)] flex-1 h-px" />
                  <span className="font-normal text-[11px] text-[rgba(82,92,102,0.55)]" style={NS}>{t('login_or_divider')}</span>
                  <div className="bg-[rgba(176,176,176,0.5)] flex-1 h-px" />
                </div>

                {/* Biometric */}
                <button
                  type="button"
                  onClick={onLogin}
                  className="border border-[#6a3e31] flex items-center justify-center h-[48px] w-full rounded-[8px] cursor-pointer bg-transparent hover:bg-[rgba(106,62,49,0.04)] transition-colors"
                >
                  <span className="font-medium text-[14px] text-[#6a3e31] tracking-[0.1px]" style={NS}>
                    {t('login_btn_biometric')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
