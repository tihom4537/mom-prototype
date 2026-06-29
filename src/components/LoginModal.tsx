import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import InputField from './InputField';
import { useLanguage } from '../i18n/LanguageContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { usePageScale } from './ScaleToFit';

function generateCaptchaText() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function CaptchaCanvas({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    // Background
    ctx.fillStyle = '#f0ece8';
    ctx.fillRect(0, 0, W, H);
    // Noise lines
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.strokeStyle = `rgba(${Math.random()*100|0},${Math.random()*60|0},${Math.random()*40|0},0.25)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Dots
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.random()*120|0},${Math.random()*80|0},${Math.random()*60|0},0.3)`;
      ctx.fill();
    }
    // Characters
    const fonts = ['serif', 'sans-serif', 'cursive'];
    const charW = W / text.length;
    text.split('').forEach((ch, i) => {
      ctx.save();
      const x = charW * i + charW / 2;
      const y = H / 2 + 6;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.font = `bold ${18 + Math.random() * 6}px ${fonts[i % fonts.length]}`;
      ctx.fillStyle = `hsl(${10 + Math.random()*20},${50+Math.random()*30}%,${25+Math.random()*20}%)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }, [text]);
  return <canvas ref={canvasRef} width={120} height={43} className="rounded-[8px]" style={{ display: 'block' }} />;
}

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
  const [captchaText, setCaptchaText] = useState(() => generateCaptchaText());
  const refreshCaptcha = useCallback(() => { setCaptchaText(generateCaptchaText()); setCaptcha(''); }, []);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = 'login-modal-title';
  const pageScale = usePageScale();

  useFocusTrap(dialogRef, true, closeButtonRef);

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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.45)]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-transparent flex flex-col gap-[3px] w-[510px] max-h-[90vh] overflow-y-auto rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        style={pageScale < 1 ? { transform: `scale(${pageScale})` } : undefined}
      >

        {/* Header */}
        <div className="bg-white flex gap-[15px] items-center pb-[15px] pt-[20px] px-[25px] rounded-tl-[20px] rounded-tr-[20px]">
          <div className="flex flex-1 min-w-0 flex-col gap-[2px]">
            <div className="flex items-center gap-[5px]">
              <p id={titleId} className="font-semibold text-[17px] text-[#6a3e31] whitespace-nowrap" style={NS}>
                {t('login_modal_title')}
              </p>
              <span className="font-medium text-[14px] text-[#b7131a]" style={NS}>*</span>
            </div>
            <p className="font-semibold text-[14px] text-[#454545] leading-[24px]" style={NS}>
              {t('login_modal_subtitle')}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('btn_close')}
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

              <InputField
                label={t('login_username_label')}
                placeholder={t('login_username_placeholder')}
                value={username}
                onChange={setUsername}
                className="w-full"
              />

              <InputField
                label={t('login_password_label')}
                placeholder={t('login_password_placeholder')}
                value={password}
                onChange={setPassword}
                type={showPassword ? 'text' : 'password'}
                className="w-full"
              />

              {/* Captcha row */}
              <div className="flex flex-col gap-[4px] w-full">
                <label className="text-sm font-medium text-[#3b3b3b] leading-5 tracking-[0.1px]" style={NS}>
                  {t('login_captcha_label')}
                </label>
                <div className="flex gap-[10px] items-center">
                  <InputField
                    placeholder={t('login_captcha_placeholder')}
                    value={captcha}
                    onChange={setCaptcha}
                    className="flex-1 min-w-0"
                  />
                  <CaptchaCanvas text={captchaText} />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="bg-[#f7f0ee] flex items-center justify-center px-[10px] h-[43px] rounded-[8px] shrink-0 cursor-pointer border-none hover:bg-[#efe0dc] transition-colors"
                  >
                    <Icon name="refresh" size="small" color="#6a3e31" />
                  </button>
                </div>
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
    </div>,
    document.body
  );
}
