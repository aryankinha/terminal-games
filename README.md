# Terminal Arcade Hub

A retro-styled, zero-dependency terminal arcade hub built in pure JavaScript (ESM) and Node.js with ANSI colors.

## Games Included
1. **Flappy Bird** (`flappy.js`): Guide the bird through pipe gaps with smooth gravity, gentle ceiling rebound, ANSI colors, and a 3s countdown.
2. **Dino Runner** (`dino.js`): Jump over grounded cacti and dodge or duck under pterodactyl birds, featuring progressive speed scaling and ducking mechanics (`_`).
3. **Snake Game** (`snake.js`): Classic snake with 2-step buffered input queue, border wrap-around, balanced vertical speed, apples (`@`), and safe hazard bombs (`X`).
4. **Breakout** (`breakout.js`): Classic brick breaker with paddle control (`========`), 3-tier colored bricks, bouncing ball physics with realistic side-deflections, 3 lives system (`♥♥♥`), and ready countdown.

## How to Run

```bash
# Start with npm
npm start

# Or directly with node
node index.js
```

## Controls

### Main Menu
- `↑` / `↓` Arrow keys (or `W` / `S`): Slide selection bar
- `ENTER` or `SPACE`: Launch highlighted game
- `1`, `2`, `3`, `4`: Quick launch games
- `Q`: Quit

### In-Game Controls
- **Flappy Bird**: `SPACE` or `UP Arrow` to flap, `Q` for Menu
- **Dino Runner**: `SPACE` or `UP Arrow` to jump, `DOWN Arrow` or `S` to duck / fast-drop, `Q` for Menu
- **Snake Game**: `Arrow Keys` or `W, A, S, D` to steer (buffered queue), `Q` for Menu
- **Breakout**: `← / →` or `A / D` to slide paddle, `Q` for Menu
- `Ctrl + C`: Cleanly exit anytime

### Game Over
- `SPACE` or `ENTER`: **Play Again immediately** (instant restart)
- `Q`, `M`, or `ESC`: Return to Main Menu

## Architecture

- **`common.js`**: Shared ANSI color palette, standardized 3-second pre-game countdown helper, grid utilities, and frame border wrapper.
- **`index.js`**: Central launcher, interactive highlight slide bar, persistent local high scores (`scores.json`), terminal resize guardian, OS signal handlers, and engine loop.
- **`flappy.js`**: Flappy Bird module with ready countdown, ANSI colors, and soft ceiling.
- **`dino.js`**: Dino Runner module with grounded cacti, altitude-based pterodactyl birds, ducking, and progressive speed scaling.
- **`snake.js`**: Snake module with toroidal border wrapping, balanced vertical speed, 2-step input queue, apples, and safe hazard bombs.
- **`breakout.js`**: Breakout module with 3 lives system, multi-colored brick tiers, realistic side-bounce physics, paddle, and ready countdown.
