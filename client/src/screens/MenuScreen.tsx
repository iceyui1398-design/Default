import React, { useState } from 'react';
import type { Difficulty, GameMode, Settings } from '../lib/checkersTypes';
import SettingsModal from '../components/SettingsModal';

interface Props {
  difficulty: Difficulty;
  settings: Settings;
  onDifficultyChange: (d: Difficulty) => void;
  onSettingsChange: (s: Settings) => void;
  onPlay: (mode: GameMode) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const DIFF_CONFIG = {
  easy: {
    label: 'EASY',
    color: '#2ECC71',
    darkColor: '#27AE60',
    bgColor: 'rgba(46,204,113,0.12)',
    mascot: EasyMascot,
  },
  medium: {
    label: 'MEDIUM',
    color: '#F39C12',
    darkColor: '#D68910',
    bgColor: 'rgba(243,156,18,0.12)',
    mascot: MediumMascot,
  },
  hard: {
    label: 'HARD',
    color: '#E74C3C',
    darkColor: '#C0392B',
    bgColor: 'rgba(231,76,60,0.12)',
    mascot: HardMascot,
  },
};

function EasyMascot() {
  return (
    <div className="mascot-circle mascot-easy">
      <svg viewBox="0 0 80 80" width="70" height="70">
        <circle cx="40" cy="40" r="38" fill="#2ECC71" />
        {/* ears */}
        <circle cx="14" cy="16" r="12" fill="#27AE60" />
        <circle cx="66" cy="16" r="12" fill="#27AE60" />
        <circle cx="14" cy="16" r="7" fill="#2ECC71" />
        <circle cx="66" cy="16" r="7" fill="#2ECC71" />
        {/* face */}
        <circle cx="28" cy="36" r="6" fill="white" />
        <circle cx="52" cy="36" r="6" fill="white" />
        <circle cx="30" cy="37" r="3.5" fill="#1a1a2e" />
        <circle cx="54" cy="37" r="3.5" fill="#1a1a2e" />
        {/* smile */}
        <path d="M28 52 Q40 62 52 52" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {/* nose */}
        <ellipse cx="40" cy="46" rx="5" ry="3.5" fill="#27AE60" />
      </svg>
    </div>
  );
}

function MediumMascot() {
  return (
    <div className="mascot-circle mascot-medium">
      <svg viewBox="0 0 80 80" width="70" height="70">
        <circle cx="40" cy="40" r="38" fill="#F39C12" />
        {/* ears */}
        <circle cx="14" cy="16" r="12" fill="#D68910" />
        <circle cx="66" cy="16" r="12" fill="#D68910" />
        <circle cx="14" cy="16" r="7" fill="#F39C12" />
        <circle cx="66" cy="16" r="7" fill="#F39C12" />
        {/* face */}
        <circle cx="28" cy="36" r="6" fill="white" />
        <circle cx="52" cy="36" r="6" fill="white" />
        <circle cx="30" cy="37" r="3.5" fill="#1a1a2e" />
        <circle cx="54" cy="37" r="3.5" fill="#1a1a2e" />
        {/* neutral mouth */}
        <line x1="30" y1="54" x2="50" y2="54" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        {/* nose */}
        <ellipse cx="40" cy="46" rx="5" ry="3.5" fill="#D68910" />
      </svg>
    </div>
  );
}

function HardMascot() {
  return (
    <div className="mascot-circle mascot-hard">
      <svg viewBox="0 0 80 80" width="70" height="70">
        <circle cx="40" cy="40" r="38" fill="#E74C3C" />
        {/* ears */}
        <circle cx="14" cy="16" r="12" fill="#C0392B" />
        <circle cx="66" cy="16" r="12" fill="#C0392B" />
        <circle cx="14" cy="16" r="7" fill="#E74C3C" />
        <circle cx="66" cy="16" r="7" fill="#E74C3C" />
        {/* angry brows */}
        <path d="M20 28 L36 33" stroke="#1a1a2e" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M44 33 L60 28" stroke="#1a1a2e" strokeWidth="3.5" strokeLinecap="round"/>
        {/* face */}
        <circle cx="28" cy="38" r="6" fill="white" />
        <circle cx="52" cy="38" r="6" fill="white" />
        <circle cx="30" cy="39" r="3.5" fill="#1a1a2e" />
        <circle cx="54" cy="39" r="3.5" fill="#1a1a2e" />
        {/* angry mouth */}
        <path d="M30 55 Q40 48 50 55" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {/* nose */}
        <ellipse cx="40" cy="48" rx="5" ry="3.5" fill="#C0392B" />
      </svg>
    </div>
  );
}

const MenuScreen: React.FC<Props> = ({
  difficulty,
  settings,
  onDifficultyChange,
  onSettingsChange,
  onPlay,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const cfg = DIFF_CONFIG[difficulty];
  const diffIndex = DIFFICULTIES.indexOf(difficulty);
  const Mascot = cfg.mascot;

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onDifficultyChange(DIFFICULTIES[val]);
  };

  return (
    <div className="screen menu-screen">
      {/* Board preview background */}
      <div className="menu-board-bg">
        <div className="menu-board-preview">
          {Array.from({ length: 64 }, (_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            return (
              <div
                key={i}
                className="preview-cell"
                style={{
                  background: (r + c) % 2 === 0 ? '#C4A68A' : '#E8D5C4',
                }}
              />
            );
          })}
        </div>

        {/* Header */}
        <div className="menu-header">
          <button className="nav-btn" onClick={() => {}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <h1 className="screen-title">CHECKERS</h1>
          <button className="nav-btn settings-nav-btn" onClick={() => setShowSettings(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>

        <p className="menu-subtitle">Capture all your opponent's pieces to win!</p>

        {/* Star */}
        <div className="menu-star">⭐</div>
      </div>

      {/* Difficulty Card */}
      <div className="menu-card" style={{ background: cfg.bgColor }}>
        {/* Mascot */}
        <div className="mascot-wrapper">
          <Mascot />
        </div>

        {/* Side icons */}
        <div className="card-side-icons">
          <button className="side-icon-btn" style={{ background: cfg.color }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="2" y="12" width="4" height="10" rx="1"/>
              <rect x="9" y="7" width="4" height="15" rx="1"/>
              <rect x="16" y="2" width="4" height="20" rx="1"/>
            </svg>
          </button>
          <button className="side-icon-btn side-icon-right" style={{ background: '#9B59B6' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>?</span>
          </button>
        </div>

        {/* Difficulty label */}
        <div className="difficulty-label" style={{ color: cfg.color }}>
          {cfg.label}
        </div>

        {/* Slider */}
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={diffIndex}
            onChange={handleSlider}
            className="difficulty-slider"
            style={{
              '--thumb-color': cfg.darkColor,
              '--track-color': cfg.color,
            } as React.CSSProperties}
          />
        </div>

        {/* Play vs Bot */}
        <button
          className="play-btn"
          style={{ background: cfg.color }}
          onClick={() => onPlay('bot')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginRight: 8 }}>
            <rect x="2" y="7" width="20" height="14" rx="3" fill="white" fillOpacity="0.9"/>
            <circle cx="8" cy="14" r="2" fill={cfg.color}/>
            <circle cx="16" cy="14" r="2" fill={cfg.color}/>
            <rect x="10" y="3" width="4" height="5" rx="1" fill="white" fillOpacity="0.9"/>
            <circle cx="12" cy="3" r="1.5" fill="white" fillOpacity="0.9"/>
          </svg>
          <div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>PLAY VS.</div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1 }}>BOT</div>
          </div>
        </button>
      </div>

      {/* Play vs Friend */}
      <button
        className="play-btn friend-btn"
        onClick={() => onPlay('friend')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginRight: 8 }}>
          <circle cx="9" cy="7" r="4" fill="white" fillOpacity="0.85"/>
          <circle cx="17" cy="9" r="3" fill="white" fillOpacity="0.6"/>
          <path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill="white" fillOpacity="0.85"/>
          <path d="M15 14c2.2 0 5 1.4 5 4" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" fillOpacity="0.6"/>
        </svg>
        <div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>PLAY VS.</div>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1 }}>FRIEND</div>
        </div>
      </button>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default MenuScreen;
