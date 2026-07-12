import { useState } from 'react'
import type { CreatureSize, MovementType, DietType } from '../types'
import { useDrawingCanvas } from '../hooks/useDrawingCanvas'
import { generateRandomName } from '../utils/nameGenerator'
import { bakeCreatureSprites } from '../renderer/baker'
import { CreationTools } from './CreationTools'
import { CreationSettings } from './CreationSettings'
import { CreationCanvas } from './CreationCanvas'
import { WorldBuilderTab } from './WorldBuilder'
import { useUIStore } from '../store/useUIStore';
import { useEngineStore } from '../store/useEngineStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function CreationPanel() {
  const isPanelOpen   = useUIStore((s) => s.isPanelOpen)
  const closePanel    = useUIStore((s) => s.closePanel)
  const queueCreature = useEngineStore((s) => s.queueCreature)
  const uiScale       = useSettingsStore((s) => s.uiScale)

  // Tab state
  const [activeTab, setActiveTab] = useState<'CREATURE' | 'WORLD'>('CREATURE')

  // Settings state (creature canvas only)
  const [brushSize,  setBrushSize]  = useState(10)
  const [brushColor, setBrushColor] = useState('#4A3B32')

  // Trait state
  const [name,     setName]     = useState('')
  const [size,     setSize]     = useState<CreatureSize>('MEDIUM')
  const [movement, setMovement] = useState<MovementType>('CRAWLER')
  const [diet,     setDiet]     = useState<DietType>('HERBIVORE')

  // Drawing Canvas Hook (lifted to root of modal)
  const drawing = useDrawingCanvas(brushSize, brushColor)

  // Loading state for baking
  const [isBaking, setIsBaking] = useState(false)

  async function handleRelease() {
    if (drawing.isEmpty || isBaking) return
    setIsBaking(true)
    const { image: dataURL, adjustedDecals } = drawing.exportBase64()
    
    // Auto-generate name if left blank
    const finalName = name.trim() || generateRandomName()
    
    // Pre-bake the SVG decals onto the 4 state frames
    const bakedSprites = await bakeCreatureSprites(dataURL, adjustedDecals)
    
    queueCreature({ 
      drawingData: dataURL, 
      size, 
      movement, 
      diet, 
      name: finalName,
      decals: drawing.decals,
      bakedSprites 
    })
    
    drawing.clear()
    setName('') // reset name for next creature
    setIsBaking(false)
    closePanel()
  }

  return (
    <div className={`creation-modal-overlay ${isPanelOpen ? 'open' : ''}`}>
      <div className="creation-modal-container">
        
        {/* Left Column: Creature Tools — hidden in World tab (it has its own sidebar) */}
        {activeTab !== 'WORLD' && (
          <CreationTools 
            drawing={drawing} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'WORLD' ? (
          /* WorldBuilderTab owns its own brush/size state — not shared with creature canvas */
          <WorldBuilderTab 
            isVisible={isPanelOpen} 
            closePanel={closePanel}
            onSwitchToCreature={() => setActiveTab('CREATURE')}
          />
        ) : (
          <>
            {/* Center Column: Massive Canvas */}
            <CreationCanvas 
              name={name} 
              setName={setName} 
              drawing={drawing} 
              uiScale={uiScale} 
              brushSize={brushSize} 
              brushColor={brushColor} 
              closePanel={closePanel} 
            />

            {/* Right Column: Settings */}
            <CreationSettings 
              brushColor={brushColor} 
              setBrushColor={setBrushColor} 
              brushSize={brushSize} 
              setBrushSize={setBrushSize} 
              size={size} 
              setSize={setSize} 
              movement={movement} 
              setMovement={setMovement} 
              diet={diet} 
              setDiet={setDiet} 
              handleRelease={handleRelease} 
              drawing={drawing} 
              isBaking={isBaking} 
            />
          </>
        )}

      </div>
    </div>
  )
}
