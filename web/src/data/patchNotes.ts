import { Bug, Zap, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PatchNoteType = 'feature' | 'bugfix' | 'performance';

export interface PatchNote {
  id: string;
  type: PatchNoteType;
  title: string;
  description: string;
}

export const getIconForType = (type: PatchNoteType): { icon: LucideIcon, color: string } => {
  switch (type) {
    case 'feature':
      return { icon: FileText, color: '#56B6C2' };
    case 'bugfix':
      return { icon: Bug, color: '#E06C75' };
    case 'performance':
      return { icon: Zap, color: '#facc15' };
  }
};

export const PATCH_NOTES: PatchNote[] = [
  {
    id: 'super-fast-3x',
    type: 'performance',
    title: 'Super Fast 3x Speed',
    description: 'We fixed a massive lag issue that happened when running the game at 2x and 3x speeds with lots of creatures. The game now runs incredibly smooth even during huge population booms.'
  },
  {
    id: 'perfect-ui-scaling',
    type: 'bugfix',
    title: 'Perfect UI Scaling',
    description: 'Fixed an issue where menus and stats panels would break out of the screen when scaling up the UI. Everything will now perfectly fit your screen no matter how large you make it.'
  },
  {
    id: 'creature-lab-cursor',
    type: 'bugfix',
    title: 'Creature Lab Cursor Fix',
    description: 'Squashed an annoying bug where the drawing brush would drift away from your mouse when the UI scale was increased. Your brush is now perfectly accurate again!'
  },
  {
    id: 'zero-hiccup-cleanup',
    type: 'performance',
    title: 'Zero Hiccup Cleanup',
    description: 'Changed how the engine cleans up dead plants and meat. The game no longer pauses or stutters when a lot of things happen at once on the screen.'
  }
];
