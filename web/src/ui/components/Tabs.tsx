import React from 'react';
import './Tabs.css';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, variant = 'horizontal', className = '' }: TabsProps) {
  return (
    <div className={`ds-tabs ds-tabs-${variant} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`ds-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span className="ds-tab-icon">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
