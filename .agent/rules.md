# Farming Sim RPG - Project Rules

## Technology Stack
- **Build Tool**: Vite 5.x
- **Language**: Vanilla JavaScript (ES Modules)
- **Styling**: Vanilla CSS with custom properties
- **Deployment**: Netlify (auto-deploy from `dist/`)
- **Testing**: Vitest

## Architecture

### Module Structure
```
src/
├── main.js              # Entry point
├── styles/              # CSS files
├── game/                # Core game logic
│   ├── Game.js          # Main controller
│   ├── state.js         # State management
│   └── constants.js     # Configuration
├── entities/            # Game entities (Player, Crop)
├── systems/             # Game systems (Inventory, Time, Save)
├── rendering/           # Canvas rendering
├── input/               # Input handling
└── ui/                  # DOM UI components
```

### Design Patterns
- **State Management**: Centralized state with pub/sub
- **Entity-Component**: Entities with serialization
- **Separation of Concerns**: Rendering, logic, UI are decoupled

## Code Style

### JavaScript
- Use ES6+ features (classes, arrow functions, destructuring)
- Use `const` by default, `let` when reassignment needed
- Export named exports from modules
- Document public methods with JSDoc comments

### CSS
- Use CSS custom properties for theming (defined in `variables.css`)
- Follow BEM-like naming: `.component__element--modifier`
- Mobile-first responsive design

### Naming Conventions
- **Files**: PascalCase for classes (`Player.js`), camelCase for utilities (`constants.js`)
- **Classes**: PascalCase (`TimeSystem`)
- **Functions/Variables**: camelCase (`getSeasonColors`)
- **Constants**: UPPER_SNAKE_CASE (`TILE_SIZE`)

## Game Balance

### Energy Costs
- Chop Tree: 8 energy
- Mine Stone: 8 energy
- Till Soil: 4 energy
- Plant Seed: 2 energy
- Harvest: 3 energy

### Time
- Day length: 24000 frames (~6-7 minutes)
- Day starts at 6:00 AM, ends at 2:00 AM
- 28 days per season

## Development Commands
```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm run test     # Run tests
```

## File Size Guidelines
- Keep individual modules under 300 lines
- Split large files into smaller focused modules
- Lazy load non-critical features when possible

## Save Data
- Save key: `farming_sim_rpg_v11`
- Auto-save every 10 seconds during gameplay
- Version migrations handled in SaveManager
