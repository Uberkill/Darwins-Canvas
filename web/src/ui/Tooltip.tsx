import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ children, content, position = 'top', className = '' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (position === 'top') {
      setCoords({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    } else {
      setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }
  };

  useEffect(() => {
    if (show) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, position]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ display: 'inherit', alignItems: 'inherit', justifyContent: 'inherit', flexDirection: 'inherit', width: '100%', height: '100%' }}
    >
      {children}
      {show && typeof document !== 'undefined' && createPortal(
        <div
          className={`decal-tooltip tooltip-${position} ${className}`}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            bottom: 'auto',
            right: 'auto',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: 1, // force visible since hover state is managed by React
            visibility: 'visible',
            transform: position === 'top' ? 'translate(-50%, -100%) scale(1)' : 'translate(-50%, 0) scale(1)'
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}
