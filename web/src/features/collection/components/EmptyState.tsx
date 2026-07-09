import React from 'react';
import { Search } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="collection-empty-catalog" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
      <Search size={64} color="var(--color-text-muted)" strokeWidth={3} />
      <p style={{ maxWidth: '300px', textAlign: 'center' }}>
        No creatures collected yet! Click on a creature in the terrarium and look for the Save icon to catch them!
      </p>
    </div>
  );
};
