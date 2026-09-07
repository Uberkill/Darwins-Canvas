// removed React
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DoodleLayer } from './DoodleLayer';

describe('DoodleLayer', () => {
  it('renders all doodles', () => {
    const { container } = render(<DoodleLayer />);
    const svgElements = container.querySelectorAll('svg.doodle');
    expect(svgElements.length).toBe(6);
  });

  it('adds run-away classes when poked', () => {
    const { container } = render(<DoodleLayer />);
    
    const bug = container.querySelector('.doodle-bug');
    const blob = container.querySelector('.doodle-blob');
    const fly = container.querySelector('.doodle-fly');
    const crawler = container.querySelector('.doodle-crawler');
    const star = container.querySelector('.doodle-star');
    const snake = container.querySelector('.doodle-snake');

    // Click bug
    fireEvent.click(bug!);
    expect(bug).toHaveClass('run-away');
    
    // Click blob
    fireEvent.click(blob!);
    expect(blob).toHaveClass('run-away-right');

    // Click fly
    fireEvent.click(fly!);
    expect(fly).toHaveClass('run-away');

    // Click crawler
    fireEvent.click(crawler!);
    expect(crawler).toHaveClass('run-away-right');

    // Click star
    fireEvent.click(star!);
    expect(star).toHaveClass('run-away');

    // Click snake
    fireEvent.click(snake!);
    expect(snake).toHaveClass('run-away');
  });
});
