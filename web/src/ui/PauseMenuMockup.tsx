import { useState } from 'react';
import { Play, Save, Settings, LogOut, Check, Volume2 } from 'lucide-react';
import { Panel } from './components/Panel';
import { Button } from './components/Button';
import { Tabs } from './components/Tabs';
import './PauseMenuMockup.css';

export function PauseMenuMockup() {
  const [activeTab, setActiveTab] = useState('main');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Local state for mockup volume
  const [masterVolume, setMasterVolume] = useState(1);
  const [sfxVolume, setSfxVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(1);
  const [uiScale, setUiScale] = useState(1);

  const handleManualSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 1000);
  };

  return (
    <div className="pause-mockup-backdrop">
      <Panel className="pause-mockup-panel">
        <div className="pause-mockup-header">
          <h2>Game Paused</h2>
        </div>

        <Tabs 
          className="pause-mockup-tabs"
          variant="horizontal"
          tabs={[
            { id: 'main', label: 'Main Menu', icon: <Play size={18} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="pause-mockup-content">
          {activeTab === 'main' ? (
            <div className="pause-mockup-main-tab">
              <Button variant="primary" style={{ width: '100%' }}>
                <Play size={24} /> Resume Game
              </Button>
              
              <Button 
                variant="secondary" 
                style={{ width: '100%' }}
                onClick={handleManualSave}
                disabled={isSaving || saveSuccess}
              >
                {saveSuccess ? <Check size={24} color="white" /> : <Save size={24} />}
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Manual Save'}
              </Button>

              <div className="pause-mockup-divider" />

              <Button variant="primary" style={{ width: '100%', background: '#ff4d4d', borderColor: '#cc0000', boxShadow: '0 6px 0 #cc0000' }}>
                <LogOut size={24} /> Save & Quit
              </Button>
            </div>
          ) : (
            <div className="pause-mockup-settings-tab">
              <div className="mockup-setting-group">
                <label><Volume2 size={20} /> Master Volume</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={masterVolume} 
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                />
              </div>

              <div className="mockup-setting-group">
                <label>SFX Volume</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={sfxVolume} 
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                />
              </div>

              <div className="mockup-setting-group">
                <label>Music Volume</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={musicVolume} 
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                />
              </div>

              <div className="pause-mockup-divider" />
              <h3>UI Scale</h3>
              
              <div className="mockup-scale-buttons">
                {[0.8, 1.0, 1.25, 1.5].map((scale) => (
                  <Button 
                    key={scale}
                    variant={uiScale === scale ? "primary" : "secondary"}
                    onClick={() => setUiScale(scale)}
                    style={{ padding: '8px 16px', fontSize: '16px' }}
                  >
                    {scale}x
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
