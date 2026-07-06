import type { CreatureSize, MovementType, DietType } from '../types'
import { SignalLow, SignalMedium, SignalHigh, Snail, Rabbit, FastForward, Leaf, Bone, Drumstick } from 'lucide-react'
import React from 'react'

// ─── Size picker ──────────────────────────────────────────────────────────────

interface TraitPickerProps<T extends string> {
  label: string
  options: { value: T; label: string; icon: React.ReactNode }[]
  value: T
  onChange: (v: T) => void
}

export function TraitPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: TraitPickerProps<T>) {
  return (
    <div>
      <div className="section-title">{label}</div>
      <div className="pill-group" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            id={`trait-${label.toLowerCase().replace(/\s/g, '-')}-${opt.value.toLowerCase()}`}
            className={`pill${value === opt.value ? ' selected' : ''}`}
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            <span aria-hidden="true">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Preset option arrays (imported by CreationPanel) ─────────────────────────

export const SIZE_OPTIONS: { value: CreatureSize; label: string; icon: React.ReactNode }[] = [
  { value: 'SMALL',  label: 'Tiny',    icon: <SignalLow size={16} /> },
  { value: 'MEDIUM', label: 'Medium',  icon: <SignalMedium size={16} /> },
  { value: 'LARGE',  label: 'Mighty',  icon: <SignalHigh size={16} /> },
]

export const MOVEMENT_OPTIONS: { value: MovementType; label: string; icon: React.ReactNode }[] = [
  { value: 'CRAWLER', label: 'Crawler', icon: <Snail size={16} /> },
  { value: 'HOPPER',  label: 'Hopper',  icon: <Rabbit size={16} /> },
  { value: 'PACER',   label: 'Pacer',   icon: <FastForward size={16} /> },
]

export const DIET_OPTIONS: { value: DietType; label: string; icon: React.ReactNode }[] = [
  { value: 'HERBIVORE', label: 'Herbivore', icon: <Leaf size={16} /> },
  { value: 'OMNIVORE',  label: 'Omnivore',  icon: <Drumstick size={16} /> },
  { value: 'CARNIVORE', label: 'Carnivore', icon: <Bone size={16} /> },
]
