import React from 'react';
import './Badge.css';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Badge({ children, icon, className = '', ...props }: BadgeProps) {
  return (
    <div className={`ds-badge ${className}`} {...props}>
      {icon && <span className="ds-badge-icon">{icon}</span>}
      {children}
    </div>
  );
}
