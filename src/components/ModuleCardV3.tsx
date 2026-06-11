import { useState } from 'react';
import Icon from './Icon';
import type { IconName } from './Icon';
import { useLanguage } from '../i18n/LanguageContext';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

export interface ModuleCardV3Props {
  title: string;
  description: string;
  icon: IconName;
  variant?: 'light' | 'dark';
  onClick?: () => void;
}

export default function ModuleCardV3({ title, description, icon, variant = 'light', onClick }: ModuleCardV3Props) {
  const cardBg = variant === 'dark' ? '#dfc2b9' : '#efe0dc';
  const [hovered, setHovered] = useState(false);
  const { t } = useLanguage();

  return (
    <div
      className="relative w-[296px] h-[390px] cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Back card 1 — sits higher, rotated right */}
      <div
        className="absolute bg-white border border-[#ddd] shadow-[0px_4px_20px_-5px_rgba(0,0,0,0.25)]"
        style={{
          top: '1%', left: '8%', right: '5%', bottom: '18%',
          borderRadius: '6px',
          transform: hovered ? 'rotate(3.5deg)' : 'rotate(0.8deg)',
          transformOrigin: 'bottom center',
          transition: 'transform 0.3s ease-out',
        }}
      />
      {/* Back card 2 — sits slightly lower, rotated left */}
      <div
        className="absolute bg-white border border-[#ddd] shadow-[0px_4px_20px_-5px_rgba(0,0,0,0.25)]"
        style={{
          top: '3.5%', left: '8%', right: '5%', bottom: '15%',
          borderRadius: '6px',
          transform: hovered ? 'rotate(-5deg)' : 'rotate(-3deg)',
          transformOrigin: 'bottom center',
          transition: 'transform 0.3s ease-out',
        }}
      />
      {/* Main card — scales up on hover */}
      <div
        className="absolute inset-x-0 bottom-0 top-[10.6%] rounded-[10px] flex flex-col pt-[63px] pl-[37px] pr-[30px] pb-[31px] gap-[24px] items-start"
        style={{
          backgroundColor: cardBg,
          boxShadow: hovered ? '0px 12px 32px rgba(106,62,49,0.22)' : '0px 4px 2px rgba(106,62,49,0.24)',
          transformOrigin: 'bottom center',
          transform: hovered ? 'scale(1.025)' : 'scale(1)',
          transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        }}
      >
        {/* Divider */}
        <div className="absolute left-0 top-[44px] w-full h-px bg-[#bf8573]" />

        {/* Icon */}
        <div className="bg-white flex items-center justify-center p-[8px] rounded-[8px] shrink-0 size-[43px]">
          <Icon name={icon} size="medium" color="#6a3e31" />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-[14px] items-start w-[249px] mb-[8px]">
          <span className="font-semibold text-[20px] leading-[24px] text-[#6a3e31] w-full" style={NS}>
            {title}
          </span>
          <p className="font-normal text-[14px] leading-[21px] text-[#3b3b3b] w-full" style={NS}>
            {description}
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-[4px]">
          <span className="font-medium text-[13px] leading-[20px] text-[#6a3e31]" style={NS}>
            {t('homepage_module_cta')}
          </span>
          <Icon name="arrow_forward" size="small" color="#6a3e31" />
        </div>
      </div>
    </div>
  );
}
