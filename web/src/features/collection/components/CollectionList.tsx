import React from 'react';
import type { CollectionMeta } from '../collectionDB';
import { audio } from '../../../engine/audioEngine';
import { CatalogThumbnail } from './CatalogThumbnail';

interface Props {
  metadata: CollectionMeta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const CollectionList: React.FC<Props> = ({ metadata, selectedId, onSelect }) => {
  return (
    <div className="collection-catalog-grid">
      {metadata.map(item => {
        // Fallback to chronological index if catalogId is missing from older saves
        const displayId = item.catalogId ?? 0;
        const formattedId = `#${displayId.toString().padStart(3, '0')}`;

        return (
          <div 
            key={item.id} 
            className={`collection-catalog-item ${selectedId === item.id ? 'active' : ''}`}
            onClick={() => { audio.playUIClick(); onSelect(item.id); }}
          >
            <span className="collection-catalog-item-id">{formattedId}</span>
            <CatalogThumbnail id={item.id} />
            <h4 className="collection-catalog-item-name">{item.name}</h4>
          </div>
        );
      })}
    </div>
  );
};
