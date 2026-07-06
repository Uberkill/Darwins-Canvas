# Darwin's Canvas

Darwin's Canvas is a 2D digital terrarium built with React, Vite, and HTML5 Canvas. Users can draw their own creatures, assign genetic traits, and release them into an infinite sandbox ecosystem to watch them evolve, hunt, and reproduce.

## Documentation
All technical rules, design mechanics, and strict styling constraints are located in the `docs/` folder. **AI Agents MUST read these files before making any modifications to the project.**

- `docs/architecture.md`: Strict technical blueprint (Zustand, Spatial Grid, Game Loop).
- `docs/design.md`: Core game mechanics, diets, and evolution rules.
- `docs/style-guide.md`: Mandatory UI aesthetics (Colors, thick borders, `lucide-react` SVGs).

## AI Agent Instructions
> [!IMPORTANT]
> **To start working on this project:** You MUST use the **Graphify chart** (via the `graphify-windows` skill) to read and understand the codebase architecture and file relationships.
> **For refactoring and memory:** You MUST use **Serena** (and her MCP tools) to handle codebase refactoring and memory management.

## Quick Start

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## Tech Stack
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **State Management:** Zustand
- **Icons:** `lucide-react`
- **Styling:** Vanilla CSS (Strict adherence to `style-guide.md`)
