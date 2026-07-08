# UI & Style Guide

> [!IMPORTANT]
> This ruleset is STRICT. AI Agents modifying the UI must follow these constraints perfectly to prevent the application from regressing into generic, lazy, or mismatched "modern corporate" designs.

Darwin's Canvas relies on a warm, playful, and distinctly hand-crafted aesthetic. It should look like a premium children's educational game or a high-quality indie sandbox, NOT a SaaS dashboard.

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

## Shape and Structure
- **Borders:** Extremely thick. Use `border: 4px solid var(--color-text)` or `border: 4px solid white` depending on contrast needs. Do not use thin `1px` borders.
- **Shadows:** Hard, solid drop shadows. Use `box-shadow: 0 4px 0 #E2DDD5` or `box-shadow: 0 6px 0 var(--color-text)`. Do not use soft, blurred shadows (e.g., `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`).
- **Radii:** Pill-shaped buttons (`var(--radius-full)` -> `9999px`) and rounded panels (`var(--radius-lg)` -> `24px`).
- **Layouts (Dashboards):** Avoid messy multi-column grids. Prefer clean "Top-Middle-Bottom" horizontal rows (e.g. 3 massive KPI cards on top, charts in the middle, analytics badges on the bottom).
- **BANNED (Dark Glassmorphism):** NEVER use dark translucent backgrounds with blurred overlays (`rgba(0,0,0, 0.8)` with `backdrop-filter: blur`). It destroys the bright, kid-friendly DNA of the app.

## Icons & Graphics
- **NO EMOJIS:** Absolutely no emojis allowed in the UI. 
- **SVG ONLY:** Use `lucide-react` for all icons. Icons should generally have a `stroke-width` of `2.5` or `3` to match the thick borders of the app.

## Interactive States
- **Hover/Active:** Instead of complex color transitions, interactive elements should "press down" physically.
  - Active state: `transform: translateY(4px); box-shadow: 0 0 0 transparent;`
