// dino.js - Minimalistic Dinosaur Runner for Terminal with ANSI colors, ducking, and countdown

import { C, createEmptyGrid, wrapFrame, createCountdown, clamp } from './common.js';

export function createDinoGame() {
  const width = 50;            // Screen width (wider playfield)
  const height = 9;            // Screen height
  const groundRow = 8;         // Bottom row for the ground
  const dinoX = 10;            // Dino positioned further right for better visibility
  const countdown = createCountdown(3000);

  let dinoY = 0;               // Height off ground (0 = ground, >0 = jumping)
  let vy = 0;                  // Vertical velocity for jumping
  let duckTicks = 0;           // Timer ticks while ducking
  let obstacles = [];          // Array of obstacles (cacti and birds)
  let score = 0;               // Distance/survival score
  let gameOver = false;        // Game over flag
  let tick = 0;                // Frame counter

  // Handle player inputs (Jump: Space/Up, Duck: Down/S)
  function handleInput(key, str) {
    if (countdown.isActive()) return;

    const isJump = (key && (key.name === 'space' || key.name === 'up')) || str === ' ' || str === 'w' || str === 'W';
    const isDuck = (key && key.name === 'down') || str === 's' || str === 'S';

    if (isJump && dinoY === 0) {
      vy = 1.4; // Jump impulse
      duckTicks = 0;
    } else if (isDuck) {
      if (dinoY > 0) {
        // Fast-drop if in mid-air
        vy = -1.4;
      } else {
        // Duck low on ground for 6 ticks (~450ms)
        duckTicks = 6;
      }
    }
  }

  // Update physics, obstacles, and collision
  function update() {
    if (gameOver) return;
    if (countdown.isActive()) return;

    // Apply jumping physics
    if (dinoY > 0 || vy > 0) {
      dinoY += vy;
      vy -= 0.2; // Smooth gravity pull
      if (dinoY <= 0) {
        dinoY = 0;
        vy = 0;
      }
    }

    // Decrement duck timer if ducking on ground
    if (duckTicks > 0) {
      duckTicks--;
    }

    tick++;
    score++;

    // Obstacle spawning with safe minimum gap (at least 18 columns)
    const lastObstacle = obstacles[obstacles.length - 1];
    const lastObsEnd = lastObstacle ? (lastObstacle.x + lastObstacle.w) : -99;
    const canSpawn = (width - 1 - lastObsEnd) > 18;

    if (canSpawn && Math.random() < 0.16) {
      const isBird = Math.random() < 0.35; // 35% chance of pterodactyl bird

      if (isBird) {
        // Bird: width 3, altitude 0 (low - jump over) or 2 (high - run under or duck)
        const altitude = Math.random() < 0.5 ? 0 : 2;
        obstacles.push({ type: 'bird', x: width - 1, w: 3, altitude });
      } else {
        // Cactus: width 1, 2, or 3
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
        // Cactus: must jump clearly above row 6 (dinoY >= 1.7)
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
          // High bird flies at row 4:
          // Safe on ground while running or ducking; jumping into its flight path kills the dino
          if (dinoY > 1.5) {
            gameOver = true;
            return;
          }
        }
      }
    }
  }

  // Render current frame
  function render() {
    const grid = createEmptyGrid(width, height);

    // Draw ground (=) in yellow/brown
    for (let x = 0; x < width; x++) {
      grid[groundRow][x] = `${C.yellow}=${C.reset}`;
    }

    // Animated bird wings flapping between 'v-v' and '^-^'
    const wingShape = (Math.floor(tick / 3) % 2 === 0) ? 'v-v' : '^-^';

    // Draw obstacles
    for (const obs of obstacles) {
      if (obs.type === 'cactus') {
        // Grounded cactus: '^' at row 6, '|' stem at row 7 into ground at row 8
        for (let i = 0; i < obs.w; i++) {
          const col = obs.x + i;
          if (col >= 0 && col < width) {
            grid[groundRow - 2][col] = `${C.brightGreen}^${C.reset}`;
            grid[groundRow - 1][col] = `${C.green}|${C.reset}`;
          }
        }
      } else if (obs.type === 'bird') {
        const row = (obs.altitude === 0) ? (groundRow - 2) : (groundRow - 4);
        for (let i = 0; i < obs.w; i++) {
          const col = obs.x + i;
          if (col >= 0 && col < width && row >= 0 && row < height) {
            grid[row][col] = `${C.brightMagenta}${wingShape[i]}${C.reset}`;
          }
        }
      }
    }

    // Draw dino: 'D' when running/jumping, '_' when ducking low
    const isDucking = (dinoY === 0 && duckTicks > 0);
    const dinoChar = isDucking ? `${C.bold}${C.brightYellow}_${C.reset}` : `${C.bold}${C.brightYellow}D${C.reset}`;
    const currentY = clamp((groundRow - 1) - Math.round(dinoY), 0, height - 1);
    grid[currentY][dinoX] = dinoChar;

    // Overlay countdown message if still in pre-game countdown
    countdown.overlay(grid, width, 3);

    let statusText = '';
    const displayScore = Math.floor(score / 2);
    if (countdown.isActive()) {
      const remaining = countdown.getSecondsRemaining();
      statusText = ` ${C.yellow}Score: 0${C.reset}  |  ${C.bold}Starting in ${remaining}...${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    } else {
      statusText = ` ${C.yellow}Score: ${displayScore}${C.reset}  |  ${C.brightCyan}[SPACE/UP] Jump  [DOWN] Duck${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    }

    return wrapFrame(grid, width, statusText, C.cyan);
  }

  return {
    // Dynamic difficulty: interval decreases as score rises, from 80ms down to 45ms
    get interval() {
      return Math.max(45, 80 - Math.floor(score / 60) * 3);
    },
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => Math.floor(score / 2)
  };
}
