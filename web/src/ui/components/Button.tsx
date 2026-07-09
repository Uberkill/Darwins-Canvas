import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'massive' | 'icon' | 'fab';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, icon, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`ds-btn ds-btn-${variant} ${className}`}
        {...props}
      >
        {icon && <span className="ds-btn-icon">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
