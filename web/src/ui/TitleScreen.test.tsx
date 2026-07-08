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

describe('TitleScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUIStore.setState({ isOnboardingOpen: false })
  })

  it('renders the game title', () => {
    render(<TitleScreen onPlay={() => {}} />)
    expect(screen.getByText("Darwin's Canvas")).toBeInTheDocument()
  })

  it('shows Play button when there are no saves and opens onboarding on click', async () => {
    render(<TitleScreen onPlay={() => {}} />)
    
    // We expect the frictionless Play button
    const playBtn = await screen.findByText('Play')
    expect(playBtn).toBeInTheDocument()
    
    // Clicking it should trigger new game logic which opens onboarding
    await act(async () => {
      fireEvent.click(playBtn)
    })
    
    // Check Zustand store to ensure onboarding was triggered
    expect(useUIStore.getState().isOnboardingOpen).toBe(true)
  })
})
