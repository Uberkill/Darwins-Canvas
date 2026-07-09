import React from 'react';
import type { LoreProfile } from '../../../utils/loreGenerator';
import { Flame, Zap, Shield, Dna, Activity } from 'lucide-react';
import { updateUserNotes } from '../collectionDB';

interface Props {
  id: string;
  loreProfile: LoreProfile | undefined;
  userNotes: string | undefined;
  kills: number | undefined;
  foodEaten: number | undefined;
}

const getInsightIcon = (iconName: LoreProfile['insightIcon']) => {
  switch (iconName) {
    case 'Flame': return <Flame size={32} color="#e74c3c" />;
    case 'Zap': return <Zap size={32} color="#f1c40f" />;
    case 'Shield': return <Shield size={32} color="#3498db" />;
    case 'Dna': return <Dna size={32} color="#9b59b6" />;
    case 'Activity': return <Activity size={32} color="#2ecc71" />;
    default: return <Dna size={32} color="#9b59b6" />;
  }
};

export const CreatureLoreCard: React.FC<Props> = ({ id, loreProfile, userNotes, kills, foodEaten }) => {
  const safeKills = kills || 0;
  const safeFood = foodEaten || 0;

  const [notes, setNotes] = React.useState(userNotes || '');

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleNotesBlur = () => {
    updateUserNotes(id, notes).catch(console.error);
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      marginTop: '24px'
    }}>
      
      {/* Insight Badge (Educational) */}
      {loreProfile && (
        <div style={{
          background: 'var(--color-bg-base)',
          border: '4px solid var(--color-text)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '50%',
            padding: '8px',
            border: '2px solid var(--color-text)'
          }}>
            {getInsightIcon(loreProfile.insightIcon)}
          </div>
          <div>
            <div style={{ fontWeight: 900, color: 'var(--color-text)', fontSize: '1.1rem' }}>
              {loreProfile.insightTitle}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.2, marginTop: '4px' }}>
              {loreProfile.insightText}
            </div>
          </div>
        </div>
      )}

      {/* Field Notes (Fun Story) */}
      <div style={{
        background: 'white',
        border: '4px solid var(--color-text)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed #E2DDD5', paddingBottom: '8px', marginBottom: '8px' }}>
          <span style={{ fontWeight: 900, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>KILLS: <span style={{ color: 'var(--color-text)' }}>{safeKills}</span></span>
          <span style={{ fontWeight: 900, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>FOOD: <span style={{ color: 'var(--color-text)' }}>{safeFood}</span></span>
        </div>
        <div style={{
          fontStyle: 'italic',
          fontWeight: 700,
          color: 'var(--color-text)',
          fontSize: '0.9rem'
        }}>
          "{loreProfile ? loreProfile.fieldNotes : 'A mysterious ancient creature with unknown origins.'}"
        </div>
      </div>

      {/* Custom User Notes */}
      <div style={{
        background: 'white',
        border: '4px solid var(--color-text)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <div style={{ fontWeight: 900, color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '8px' }}>
          My Notes:
        </div>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          onBlur={handleNotesBlur}
          placeholder="Add your own research notes here..."
          style={{
            width: '100%',
            height: '60px',
            resize: 'none',
            border: '2px dashed var(--color-text-muted)',
            borderRadius: '8px',
            padding: '8px',
            fontFamily: 'inherit',
            fontWeight: 600,
            color: 'var(--color-text)',
            background: 'var(--color-bg-base)',
            outline: 'none'
          }}
        />
      </div>

    </div>
  );
};
