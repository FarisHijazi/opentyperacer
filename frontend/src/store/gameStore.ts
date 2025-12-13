import { create } from 'zustand';

interface Player {
  id: string;
  odefinitionUserId: string;
  username: string;
  avatarColor: string;
  carColor: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishTime: number | null;
  position: number | null;
}

interface RaceResult {
  odefinitionUserId: string;
  username: string;
  position: number | null;
  wpm: number;
  accuracy: number;
  finishTime: number | null;
}

interface GameState {
  roomCode: string | null;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  players: Player[];
  trackId: string | null;
  trackText: string | null;
  trackName: string | null;
  countdownSeconds: number;
  startTime: number | null;
  results: RaceResult[];

  // Actions
  setRoomCode: (code: string | null) => void;
  setStatus: (status: GameState['status']) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayer: (odefinitionPlayerId: string, updates: Partial<Player>) => void;
  setTrack: (trackId: string | null, trackText: string | null, trackName: string | null) => void;
  setCountdown: (seconds: number) => void;
  setStartTime: (time: number | null) => void;
  setResults: (results: RaceResult[]) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomCode: null,
  status: 'waiting',
  players: [],
  trackId: null,
  trackText: null,
  trackName: null,
  countdownSeconds: 0,
  startTime: null,
  results: [],

  setRoomCode: (code) => set({ roomCode: code }),
  setStatus: (status) => set({ status }),
  setPlayers: (players) => set({ players }),
  updatePlayer: (odefinitionPlayerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === odefinitionPlayerId ? { ...p, ...updates } : p
      ),
    })),
  setTrack: (trackId, trackText, trackName) => set({ trackId, trackText, trackName }),
  setCountdown: (seconds) => set({ countdownSeconds: seconds }),
  setStartTime: (time) => set({ startTime: time }),
  setResults: (results) => set({ results }),
  reset: () =>
    set({
      status: 'waiting',
      countdownSeconds: 0,
      startTime: null,
      results: [],
    }),
}));
