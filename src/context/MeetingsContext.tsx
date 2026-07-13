import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { DEMO_MODE } from '../config/demo';
import type { StructuredProceedings } from '../utils/agendaClassifier';

export type ProceedingsData = string | StructuredProceedings;

// ─── Shared attendance types ───────────────────────────────────────────────────
export type BiometricStatus = 'none' | 'taken' | 'pending' | 'failed';
export type MarkStatus      = 'present' | 'absent' | 'unmarked';
export type ClosureStatus   = 'present' | 'absent' | 'unmarked';

export interface AttendanceRow {
  id: number; name: string; designation: string; gpName: string;
  phone: string; email: string;
  status: MarkStatus; biometric: BiometricStatus; reason: string;
}

export interface ClosureRow {
  id: number; name: string; designation: string; gpName: string;
  phone: string; email: string;
  status: ClosureStatus; biometric: BiometricStatus; reason: string;
}

// ─── Shared review types ───────────────────────────────────────────────────────
export type VoteStatus = 'agree' | 'disagree' | null;

export interface ReviewParticipantStored {
  id: number; name: string; designation: string;
  phone: string; email: string;
  gender: 'woman' | 'man' | 'other'; vote: VoteStatus;
}

export type SavedVotesMap = Record<number, ReviewParticipantStored[]>;
export type ReviewsMap    = Record<number, boolean>;

export type MeetingTab = 'today' | 'upcoming' | 'past' | 'drafts' | 'cancelled';
export type MeetingStatus = 'active' | 'draft' | 'pending_president' | 'completed' | 'cancelled';

export interface MeetingData {
  id: number;
  name: string;
  nameKey?: string;
  mode: 'IN PERSON' | 'ONLINE';
  date: string;
  time: string;
  venue: string;
  participants: number;
  gpName: string;
  electedQuorum: string;
  participantsQuorum: string;
  stepsCompleted: number; // 0–5
  tab: MeetingTab;
  status?: MeetingStatus;
  description?: string;
  chairperson?: string;
  meetingType?: string;
  meetingLink?: string;
  /** Type/date picked for the next meeting during Proceedings Review — carried
   *  forward to the Send to President proceedings preview. */
  nextMeetingType?: string;
  nextMeetingDate?: string;
  nextMeetingTime?: string;
}

const DEMO_MEETING: MeetingData = {
  id: 99,
  name: 'Demo — 1st GP General Body Meeting 2026',
  nameKey: 'meeting_name_1',
  mode: 'IN PERSON',
  date: '19/03/2026',
  time: '10:00 a.m',
  venue: 'Kakanur GP Office (1501001003)',
  participants: 14,
  gpName: 'Kakanur Gram Panchayat',
  electedQuorum: '51%',
  participantsQuorum: '78%',
  stepsCompleted: 2,
  tab: 'today',
  meetingType: 'GP General Body',
  description: 'Pre-populated demo meeting — all agenda proceedings already saved. Use this to walk through the full review flow without entering data.',
};

const INITIAL_MEETINGS: MeetingData[] = [
  ...(DEMO_MODE ? [DEMO_MEETING] : []),
  {
    id: 1,
    name: '1st GP General Body Meeting 2026',
    nameKey: 'meeting_name_1',
    mode: 'IN PERSON',
    date: '19/03/2026',
    time: '10:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 14,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 0,
    tab: 'today',
    meetingType: 'GP General Body',
  },
  {
    id: 2,
    name: '2nd GP General Body Meeting 2026',
    nameKey: 'meeting_name_2',
    mode: 'IN PERSON',
    date: '19/03/2026',
    time: '2:00 p.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 16,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 2,
    tab: 'today',
    meetingType: 'GP General Body',
  },
  {
    id: 3,
    name: '3rd GP General Body Meeting 2025',
    nameKey: 'meeting_name_3',
    mode: 'IN PERSON',
    date: '15/12/2025',
    time: '11:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 12,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'GP General Body',
  },
  {
    id: 7,
    name: '2nd GP General Body Meeting 2025',
    nameKey: 'meeting_name_7',
    mode: 'IN PERSON',
    date: '10/09/2025',
    time: '10:00 a.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 16,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'GP General Body',
  },
  {
    id: 8,
    name: '1st GP General Body Meeting 2025',
    nameKey: 'meeting_name_8',
    mode: 'IN PERSON',
    date: '20/03/2025',
    time: '11:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 14,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'GP General Body',
  },
  {
    id: 9,
    name: '4th GP General Body Meeting 2024',
    nameKey: 'meeting_name_9',
    mode: 'ONLINE',
    date: '18/12/2024',
    time: '2:00 p.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 10,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'Grama Sabha',
  },
  {
    id: 10,
    name: '3rd GP General Body Meeting 2024',
    nameKey: 'meeting_name_10',
    mode: 'IN PERSON',
    date: '05/09/2024',
    time: '10:30 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 13,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'Grama Sabha',
  },
  {
    id: 11,
    name: '2nd GP General Body Meeting 2024',
    nameKey: 'meeting_name_11',
    mode: 'IN PERSON',
    date: '22/06/2024',
    time: '11:00 a.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 15,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'Finance Committee',
  },
  {
    id: 12,
    name: '1st GP General Body Meeting 2024',
    nameKey: 'meeting_name_12',
    mode: 'IN PERSON',
    date: '18/03/2024',
    time: '10:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 12,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'Finance Committee',
  },
  {
    id: 13,
    name: '4th GP General Body Meeting 2023',
    nameKey: 'meeting_name_13',
    mode: 'ONLINE',
    date: '14/12/2023',
    time: '3:00 p.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 11,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'GP General Body',
  },
  {
    id: 14,
    name: '3rd GP General Body Meeting 2023',
    nameKey: 'meeting_name_14',
    mode: 'IN PERSON',
    date: '08/09/2023',
    time: '10:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 14,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'Grama Sabha',
  },
  {
    id: 15,
    name: '2nd GP General Body Meeting 2023',
    nameKey: 'meeting_name_15',
    mode: 'IN PERSON',
    date: '15/06/2023',
    time: '11:30 a.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 16,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 4,
    tab: 'past',
    meetingType: 'Finance Committee',
  },
  {
    id: 4,
    name: '4th GP General Body Meeting 2026',
    nameKey: 'meeting_name_4',
    mode: 'IN PERSON',
    date: '25/04/2026',
    time: '10:30 a.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 18,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 0,
    tab: 'upcoming',
    meetingType: 'GP General Body',
  },
  {
    id: 1783886124706,
    name: '5th GP General Body Meeting 2026',
    nameKey: 'meeting_name_5',
    mode: 'IN PERSON',
    date: '20/08/2026',
    time: '10:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 12,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 0,
    tab: 'upcoming' as const,
    meetingType: 'Grama Sabha',
  },
  {
    id: 5,
    name: '5th GP General Body Meeting 2026',
    nameKey: 'meeting_name_5',
    mode: 'IN PERSON',
    date: '10/06/2026',
    time: '11:00 a.m',
    venue: 'Kakanur GP Office (1501001003)',
    participants: 14,
    gpName: 'Kakanur Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 0,
    tab: 'drafts',
    meetingType: 'GP General Body',
  },
  {
    id: 6,
    name: '6th GP General Body Meeting 2025',
    nameKey: 'meeting_name_6',
    mode: 'IN PERSON',
    date: '05/09/2025',
    time: '10:00 a.m',
    venue: 'Hosakote GP Office (1522007034027)',
    participants: 15,
    gpName: 'Hosakote Gram Panchayat',
    electedQuorum: '51%',
    participantsQuorum: '10%',
    stepsCompleted: 0,
    tab: 'cancelled',
    meetingType: 'Finance Committee',
  },
];

