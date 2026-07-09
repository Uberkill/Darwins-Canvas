import React, { useEffect, useState } from 'react';
import { getCollectionBlob } from '../collectionDB';

interface Props {
  id: string;
}

export const CatalogThumbnail: React.FC<Props> = ({ id }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    getCollectionBlob(id).then(blob => {
      if (!isMounted || !blob) return;
      
      // Use bakedSprites for decals, fallback to base drawing
      const src = blob.bakedSprites?.IDLE || blob.drawingData;
      setImgSrc(src);
    }).catch(err => {
      console.error('Failed to load thumbnail:', err);
    });

    return () => { isMounted = false; };
  }, [id]);

  if (!imgSrc) {
    return (
      <div className="catalog-thumbnail-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt="Thumbnail" 
      className="catalog-thumbnail-img" 
      style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', backgroundColor: 'white', borderRadius: '8px', border: '3px solid var(--color-text)' }}
    />
  );
};
