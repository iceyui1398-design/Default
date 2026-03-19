import axios from 'axios';
import type { Analysis, MatchData, Odds } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export interface FixtureDetail {
  fixture: MatchData;
  h2h: MatchData[];
  homeStats: unknown;
  awayStats: unknown;
  injuries: { home: unknown[]; away: unknown[] };
  odds: Odds | null;
  analysis: Analysis | null;
}

export async function fetchFixtures(): Promise<MatchData[]> {
  const { data } = await api.get('/fixtures');
  return data.data || [];
}

export async function fetchLiveMatches(): Promise<MatchData[]> {
  const { data } = await api.get('/fixtures/live');
  return data.data || [];
}

export async function fetchFixtureDetail(id: number): Promise<FixtureDetail> {
  const { data } = await api.get(`/fixtures/${id}`);
  return data.data;
}

export async function triggerAnalysis(fixtureId: number, forceRefresh = false): Promise<Analysis> {
  const { data } = await api.post(`/fixtures/${fixtureId}/analyze`, { force_refresh: forceRefresh });
  return data.data;
}

export async function fetchAnalysis(fixtureId: number): Promise<Analysis | null> {
  try {
    const { data } = await api.get(`/fixtures/${fixtureId}/analysis`);
    return data.data;
  } catch {
    return null;
  }
}

export async function fetchAllAnalyses(): Promise<Analysis[]> {
  const { data } = await api.get('/analysis');
  return data.data || [];
}

export async function checkHealth(): Promise<{
  status: string;
  apis: { rapidapi: boolean; odds_api: boolean; anthropic: boolean };
}> {
  const { data } = await api.get('/health', { baseURL: '' });
  return data;
}
