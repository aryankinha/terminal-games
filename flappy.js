// flappy.js - Minimalistic Flappy Bird for Terminal

export function createFlappyGame() {
  const width = 28;       // Screen width in characters
  const height = 12;      // Screen height in characters
  const birdX = 4;        // Fixed horizontal position of the bird

  let birdY = 5;          // Vertical position of the bird
  let velocity = 0;       // Vertical velocity
  let pipes = [];         // Array of active pipes { x, gapY, gapSize, passed }
  let score = 0;          // Current score
  let gameOver = false;   // Game over flag
  let tick = 0;           // Frame counter for spawning pipes

  // Handle player inputs (Space or Up arrow to flap)
  function handleInput(key, str) {
    const isJump = (key && (key.name === 'space' || key.name === 'up')) || str === ' ' || str === '\u0020';
    if (isJump) {
      velocity = -1.1; // Flap upwards
    }
  }

  // Update physics, pipe movements, and collisions
  function update() {
    if (gameOver) return;

    // Apply gravity
    velocity += 0.28;
    birdY += velocity;

    // Spawn a new pipe every 14 ticks
    tick++;
    if (tick % 14 === 0) {
      const gapSize = 4;
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

    // Collision check: ceiling or floor
    const currentY = Math.round(birdY);
    if (currentY < 0 || currentY >= height) {
      gameOver = true;
      return;
    }

    // Collision check: pipes
    for (const pipe of pipes) {
      if (pipe.x === birdX) {
        if (currentY < pipe.gapY || currentY >= pipe.gapY + pipe.gapSize) {
          gameOver = true;
          return;
        }
      }
    }
  }

  // Render the current game frame as an ASCII string
  function render() {
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width).fill(' ');
    }

    // Draw pipes
    for (const pipe of pipes) {
      if (pipe.x >= 0 && pipe.x < width) {
        for (let y = 0; y < height; y++) {
          if (y < pipe.gapY || y >= pipe.gapY + pipe.gapSize) {
            grid[y][pipe.x] = '#';
          }
        }
      }
    }

    // Draw bird
    const renderY = Math.max(0, Math.min(height - 1, Math.round(birdY)));
    grid[renderY][birdX] = '>';

    // Add borders around the playfield
    const border = '+' + '-'.repeat(width) + '+';
    const lines = grid.map(row => '|' + row.join('') + '|');

    return [
      border,
      ...lines,
      border,
      ` Score: ${score}  |  [SPACE/UP] Flap  |  [Q] Menu`
    ].join('\n');
  }

  return {
    interval: 80,
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => score
  };
}
