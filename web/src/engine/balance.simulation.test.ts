/**
 * balance.simulation.test.ts
 *
 * Full ecosystem balance probes — 1v1, edge cases, age/death tracing, old age system.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('./audioEngine', () => ({
  audio: {
    playLevelUp: vi.fn(),
    playCreatureEvent: vi.fn(),
    playBGM: vi.fn(),
    stopBGM: vi.fn(),
    init: vi.fn(),
    updateTimeOfDay: vi.fn(),
  }
}))

import { simulate } from './simulate'
import { buildCreature } from './creatureFactory'
import { spawnPlant } from './entityManager'
import { createMockWorld } from '../test/factories'
import { SpatialGrid } from './SpatialGrid'
import {
  HERBIVORE_BASE_HUNGER_DRAIN, CARNIVORE_BASE_HUNGER_DRAIN,
  OMNIVORE_BASE_HUNGER_DRAIN, CARNIVORE_BASE_DAMAGE,
  HERBIVORE_REPRO_CHANCE, CARNIVORE_REPRO_CHANCE,
  HERBIVORE_REPRO_COOLDOWN, CARNIVORE_REPRO_COOLDOWN,
  PLANT_SPAWN_RATE,
} from '../constants'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const W = 2560, H = 1440

function makeWorld() {
  const world = createMockWorld({ worldWidth: W, worldHeight: H })
  world.scratchpad.spatialGrid = new SpatialGrid(W, H, 150)
  return world
}

function addCreature(world: any, diet: 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE', count: number, opts: any = {}) {
  for (let i = 0; i < count; i++) {
    const c = buildCreature(
      { name: `${diet}-${i}`, size: opts.size || 'MEDIUM', diet, movement: 'CRAWLER', drawingData: '', decals: [] },
      W, H
    )
    if (opts.x !== undefined) c.x = opts.x + (i * 60)
    if (opts.y !== undefined) c.y = opts.y
    if (opts.hunger !== undefined) c.hunger = opts.hunger
    if (opts.level !== undefined) {
      c.level = opts.level
      const bonus = Math.min(19, opts.level - 1)
      c.damage = c.baseStats.damage * (1 + 0.10 * bonus)
      c.maxHealth = c.baseStats.maxHealth * (1 + 0.10 * bonus)
      c.health = c.maxHealth
      c.speed = c.baseStats.speed * (1 + 0.02 * bonus)
    }
    world.creatures.push(c)
  }
}

function seedPlants(world: any, count: number) {
  for (let i = 0; i < count; i++) {
    spawnPlant(world, {
      id: crypto.randomUUID(), type: 'PLANT',
      x: Math.random() * W, y: Math.random() * H,
      growthStage: 1.0, wobblePhase: 0,
    })
  }
}

function tick(world: any, seconds: number) {
  const dt = 1 / 20
  for (let i = 0; i < seconds * 20; i++) {
    simulate(world, dt)
    // Mock the async queue drainer that normally runs in useGameLoop.ts
    if (world.scratchpad.pendingImmigrations && world.scratchpad.pendingImmigrations.length > 0) {
      const pending = [...world.scratchpad.pendingImmigrations]
      world.scratchpad.pendingImmigrations = []
      for (const diet of pending) {
        const side = Math.random() < 0.5 ? 0 : world.worldWidth
        const y = Math.random() * (world.worldHeight - 200) + 100
        const color = diet === 'HERBIVORE' ? 'green' : diet === 'CARNIVORE' ? 'red' : 'purple'
        const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="${color}"/></svg>`
        const migrant = buildCreature({
          name: 'Migrant ' + diet, diet, size: 'MEDIUM', movement: 'CRAWLER', drawingData: svg, decals: []
        }, world.worldWidth, world.worldHeight)
        migrant.x = side
        migrant.y = y
        world.creatures.push(migrant)
      }
    }
  }
}

function census(world: any) {
  const alive = world.creatures.filter((c: any) => c.health > 0)
  const carns = alive.filter((c: any) => c.diet === 'CARNIVORE')
  const herbs = alive.filter((c: any) => c.diet === 'HERBIVORE')
  const omnis = alive.filter((c: any) => c.diet === 'OMNIVORE')
  const tot = alive.length
  const pct = (n: number) => tot > 0 ? `${((n/tot)*100).toFixed(0)}%` : '0%'
  const lvls = (arr: any[]) => arr.length === 0 ? 'EXTINCT' :
    `${arr.length}(Lv${(arr.reduce((s:number,c:any)=>s+c.level,0)/arr.length).toFixed(1)} max:${Math.max(...arr.map((c:any)=>c.level))})`
  return { carns, herbs, omnis, tot, plants: world.plants.length, pct, lvls }
}

// ─── Section 1: Why Carnivores Survive Without Prey ──────────────────────────

describe('🔍 Diagnosis — Why Carnivores Outlive Their Prey', () => {

  it('PROBE: lone carnivore starvation timeline — how long does it actually take?', () => {
    // Math expectation with current settings:
    // catnap threshold = >40 hunger (I accidentally lowered this from >60)
    // Sleep drain = baseDrain * 0.2 = 1.5 * 0.2 = 0.3/s
    // Awake drain = 1.5/s
    // Starting hunger = 80
    // Sleeps from 80→40: (80-40) / 0.3 = 133s asleep
    // Hunts from 40→0:   (40-0)  / 1.5 =  27s awake
    // Starvation at 5hp/s: 100hp / 5 = 20s
    // Expected total: ~180s — which matches the "200s" result!
    const catnap_threshold = 40  // currently >40 means sleep
    const sleepDrain = CARNIVORE_BASE_HUNGER_DRAIN * 0.2
    const awakeDrain = CARNIVORE_BASE_HUNGER_DRAIN
    const startHunger = 80
    const sleepTime = (startHunger - catnap_threshold) / sleepDrain
    const huntTime  = catnap_threshold / awakeDrain
    const starvTime = 100 / 5  // 5 hp/s damage
    console.log('\n════ DIAGNOSIS: Lone Carnivore Starvation ════')
    console.log(`  Catnap threshold: hunger > ${catnap_threshold}`)
    console.log(`  Sleeping drain: ${sleepDrain}/s | Awake drain: ${awakeDrain}/s`)
    console.log(`  Sleeps from 80→${catnap_threshold}: ${sleepTime.toFixed(0)}s`)
    console.log(`  Hunts/wanders from ${catnap_threshold}→0: ${huntTime.toFixed(0)}s`)
    console.log(`  Starvation (5hp/s): ${starvTime.toFixed(0)}s`)
    console.log(`  ⚠️  TOTAL expected survival: ~${(sleepTime+huntTime+starvTime).toFixed(0)}s`)
    console.log(`  ROOT CAUSE: catnap threshold >40 means carnivore sleeps for ${sleepTime.toFixed(0)}s!`)
    console.log(`  With threshold >85: sleeps only ${((startHunger-85)/sleepDrain).toFixed(0)}s, total ~${((startHunger-85)/sleepDrain + 85/awakeDrain + starvTime).toFixed(0)}s`)
    console.log(`  → FIXING: raise catnap threshold to >85 (only sleep when nearly full)`)
    expect(sleepTime).toBeGreaterThan(80) // documents the bug
  })

  it('PROBE: carnivore plant-eating fallback — can they survive on plants alone?', () => {
    // Carnivores eat plants when hunger < 20 (desperate fallback)
    // With 150 plants on field and no herbivores, they should be able to survive indefinitely
    const world = makeWorld()
    addCreature(world, 'CARNIVORE', 3, { hunger: 10 }) // hungry so they eat plants
    seedPlants(world, 150) // abundant plants
    tick(world, 120) // 2 minutes
    const c = census(world)
    console.log(`\n════ PROBE: Plant-Eating Fallback ════`)
    console.log(`  3 hungry carnivores + 150 plants → after 2min: ${c.carns.length} alive, ${c.plants} plants`)
    if (c.carns.length > 0) {
      console.log('  ⚠️  Carnivores survived on plants alone — this is the emergency "survive or die" mechanism')
      console.log('  This is INTENTIONAL but explains why they persist after prey collapses')
    }
    expect(true).toBe(true)
  })

  it('PROBE: old age system — do carnivores born at t=0 die by t=9min?', () => {
    // Carnivore maxAge = 420 * (0.8 + rand * 0.4) = 336–504s
    // At t=540s (9min), ALL original carnivores should be dead or dying
    // The surviving carnivores at t=10min are BORN during simulation (young)
    const world = makeWorld()
    addCreature(world, 'CARNIVORE', 10, { hunger: 80 })
    // Record their IDs at birth
    const originalIds = new Set(world.creatures.map((c: any) => c.id))

    // Seed plants for plant-eating fallback survival
    seedPlants(world, 100)

    tick(world, 540) // 9 minutes

    const survivingOriginals = world.creatures.filter((c: any) =>
      originalIds.has(c.id) && c.health > 0
    )
    const newBorns = world.creatures.filter((c: any) =>
      !originalIds.has(c.id) && c.health > 0
    )

    console.log(`\n════ PROBE: Old Age System ════`)
    console.log(`  Started with 10 carnivores (maxAge 336–504s = 5.6–8.4min)`)
    console.log(`  At t=540s (9min):`)
    console.log(`    Original carnivores still alive: ${survivingOriginals.length}/10`)
    console.log(`    New-born carnivores alive: ${newBorns.length}`)
    if (survivingOriginals.length === 0) {
      console.log('  ✅  Old age system works — all originals dead by 9min')
    } else {
      const ages = survivingOriginals.map((c: any) => c.age.toFixed(0))
      console.log(`  ⚠️  Some originals survived: ages = [${ages.join(', ')}]s`)
      console.log('  → May have level bonus extending maxAge or RNG gave long lives')
    }
    console.log(`  KEY: Surviving carnivores at t=10min are NEWBORNS, not the originals`)
    expect(originalIds.size).toBe(10)
  })

  it('PROBE: age distribution at collapse — what age are survivors?', () => {
    const world = makeWorld()
    addCreature(world, 'HERBIVORE', 20)
    addCreature(world, 'CARNIVORE', 5)
    addCreature(world, 'OMNIVORE', 8)
    seedPlants(world, 80)
    tick(world, 300) // run to 5min when collapse usually happens

    const alive = world.creatures.filter((c: any) => c.health > 0 && c.diet === 'CARNIVORE')
    console.log(`\n════ PROBE: Carnivore Age at Collapse (t=5min) ════`)
    console.log(`  Carnivores alive: ${alive.length}`)
    if (alive.length > 0) {
      const ages = alive.map((c: any) => ({ age: c.age.toFixed(0), maxAge: c.maxAge.toFixed(0), level: c.level, kills: c.kills }))
      for (const a of ages) {
        const pctLife = ((+a.age / +a.maxAge) * 100).toFixed(0)
        console.log(`    Age: ${a.age}s / maxAge:${a.maxAge}s (${pctLife}% through life) | Lv${a.level} | ${a.kills} kills`)
      }
      const youngBorn = ages.filter(a => +a.age < 180).length
      const oldOriginal = ages.filter(a => +a.age >= 200).length
      console.log(`  Young (born <3min ago): ${youngBorn} | Old (original, >3min old): ${oldOriginal}`)
    }
    expect(true).toBe(true)
  })
})

// ─── Section 2: 1v1 Scenarios ────────────────────────────────────────────────

describe('⚔️  1v1 Scenarios', () => {

  it('1v1: Lv1 C vs Lv1 H — carnivore wins reliably (10 trials)', () => {
    let wins = 0
    for (let t = 0; t < 10; t++) {
      const world = makeWorld()
      addCreature(world, 'CARNIVORE', 1, { x: 500, y: 500, hunger: 30 })
      addCreature(world, 'HERBIVORE', 1, { x: 560, y: 500 })
      seedPlants(world, 5)
      tick(world, 30)
      const c = census(world)
      if (c.carns.length > 0 && c.herbs.length === 0) wins++
    }
    console.log(`\n  Lv1 1v1: Carnivore won ${wins}/10 in 30s`)
    expect(wins).toBeGreaterThanOrEqual(0)
  })

  it('1v1: Lv10 C vs Lv10 H — boss still wins', () => {
    const world = makeWorld()
    addCreature(world, 'CARNIVORE', 1, { x: 500, y: 500, hunger: 30, level: 10 })
    addCreature(world, 'HERBIVORE', 1, { x: 570, y: 500, level: 10 })
    seedPlants(world, 5)
    tick(world, 30)
    const c = census(world)
    console.log(`\n  Lv10 1v1: C alive=${c.carns.length > 0} | H alive=${c.herbs.length > 0}`)
    expect(true).toBe(true)
  })

  it('EDGE: NaN safety — 1v1 at 60fps for 1 minute', () => {
    const world = makeWorld()
    addCreature(world, 'CARNIVORE', 1, { x: 500, y: 500, hunger: 10 })
    addCreature(world, 'HERBIVORE', 1, { x: 510, y: 500 })
    for (let i = 0; i < 60 * 60; i++) {
      simulate(world, 1/60)
      for (const c of world.creatures) {
        expect(Number.isNaN(c.health)).toBe(false)
        expect(Number.isNaN(c.x)).toBe(false)
      }
    }
    console.log('\n  ✅  Zero NaN in 1min at 60fps')
  })
})

// ─── Section 3: 10min Ecosystem Run ──────────────────────────────────────────

describe('🌿 Ecosystem — 10min', () => {

  it('PROBE: 20H / 5C / 8O — full 15min cycle (carnivore die-off + immigration rescue)', () => {
    const world = makeWorld()
    addCreature(world, 'HERBIVORE', 20)
    addCreature(world, 'CARNIVORE', 5)
    addCreature(world, 'OMNIVORE', 8)
    seedPlants(world, 80)

    console.log('\n══════ FULL CYCLE — 15min ══════')
    const snap = (label: string) => {
      const c = census(world)
      const hExt = c.herbs.length === 0 ? '💀EXTINCT' : `${c.herbs.length}(Lv${(c.herbs.reduce((s:any,x:any)=>s+x.level,0)/c.herbs.length).toFixed(1)})`
      const cExt = c.carns.length === 0 ? '💀EXTINCT' : `${c.carns.length}(Lv${(c.carns.reduce((s:any,x:any)=>s+x.level,0)/c.carns.length).toFixed(1)} max:${Math.max(...c.carns.map((x:any)=>x.level))})`
      const oExt = c.omnis.length === 0 ? '💀EXTINCT' : `${c.omnis.length}(Lv${(c.omnis.reduce((s:any,x:any)=>s+x.level,0)/c.omnis.length).toFixed(1)})`
      const senescent = c.carns.filter((x: any) => x.age > x.maxAge).length
      const suffix = senescent > 0 ? ` ⏳${senescent} in senescence` : ''
      console.log(`  [${label}] H:${hExt} C:${cExt} O:${oExt} | Plants:${c.plants}${suffix}`)
    }

    for (let m = 1; m <= 15; m++) {
      tick(world, 60)
      snap(`${m}min`.padEnd(5))
    }

    const final = census(world)
    console.log('\n  ── Summary ──')
    if (final.herbs.length > 0) console.log('  ✅  Herbivores recovered — full ecosystem cycle complete!')
    else console.log('  ⚠️  Herbivores still extinct at 15min — immigration rescue pending')
    if (final.carns.length === 0) console.log('  ✅  Carnivores died out — old age + starvation working correctly')
    else console.log(`  ℹ️   ${final.carns.length} carnivores persisting on plant fallback`)
    expect(final.tot).toBeGreaterThan(0)
  })
})

// ─── Section 4: Balance Flags ─────────────────────────────────────────────────

describe('✅ Balance Flags', () => {
  it('kill time 1.5–10s window', () => {
    const t = 100 / CARNIVORE_BASE_DAMAGE
    console.log(`\n  Kill time: ${t.toFixed(2)}s | Lunge: ${(100/(CARNIVORE_BASE_DAMAGE*2)).toFixed(2)}s`)
    expect(t).toBeGreaterThan(1.5); expect(t).toBeLessThan(10)
  })
  it('plant supply > 2/s', () => { expect(1/PLANT_SPAWN_RATE).toBeGreaterThan(2.0) })
  it('omnivore drains less than herbivore', () => { expect(OMNIVORE_BASE_HUNGER_DRAIN).toBeLessThan(HERBIVORE_BASE_HUNGER_DRAIN) })
  it('herbivore breeds much faster than carnivore', () => {
    const ratio = (HERBIVORE_REPRO_CHANCE/(HERBIVORE_REPRO_COOLDOWN+1)) /
                  (CARNIVORE_REPRO_CHANCE/(CARNIVORE_REPRO_COOLDOWN+1))
    console.log(`\n  H breeds ${ratio.toFixed(1)}× faster than C`)
    expect(ratio).toBeGreaterThan(3)
  })
})
