import { useEffect } from 'react';
import Icon from './Icon';
import Button from './Button';
import CloseButton from './CloseButton';
import NumberCircle from './NumberCircle';
import { useLanguage } from '../i18n/LanguageContext';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

interface ViewProceedingsModalProps {
  agendaNumber: string | number;
  agendaHeading: string;
  agendaDescription?: string;
  proceedingsText: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function ViewProceedingsModal({
  agendaNumber,
  agendaHeading,
  agendaDescription,
  proceedingsText,
  onClose,
  onEdit,
}: ViewProceedingsModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex flex-col w-[600px] max-w-[90vw] max-h-[85vh] rounded-[20px] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-white flex items-center justify-between px-[25px] py-[15px] border-b border-[#e0e0e0] shrink-0">
          <p
            className="text-[20px] font-semibold text-[#6a3e31] leading-[24px]"
            style={NS}
          >
            {t('view_proceedings_title')}
          </p>
          <CloseButton onClick={onClose} />
        </div>

        {/* Body */}
        <div className="bg-white flex flex-col gap-[30px] items-start px-[30px] pt-[25px] pb-[35px] overflow-y-auto">

          {/* Agenda card — subpage style */}
          <div className="border border-[rgba(106,62,49,0.24)] rounded-[8px] flex flex-col gap-[8px] px-[15px] pt-[8px] pb-[15px] w-full">

            {/* Agenda header row */}
            <div className="flex items-start pt-[3px] w-full">
              <div className="flex flex-1 gap-[15px] items-start min-w-0">
                <NumberCircle type="subpage" number={String(agendaNumber)} />
                <div className="flex flex-col flex-1 min-w-0">
                  <p
                    className="text-[14px] font-medium text-[#4b4b4b] leading-[24px]"
                    style={NS}
                  >
                    {agendaHeading}
                  </p>
                  {agendaDescription && (
                    <p
                      className="text-[12px] font-normal text-[#3b3b3b] leading-[20px]"
                      style={NS}
                    >
                      {agendaDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Proceedings text box — indented to align with heading text (32px circle + 15px gap) */}
            <div className="bg-[rgba(221,221,221,0.15)] border border-[rgba(106,62,49,0.24)] rounded-[8px] px-[15px] pt-[8px] pb-[10px] ml-[47px]">
              <p
                className="text-[12px] font-normal text-[#3b3b3b] leading-[20px] whitespace-pre-wrap"
                style={NS}
              >
                {proceedingsText || (
                  <span className="text-[#727272] italic">{t('view_proceedings_empty')}</span>
                )}
              </p>
            </div>
          </div>

          {/* Footer buttons — centered */}
          <div className="flex gap-[10px] items-center justify-center w-full">
            <Button
              variant="outlined"
              size="small"
              iconPlacement="none"
              text={t('btn_close')}
              onClick={onClose}
            />
            <Button
              variant="filled"
              size="small"
              iconPlacement="none"
              text={t('btn_edit')}
              onClick={onEdit}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
