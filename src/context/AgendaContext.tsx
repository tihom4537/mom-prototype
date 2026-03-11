import { createContext, useContext, useState } from 'react';

export interface AgendaItem {
  id: number;
  heading: string;
  description: string;
  completed: boolean;
}

const INITIAL_AGENDA_ITEMS: AgendaItem[] = [
  {
    id: 1,
    heading: 'Reading and reporting on the proceedings of the previous meeting',
    description: 'The decisions taken in the previous meeting are to be reviewed and the actions taken have to be discussed.',
    completed: false,
  },
  {
    id: 2,
    heading: 'Reading and explaining circulars issued by the government',
    description: 'All circulars issued by the state and district government offices are to be read out and explained to the members.',
    completed: true,
  },
  {
    id: 3,
    heading: 'About approval of deposit expenditure',
    description: 'The deposit expenditure statements are to be presented and approved by the General Body members.',
    completed: false,
  },
  {
    id: 4,
    heading: 'Regarding applications received from the public',
    description: 'Applications received from citizens regarding public works and services are to be reviewed and decisions taken.',
    completed: false,
  },
];

interface AgendaContextValue {
  agendaItems: AgendaItem[];
  markCompleted: (id: number) => void;
}

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(INITIAL_AGENDA_ITEMS);

  const markCompleted = (id: number) => {
    setAgendaItems(items =>
      items.map(item => (item.id === id ? { ...item, completed: true } : item))
    );
  };

  return (
    <AgendaContext.Provider value={{ agendaItems, markCompleted }}>
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda(): AgendaContextValue {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error('useAgenda must be used within AgendaProvider');
  return ctx;
}
