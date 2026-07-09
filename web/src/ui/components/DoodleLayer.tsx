import { useState } from 'react';

export function DoodleLayer() {
  const [frightened, setFrightened] = useState<Record<number, boolean>>({});

  const handlePokeDoodle = (id: number) => {
    setFrightened(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="doodle-layer">
      {/* Little Crawler Bug */}
      <svg onClick={() => handlePokeDoodle(1)} className={`doodle doodle-bug ${frightened[1] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#FF6B9E" strokeWidth="5" strokeLinecap="round">
        <ellipse cx="50" cy="50" rx="20" ry="30" fill="#FFF6E5" />
        <path d="M30,40 L15,30 M30,50 L10,50 M30,60 L15,70" />
        <path d="M70,40 L85,30 M70,50 L90,50 M70,60 L85,70" />
        <circle cx="42" cy="40" r="4" fill="#4A3B32" stroke="none"/>
        <circle cx="58" cy="40" r="4" fill="#4A3B32" stroke="none"/>
      </svg>

      {/* Cute Slime/Blob */}
      <svg onClick={() => handlePokeDoodle(2)} className={`doodle doodle-blob ${frightened[2] ? 'run-away-right' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#00D8A1" strokeWidth="5" strokeLinecap="round">
        <path d="M50,80 Q20,80 20,55 Q20,20 50,20 Q80,20 80,55 Q80,80 50,80 Z" fill="#FFF6E5" />
        <circle cx="35" cy="50" r="5" fill="#4A3B32" stroke="none" />
        <circle cx="65" cy="50" r="5" fill="#4A3B32" stroke="none" />
        <path d="M45,60 Q50,65 55,60" />
      </svg>

      {/* Flying Creature */}
      <svg onClick={() => handlePokeDoodle(3)} className={`doodle doodle-fly ${frightened[3] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#36C5F0" strokeWidth="5" strokeLinecap="round">
        <circle cx="50" cy="50" r="15" fill="#FFF6E5" />
        <path d="M35,40 Q20,20 10,40 Q20,50 35,50" fill="#FFF6E5" />
        <path d="M65,40 Q80,20 90,40 Q80,50 65,50" fill="#FFF6E5" />
        <circle cx="45" cy="48" r="3" fill="#4A3B32" stroke="none" />
        <circle cx="55" cy="48" r="3" fill="#4A3B32" stroke="none" />
      </svg>
      
      {/* Right Margin Crawler */}
      <svg onClick={() => handlePokeDoodle(4)} className={`doodle doodle-crawler ${frightened[4] ? 'run-away-right' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#FFC837" strokeWidth="5" strokeLinecap="round">
        <path d="M20,50 Q50,20 80,50 Q50,80 20,50" fill="#FFF6E5" />
        <path d="M30,50 L30,75 M50,55 L50,80 M70,50 L70,75" />
        <circle cx="65" cy="45" r="4" fill="#4A3B32" stroke="none" />
      </svg>

      {/* Star */}
      <svg onClick={() => handlePokeDoodle(5)} className={`doodle doodle-star ${frightened[5] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#00D8A1" strokeWidth="5" strokeLinecap="round">
        <path d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z" fill="#FFF6E5" />
        <circle cx="40" cy="55" r="4" fill="#4A3B32" stroke="none" />
        <circle cx="60" cy="55" r="4" fill="#4A3B32" stroke="none" />
      </svg>

      {/* Snake */}
      <svg onClick={() => handlePokeDoodle(6)} className={`doodle doodle-snake ${frightened[6] ? 'run-away' : ''}`} viewBox="0 0 100 100" fill="none" stroke="#FF6B9E" strokeWidth="5" strokeLinecap="round">
        <path d="M50,10 Q20,30 50,50 T50,90" fill="none" />
        <circle cx="50" cy="90" r="10" fill="#FFF6E5" />
        <circle cx="45" cy="92" r="3" fill="#4A3B32" stroke="none" />
        <circle cx="55" cy="92" r="3" fill="#4A3B32" stroke="none" />
      </svg>
    </div>
  );
}
