import React from 'react';
import './Panel.css';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Panel({ children, className = '', ...props }: PanelProps) {
  return (
    <div className={`ds-panel ${className}`} {...props}>
      {children}
    </div>
  );
}
