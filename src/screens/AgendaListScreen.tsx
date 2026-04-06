import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda } from '../context/AgendaContext';
import { AgendaCard, AgendaListCard, MeetingDetailsCard } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

export default function AgendaListScreen() {
  const { t } = useLanguage();
  const { agendaItems } = useAgenda();
  const navigate = useNavigate();

  const [viewMode, setViewMode]       = useState<'list' | 'single'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Strip leading "+ " — the icon in Button already renders the "+"
  const btnText = (key: string) => t(key).replace(/^\+\s*/, '');

  const handleAddProceedings = (id: number) => {
    const item = agendaItems.find(a => a.id === id)!;
    navigate('/mom-entry', { state: { agenda: item } });
  };

  const toggleView = () => {
    setViewMode(v => (v === 'list' ? 'single' : 'list'));
  };

  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === agendaItems.length - 1;

  return (
    <MeetingShellLayout stepperActiveState={2}>
      <MeetingDetailsCard
        meetingTitle="2nd GP General Body Meeting 2026"
        modeOfMeeting="IN PERSON"
        date="19/03/2026"
        time="10:00 a.m"
        venue="Venue: Kakanur GP Office (1501001003)"
        participants="Participants: 14"
      />
      <AgendaListCard
        heading={t('agenda_list_heading')}
        countLabel={`${agendaItems.length} ${t('agenda_count_label')}`}
        viewToggleLabel={viewMode === 'list' ? t('btn_single_view') : t('btn_list_view')}
        viewToggleIcon={viewMode === 'list' ? 'web_asset' : 'format_list_bulleted'}
        onViewToggle={toggleView}
      >
        {/* List view — all cards stacked */}
        {viewMode === 'list' && agendaItems.map(item => (
          <AgendaCard
            key={item.id}
            stage={item.completed ? 'completed' : 'default'}
            agendaNumber={String(item.id)}
            agendaHeading={item.heading}
            agendaDescription={item.description}
            addProceedingsText={btnText('btn_add_proceedings')}
            viewProceedingsText={btnText('btn_view_proceedings')}
            editProceedingsText={btnText('btn_edit_proceedings')}
            onAddProceedings={() => handleAddProceedings(item.id)}
            onEditProceedings={() => handleAddProceedings(item.id)}
          />
        ))}

        {/* Single view — one card at a time with Prev / Next */}
        {viewMode === 'single' && agendaItems.length > 0 && (() => {
          const item = agendaItems[currentIndex];
          return (
            <>
              <AgendaCard
                stage={item.completed ? 'completed' : 'default'}
                agendaNumber={String(item.id)}
                agendaHeading={item.heading}
                agendaDescription={item.description}
                addProceedingsText={btnText('btn_add_proceedings')}
                viewProceedingsText={btnText('btn_view_proceedings')}
                editProceedingsText={btnText('btn_edit_proceedings')}
                onAddProceedings={() => handleAddProceedings(item.id)}
                onEditProceedings={() => handleAddProceedings(item.id)}
              />
              <div className="flex items-center justify-end gap-2 shrink-0 w-full">
                <button
                  onClick={() => setCurrentIndex(i => i - 1)}
                  disabled={isFirst}
                  aria-label="Previous agenda"
                  className={`flex items-center justify-center size-9 rounded-full border transition-colors
                    ${isFirst
                      ? 'border-[#ccc] text-[#ccc] cursor-not-allowed'
                      : 'border-[#6a3e31] text-[#6a3e31] hover:bg-[#f7f0ee] cursor-pointer'
                    }`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3L5 8l5 5" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  disabled={isLast}
                  aria-label="Next agenda"
                  className={`flex items-center justify-center size-9 rounded-full border transition-colors
                    ${isLast
                      ? 'border-[#ccc] text-[#ccc] cursor-not-allowed'
                      : 'border-[#6a3e31] text-[#6a3e31] hover:bg-[#f7f0ee] cursor-pointer'
                    }`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </button>
              </div>
            </>
          );
        })()}
      </AgendaListCard>
    </MeetingShellLayout>
  );
}
