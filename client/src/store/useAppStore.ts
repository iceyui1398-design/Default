import { create } from 'zustand';
import type { MatchData, Analysis } from '../lib/types';

interface Notification {
  id: string;
  type: 'goal' | 'red_card' | 'odds' | 'info';
  message: string;
  timestamp: number;
}

interface AppState {
  // Fixtures
  fixtures: MatchData[];
  liveMatches: MatchData[];
  setFixtures: (fixtures: MatchData[]) => void;
  setLiveMatches: (matches: MatchData[]) => void;
  updateLiveMatch: (match: MatchData) => void;

  // Analyses
  analyses: Record<string, Analysis>;
  setAnalysis: (fixtureId: string | number, analysis: Analysis) => void;

  // UI State
  selectedFixtureId: number | null;
  setSelectedFixtureId: (id: number | null) => void;
  activeTab: 'upcoming' | 'live' | 'analyses';
  setActiveTab: (tab: 'upcoming' | 'live' | 'analyses') => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;

  // API Health
  apiHealth: { rapidapi: boolean; odds_api: boolean; anthropic: boolean } | null;
  setApiHealth: (health: AppState['apiHealth']) => void;

  // Socket connection status
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  fixtures: [],
  liveMatches: [],
  setFixtures: (fixtures) => set({ fixtures }),
  setLiveMatches: (matches) => set({ liveMatches: matches }),
  updateLiveMatch: (match) => set((state) => {
    const idx = state.liveMatches.findIndex(m => m.fixture.id === match.fixture.id);
    if (idx >= 0) {
      const updated = [...state.liveMatches];
      updated[idx] = match;
      return { liveMatches: updated };
    }
    return { liveMatches: [...state.liveMatches, match] };
  }),

  analyses: {},
  setAnalysis: (fixtureId, analysis) => set((state) => ({
    analyses: { ...state.analyses, [String(fixtureId)]: analysis },
  })),

  selectedFixtureId: null,
  setSelectedFixtureId: (id) => set({ selectedFixtureId: id }),
  activeTab: 'upcoming',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).slice(2);
    const newNotif = { ...notification, id, timestamp: Date.now() };
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 10),
    }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => get().dismissNotification(id), 5000);
  },
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),

  apiHealth: null,
  setApiHealth: (health) => set({ apiHealth: health }),

  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),
}));
