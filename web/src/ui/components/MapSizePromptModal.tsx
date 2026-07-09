import { Leaf, TreePine, Trees } from 'lucide-react'

interface MapSizePromptModalProps {
  onSelect: (multiplier: number) => void;
}

export function MapSizePromptModal({ onSelect }: MapSizePromptModalProps) {
  return (
    <>
      <div className="pause-header">
        <h2>Ecosystem Scale</h2>
        <p className="pause-section-title" style={{ marginTop: '4px' }}>Choose the size of your world</p>
      </div>

      <div className="pause-content" style={{ gap: '20px', padding: '16px 32px 40px 32px' }}>
        <button 
          className="map-size-btn standard" 
          onClick={() => onSelect(1)}
        >
          <div style={{ backgroundColor: '#E5FAEE', padding: '12px', borderRadius: '50%', display: 'flex', color: 'var(--color-secondary)' }}>
            <Leaf size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', color: 'var(--color-text)', fontWeight: 900 }}>Standard (1x)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 800, marginTop: '2px' }}>
              Max 250 Creatures
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'normal', marginTop: '2px' }}>
              A balanced environment. Good for focused observation.
            </div>
          </div>
        </button>

        <button 
          className="map-size-btn vast" 
          onClick={() => onSelect(2)}
        >
          <div style={{ backgroundColor: '#E5F6FA', padding: '12px', borderRadius: '50%', display: 'flex', color: 'var(--color-blue)' }}>
            <TreePine size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', color: 'var(--color-text)', fontWeight: 900 }}>Vast (2x)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 800, marginTop: '2px' }}>
              Max 1000 Creatures
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'normal', marginTop: '2px' }}>
              A massive continent. Perfect for diverse evolution.
            </div>
          </div>
        </button>

        <button 
          className="map-size-btn epic" 
          onClick={() => onSelect(3)}
        >
          <div style={{ backgroundColor: '#FFF0F5', padding: '12px', borderRadius: '50%', display: 'flex', color: 'var(--color-primary)' }}>
            <Trees size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', color: 'var(--color-text)', fontWeight: 900 }}>Epic (3x)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 800, marginTop: '2px' }}>
              Max 2250 Creatures
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'normal', marginTop: '2px' }}>
              An entire world. Warning: High-end systems only!
            </div>
          </div>
        </button>
      </div>
    </>
  )
}
