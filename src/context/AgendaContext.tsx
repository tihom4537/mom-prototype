import { createContext, useContext, useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { DEMO_MODE, DEMO_PROCEEDINGS } from '../config/demo';
import type { StructuredProceedings } from '../utils/agendaClassifier';

export type ProceedingsData = string | StructuredProceedings;

export interface AgendaItem {
  id: number;
  heading: string;
  description: string;
  completed: boolean;
  proceedingsText: ProceedingsData;
}

interface AgendaItemKey {
  id: number;
  headingKey: string;
  descriptionKey: string;
  completed: boolean;
  proceedingsText: ProceedingsData;
}

const INITIAL_AGENDA_KEYS: AgendaItemKey[] = [
  { id: 1, headingKey: 'agenda_heading_1', descriptionKey: 'agenda_desc_1', completed: DEMO_MODE, proceedingsText: DEMO_MODE ? DEMO_PROCEEDINGS[1] : '' },
  { id: 2, headingKey: 'agenda_heading_2', descriptionKey: 'agenda_desc_2', completed: DEMO_MODE, proceedingsText: DEMO_MODE ? DEMO_PROCEEDINGS[2] : '' },
  { id: 3, headingKey: 'agenda_heading_3', descriptionKey: 'agenda_desc_3', completed: DEMO_MODE, proceedingsText: DEMO_MODE ? DEMO_PROCEEDINGS[3] : '' },
  { id: 4, headingKey: 'agenda_heading_4', descriptionKey: 'agenda_desc_4', completed: DEMO_MODE, proceedingsText: DEMO_MODE ? DEMO_PROCEEDINGS[4] : '' },
];

interface AgendaContextValue {
  agendaItems: AgendaItem[];
  markCompleted: (id: number) => void;
  saveProceedings: (id: number, data: ProceedingsData) => void;
}

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [keys, setKeys] = useState<AgendaItemKey[]>(INITIAL_AGENDA_KEYS);

  const markCompleted = (id: number) => {
    setKeys(items =>
      items.map(item => (item.id === id ? { ...item, completed: true } : item))
    );
  };

  const saveProceedings = (id: number, data: ProceedingsData) => {
    setKeys(items =>
      items.map(item => (item.id === id ? { ...item, proceedingsText: data, completed: true } : item))
    );
  };

  const agendaItems: AgendaItem[] = useMemo(
    () => keys.map(k => ({
      id: k.id,
      heading: t(k.headingKey),
      description: t(k.descriptionKey),
      completed: k.completed,
      proceedingsText: k.proceedingsText,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keys, t]
  );

  return (
    <AgendaContext.Provider value={{ agendaItems, markCompleted, saveProceedings }}>
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda(): AgendaContextValue {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error('useAgenda must be used within AgendaProvider');
  return ctx;
}
