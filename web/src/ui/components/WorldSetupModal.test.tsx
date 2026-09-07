
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldSetupModal } from './WorldSetupModal';
import { useUIStore } from '../../store/useUIStore';

// Mocks
vi.mock('../../engine/worldRef', () => ({
  worldRef: { current: {} },
  TERRAIN_CELL_SIZE: 10
}));

vi.mock('../../constants', () => ({
  getWorldWidth: () => 1000,
  getWorldHeight: () => 1000
}));

vi.mock('../../store/useUIStore', () => ({
  useUIStore: vi.fn()
}));

const mockGenerateProcedural = vi.fn();
const mockClearCanvas = vi.fn();
const mockCancelGeneration = vi.fn();
const mockDraftTerrainRef = { current: new Uint8Array(100) };

vi.mock('../../hooks/useTerrainPainter', () => ({
  useTerrainPainter: () => ({
    canvasRef: { current: null },
    cursorRef: { current: null },
    isDirtyRef: { current: false },
    isGenerating: false,
    generateProcedural: mockGenerateProcedural,
    cancelGeneration: mockCancelGeneration,
    clearCanvas: mockClearCanvas,
    draftTerrainRef: mockDraftTerrainRef,
    handlers: {}
  })
}));

describe('WorldSetupModal', () => {
  const mockOnStart = vi.fn();
  const mockOnClose = vi.fn();
  const mockRequestConfirm = vi.fn((_msg, cb) => cb());

  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return mockRequestConfirm;
      }
      return {};
    });
  });

  it('renders basic UI', () => {
    render(<WorldSetupModal onStart={mockOnStart} onClose={mockOnClose} />);
    expect(screen.getByText('World Setup')).toBeInTheDocument();
    expect(screen.getByText('Pangaea')).toBeInTheDocument();
  });

  it('calls onStart with correct parameters', () => {
    render(<WorldSetupModal onStart={mockOnStart} onClose={mockOnClose} />);
    
    // Type a name
    fireEvent.change(screen.getByPlaceholderText('My Ecosystem'), { target: { value: 'Test Map' } });
    
    fireEvent.click(screen.getByText('Start Simulation'));
    expect(mockOnStart).toHaveBeenCalledWith(2, 'pangaea', 'Test Map');
  });

  it('calls onClose and cancels generation', () => {
    const { container } = render(<WorldSetupModal onStart={mockOnStart} onClose={mockOnClose} />);
    
    const closeBtn = container.querySelector('.close-modal-btn');
    fireEvent.click(closeBtn!);
    
    expect(mockCancelGeneration).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles map type selection', () => {
    render(<WorldSetupModal onStart={mockOnStart} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Great Lakes'));
    expect(mockGenerateProcedural).toHaveBeenCalledWith('great-lakes', true);
  });

  it('handles map scale selection', () => {
    render(<WorldSetupModal onStart={mockOnStart} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Large'));
    // Generate should be called again due to multiplier change
    expect(mockGenerateProcedural).toHaveBeenCalled();
  });

  it('handles brush selections', () => {
    render(<WorldSetupModal onStart={mockOnStart} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Water'));
    fireEvent.click(screen.getByText('Dirt'));
    fireEvent.click(screen.getByText('Grass'));
    fireEvent.click(screen.getByText('Rock'));
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: 10 } });
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
