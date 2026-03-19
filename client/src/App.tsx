import { useEffect } from 'react';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { NotificationBar } from './components/NotificationBar';
import { MatchDetail } from './components/MatchDetail';
import { UpcomingPage } from './pages/UpcomingPage';
import { LivePage } from './pages/LivePage';
import { AnalysesPage } from './pages/AnalysesPage';
import { useSocket } from './hooks/useSocket';
import { useAppStore } from './store/useAppStore';
import { fetchFixtures, fetchLiveMatches, checkHealth } from './lib/api';

export default function App() {
  const {
    activeTab,
    selectedFixtureId,
    setSelectedFixtureId,
    setFixtures,
    setLiveMatches,
    setApiHealth,
  } = useAppStore();

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fixtures, liveMatches, health] = await Promise.allSettled([
          fetchFixtures(),
          fetchLiveMatches(),
          checkHealth(),
        ]);

        if (fixtures.status === 'fulfilled') setFixtures(fixtures.value);
        if (liveMatches.status === 'fulfilled') setLiveMatches(liveMatches.value);
        if (health.status === 'fulfilled') setApiHealth(health.value.apis);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadData();

    // Refresh fixtures every 5 minutes
    const interval = setInterval(() => {
      fetchFixtures().then(setFixtures).catch(console.error);
      fetchLiveMatches().then(setLiveMatches).catch(console.error);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-svh bg-slate-900">
      <Header />
      <TabBar />
      <NotificationBar />

      <main className="max-w-lg mx-auto">
        {activeTab === 'upcoming' && <UpcomingPage />}
        {activeTab === 'live' && <LivePage />}
        {activeTab === 'analyses' && <AnalysesPage />}
      </main>

      {selectedFixtureId && (
        <MatchDetail
          fixtureId={selectedFixtureId}
          onClose={() => setSelectedFixtureId(null)}
        />
      )}
    </div>
  );
}
