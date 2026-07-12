import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TitleScreen } from './TitleScreen'
import { useUIStore } from '../store/useUIStore';

// Mock the save system because it relies on localStorage/IndexedDB
vi.mock('../utils/saveSystem', () => ({
  listSaves: vi.fn().mockResolvedValue([]),
  deleteGame: vi.fn(),
  loadGame: vi.fn(),
}))

// Mock audio
vi.mock('../engine/audioEngine', () => ({
  audio: {
    startBGM: vi.fn(),
  }
}))

vi.stubGlobal('requestAnimationFrame', (cb: any) => setTimeout(cb, 0))

// Mock TerrainGenerator to resolve instantly
vi.mock('../utils/terrainGenerator', () => {
  return {
    TerrainGenerator: {
      generateAsync: vi.fn().mockResolvedValue(new Uint8Array(100)),
    }
  }
})

describe('TitleScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUIStore.setState({ isOnboardingOpen: false })
  })

  it('renders the game title', () => {
    render(<TitleScreen onPlay={() => {}} />)
    expect(screen.getByText("Darwin's Canvas")).toBeInTheDocument()
  })

  it.skip('shows Play button when there are no saves and opens onboarding on click', async () => {
    render(<TitleScreen onPlay={() => {}} />)
    
    // We expect the frictionless Play button
    const playBtn = await screen.findByText('Play')
    expect(playBtn).toBeInTheDocument()
    
    // Clicking it should trigger new game logic which opens onboarding
    await act(async () => {
      fireEvent.click(playBtn)
    })
    
    // Check that World Setup Modal opened
    expect(screen.getByText('World Setup')).toBeInTheDocument()

    // Click Start Simulation (button will be enabled because of the mock)
    const startBtn = screen.getByText('Start Simulation')
    
    await act(async () => {
      fireEvent.click(startBtn)
    })

    // Check Zustand store to ensure onboarding was triggered
    expect(useUIStore.getState().isOnboardingOpen).toBe(true)
  })
})
