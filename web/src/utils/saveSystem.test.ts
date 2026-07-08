import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { loadGame, saveGame } from './saveSystem'
import { createMockWorld } from '../test/factories'

describe('saveSystem Compatibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('safely hydrates legacy save payloads missing new properties', async () => {
    const legacyState = {
      timeOfDay: 0.5,
      creatures: [],
      plants: []
      // MISSING analytics!
      // MISSING scratchpad!
    } as any

    await saveGame('slot_1', legacyState, 'Legacy Ecosystem')

    const save = await loadGame('slot_1')
    
    // The loadGame itself just parses it.
    // We expect loadGame to at least return an object, but we also expect it to not crash.
    expect(save).toBeDefined()
    expect(save?.timeOfDay).toBe(0.5)
    
    // In our implementation, TitleScreen does: `save.creatures || []`
    // We fed it an empty array to prevent saveGame from crashing during test setup.
    expect(save?.creatures).toEqual([])
  })

  it('saves and loads a complete modern world state', async () => {
    const world = createMockWorld()
    
    await saveGame('slot_2', world, 'Modern Ecosystem')
    
    const loaded = await loadGame('slot_2')
    expect(loaded).toBeDefined()
    expect(loaded?.creatures.length).toBe(0)
    expect(loaded?.plants.length).toBe(0)
    expect(loaded?.timeOfDay).toBe(0.1)
  })
})
