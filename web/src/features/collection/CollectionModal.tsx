import React, { useEffect, useState } from 'react';
import { X, Trash2, Download } from 'lucide-react';
import { useCollectionStore } from './useCollectionStore';
import { getCollectionBlob } from './collectionDB';
import type { CollectionBlob, CollectionMeta } from './collectionDB';
import { useEngineStore } from '../../store/useEngineStore';
import { useUIStore } from '../../store/useUIStore';
import { audio } from '../../engine/audioEngine';
import './CollectionModal.css';

// Components
import { EmptyState } from './components/EmptyState';
import { CollectionList } from './components/CollectionList';
import { TradingCard } from './components/TradingCard';
import { CreatureStatsBadges } from './components/CreatureStatsBadges';
import { CreatureLoreCard } from './components/CreatureLoreCard';
import { Confetti } from './components/Confetti';

export const CollectionModal: React.FC = () => {
  const { isOpen, metadata, selectedId, closeCollection, selectCreature, removeCreature } = useCollectionStore();
  const requestConfirm = useUIStore(s => s.requestConfirm);
  const [blob, setBlob] = useState<CollectionBlob | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (selectedId) {
      let isMounted = true;
      getCollectionBlob(selectedId).then((b: CollectionBlob | null) => {
        if (isMounted) setBlob(b);
      });
      return () => { isMounted = false; };
    } else {
      setBlob(null);
    }
  }, [selectedId]);

  if (!isOpen) return null;

  const selectedMeta = metadata.find((m: CollectionMeta) => m.id === selectedId);

  const handleSpawn = () => {
    if (!selectedMeta || !blob) return;
    
    useEngineStore.getState().queueCreature({
      name: selectedMeta.name,
      diet: selectedMeta.diet,
      movement: selectedMeta.movement,
      size: selectedMeta.size,
      drawingData: blob.drawingData,
      decals: blob.decals,
      bakedSprites: blob.bakedSprites
    });

    audio.playUIPop();
    setShowConfetti(true);
    
    setTimeout(() => {
      setShowConfetti(false);
      closeCollection();
    }, 1500);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId) return;
    requestConfirm('Delete this creature from your collection?', () => {
      removeCreature(selectedId);
      audio.playUIPop();
    });
  };

  return (
    <div className="collection-modal-overlay">
      <div className="collection-modal-header">
        <h1 className="collection-modal-title">Darwinpedia</h1>
        <button className="collection-close-btn" onClick={() => { audio.playUIClick(); closeCollection(); }}>
          <X size={32} strokeWidth={3} />
        </button>
      </div>

      <div className="collection-modal-content">
        
        {/* Top Area (Image & Text) */}
        <div className="collection-top-area">
          {/* Left Half (Hero) */}
          <div className="collection-hero-pane">
            {selectedMeta && blob ? (
              <>
                <TradingCard diet={selectedMeta.diet}>
                  <img src={blob.bakedSprites?.IDLE || blob.drawingData} alt={selectedMeta.name} />
                </TradingCard>
                
                <h2 className="collection-card-title">{selectedMeta.name}</h2>
                
                <div className="collection-card-actions" style={{ position: 'relative' }}>
                  <button className="collection-delete-btn" onClick={handleRemove} title="Delete from Collection">
                    <Trash2 size={28} strokeWidth={3} />
                  </button>
                  <button className="collection-spawn-btn" onClick={handleSpawn} disabled={showConfetti}>
                    {showConfetti && <Confetti />}
                    <Download size={28} strokeWidth={3} style={{ marginRight: 8 }} />
                    Spawn
                  </button>
                </div>
              </>
            ) : (
              <div className="collection-empty-left">
                Select a creature from the catalog to view its details.
              </div>
            )}
          </div>

          {/* Right Half (Details) */}
          <div className="collection-details-pane">
            {selectedMeta && blob && (
              <>
                <CreatureStatsBadges 
                  diet={selectedMeta.diet} 
                  movement={selectedMeta.movement} 
                  size={selectedMeta.size} 
                />
                
                <CreatureLoreCard 
                  id={selectedMeta.id}
                  loreProfile={selectedMeta.loreProfile} 
                  userNotes={selectedMeta.userNotes}
                  kills={selectedMeta.kills} 
                  foodEaten={selectedMeta.foodEaten} 
                />
              </>
            )}
          </div>
        </div>

        {/* Bottom Area (Catalog) */}
        <div className="collection-catalog-pane">
          {metadata.length === 0 ? (
            <EmptyState />
          ) : (
            <CollectionList 
              metadata={metadata} 
              selectedId={selectedId} 
              onSelect={selectCreature} 
            />
          )}
        </div>

      </div>
    </div>
  );
};
