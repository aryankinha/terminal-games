// flappy.js - Minimalistic Flappy Bird for Terminal with ANSI colors

import { C, createEmptyGrid, wrapFrame, createCountdown, clamp } from './common.js';

export function createFlappyGame() {
  const width = 50;            // Screen width in characters (wide playfield)
  const height = 14;           // Screen height in characters
  const birdX = 8;             // Fixed horizontal position of the bird
  const countdown = createCountdown(3000);

  let birdY = 6;               // Vertical position of the bird
  let velocity = 0;            // Vertical velocity
  let pipes = [];              // Array of active pipes { x, gapY, gapSize, passed }
  let score = 0;               // Current score
  let gameOver = false;        // Game over flag
  let tick = 0;                // Frame counter for spawning pipes

  // Handle player inputs (Space or Up arrow to flap)
  function handleInput(key, str) {
    // Only accept flap inputs once countdown has finished
    if (countdown.isActive()) return;

    const isJump = (key && (key.name === 'space' || key.name === 'up')) || str === ' ' || str === '\u0020';
    if (isJump) {
      velocity = -0.72; // Gentle upward flap impulse
    }
  }

  // Update physics, pipe movements, and collisions
  function update() {
    if (gameOver) return;

    // Pause physics and obstacles during the 3-second countdown
    if (countdown.isActive()) return;

    // Apply gentle gravity with clamped terminal velocity
    velocity += 0.15;
    if (velocity > 0.75) velocity = 0.75;
    birdY += velocity;

    // Ceiling soft-clamp: player cannot fly above screen, rebounds gently
    if (birdY < 0) {
      birdY = 0;
      velocity = 0.1;
    }

    // Spawn pipes every 22 ticks with a generous gap (5 rows)
    tick++;
    if (tick % 22 === 0) {
      const gapSize = 5;
      const gapY = Math.floor(Math.random() * (height - gapSize - 2)) + 1;
      pipes.push({ x: width - 1, gapY, gapSize, passed: false });
    }

    // Move pipes left
    for (const pipe of pipes) {
      pipe.x -= 1;

      // Increase score when bird passes the pipe
      if (!pipe.passed && pipe.x < birdX) {
        pipe.passed = true;
        score++;
      }
    }

    // Remove pipes that moved off screen
    pipes = pipes.filter(p => p.x >= 0);

    // Collision check: hitting the floor
    const currentY = Math.round(birdY);
    if (currentY >= height) {
      gameOver = true;
      return;
    }

    // Collision check: hitting pipe obstacles
    for (const pipe of pipes) {
      if (pipe.x === birdX) {
        if (currentY < pipe.gapY || currentY >= pipe.gapY + pipe.gapSize) {
          gameOver = true;
          return;
        }
      }
    }
  }

  // Render the current game frame as an ASCII string with ANSI colors
  function render() {
    const grid = createEmptyGrid(width, height);

    // Draw pipes (vibrant green)
    for (const pipe of pipes) {
      if (pipe.x >= 0 && pipe.x < width) {
        for (let y = 0; y < height; y++) {
          if (y < pipe.gapY || y >= pipe.gapY + pipe.gapSize) {
            grid[y][pipe.x] = `${C.brightGreen}#${C.reset}`;
          }
        }
      }
    }

    // Draw bird (bright yellow bold)
    const renderY = clamp(Math.round(birdY), 0, height - 1);
    grid[renderY][birdX] = `${C.bold}${C.brightYellow}>${C.reset}`;

    // Overlay countdown message if still in pre-game countdown
    countdown.overlay(grid, width, 4);

    let statusText = '';
    if (countdown.isActive()) {
      const remaining = countdown.getSecondsRemaining();
      statusText = ` ${C.yellow}Score: 0${C.reset}  |  ${C.bold}Starting in ${remaining}...${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    } else {
      statusText = ` ${C.yellow}Score: ${score}${C.reset}  |  ${C.brightCyan}[SPACE/UP] Flap${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    }

    return wrapFrame(grid, width, statusText, C.cyan);
  }

  return {
    interval: 110, // Slower tick rate (~9 FPS) for relaxed, controllable pace
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => score
  };
}
