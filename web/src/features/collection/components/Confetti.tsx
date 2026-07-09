import React, { useEffect, useState } from 'react';
import './Confetti.css';

export const Confetti: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    setShouldRender(true);
    const timer = setTimeout(() => setShouldRender(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <div 
          key={i} 
          className={`confetti-particle confetti-color-${i % 4}`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.2}s`,
            animationDuration: `${0.8 + Math.random()}s`
          }}
        />
      ))}
    </div>
  );
};
