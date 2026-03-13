import { create } from 'zustand';

interface TimeState {
  realDate: string | null;     // YYYY-MM-DD
  realTime: string | null;     // HH:mm:ss
  timestamp: string | null;
  unixtime: number | null;
  lastFetched: number | null;
  source: 'api' | 'fallback' | null;
  setTime: (data: {
    date: string;
    time: string;
    timestamp: string;
    unixtime: number;
    source?: 'api' | 'fallback';
  }) => void;
}

export const useTimeStore = create<TimeState>()((set) => ({
  realDate: null,
  realTime: null,
  timestamp: null,
  unixtime: null,
  lastFetched: null,
  source: null,

  setTime: (data) =>
    set({
      realDate: data.date,
      realTime: data.time,
      timestamp: data.timestamp,
      unixtime: data.unixtime,
      lastFetched: Date.now(),
      source: data.source || 'api',
    }),
}));
