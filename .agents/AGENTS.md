# Darwin's Canvas Agent Rules

## UI Consistency
**CRITICAL RULE**: Do not change the overall aesthetic, style, or color scheme of UI components unless explicitly directed to do so by the user. These strict rules (chunky borders, hard shadows) apply ONLY to UI elements (buttons, panels, HTML DOM). They DO NOT apply to the 2.5D HTML5 Canvas simulation environment, which has its own distinct, soft painterly aesthetic.
Always refer to `docs/design.md` and `docs/style-guide.md` before making any visual changes to the UI.
The established UI aesthetic (Playful Clean Design Tokens, soft colors, specific drop-shadows, non-glassmorphic styling) must be strictly maintained for all DOM elements. When fixing UX issues, localize your changes narrowly (like adding a border to a specific cursor) rather than overhauling entire CSS blocks or themes.

<RULE[workspace]>
# Rule: Canvas Coordinate Drift Prevention
**Trigger:** Whenever an agent modifies layout, styling, or positioning of a `<canvas>` element (especially UI canvases like `CreationCanvas.tsx` or `WorldBuilder.tsx`).
**Action:** 
1. **Never use `object-fit: contain` on a `<canvas>` that is subject to flexbox resizing.** If the DOM element becomes a rectangle, the visual pixels will letterbox, completely disconnecting the visual drawing area from `getBoundingClientRect` and `nativeEvent.offsetX/Y`. This causes massive pointer drift.
2. **Never use `position: absolute` on a `<canvas>`** to "future-proof" it against flexbox collapse without ensuring its container is a perfect square.
3. **The Solution:** The wrapper container of the canvas MUST use the CSS Container Query pattern to enforce a perfect mathematical square:
   ```tsx
   <div style={{ containerType: 'size' /* on the parent flex column */ }}>
      <div style={{ width: '100cqmin', height: '100cqmin' }}>
         <canvas style={{ width: '100%', height: '100%' }} />
      </div>
   </div>
   ```
   This guarantees the canvas DOM element exactly matches its visual drawing area, making coordinate tracking mathematically flawless.
</RULE[workspace]>
