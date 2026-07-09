import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom';
  align?: 'center' | 'left' | 'right';
  variant?: 'decal' | 'god';
  className?: string;
}

export function Tooltip({ children, content, position = 'top', align = 'center', variant = 'decal', className = '' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let leftPos = rect.left + rect.width / 2;
    if (align === 'left') leftPos = rect.left;
    if (align === 'right') leftPos = rect.right;

    if (position === 'top') {
      setCoords({ top: rect.top - 8, left: leftPos });
    } else {
      setCoords({ top: rect.bottom + 8, left: leftPos });
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
  }, [show, position, align]);

  const getTransform = () => {
    let x = '-50%';
    if (align === 'left') x = '0%';
    if (align === 'right') x = '-100%';
    return position === 'top' ? `translate(${x}, -100%) scale(1)` : `translate(${x}, 0) scale(1)`;
  };

  const variantClass = variant === 'god' ? 'god-tooltip-fixed' : 'decal-tooltip';

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
          className={`${variantClass} tooltip-${position} ${className}`}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            bottom: 'auto',
            right: 'auto',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: 1, 
            visibility: 'visible',
            transform: getTransform()
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}
