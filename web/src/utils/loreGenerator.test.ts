import { describe, it, expect } from 'vitest';
import { generateLore } from './loreGenerator';

describe('loreGenerator', () => {
  it('generates correct lore for a veteran carnivore pacer', () => {
    const profile = generateLore({
      diet: 'CARNIVORE',
      movement: 'PACER',
      kills: 10,
      age: 250
    });
    expect(profile.fieldNotes).toContain('dominated the terrarium');
    expect(profile.fieldNotes).toContain('sprints across the landscape');
    expect(profile.fieldNotes).toContain('veteran');
  });

  it('handles negative age or missing data gracefully', () => {
    const profile = generateLore({
      diet: 'CARNIVORE',
      age: -5
    });
    expect(profile.fieldNotes).toContain('tragically perished');
  });
});
