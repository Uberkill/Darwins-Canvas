import React from 'react';
import { Drumstick, Leaf, Apple, Bug, Rabbit, Footprints, Signal, HelpCircle } from 'lucide-react';
import type { DietType, MovementType, CreatureSize } from '../../../types';

interface Props {
  diet: DietType | string;
  movement: MovementType | string;
  size: CreatureSize | string;
}

export const CreatureStatsBadges: React.FC<Props> = ({ diet, movement, size }) => {
  const getDietIcon = () => {
    switch(diet) {
      case 'CARNIVORE': return <Drumstick size={24} strokeWidth={3} color="#e74c3c" />;
      case 'HERBIVORE': return <Leaf size={24} strokeWidth={3} color="#2ecc71" />;
      case 'OMNIVORE': return <Apple size={24} strokeWidth={3} color="#f1c40f" />;
      default: return <HelpCircle size={24} strokeWidth={3} color="#95a5a6" />;
    }
  };

  const getMovementIcon = () => {
    switch(movement) {
      case 'CRAWLER': return <Bug size={24} strokeWidth={3} color="#9b59b6" />;
      case 'HOPPER': return <Rabbit size={24} strokeWidth={3} color="#3498db" />;
      case 'PACER': return <Footprints size={24} strokeWidth={3} color="#e67e22" />;
      default: return <HelpCircle size={24} strokeWidth={3} color="#95a5a6" />;
    }
  };

  const getSizeIcon = () => {
    switch(size) {
      case 'SMALL':
      case 'MEDIUM':
      case 'LARGE':
        return <Signal size={24} strokeWidth={3} color="#34495e" />;
      default:
        return <HelpCircle size={24} strokeWidth={3} color="#95a5a6" />;
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', alignSelf: 'center', width: 'fit-content', background: '#E2DDD5', padding: '5px 20px', borderRadius: '9999px', border: '3px solid var(--color-text)' }}>
      {getDietIcon()}
      {getMovementIcon()}
      {getSizeIcon()}
    </div>
  );
};
