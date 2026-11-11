# Campus Rivals

A browser-based multiplayer campus tycoon with continuous open-world rivalry combat.

## Quick Start

```bash
# Install dependencies
npm install

# Start development (client + server)
npm run dev

# Open http://localhost:5173 in your browser
```

## Game Overview

Players choose one of three fictional universities:
- **Metro Heights University** (Blue) - Modern metropolitan campus
- **Foundry Institute** (Yellow) - Inventive industrial campus  
- **Redcrest University** (Red) - Traditional brick campus

### Core Loop
1. Choose a school and claim a campus plot
2. Earn Campus Cash through passive income
3. Step on purchase pads to unlock buildings
4. Customize your campus layout
5. Leave campus to fight rival players and NPCs
6. Earn Spirit rewards for victories
7. Unlock decorations and collectibles

### Combat
- **Always available** - No queues, matches, or opt-in required
- Players can fight rivals anywhere outside protected spawn areas
- Foam baton melee and spirit blaster ranged attacks
- Dash ability with cooldown
- Respawn at school spawn point after knockout

## Project Structure

```
packages/
├── shared/     # Shared types, config, and utilities
├── server/     # Node.js + Socket.IO game server
└── client/     # Vite + Three.js browser client
```

## Scripts

```bash
npm run dev       # Start client and server in development mode
npm run build     # Build all packages for production
npm run start     # Start production server
npm test          # Run unit tests
npm run typecheck # Type-check all packages
```

## Architecture

### Server (Authoritative)
- Economy: Cash, income, purchases, upgrades
- Combat: Damage, cooldowns, team checks, rewards
- Persistence: SQLite database for player data
- Validation: All game state changes verified server-side

### Client
- Three.js 3D rendering
- Socket.IO real-time sync
- Local prediction with server reconciliation
- Touch and keyboard/mouse controls

## Controls

| Action | Keyboard/Mouse | Touch |
|--------|---------------|-------|
| Move | WASD / Arrow keys | Left side joystick |
| Look | Right-click drag | - |
| Attack | Left-click | Tap right side |
| Dash | Space | - |
| Interact | E or F | - |
| Switch Weapon | Q | - |

## Configuration

### Environment Variables

```
PORT=3000                    # Server port
NODE_ENV=development         # Environment
CLIENT_URL=http://localhost:5173  # CORS origin (dev only)
DB_PATH=/path/to/db.sqlite   # Database path
```

## Deployment

### Docker

```bash
docker build -t campus-rivals .
docker run -p 3000:3000 -v ./data:/app/data campus-rivals
```

### Manual

```bash
npm run build
NODE_ENV=production npm start
```

The server serves the built client in production mode.

## Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch
```

## Schools

| School | Color | Style | Specialty |
|--------|-------|-------|-----------|
| Metro Heights | Blue | Modern | Innovation Hub (+10% income) |
| Foundry Institute | Yellow | Industrial | Maker Workshop (+15% upgrade discount) |
| Redcrest University | Red | Traditional | Grand Hall (+20% student capacity) |

## Buildings

1. **Admissions Office** - Free starting building
2. **Classroom** - Academic, increases capacity
3. **Dormitory** - Housing, high capacity
4. **Dining Hall** - Required for larger campuses
5. **Library** - Boosts academic income
6. **School Specialty** - Unique per-school building
7. **Recreation Center** - Student happiness
8. **Stadium** - High income and capacity
9. **President's Office** - Spawns president NPC
10. **Display Hall** - Show collectibles

## License

MIT