export interface MeetingAgendaItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  proceedingsText: ProceedingsData;
}

export type MeetingAgendasMap = Record<number, MeetingAgendaItem[]>;

interface MeetingsContextValue {
  meetings: MeetingData[];
  addMeeting: (meeting: Omit<MeetingData, 'id'>) => number;
  updateMeeting: (id: number, patch: Partial<MeetingData>) => void;
  openingAbsentIds: Set<number>;
  setOpeningAbsentIds: (ids: Set<number>) => void;
  // Per-meeting agendas (user-created meetings)
  meetingAgendas: MeetingAgendasMap;
  setMeetingAgendas: (meetingId: number, agendas: MeetingAgendaItem[]) => void;
  saveMeetingProceedings: (meetingId: number, agendaId: number, data: ProceedingsData) => void;
  // Persisted screen state
  attendanceRows: AttendanceRow[] | null;
  setAttendanceRows: (rows: AttendanceRow[]) => void;
  closureRows: ClosureRow[] | null;
  setClosureRows: (rows: ClosureRow[]) => void;
  savedVotes: SavedVotesMap;
  setSavedVotes: React.Dispatch<React.SetStateAction<SavedVotesMap>>;
  reviews: ReviewsMap;
  setReviews: React.Dispatch<React.SetStateAction<ReviewsMap>>;
}

const MeetingsContext = createContext<MeetingsContextValue | null>(null);

export function MeetingsProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<MeetingData[]>(INITIAL_MEETINGS);
  const [openingAbsentIds, setOpeningAbsentIds] = useState<Set<number>>(new Set());
  const [meetingAgendas, setMeetingAgendasState] = useState<MeetingAgendasMap>({});
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[] | null>(null);
  const [closureRows, setClosureRows] = useState<ClosureRow[] | null>(null);
  const [savedVotes, setSavedVotes] = useState<SavedVotesMap>({});
  const [reviews, setReviews] = useState<ReviewsMap>({});

  function addMeeting(meeting: Omit<MeetingData, 'id'>): number {
    const newId = Date.now();
    setMeetings(prev => [...prev, { ...meeting, id: newId }]);
    return newId;
  }

  function updateMeeting(id: number, patch: Partial<MeetingData>) {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }

  function setMeetingAgendas(meetingId: number, agendas: MeetingAgendaItem[]) {
    setMeetingAgendasState(prev => ({ ...prev, [meetingId]: agendas }));
  }

  function saveMeetingProceedings(meetingId: number, agendaId: number, data: ProceedingsData) {
    setMeetingAgendasState(prev => {
      const existing = prev[meetingId] ?? [];
      return {
        ...prev,
        [meetingId]: existing.map(a =>
          a.id === agendaId ? { ...a, proceedingsText: data, completed: true } : a
        ),
      };
    });
  }

  return (
    <MeetingsContext.Provider value={{
      meetings, addMeeting, updateMeeting,
      meetingAgendas, setMeetingAgendas, saveMeetingProceedings,
      openingAbsentIds, setOpeningAbsentIds,
      attendanceRows, setAttendanceRows,
      closureRows, setClosureRows,
      savedVotes, setSavedVotes,
      reviews, setReviews,
    }}>
      {children}
    </MeetingsContext.Provider>
  );
}

export function useMeetings(): MeetingsContextValue {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error('useMeetings must be used within MeetingsProvider');
  return ctx;
}
