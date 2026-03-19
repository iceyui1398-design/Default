import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/useAppStore';
import type { MatchData } from '../lib/types';

const SOCKET_URL = window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setLiveMatches,
    updateLiveMatch,
    addNotification,
    setIsConnected,
  } = useAppStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socket.on('live_matches_updated', (matches: MatchData[]) => {
      setLiveMatches(matches);
    });

    socket.on('goal_scored', ({ homeTeam, awayTeam, score, match }: {
      homeTeam: string;
      awayTeam: string;
      score: string;
      match: MatchData;
    }) => {
      updateLiveMatch(match);
      addNotification({
        type: 'goal',
        message: `GOAL! ${homeTeam} vs ${awayTeam} — ${score}`,
      });
    });

    socket.on('red_card', ({ event, match }: {
      event: { team: { name: string }; player: { name: string }; time: { elapsed: number } };
      match: MatchData;
    }) => {
      updateLiveMatch(match);
      addNotification({
        type: 'red_card',
        message: `Red Card! ${event.player?.name} (${event.team?.name}) — ${event.time?.elapsed}'`,
      });
    });

    socket.on('odds_movement', ({ homeTeam, awayTeam, changePercent }: {
      homeTeam: string;
      awayTeam: string;
      changePercent: number;
    }) => {
      addNotification({
        type: 'odds',
        message: `Odds moved ${changePercent}%: ${homeTeam} vs ${awayTeam}`,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
}
