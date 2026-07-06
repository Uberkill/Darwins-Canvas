import { useState } from 'react'
import { 
  X, Brush, Eye, Zap, 
  Leaf, Drumstick, Utensils, 
  Dna, Route, Orbit,
  Flame, Hand, Droplets
} from 'lucide-react'
import { useStore } from '../store/useStore'
import './TutorialModal.css'

type Tab = 'QUICKSTART' | 'GUIDE'
type Chapter = 'DRAWING' | 'DIETS' | 'EVOLUTION' | 'TOOLS'

export function TutorialModal() {
  const isTutorialOpen = useStore((s) => s.isTutorialOpen)
  const closeTutorial = useStore((s) => s.closeTutorial)
  
  const [activeTab, setActiveTab] = useState<Tab>('QUICKSTART')
  const [activeChapter, setActiveChapter] = useState<Chapter>('DRAWING')

  if (!isTutorialOpen) return null

  // Prevent clicks on the backdrop from falling through to the canvas
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeTutorial()
  }

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="tutorial-backdrop" onPointerDown={handleBackdropClick} onPointerUp={(e) => e.stopPropagation()}>
      <div className="tutorial-modal" onPointerDown={handleModalClick} onPointerUp={handleModalClick}>
        
        <div className="tutorial-header">
          <div className="tutorial-tabs">
            <button 
              className={`tutorial-tab ${activeTab === 'QUICKSTART' ? 'active' : ''}`}
              onClick={() => setActiveTab('QUICKSTART')}
            >
              Quick Start
            </button>
            <button 
              className={`tutorial-tab ${activeTab === 'GUIDE' ? 'active' : ''}`}
              onClick={() => setActiveTab('GUIDE')}
            >
              Field Guide
            </button>
          </div>
          <button className="tutorial-close" onClick={closeTutorial}>
            <X size={24} />
          </button>
        </div>

        <div className="tutorial-content">
          {activeTab === 'QUICKSTART' ? (
            <div className="quickstart-view">
              <div className="quickstart-step">
                <div className="quickstart-icon"><Brush size={32} /></div>
                <div className="quickstart-text">
                  <h3>1. Draw Life</h3>
                  <p>Click the + button to draw a creature. Big creatures are strong, but small creatures are fast!</p>
                </div>
              </div>
              <div className="quickstart-step">
                <div className="quickstart-icon" style={{ background: 'var(--color-secondary)' }}><Eye size={32} /></div>
                <div className="quickstart-text">
                  <h3>2. Observe</h3>
                  <p>Watch your creatures eat, survive, and reproduce. Their offspring will mutate and evolve over time.</p>
                </div>
              </div>
              <div className="quickstart-step">
                <div className="quickstart-icon" style={{ background: 'var(--color-primary)' }}><Zap size={32} /></div>
                <div className="quickstart-text">
                  <h3>3. Intervene</h3>
                  <p>Use God Tools at the bottom to shape the ecosystem. Feed the hungry, or smite the overpopulated!</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="guide-nav">
                <button className={`guide-nav-item ${activeChapter === 'DRAWING' ? 'active' : ''}`} onClick={() => setActiveChapter('DRAWING')}>
                  <Brush size={20} /> Drawing Life
                </button>
                <button className={`guide-nav-item ${activeChapter === 'DIETS' ? 'active' : ''}`} onClick={() => setActiveChapter('DIETS')}>
                  <Drumstick size={20} /> Diets
                </button>
                <button className={`guide-nav-item ${activeChapter === 'EVOLUTION' ? 'active' : ''}`} onClick={() => setActiveChapter('EVOLUTION')}>
                  <Dna size={20} /> Evolution
                </button>
                <button className={`guide-nav-item ${activeChapter === 'TOOLS' ? 'active' : ''}`} onClick={() => setActiveChapter('TOOLS')}>
                  <Zap size={20} /> God Tools
                </button>
              </div>
              <div className="guide-body">
                {activeChapter === 'DRAWING' && (
                  <>
                    <div className="guide-chapter-header">
                      <Brush className="guide-chapter-icon" size={40} />
                      <h2 className="guide-chapter-title">Drawing Life</h2>
                    </div>
                    <div className="guide-topic">
                      <Route className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Size Defines Speed</h4>
                        <p>Small creatures are incredibly fast but have very low health. Massive creatures are slow but can survive anything.</p>
                      </div>
                    </div>
                  </>
                )}
                {activeChapter === 'DIETS' && (
                  <>
                    <div className="guide-chapter-header">
                      <Drumstick className="guide-chapter-icon" size={40} />
                      <h2 className="guide-chapter-title">Diets & Survival</h2>
                    </div>
                    <div className="guide-topic">
                      <Leaf className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Herbivores</h4>
                        <p>They peacefully graze on the natural environment. Their hunger drains slowly.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Drumstick className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Carnivores</h4>
                        <p>They must hunt other creatures to survive! They are aggressive and drain hunger quickly.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Utensils className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Omnivores</h4>
                        <p>They eat anything they can find. They are the ultimate survivors in unpredictable ecosystems.</p>
                      </div>
                    </div>
                  </>
                )}
                {activeChapter === 'EVOLUTION' && (
                  <>
                    <div className="guide-chapter-header">
                      <Dna className="guide-chapter-icon" size={40} />
                      <h2 className="guide-chapter-title">Evolution</h2>
                    </div>
                    <div className="guide-topic">
                      <Orbit className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Mutations</h4>
                        <p>When creatures reproduce, their babies inherit traits with slight random mutations. Only the fittest survive to pass on their genes!</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Brush className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Color Shifting</h4>
                        <p>As generations evolve, their colors naturally drift across the rainbow. Use the Inspector to check their genetic purity.</p>
                      </div>
                    </div>
                  </>
                )}
                {activeChapter === 'TOOLS' && (
                  <>
                    <div className="guide-chapter-header">
                      <Zap className="guide-chapter-icon" size={40} />
                      <h2 className="guide-chapter-title">God Tools</h2>
                    </div>
                    <div className="guide-topic">
                      <Flame className="guide-topic-icon" size={24} style={{color: 'var(--color-primary)'}} />
                      <div className="guide-topic-content">
                        <h4>Smite</h4>
                        <p>Instantly vaporize any creature. Useful for removing overpopulated species.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Droplets className="guide-topic-icon" size={24} style={{color: 'var(--color-secondary)'}} />
                      <div className="guide-topic-content">
                        <h4>Feed</h4>
                        <p>Instantly restore a creature's hunger to maximum. Save your favorites from starvation.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Hand className="guide-topic-icon" size={24} style={{color: 'var(--color-tertiary)'}} />
                      <div className="guide-topic-content">
                        <h4>Grab</h4>
                        <p>Pick up a creature and drop them anywhere. Perfect for saving them from predators.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
