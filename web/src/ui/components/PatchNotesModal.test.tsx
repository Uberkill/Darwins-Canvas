import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PatchNotesModal } from './PatchNotesModal';
import { GAME_VERSION } from '../../constants';

// Mock the data
vi.mock('../../data/patchNotes', () => ({
  PATCH_NOTES: [
    { id: '1', type: 'FEATURE', title: 'New Feature', description: 'Added something cool' },
    { id: '2', type: 'BALANCE', title: 'Balance Tweak', description: 'Nerfed carnivores' }
  ],
  getIconForType: vi.fn(() => ({ icon: () => <svg data-testid="mock-icon" />, color: '#000' }))
}));

describe('PatchNotesModal', () => {
  it('renders correctly', () => {
    const onClose = vi.fn();
    render(<PatchNotesModal onClose={onClose} />);
    
    expect(screen.getByText('Patch Notes')).toBeInTheDocument();
    expect(screen.getByText(`Current Version: ${GAME_VERSION}`)).toBeInTheDocument();
    
    expect(screen.getByText('New Feature')).toBeInTheDocument();
    expect(screen.getByText('Added something cool')).toBeInTheDocument();
    expect(screen.getByText('Balance Tweak')).toBeInTheDocument();
    expect(screen.getByText('Nerfed carnivores')).toBeInTheDocument();
  });

  it('calls onClose when button is clicked', () => {
    const onClose = vi.fn();
    render(<PatchNotesModal onClose={onClose} />);
    
    fireEvent.click(screen.getByText('Awesome!'));
    expect(onClose).toHaveBeenCalled();
  });
});
