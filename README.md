# Terminal Arcade Hub

A minimalistic, zero-dependency terminal arcade hub built in JavaScript and Node.js.

## Games Included
1. **Flappy Bird** (`flappy.js`): Guide the bird through pipe gaps with smooth gravity and a 3s countdown.
2. **Dino Runner** (`dino.js`): Jump over grounded cacti and dodge low/high pterodactyl birds.
3. **Snake Game** (`snake.js`): Classic snake with border wrap-around, balanced vertical speed, apples (`@`), and deadly bombs (`X`).
4. **Breakout** (`breakout.js`): Classic brick breaker with paddle control (`========`), bouncing ball (`O`), brick destruction, and a 3s countdown.

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
- **Dino Runner**: `SPACE` or `UP Arrow` to jump, `Q` for Menu
- **Snake Game**: `Arrow Keys` or `W, A, S, D` to steer, `Q` for Menu
- **Breakout**: `← / →` or `A / D` to slide paddle, `Q` for Menu
- `Ctrl + C`: Exit anytime

### Game Over
- `SPACE` or `ENTER`: **Play Again immediately** (instant restart)
- `Q`, `M`, or `ESC`: Return to Main Menu

## Architecture

- **`index.js`**: Central launcher, interactive highlight slide bar, persistent local high scores (`scores.json`), and dynamic game loop.
- **`flappy.js`**: Self-contained Flappy Bird module with ready countdown and soft ceiling.
- **`dino.js`**: Self-contained Dino Runner module with grounded cacti and altitude-based pterodactyl birds.
- **`snake.js`**: Self-contained Snake module with toroidal border wrapping, balanced vertical speed, apples, and hazard bombs.
- **`breakout.js`**: Self-contained Breakout module with 27 bricks (`[##]`), paddle, bouncing ball physics, and ready countdown.
