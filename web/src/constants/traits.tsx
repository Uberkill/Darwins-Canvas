import React from 'react'
import { SignalLow, SignalMedium, SignalHigh, Snail, Rabbit, FastForward, Leaf, Drumstick, Bone } from 'lucide-react'
import type { CreatureSize, MovementType, DietType } from '../types'

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
