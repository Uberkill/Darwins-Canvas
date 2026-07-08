const DECAL_SVGS = {
  // ─── EYES ───────────────────────────────────────────────
  HERBIVORE_EYE: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="25" fill="#1A1513"/><circle cx="45" cy="45" r="5" fill="white"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="25" y1="50" x2="75" y2="50" stroke="#1A1513" stroke-width="12" stroke-linecap="round"/></svg>`,
  },
  CARNIVORE_EYE: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><ellipse cx="50" cy="50" rx="10" ry="30" fill="#1A1513"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="35" y1="50" x2="65" y2="50" stroke="#1A1513" stroke-width="12" stroke-linecap="round"/></svg>`,
  },
  INSECT_EYE: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="25" r="12" fill="#1A1513"/><circle cx="25" cy="65" r="12" fill="#1A1513"/><circle cx="75" cy="65" r="12" fill="#1A1513"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="40" y1="25" x2="60" y2="25" stroke="#1A1513" stroke-width="10" stroke-linecap="round"/><line x1="15" y1="65" x2="35" y2="65" stroke="#1A1513" stroke-width="10" stroke-linecap="round"/><line x1="65" y1="65" x2="85" y2="65" stroke="#1A1513" stroke-width="10" stroke-linecap="round"/></svg>`,
  },
  NOCTURNAL_EYE: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="#1A1513" stroke-width="12"/><circle cx="50" cy="50" r="8" fill="#1A1513"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 10 50 A 40 40 0 0 0 90 50" fill="none" stroke="#1A1513" stroke-width="12" stroke-linecap="round"/></svg>`,
  },
  AQUATIC_EYE: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 10 50 Q 50 20 90 50 Q 50 80 10 50" fill="none" stroke="#1A1513" stroke-width="8"/><circle cx="50" cy="50" r="15" fill="#1A1513"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="10" y1="50" x2="90" y2="50" stroke="#1A1513" stroke-width="12" stroke-linecap="round"/></svg>`,
  },

  // ─── MOUTHS ───────────────────────────────────────────────
  HERBIVORE_JAW: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="60" r="25" fill="none" stroke="#1A1513" stroke-width="12"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 25 50 Q 50 80 75 50" fill="none" stroke="#1A1513" stroke-width="12" stroke-linecap="round"/></svg>`,
  },
  CARNIVORE_JAW: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 15 30 L 30 50 L 50 30 L 70 50 L 85 30" fill="none" stroke="#1A1513" stroke-width="10" stroke-linejoin="round"/><path d="M 15 70 L 30 50 L 50 70 L 70 50 L 85 70" fill="none" stroke="#1A1513" stroke-width="10" stroke-linejoin="round"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 15 50 L 30 70 L 50 50 L 70 70 L 85 50" fill="none" stroke="#1A1513" stroke-width="10" stroke-linejoin="round"/></svg>`,
  },
  BEAK: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 20 50 L 80 50 L 50 10 Z" fill="none" stroke="#1A1513" stroke-width="10" stroke-linejoin="round"/><path d="M 20 60 L 80 60 L 50 90 Z" fill="none" stroke="#1A1513" stroke-width="10" stroke-linejoin="round"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 20 40 L 80 40 L 50 80 Z" fill="none" stroke="#1A1513" stroke-width="10" stroke-linejoin="round"/><line x1="20" y1="40" x2="80" y2="40" stroke="#1A1513" stroke-width="10" stroke-linecap="round"/></svg>`,
  },
  PROBOSCIS: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="50" y1="20" x2="50" y2="80" stroke="#1A1513" stroke-width="12" stroke-linecap="round"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M 50 20 L 50 70 Q 70 70 70 50" fill="none" stroke="#1A1513" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  BALEEN: {
    OPEN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="25" y="25" width="50" height="50" fill="none" stroke="#1A1513" stroke-width="10" rx="4"/><line x1="40" y1="25" x2="40" y2="75" stroke="#1A1513" stroke-width="8"/><line x1="60" y1="25" x2="60" y2="75" stroke="#1A1513" stroke-width="8"/></svg>`,
    CLOSED: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="25" y="40" width="50" height="20" fill="none" stroke="#1A1513" stroke-width="10" rx="4"/><line x1="40" y1="40" x2="40" y2="60" stroke="#1A1513" stroke-width="8"/><line x1="60" y1="40" x2="60" y2="60" stroke="#1A1513" stroke-width="8"/></svg>`,
  },
} as const;

export type DecalStyle = keyof typeof DECAL_SVGS;

export function getDecalDataUrl(style: DecalStyle, state: 'OPEN' | 'CLOSED'): string {
  const svgString = DECAL_SVGS[style][state] || DECAL_SVGS[style].OPEN;
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}
