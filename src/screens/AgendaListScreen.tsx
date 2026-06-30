import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda } from '../context/AgendaContext';
import { useMeetings } from '../context/MeetingsContext';
import type { MeetingAgendaItem } from '../context/MeetingsContext';
import { AgendaCard, AgendaListCard, MeetingDetailsCard, Button, ViewProceedingsModal, Icon } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" } as const;

export default function AgendaListScreen() {
  const { t } = useLanguage();
  const { agendaItems } = useAgenda();
  const { meetingAgendas } = useMeetings();
  const navigate = useNavigate();
  const location = useLocation();
  const meetingId: number | undefined = (location.state as { meetingId?: number } | null)?.meetingId;

  // Use per-meeting agendas if this is a user-created meeting; fall back to demo AgendaContext
  const userAgendas: MeetingAgendaItem[] | null = meetingId != null ? (meetingAgendas[meetingId] ?? null) : null;
  const effectiveAgendaItems = userAgendas
    ? userAgendas.map(a => ({ id: a.id, heading: a.title, description: a.description, completed: a.completed, proceedingsText: a.proceedingsText }))
    : agendaItems;

  const [viewMode, setViewMode]       = useState<'list' | 'single'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modal state
  const [modalAgendaId, setModalAgendaId] = useState<number | null>(null);
  const modalItem = modalAgendaId !== null ? effectiveAgendaItems.find(a => a.id === modalAgendaId) : null;

  const allCompleted = effectiveAgendaItems.every(a => a.completed);

  // Strip leading "+ " — the icon in Button already renders the "+"
  const btnText = (key: string) => t(key).replace(/^\+\s*/, '');

  const handleAddProceedings = (id: number) => {
    const item = effectiveAgendaItems.find(a => a.id === id)!;
    navigate('/mom-entry/simple-v4', { state: { agenda: item, meetingId } });
  };

  const handleEditProceedings = (id: number) => {
    const item = effectiveAgendaItems.find(a => a.id === id)!;
    const ctxProceedings = meetingId != null
      ? meetingAgendas[meetingId]?.find(a => a.id === id)?.proceedingsText
      : undefined;
    const proceedings = ctxProceedings ?? item.proceedingsText ?? '';
    // Pass as discussionText regardless of type — MoMEntryDefaultScreen parses it
    navigate('/mom-entry/simple-v4', { state: { agenda: item, meetingId, discussionText: proceedings, feedbackCompleted: item.completed } });
  };

  const handleViewProceedings = (id: number) => {
    setModalAgendaId(id);
  };

  const toggleView = () => {
    setViewMode(v => (v === 'list' ? 'single' : 'list'));
  };

  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === effectiveAgendaItems.length - 1;

  return (
    <MeetingShellLayout stepperActiveState={2}>
      <MeetingDetailsCard
        variant="default-shortened"
        meetingTitle={t('mock_meeting_title')}
        modeOfMeeting={t('meeting_type_in_person')}
        date="19/03/2026"
        time="10:00 a.m"
        venue={`${t('meeting_venue_label')} Kakanur GP Office (1501001003)`}
        participants={`14 ${t('meeting_participants_label')}`}
      />
      <AgendaListCard
        heading={t('agenda_list_heading')}
        countLabel={`${effectiveAgendaItems.length} ${t('agenda_count_label')}`}
        viewToggleLabel={viewMode === 'list' ? t('btn_single_view') : t('btn_list_view')}
        viewToggleIcon={viewMode === 'list' ? 'web_asset' : 'format_list_bulleted'}
        onViewToggle={toggleView}
      >
        {/* List view — all cards stacked */}
        {viewMode === 'list' && effectiveAgendaItems.map(item => (
          <AgendaCard
            key={item.id}
            stage={item.completed ? 'completed' : 'default'}
            agendaNumber={String(item.id)}
            agendaHeading={item.heading}
            agendaDescription={item.description}
            addProceedingsText={btnText('btn_add_proceedings')}
            viewProceedingsText={btnText('btn_view_proceedings')}
            editProceedingsText={btnText('btn_edit_proceedings')}
            completionTagLabel={item.completed ? btnText('tag_completed') : btnText('tag_pending')}
            onAddProceedings={() => handleAddProceedings(item.id)}
            onViewProceedings={() => handleViewProceedings(item.id)}
            onEditProceedings={() => handleEditProceedings(item.id)}
          />
        ))}

        {/* Single view — one card at a time with Prev / Next */}
        {viewMode === 'single' && effectiveAgendaItems.length > 0 && (() => {
          const item = effectiveAgendaItems[currentIndex];
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
                completionTagLabel={item.completed ? btnText('tag_completed') : btnText('tag_pending')}
                onAddProceedings={() => handleAddProceedings(item.id)}
                onViewProceedings={() => handleViewProceedings(item.id)}
                onEditProceedings={() => handleEditProceedings(item.id)}
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

      {/* Proceed Next — disabled until all agenda items completed */}
      <div className="flex items-center justify-center gap-[10px] pb-2 mt-[20px]">
        <Button
          variant="outlined"
          iconPlacement="left"
          iconName="arrow_back"
          text={t('btn_previous')}
          onClick={() => navigate('/meetings/attendance', { state: { meetingId } })}
        />
        <Button
          variant="filled"
          iconPlacement="right"
          iconName="arrow_forward"
          text={t('btn_proceed_next')}
          state={allCompleted ? 'default' : 'disabled'}
          onClick={allCompleted ? () => navigate('/meetings/proceedings-review', { state: { meetingId } }) : undefined}
        />
      </div>

      {/* View Proceedings Modal */}
      {modalItem && (
        <ViewProceedingsModal
          agendaNumber={modalItem.id}
          agendaHeading={modalItem.heading}
          agendaDescription={modalItem.description}
          proceedingsText={modalItem.proceedingsText}
          onClose={() => setModalAgendaId(null)}
          onEdit={() => {
            setModalAgendaId(null);
            handleEditProceedings(modalItem.id);
          }}
        />
      )}
    </MeetingShellLayout>
  );
}
