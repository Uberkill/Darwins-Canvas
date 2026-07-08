# Ecosystem Balancing & Math ⚖️

This document outlines the core math logic that drives the terrarium ecosystem, explicitly designed to avoid extinction spirals and ensure stable population dynamics.

## 1. Carrying Capacity (K-Selection vs r-Selection)

To avoid total ecosystem collapse (where prey overpopulates, consumes all food, and triggers a mass starvation event), populations are explicitly capped:
*   **Herbivore Cap:** `100`
*   **Carnivore Cap:** `25`
*   **Omnivore Cap:** `25`
*   **Plant Cap:** `100`

By separating the caps instead of using a single `GLOBAL_POPULATION_CAP`, we ensure that a massive breeding spike in Herbivores (r-selection) does not lock Carnivores (K-selection) out of reproducing when they hunt successfully.

## 2. The Economics of Food

To sustain a maximum cap of 100 Herbivores, the ecosystem must passively generate enough energy:
*   **Herbivore Hunger Drain:** `2.5` energy / second.
*   **Required Global Energy:** `100 * 2.5 = 250` energy / second needed to sustain the cap.
*   **Plant Generation:** Plants spawn every `0.4s` (2.5 plants/sec).
*   **Plant Yield:** Fully grown plants give `80` energy.
*   **Total Output:** `2.5 * 80 = 200` energy / second generated globally. 

*(This math intentionally sustains exactly ~80 herbivores on average, causing mild starvation at the hard cap of 100. This ensures dynamic fluctuation without immediate total extinction).*

## 3. Predator Sustenance

Carnivores and Omnivores rely heavily on the success of their hunts.
*   **Base Drain:** Both drain at `2.8` energy / second.
*   **Meat Yield:** Carnivores extract `100` energy from a kill (~35 seconds of life). Omnivores extract `80` (~28 seconds).

## 4. XP and Leveling (The Anti-Runaway System)

Leveling scales heavily affect the terrarium, giving max health, stamina, and crucially, speed and damage.
If predators level up too quickly, they gain speed bonuses that make them un-kitable. If prey levels up too quickly, they become uncatchable.

**Leveling Formulas (Diminishing Returns):**
*   **Herbivore:** `1 + floor(sqrt(foodEaten / 3))` 
    *(Takes 12 plants to reach Level 3)*
*   **Carnivore:** `1 + floor(sqrt(kills))` 
    *(Takes 4 kills to reach Level 3)*
*   **Omnivore:** `1 + floor(sqrt((kills * 1.5) + (foodEaten / 6)))`

**Stat Scaling per Level:**
*   `+10%` Health & Stamina
*   `+2%` Speed (Intentionally kept low to prevent unavoidable chases)
*   `+10%` Base Damage
*   `+5%` Render Scale

## 5. Senescence (Organic Aging & The Generational Reset)

To prevent the **Immortal God Problem** (where a Level 15 creature lives forever and dominates the map, giving new Level 1 creatures no chance to survive), we implement Senescence (Old Age).

*   **Randomized Lifespans:** When a creature is born, its `maxAge` is randomized by ±20% (e.g. Herbivores live between 240s and 360s). This prevents the entire starting generation from dying at the exact same millisecond.
*   **The Aging Process:** Once a creature's `age` surpasses its `maxAge`, it does not instantly die. Instead, it enters Senescence.
*   **Senescence Penalties:** Every second past `maxAge`, the creature loses max health, loses speed, loses damage, and its hunger drain rate drastically increases (up to 3x normal). 
*   **The Equalizer:** This means a Level 15 God-tier Herbivore will eventually become sluggish, frail, and ravenous. A fresh Level 1 Carnivore will be able to hunt it down, completing the circle of life organically.
*   **Absolute Death:** If a creature survives 120 seconds into Senescence, its heart gives out and it dies instantly.

## 6. Omnivore Diet Restriction
Omnivores are explicitly coded to **prioritize plants**. They will completely ignore meat (and will not hunt) unless their hunger drops below `20` (starvation threshold). This prevents them from starving out Carnivores.

## 7. The Apex Predator Burst & Food Coma
Carnivores have an extreme burst speed (`LUNGE_SPEED_MULTIPLIER = 2.5`). However, upon getting a kill or eating meat, they enter a **15-second Food Coma** (`eatingTimer = 15.0`). They will freeze in place and sleep next to their carcass, allowing the ecosystem to recover.

## 8. Circadian Rhythms (Sleep Schedules)
*   **Herbivores & Omnivores:** Diurnal. Sleep at night (`globalSightPenalty < 0.9`), unless they are starving (`hunger < 30`).
*   **Carnivores:** Nocturnal. They hunt relentlessly at night. During the day, they take intermediate catnaps if they are well-fed (`hunger > 60`).

## 9. Weather Systems & Plant Spawning
*   **Clear:** `1.0x` Plant Spawn Rate
*   **Rain:** `RAIN_PLANT_SPAWN_MULTIPLIER` (`2.5x`) Plant Spawn Rate
*   **Drought:** `DROUGHT_PLANT_SPAWN_MULTIPLIER` (`0.2x`) Plant Spawn Rate

## 10. Immigration (Anti-Extinction Rule)
*   **Condition:** Herbivore, Carnivore, or Omnivore population = 0.
*   **Timer:** Checked every `120` seconds.
*   **Chance:** `5%` chance to spawn 1 Migrant on the edge of the map.

---

## 🛑 Blast Radius & Revert Guide 🛑

If future balancing changes break the ecosystem or cause a return to extinction spirals, consult this guide before making sweeping changes:

### Reverting Extinction Spirals
If all creatures die rapidly, you have likely broken the Plant Energy generation math.
*   **Fix:** Ensure `(1 / PLANT_SPAWN_RATE) * PLANT_ENERGY` is approximately equal to `HERBIVORE_POPULATION_CAP * HERBIVORE_BASE_HUNGER_DRAIN`.

### Reverting Apex Predator Snowballs
If Carnivores wipe out the map in the first 2 minutes, you have likely increased their Speed scaling or Leveling XP. 
*   **Fix:** Ensure the Speed bonus in `simulate.ts` remains capped tightly (`0.02`), and the Carnivore XP formula stays as `sqrt(kills)`, **not** `sqrt(kills * multiplier)`.

### Files Modified in this System
*   `src/constants/index.ts` - All raw numerical values and caps.
*   `src/engine/simulate.ts` - XP Math and Stat Leveling application.
*   `src/engine/collision.ts` - Plant and Meat energy yields.
*   `src/engine/reproduction.ts` - Separation of population caps.
*   `src/__tests__/engine/balance.test.ts` - Automated math verification tests.
