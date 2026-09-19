// dino.js - Minimalistic Dinosaur Runner for Terminal

export function createDinoGame() {
  const width = 50;       // Screen width (wider playfield)
  const height = 9;       // Screen height
  const groundRow = 8;    // Bottom row for the ground
  const dinoX = 10;       // Dino positioned further right for better visibility

  let dinoY = 0;          // Height off ground (0 = ground, >0 = jumping)
  let vy = 0;             // Vertical velocity for jumping
  let obstacles = [];     // Array of obstacles (cacti and birds)
  let score = 0;          // Distance/survival score
  let gameOver = false;   // Game over flag
  let tick = 0;           // Frame counter

  // Handle jump input
  function handleInput(key, str) {
    const isJump = (key && (key.name === 'space' || key.name === 'up')) || str === ' ' || str === '\u0020';
    // Only jump if currently on the ground
    if (isJump && dinoY === 0) {
      vy = 1.4; // Jump impulse
    }
  }

  // Update physics, obstacles, and collision
  function update() {
    if (gameOver) return;

    // Apply jumping physics
    if (dinoY > 0 || vy > 0) {
      dinoY += vy;
      vy -= 0.2; // Smooth gravity pull
      if (dinoY <= 0) {
        dinoY = 0;
        vy = 0;
      }
    }

    tick++;
    score++;

    // Random obstacle spawning with safe minimum distance (at least 18 columns)
    const lastObstacle = obstacles[obstacles.length - 1];
    const lastObsEnd = lastObstacle ? (lastObstacle.x + lastObstacle.w) : -99;
    const canSpawn = (width - 1 - lastObsEnd) > 18;

    if (canSpawn && Math.random() < 0.16) {
      const isBird = Math.random() < 0.35; // 35% chance to spawn a bird

      if (isBird) {
        // Bird: width 3, altitude 0 (low - jump over) or 2 (high - run under)
        const altitude = Math.random() < 0.5 ? 0 : 2;
        obstacles.push({ type: 'bird', x: width - 1, w: 3, altitude });
      } else {
        // Cactus: width 1 (^), 2 (^^), or 3 (^^^) with '|' pipe stem grounded to '='
        const rand = Math.random();
        const w = rand < 0.45 ? 1 : (rand < 0.8 ? 2 : 3);
        obstacles.push({ type: 'cactus', x: width - 1, w, altitude: 0 });
      }
    }

    // Move obstacles left
    for (const obs of obstacles) {
      obs.x -= 1;
    }

    // Remove obstacles that scrolled off screen
    obstacles = obstacles.filter(obs => obs.x + obs.w > 0);

    // Collision detection
    for (const obs of obstacles) {
      const horizontalHit = dinoX >= obs.x && dinoX < obs.x + obs.w;
      if (!horizontalHit) continue;

      if (obs.type === 'cactus') {
        // Cactus is grounded: row 7 is '|' stem, row 6 is '^' top
        // Must jump clearly above row 6 (dinoY >= 1.7) to clear
        if (dinoY < 1.7) {
          gameOver = true;
          return;
        }
      } else if (obs.type === 'bird') {
        if (obs.altitude === 0) {
          // Low bird flies at row 6: must jump over it
          if (dinoY < 1.7) {
            gameOver = true;
            return;
          }
        } else if (obs.altitude === 2) {
          // High bird flies at row 4: safe on ground (row 7), kills if jumping into it
          if (dinoY >= 2.2 && dinoY <= 3.8) {
            gameOver = true;
            return;
          }
        }
      }
    }
  }

  // Render the current game frame
  function render() {
    // Initialize blank screen
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width).fill(' ');
    }

    // Draw ground
    for (let x = 0; x < width; x++) {
      grid[groundRow][x] = '=';
    }

    // Animated bird wings (flapping between 'v-v' and '^-^')
    const birdShape = (Math.floor(tick / 3) % 2 === 0) ? 'v-v' : '^-^';

    // Draw obstacles
    for (const obs of obstacles) {
      if (obs.type === 'cactus') {
        // Sticking to ground: '^' at row 6, '|' pipe stem at row 7 into '=' at row 8
        for (let i = 0; i < obs.w; i++) {
          const col = obs.x + i;
          if (col >= 0 && col < width) {
            grid[groundRow - 2][col] = '^';
            grid[groundRow - 1][col] = '|';
          }
        }
      } else if (obs.type === 'bird') {
        const row = (obs.altitude === 0) ? (groundRow - 2) : (groundRow - 4);
        for (let i = 0; i < obs.w; i++) {
          const col = obs.x + i;
          if (col >= 0 && col < width && row >= 0 && row < height) {
            grid[row][col] = birdShape[i];
          }
        }
      }
    }

    // Draw dino: 'D' at appropriate jump height
    const currentY = Math.max(0, (groundRow - 1) - Math.round(dinoY));
    grid[currentY][dinoX] = 'D';

    // Add borders
    const border = '+' + '-'.repeat(width) + '+';
    const lines = grid.map(row => '|' + row.join('') + '|');

    return [
      border,
      ...lines,
      border,
      ` Score: ${Math.floor(score / 2)}  |  [SPACE/UP] Jump  |  [Q] Menu`
    ].join('\n');
  }

  return {
    interval: 80, // Snappy tick rate (~12 FPS)
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => Math.floor(score / 2)
  };
}
