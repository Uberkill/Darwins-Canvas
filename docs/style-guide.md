# UI & Style Guide

> [!IMPORTANT]
> This ruleset is STRICT, but it applies **ONLY to UI elements** (HTML DOM, buttons, panels, menus). AI Agents modifying the UI must follow these constraints perfectly to prevent the application from regressing into generic, lazy, or mismatched "modern corporate" designs.
> **DO NOT** apply these rules (thick borders, hard shadows, no blurs) to the actual 2.5D HTML5 Canvas simulation environment. The simulation environment uses a completely separate, soft, organic, painterly aesthetic (e.g., Animal Crossing style) with blurred shadows and smooth rendering.

Darwin's Canvas relies on a warm, playful, and distinctly hand-crafted aesthetic. The UI should look like a premium children's educational game or a high-quality indie sandbox, NOT a SaaS dashboard.

## Typography
- **Primary Font:** `Nunito`
- **Weights:** Use heavy weights (`800` or `900`) for headers, buttons, and important text to maintain a chunky, playful feel.
- **System Fonts:** Never use default sans-serif (Arial, Roboto, Inter) unless `Nunito` fails to load.

## Colors
- **Backgrounds:** Use warm cream/off-white (`var(--color-bg-base)` -> `#D4D0C8`). Do not use pure white `#FFFFFF` or generic gray `#F3F4F6` for main backgrounds.
- **Panels/Modals:** `var(--color-panel)` (`#FFFDF8`).
- **Text:** `var(--color-text)` (`#4A4640`) for high contrast, `var(--color-text-muted)` (`#8A857D`) for secondary text.
- **Accents:** Use vibrant, saturated colors for buttons and highlights:
  - Primary (Green): `var(--color-primary)` (`#98C972`)
  - Secondary (Yellow): `var(--color-secondary)` (`#F5D76E`)
  - Tertiary (Pink): `var(--color-tertiary)` (`#FF8C9D`)
  - Blue: `var(--color-blue)` (`#7CB9E8`)
- **Terrain Colors (Strict Consistency):** If building UI related to the terrain or World Builder, use these exact hex codes to match the simulation engine. Do NOT use them with white text without checking accessibility contrast ratios:
  - Water: `#4CA8D1`
  - Dirt: `#D6A675`
  - Grass: `#84C270`
  - Rock: `#979A9E`

## Shape and Structure
- **Borders:** Extremely thick. Use `border: 4px solid var(--color-text)` or `border: 4px solid white` depending on contrast needs. Do not use thin `1px` borders.
- **Shadows:** Hard, solid drop shadows. Use `box-shadow: 0 4px 0 #E2DDD5` or `box-shadow: 0 6px 0 var(--color-text)`. Do not use soft, blurred shadows (e.g., `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`).
- **Radii:** Pill-shaped buttons (`var(--radius-full)` -> `9999px`) and rounded panels (`var(--radius-lg)` -> `24px`).
- **Layouts (Dashboards):** Avoid messy multi-column grids. Prefer clean "Top-Middle-Bottom" horizontal rows (e.g. 3 massive KPI cards on top, charts in the middle, analytics badges on the bottom).
- **BANNED (Dark Glassmorphism):** NEVER use dark translucent backgrounds with blurred overlays (`rgba(0,0,0, 0.8)` with `backdrop-filter: blur`). It destroys the bright, kid-friendly DNA of the app.

## Global UI Scale & Modal Positioning
- The application scales the entire UI using a global CSS variable (`--ui-scale`).
- **NO `position: fixed` for Modals:** Global modals (e.g., PauseMenu, StatsPanel) must NOT use `position: fixed` if they are intended to respect the global `uiScale`.
- Use `position: absolute; inset: 0;` inside the `.app-container` (which is `position: relative`).
- **Stacking & Accessibility:** Because absolute positioning within a scaled container changes stacking contexts, the `.app-container` MUST NOT have `overflow: hidden` (to prevent clipping), and accessibility focus-trapping libraries must be configured to search within `.app-container` rather than `document.body`.

## Icons & Graphics
- **NO EMOJIS:** Absolutely no emojis allowed in the UI. 
- **SVG ONLY:** Use `lucide-react` for all icons. Icons should generally have a `stroke-width` of `2.5` or `3` to match the thick borders of the app.

## Interactive States
- **Hover/Active:** Instead of complex color transitions, interactive elements should "press down" physically.
  - Active state: `transform: translateY(4px); box-shadow: 0 0 0 transparent;`

## Canvas Layout Constraints
- **Coordinate Drift Prevention:** When building UI canvases (like the Creature Lab or Map Painter), you MUST wrap the canvas in a strict `100cqmin` Container Query wrapper.
- DO NOT use `object-fit: contain` on a canvas inside a responsive flexbox. If the canvas DOM element stretches into a rectangle, the browser will letterbox the rendering buffer. `getBoundingClientRect` and `offsetX` do not calculate this letterboxing, which completely destroys pointer coordinate mapping and causes brush drift.
- Use this exact structure to guarantee the DOM element is a perfect square, completely eliminating drift:
```tsx
<div style={{ containerType: 'size' /* applied to the parent column */ }}>
  <div style={{ width: '100cqmin', height: '100cqmin' }}>
    <canvas style={{ width: '100%', height: '100%' }} />
  </div>
</div>
```

## Screen Pixels vs. CSS Pixels (Cursor Math)
- `getBoundingClientRect()` returns *physical screen pixels* which inherently include any CSS `transform: scale()`. This applies uniformly to both `mouse` and `touch` events.
- **Rule 1 (Raw Canvas):** When feeding pointer coordinates into a raw Canvas buffer (e.g., `getCanvasPoint`), **do not** divide by `uiScale`. The raw canvas lives outside the CSS transform hierarchy and self-corrects via `scaleX = 1024 / rect.width`.
- **Rule 2 (CSS Transforms):** When feeding pointer coordinates into a DOM element's CSS `transform: translate()` (like a custom cursor dot), and that element lives *inside* a container scaled by `uiScale`, you **must** divide the screen coordinates by `uiScale`. Failure to do this results in double-compensation and pointer drift.
