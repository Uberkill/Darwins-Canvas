import { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Play, FastForward, Zap } from 'lucide-react'
import { worldRef } from '../engine/worldRef'
import { audio } from '../engine/audioEngine'
import { DAY_NIGHT_CYCLE_DURATION } from '../constants'
import './TimeControls.css'
import { useEngineStore } from '../store/useEngineStore';

export function TimeControls() {
  const timeScale = useEngineStore((s) => s.timeScale)
  const setTimeScale = useEngineStore((s) => s.setTimeScale)

  const [day, setDay] = useState(1)
  const [isDayTime, setIsDayTime] = useState(true)

  const rafRef = useRef<number>(0)

  // Sync HUD with game time every frame
  useEffect(() => {
    function tick() {
      if (worldRef.current) {
        // Calculate days passed (starts at Day 1)
        const currentDay = Math.floor(worldRef.current.totalTime / DAY_NIGHT_CYCLE_DURATION) + 1
        
        // timeOfDay goes from 0 to 1. 0.0-0.5 is Day, 0.5-1.0 is Night (approximately, visual effects fade in/out around 0.6 to 0.9)
        // Let's call it Day when timeOfDay < 0.6
        const currentIsDay = worldRef.current.timeOfDay < 0.6

        // Only update state if it changed to avoid React render spam
        setDay((prev) => (prev !== currentDay ? currentDay : prev))
        setIsDayTime((prev) => (prev !== currentIsDay ? currentIsDay : prev))
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div className="time-controls-media">
      <div className={`time-icon-media ${isDayTime ? 'day' : 'night'}`}>
        {isDayTime ? <Sun size={20} /> : <Moon size={20} />}
      </div>
      <div className="badge-day-media">
        Day {day}
      </div>
      <div className="media-divider"></div>
      
      <button 
        className={`media-btn ${timeScale === 1 ? 'active' : 'inactive'}`}
        onClick={() => {
          audio.playUIClick()
          setTimeScale(1)
        }}
        aria-label="Speed 1x"
      >
        <Play size={20} fill="currentColor" />
      </button>
      <button 
        className={`media-btn ${timeScale === 2 ? 'active' : 'inactive'}`}
        onClick={() => {
          audio.playUIClick()
          setTimeScale(2)
        }}
        aria-label="Speed 2x"
      >
        <FastForward size={20} fill="currentColor" />
      </button>
      <button 
        className={`media-btn ${timeScale === 10 ? 'active' : 'inactive'}`}
        onClick={() => {
          audio.playUIClick()
          setTimeScale(10)
        }}
        aria-label="Speed 10x"
      >
        <Zap size={20} fill="currentColor" />
      </button>
    </div>
  )
}
