
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SaveSlotsModal } from './SaveSlotsModal';
import type { SaveSlotMetadata } from '../../utils/saveSystem';

describe('SaveSlotsModal', () => {
  const mockSaves: Record<string, SaveSlotMetadata | null> = {
    slot_1: {
      name: 'Test Save',
      creatureCount: 10,
      lastSaved: 1600000000000,
    } as SaveSlotMetadata,
    slot_2: null,
    slot_3: null,
  };

  it('renders correctly in NEW mode', () => {
    const onPlay = vi.fn();
    const onDelete = vi.fn();
    render(<SaveSlotsModal mode="NEW" saves={mockSaves} onPlay={onPlay} onDelete={onDelete} />);
    
    expect(screen.getByText('Select a Slot to Overwrite')).toBeInTheDocument();
    expect(screen.getByText('Test Save')).toBeInTheDocument();
    expect(screen.getAllByText('New Ecosystem')).toHaveLength(2); // slot 2 and 3
  });

  it('renders correctly in LOAD mode', () => {
    const onPlay = vi.fn();
    const onDelete = vi.fn();
    render(<SaveSlotsModal mode="LOAD" saves={mockSaves} onPlay={onPlay} onDelete={onDelete} />);
    
    expect(screen.getByText('Select a Save to Load')).toBeInTheDocument();
    expect(screen.getAllByText('New Ecosystem')).toHaveLength(2);
  });

  it('calls onPlay when a filled slot is clicked', () => {
    const onPlay = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(<SaveSlotsModal mode="NEW" saves={mockSaves} onPlay={onPlay} onDelete={onDelete} />);
    
    const filledSlot = container.querySelector('.save-slot.filled');
    fireEvent.click(filledSlot!);
    
    expect(onPlay).toHaveBeenCalledWith('slot_1', true);
  });

  it('calls onPlay when an empty slot is clicked in NEW mode', () => {
    const onPlay = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(<SaveSlotsModal mode="NEW" saves={mockSaves} onPlay={onPlay} onDelete={onDelete} />);
    
    const emptySlots = container.querySelectorAll('.save-slot.empty');
    fireEvent.click(emptySlots[0]!);
    
    expect(onPlay).toHaveBeenCalledWith('slot_2', true);
  });

  it('does not call onPlay when an empty slot is clicked in LOAD mode', () => {
    const onPlay = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(<SaveSlotsModal mode="LOAD" saves={mockSaves} onPlay={onPlay} onDelete={onDelete} />);
    
    const emptySlots = container.querySelectorAll('.save-slot.empty');
    fireEvent.click(emptySlots[0]!);
    
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onPlay = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(<SaveSlotsModal mode="NEW" saves={mockSaves} onPlay={onPlay} onDelete={onDelete} />);
    
    const deleteBtn = container.querySelector('.delete-btn');
    fireEvent.click(deleteBtn!);
    
    expect(onDelete).toHaveBeenCalled();
  });
});
