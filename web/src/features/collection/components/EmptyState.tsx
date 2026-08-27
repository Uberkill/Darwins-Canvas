import React from 'react';
import { Search, Ghost } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="collection-empty-catalog" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ghost size={120} color="var(--color-text-muted)" strokeWidth={2} style={{ opacity: 0.3 }} />
        <Search size={48} color="var(--color-primary)" strokeWidth={3} style={{ position: 'absolute', bottom: -10, right: -10 }} />
      </div>
      <p style={{ maxWidth: '350px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
        Discover creatures to fill these pages!
      </p>
      <p style={{ maxWidth: '300px', textAlign: 'center', fontSize: '0.9rem', color: '#9A9289', margin: 0 }}>
        Click on a creature in the terrarium and look for the Save icon to catch them!
      </p>
    </div>
  );
};
