Before considering a task complete:
1. Run `npx tsc -b` inside `web/` to guarantee no TypeScript errors.
2. Run `npm run lint` inside `web/` to catch syntax/style violations.
3. Ensure no memory leaks or GC stutters were introduced into the core simulation loop (`simulate.ts`) or Renderer.