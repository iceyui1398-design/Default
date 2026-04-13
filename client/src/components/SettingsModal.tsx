import React from 'react';
import type { Settings } from '../lib/checkersTypes';

interface Props {
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ settings, onSettingsChange, onClose }) => {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="settings-close-btn" onClick={onClose}>
          ✕
        </button>

        <h2 className="settings-title">SETTINGS</h2>

        <div className="settings-card">
          <h3 className="settings-subtitle">CHOOSE THE RULE</h3>

          <div className="settings-row">
            <span className="settings-label">Jumping is mandatory</span>
            <button
              className={`toggle-btn ${settings.mandatoryJump ? 'toggle-on' : 'toggle-off'}`}
              onClick={() =>
                onSettingsChange({ ...settings, mandatoryJump: !settings.mandatoryJump })
              }
            >
              <div className="toggle-thumb" />
              <span className="toggle-icon">{settings.mandatoryJump ? '✓' : '✕'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
