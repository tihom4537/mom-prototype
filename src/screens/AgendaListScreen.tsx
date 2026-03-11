import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgenda } from '../context/AgendaContext';
import { SectionHeading, AgendaNoLabel, Button, AgendaCard } from '../components';
import MeetingShellLayout from '../layouts/MeetingShellLayout';

export default function AgendaListScreen() {
  const { t } = useLanguage();
  const { agendaItems } = useAgenda();
  const navigate = useNavigate();

  // Strip leading "+ " — the icon in Button already renders the "+"
  const btnText = (key: string) => t(key).replace(/^\+\s*/, '');

  const handleAddProceedings = (id: number) => {
    const item = agendaItems.find(a => a.id === id)!;
    navigate('/mom-entry', { state: { agenda: item } });
  };

  return (
    <MeetingShellLayout stepperActiveState={2}>
      <div className="bg-white flex flex-col gap-5 p-6 rounded-[15px]">
        {/* Header row */}
        <div className="flex items-center justify-between shrink-0 w-full">
          <div className="flex items-center gap-4">
            <SectionHeading text={t('agenda_list_heading')} />
            <AgendaNoLabel text={`${agendaItems.length} ${t('agenda_count_label')}`} />
          </div>
          <Button
            variant="filled"
            iconPlacement="left"
            text={t('btn_list')}
          />
        </div>

        {/* Agenda cards */}
        {agendaItems.map(item => (
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
      </div>
    </MeetingShellLayout>
  );
}
