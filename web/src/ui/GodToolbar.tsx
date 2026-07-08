import React from 'react'
import { MousePointer2, Zap, Heart, Leaf, Magnet, Hand } from 'lucide-react'
import { useStore } from '../store/useStore'
import { audio } from '../engine/audioEngine'
import type { GodTool } from '../types'
import './GodToolbar.css'

const TOOLS: { id: GodTool; icon: React.ReactNode; tooltip: string }[] = [
  { id: 'POINTER', icon: <MousePointer2 size={24} />, tooltip: 'Pointer' },
  { id: 'GRAB', icon: <Hand size={24} />, tooltip: 'Grab (Drag & Drop)' },
  { id: 'SMITE', icon: <Zap size={24} />, tooltip: 'Smite (Delete)' },
  { id: 'HEAL', icon: <Heart size={24} />, tooltip: 'Heal (Restore)' },
  { id: 'FEED', icon: <Leaf size={24} />, tooltip: 'Feed (Spawn Plant)' },
  { id: 'LURE', icon: <Magnet size={24} />, tooltip: 'Lure (Attract All)' },
]

export function GodToolbar() {
  const activeTool = useStore((s) => s.activeTool)
  const setActiveTool = useStore((s) => s.setActiveTool)
  const clearQueue = useStore((s) => s.clearQueue)

  return (
    <div 
      className="god-toolbar"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`god-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => {
            audio.playUIClick()
            setActiveTool(tool.id)
            clearQueue()
          }}
        >
          {tool.icon}
          <span className="god-tooltip">{tool.tooltip}</span>
        </button>
      ))}
    </div>
  )
}
