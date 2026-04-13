import { useState } from 'react';
import type { Difficulty, GameMode, Settings } from './lib/checkersTypes';
import MenuScreen from './screens/MenuScreen';
import GameScreen from './screens/GameScreen';

type AppScreen = 'menu' | 'game';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameMode, setGameMode] = useState<GameMode>('bot');
  const [settings, setSettings] = useState<Settings>({ mandatoryJump: false });

  const handlePlay = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('game');
  };

  if (screen === 'game') {
    return (
      <GameScreen
        difficulty={difficulty}
        gameMode={gameMode}
        settings={settings}
        onBack={() => setScreen('menu')}
        onSettingsChange={setSettings}
      />
    );
  }

  return (
    <MenuScreen
      difficulty={difficulty}
      settings={settings}
      onDifficultyChange={setDifficulty}
      onSettingsChange={setSettings}
      onPlay={handlePlay}
    />
  );
}
