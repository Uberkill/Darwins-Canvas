import React, { useRef, useState } from 'react';
import type { DietType } from '../../../types';
import './TradingCard.css';

interface Props {
  diet: DietType | string;
  children: React.ReactNode;
}

export const TradingCard: React.FC<Props> = ({ diet, children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const getBackgroundColor = () => {
    switch(diet) {
      case 'CARNIVORE': return '#ffccd5'; // pastel red
      case 'HERBIVORE': return '#d8f3dc'; // pastel green
      case 'OMNIVORE': return '#fcf6bd'; // pastel yellow
      default: return '#e9ecef';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-10 to 10 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setRotate({ x: rotateX, y: rotateY });
    
    // Glare effect follows mouse
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlare({ x: glareX, y: glareY, opacity: 0.6 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare({ ...glare, opacity: 0 });
  };

  return (
    <div className="trading-card-perspective">
      <div 
        ref={cardRef}
        className="trading-card-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: getBackgroundColor(),
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: rotate.x === 0 && rotate.y === 0 ? 'transform 0.5s ease-out' : 'none'
        }}
      >
        <div 
          className="trading-card-glare"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
            opacity: glare.opacity
          }}
        />
        {children}
      </div>
    </div>
  );
};
