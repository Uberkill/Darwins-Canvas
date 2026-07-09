import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CreatureStatsBadges } from './CreatureStatsBadges';
import { CreatureLoreCard } from './CreatureLoreCard';

describe('Collection Components', () => {
  it('CreatureStatsBadges falls back to HelpCircle on invalid data', () => {
    const { container } = render(
      <CreatureStatsBadges diet="INVALID_DIET" movement="INVALID_MOVE" size="INVALID_SIZE" />
    );
    // HelpCircle uses the lucide-react class or SVG properties.
    // It should render 3 SVGs (since there are 3 badges)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(3);
    // Check that at least one of them has the color fallback we assigned for HelpCircle: #95a5a6
    // Actually all 3 should be #95a5a6
    svgs.forEach(svg => {
      expect(svg.getAttribute('color') || svg.getAttribute('stroke')).toBe('#95a5a6');
    });
  });

  it('CreatureLoreCard renders fallback for undefined lore', () => {
    const { getByText, getAllByText } = render(
      <CreatureLoreCard 
        id="test_id"
        loreProfile={{
          fieldNotes: 'test lore',
          insightTitle: 'test title',
          insightText: 'test text',
          insightIcon: 'Dna'
        }}
        userNotes="test notes"
        kills={undefined} 
        foodEaten={undefined} 
      />
    );
    expect(getByText(/"test lore"/)).toBeDefined();
    const zeroes = getAllByText('0', { selector: 'span span' });
    expect(zeroes.length).toBe(2);
  });
});
