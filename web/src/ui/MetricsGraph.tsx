import { useMemo } from 'react';
import type { EcosystemDataPoint } from '../types';

export interface GraphLine {
  key: keyof EcosystemDataPoint;
  className: string;
}

interface Props {
  history: EcosystemDataPoint[];
  lines: GraphLine[];
}

export function MetricsGraph({ history, lines }: Props) {
  const { points, maxY } = useMemo(() => {
    let maxFound = 10;
    for (const h of history) {
      for (const line of lines) {
        maxFound = Math.max(maxFound, (h[line.key] as number) || 0);
      }
    }
    const maxY = Math.ceil(maxFound * 1.2); 

    const width = 1000;
    const height = 500;
    const xStep = history.length > 1 ? width / (history.length - 1) : 0;

    const pointsObj: Record<string, string> = {};
    for (const line of lines) pointsObj[line.key] = '';

    history.forEach((h, i) => {
      const x = i * xStep;
      for (const line of lines) {
        const val = (h[line.key] as number) || 0;
        const y = height - (val / maxY) * height;
        pointsObj[line.key] += `${x.toFixed(1)},${y.toFixed(1)} `;
      }
    });

    return { points: pointsObj, maxY };
  }, [history, lines]);

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
        {lines.map((line, i) => (
          <polyline key={i} points={points[line.key].trim()} className={line.className} />
        ))}
      </svg>
    </div>
  );
}
