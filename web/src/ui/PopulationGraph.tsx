import { useMemo } from 'react';
import type { EcosystemDataPoint } from '../types';

interface Props {
  history: EcosystemDataPoint[];
}

export function PopulationGraph({ history }: Props) {
  const { points, maxY } = useMemo(() => {
    // 1. Find max Y
    let maxFound = 10; // minimum cap
    for (const h of history) {
      maxFound = Math.max(maxFound, h.carnivore, h.omnivore, h.herbivore, h.plant, h.meat);
    }
    const maxY = Math.ceil(maxFound * 1.2); // 20% padding

    // 2. Generate points for each line
    // SVG coordinate system: (0,0) is top-left.
    // We will use 0 to 1000 for X and Y, and let SVG viewBox scale it.
    const width = 1000;
    const height = 500;
    
    const carnivorePts: string[] = [];
    const omnivorePts: string[] = [];
    const herbivorePts: string[] = [];
    const plantPts: string[] = [];
    const meatPts: string[] = [];

    const xStep = history.length > 1 ? width / (history.length - 1) : 0;

    history.forEach((h, i) => {
      const x = i * xStep;
      // y is inverted
      const getPt = (val: number) => `${x.toFixed(1)},${(height - (val / maxY) * height).toFixed(1)}`;
      
      carnivorePts.push(getPt(h.carnivore));
      omnivorePts.push(getPt(h.omnivore));
      herbivorePts.push(getPt(h.herbivore));
      plantPts.push(getPt(h.plant));
      meatPts.push(getPt(h.meat));
    });

    return {
      points: {
        carnivore: carnivorePts.join(' '),
        omnivore: omnivorePts.join(' '),
        herbivore: herbivorePts.join(' '),
        plant: plantPts.join(' '),
        meat: meatPts.join(' '),
      },
      maxY
    };
  }, [history]);

  // If no history, render empty
  if (history.length === 0) {
    return <div className="graph-empty">Collecting data...</div>;
  }

  return (
    <div className="population-graph-container">
      <div className="graph-y-axis">
        <span>{maxY}</span>
        <span>{Math.floor(maxY / 2)}</span>
        <span>0</span>
      </div>
      <svg className="population-svg" viewBox="0 0 1000 500" preserveAspectRatio="none">
        <polyline points={points.plant} className="line-plant" />
        <polyline points={points.meat} className="line-meat" />
        <polyline points={points.herbivore} className="line-herbivore" />
        <polyline points={points.omnivore} className="line-omnivore" />
        <polyline points={points.carnivore} className="line-carnivore" />
      </svg>
    </div>
  );
}
