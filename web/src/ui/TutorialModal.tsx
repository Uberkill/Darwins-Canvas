import { useState } from 'react'
import { 
  X, Brush, Eye, Zap, 
  Leaf, Drumstick, Utensils, 
  Dna, Route, Orbit,
  Flame, Hand, Droplets,
  Sun, Moon, CloudRain, Activity, Swords, Hourglass, RefreshCw
} from 'lucide-react'
import './TutorialModal.css'
import { useUIStore } from '../store/useUIStore';

type Tab = 'QUICKSTART' | 'GUIDE'
type Chapter = 'DRAWING' | 'DIETS' | 'EVOLUTION' | 'TOOLS' | 'WEATHER' | 'COMBAT' | 'LIFECYCLE'

export function TutorialModal() {
  const isTutorialOpen = useUIStore((s) => s.isTutorialOpen)
  const closeTutorial = useUIStore((s) => s.closeTutorial)
  
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
                  <h3>1. Make a Creature</h3>
                  <p>Click the big + button to draw your first creature! Big ones are tough tanks, while small ones are super speedy. Hover over the buttons to see what they do!</p>
                </div>
              </div>
              <div className="quickstart-step">
                <div className="quickstart-icon" style={{ background: 'var(--color-secondary)' }}><Eye size={32} /></div>
                <div className="quickstart-text">
                  <h3>2. Watch Them Grow</h3>
                  <p>Watch your creatures eat, fight, and survive! If they do well, they'll level up. Reach Level 5 to become a massive, glowing Boss!</p>
                </div>
              </div>
              <div className="quickstart-step">
                <div className="quickstart-icon" style={{ background: 'var(--color-primary)' }}><Zap size={32} /></div>
                <div className="quickstart-text">
                  <h3>3. Play God</h3>
                  <p>Use the tools at the bottom to mess with the world! Zap creatures with lightning, feed your favorites, or pick them up and drop them. Oh, and the game auto-saves every 40 seconds!</p>
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
                <button className={`guide-nav-item ${activeChapter === 'WEATHER' ? 'active' : ''}`} onClick={() => setActiveChapter('WEATHER')}>
                  <CloudRain size={20} /> Weather & Time
                </button>
                <button className={`guide-nav-item ${activeChapter === 'COMBAT' ? 'active' : ''}`} onClick={() => setActiveChapter('COMBAT')}>
                  <Swords size={20} /> Combat & Stamina
                </button>
                <button className={`guide-nav-item ${activeChapter === 'LIFECYCLE' ? 'active' : ''}`} onClick={() => setActiveChapter('LIFECYCLE')}>
                  <Hourglass size={20} /> Circle of Life
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
                        <h4>Size & Speed</h4>
                        <p>Small creatures zoom around like crazy but are super squishy! Giant creatures are slow-moving tanks that can survive almost anything. Hover your mouse over the buttons to check their exact stats.</p>
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
                        <p>Peaceful plant eaters. They just chill and munch on grass all day, so they don't get hungry too fast.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Drumstick className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Carnivores</h4>
                        <p>Fierce meat eaters! They have to hunt to survive and get hungry super fast. Watch out for their jumping attacks!</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Utensils className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Omnivores</h4>
                        <p>They'll eat anything! Plants, meat, whatever is around. They are the ultimate survivors.</p>
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
                        <p>When creatures have babies, the kids might look and act a bit different! Only the strongest survive to pass on their genes.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Brush className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Boss Monsters!</h4>
                        <p>As your creatures eat and hunt, they earn XP. When they hit Level 5, they turn into massive glowing Bosses with crazy high stats! If they survive past Level 10, they start living way longer too!</p>
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
                        <p>ZAP! Strike a creature with lightning to deal huge damage and scare them away!</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Droplets className="guide-topic-icon" size={24} style={{color: 'var(--color-secondary)'}} />
                      <div className="guide-topic-content">
                        <h4>Feed</h4>
                        <p>Drop a magical plant from the sky to save a starving creature.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Hand className="guide-topic-icon" size={24} style={{color: 'var(--color-tertiary)'}} />
                      <div className="guide-topic-content">
                        <h4>Grab</h4>
                        <p>Pick up a creature and move them away from danger (or drop them right in front of a hungry carnivore!).</p>
                      </div>
                    </div>
                  </>
                )}
                {activeChapter === 'WEATHER' && (
                  <>
                    <div className="guide-chapter-header">
                      <CloudRain className="guide-chapter-icon" size={40} />
                      <h2 className="guide-chapter-title">Weather & Time</h2>
                    </div>
                    <div className="guide-topic">
                      <Moon className="guide-topic-icon" size={24} style={{color: 'var(--color-secondary)'}} />
                      <div className="guide-topic-content">
                        <h4>Day & Night</h4>
                        <p>When the sun sets, visibility drops! Herbivores sleep in the dark, and Carnivores catnap during the day to save energy.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Sun className="guide-topic-icon" size={24} style={{color: 'var(--color-primary)'}} />
                      <div className="guide-topic-content">
                        <h4>Seasons</h4>
                        <p>Rain floods the ecosystem with massive plant growth, while Droughts cause extreme scarcity and mass starvation.</p>
                      </div>
                    </div>
                  </>
                )}
                {activeChapter === 'COMBAT' && (
                  <>
                    <div className="guide-chapter-header">
                      <Activity className="guide-chapter-icon" size={40} />
                      <h2 className="guide-chapter-title">Combat & Stamina</h2>
                    </div>
                    <div className="guide-topic">
                      <Activity className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Exhaustion</h4>
                        <p>Running and hunting drains a creature's stamina. If stamina hits 0, they suffer a severe 50% speed penalty until they rest.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <Swords className="guide-topic-icon" size={24} style={{color: 'var(--color-primary)'}} />
                      <div className="guide-topic-content">
                        <h4>Apex Predator Lunge</h4>
                        <p>Carnivores can burst forward for 2.5x speed and deal double damage on impact, at the cost of massive stamina drain.</p>
                      </div>
                    </div>
                  </>
                )}
                {activeChapter === 'LIFECYCLE' && (
                  <>
                    <div className="guide-chapter-header">
                      <Hourglass className="guide-chapter-icon" size={40} />
                      <h2 className="guide-chapter-title">The Circle of Life</h2>
                    </div>
                    <div className="guide-topic">
                      <Hourglass className="guide-topic-icon" size={24} />
                      <div className="guide-topic-content">
                        <h4>Aging & Senescence</h4>
                        <p>Creatures don't live forever! Once they pass their maximum lifespan, they physically shrink, slow down, and starve faster until they die of old age.</p>
                      </div>
                    </div>
                    <div className="guide-topic">
                      <RefreshCw className="guide-topic-icon" size={24} style={{color: 'var(--color-tertiary)'}} />
                      <div className="guide-topic-content">
                        <h4>Immigration</h4>
                        <p>If an entire species goes extinct, don't panic! Migrants may eventually wander in from the edges of the map to re-seed the population.</p>
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
