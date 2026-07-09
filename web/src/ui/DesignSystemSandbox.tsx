import { useState } from 'react';
import { Button } from './components/Button';
import { Panel } from './components/Panel';
import { Badge } from './components/Badge';
import { Tabs } from './components/Tabs';
import { Zap, Hand, Heart, MousePointer2 } from 'lucide-react';
import './DesignSystemSandbox.css';

export function DesignSystemSandbox() {
  const [activeTab, setActiveTab] = useState('QUICKSTART');

  return (
    <div className="sandbox-container">
      <header className="sandbox-header">
        <h1>Darwin's Canvas — Design System</h1>
        <p>The definitive single source of truth for all UI components.</p>
      </header>

      <main className="sandbox-main">
        {/* Color Tokens */}
        <section className="sandbox-section">
          <h2>1. Color Palette</h2>
          <div className="color-grid">
            <div className="color-swatch" style={{ background: 'var(--color-bg-base)' }}>--color-bg-base</div>
            <div className="color-swatch" style={{ background: 'var(--color-bg-dots)' }}>--color-bg-dots</div>
            <div className="color-swatch" style={{ background: 'var(--color-panel)', color: '#000' }}>--color-panel</div>
            <div className="color-swatch" style={{ background: 'var(--color-primary)' }}>--color-primary</div>
            <div className="color-swatch" style={{ background: 'var(--color-secondary)' }}>--color-secondary</div>
            <div className="color-swatch" style={{ background: 'var(--color-tertiary)' }}>--color-tertiary</div>
            <div className="color-swatch" style={{ background: 'var(--color-blue)' }}>--color-blue</div>
            <div className="color-swatch" style={{ background: 'var(--color-text)' }}>--color-text</div>
            <div className="color-swatch" style={{ background: 'var(--color-text-muted)' }}>--color-text-muted</div>
          </div>
        </section>

        {/* Typography */}
        <section className="sandbox-section">
          <h2>2. Typography (Nunito)</h2>
          <Panel>
            <h1 style={{ fontSize: '3rem', fontWeight: 900 }}>Heading 1 (900)</h1>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Heading 2 (800)</h2>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Heading 3 (800)</h3>
            <p style={{ fontSize: '1rem', fontWeight: 700 }}>Body Text (700) — The quick brown fox jumps over the lazy dog.</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Body Text (500) — The quick brown fox jumps over the lazy dog.</p>
          </Panel>
        </section>

        {/* Buttons */}
        <section className="sandbox-section">
          <h2>3. Buttons (Interactive)</h2>
          <Panel>
            <div className="sandbox-row">
              <Button variant="massive">Massive Button</Button>
              <Button variant="massive" disabled>Disabled</Button>
            </div>
            <div className="sandbox-row">
              <Button variant="primary">Action Button</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div className="sandbox-row">
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
            <div className="sandbox-row">
              <Button variant="icon" icon={<MousePointer2 size={24} />} />
              <Button variant="icon" icon={<Zap size={24} />} />
              <Button variant="icon" icon={<Hand size={24} />} disabled />
            </div>
            <div className="sandbox-row">
              <Button variant="fab" icon={<Heart size={32} />} />
            </div>
          </Panel>
        </section>

        {/* Badges & Pills */}
        <section className="sandbox-section">
          <h2>4. Badges & Indicators</h2>
          <Panel>
            <div className="sandbox-row">
              <Badge icon={<Zap size={16} />}>5 Creatures</Badge>
              <Badge>Day 12</Badge>
            </div>
          </Panel>
        </section>

        {/* Tabs */}
        <section className="sandbox-section">
          <h2>5. Navigation Tabs</h2>
          <Panel>
            <Tabs 
              tabs={[
                { id: 'QUICKSTART', label: 'Quick Start' },
                { id: 'GUIDE', label: 'Field Guide' }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <br />
            <Tabs 
              variant="vertical"
              tabs={[
                { id: 'DRAWING', label: 'Drawing Life', icon: <Hand size={20} /> },
                { id: 'DIETS', label: 'Diets', icon: <Heart size={20} /> }
              ]}
              activeTab="DRAWING"
              onTabChange={() => {}}
            />
          </Panel>
        </section>
      </main>
    </div>
  );
}
