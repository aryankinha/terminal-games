// flappy.js - Minimalistic Flappy Bird for Terminal

export function createFlappyGame() {
  const width = 50;            // Screen width in characters (wide playfield)
  const height = 14;           // Screen height in characters
  const birdX = 8;             // Fixed horizontal position of the bird
  const countdownDuration = 3000; // 3-second countdown before game starts

  let birdY = 6;               // Vertical position of the bird
  let velocity = 0;            // Vertical velocity
  let pipes = [];              // Array of active pipes { x, gapY, gapSize, passed }
  let score = 0;               // Current score
  let gameOver = false;        // Game over flag
  let tick = 0;                // Frame counter for spawning pipes
  const startTime = Date.now();// Timestamp when game session was created

  // Check if still within the 3-second countdown
  function isCountingDown() {
    return (Date.now() - startTime) < countdownDuration;
  }

  // Get current remaining seconds for countdown (3, 2, 1)
  function getRemainingSeconds() {
    const elapsed = Date.now() - startTime;
    return Math.max(1, Math.ceil((countdownDuration - elapsed) / 1000));
  }

  // Handle player inputs (Space or Up arrow to flap)
  function handleInput(key, str) {
    // Only accept flap inputs once countdown has finished
    if (isCountingDown()) return;

    const isJump = (key && (key.name === 'space' || key.name === 'up')) || str === ' ' || str === '\u0020';
    if (isJump) {
      velocity = -0.72; // Gentle upward flap impulse
    }
  }

  // Update physics, pipe movements, and collisions
  function update() {
    if (gameOver) return;

    // Pause physics and obstacles during the 3-second countdown
    if (isCountingDown()) return;

    // Apply gentle gravity with clamped terminal velocity
    velocity += 0.15;
    if (velocity > 0.75) velocity = 0.75;
    birdY += velocity;

    // Ceiling soft-clamp: player cannot fly above screen, but touching ceiling does not kill
    if (birdY < 0) {
      birdY = 0;
      velocity = 0;
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

  // Render the current game frame as an ASCII string
  function render() {
    // Initialize empty grid
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

    // Draw bird (clamped within visual area)
    const renderY = Math.max(0, Math.min(height - 1, Math.round(birdY)));
    grid[renderY][birdX] = '>';

    // Overlay 3-second countdown message if counting down
    let statusText = '';
    if (isCountingDown()) {
      const remaining = getRemainingSeconds();
      const message = `Starting in ${remaining}...`;
      const startCol = Math.floor((width - message.length) / 2);
      for (let i = 0; i < message.length; i++) {
        grid[4][startCol + i] = message[i];
      }
      statusText = ` Score: 0  |  Starting in ${remaining}...  |  [Q] Menu`;
    } else {
      statusText = ` Score: ${score}  |  [SPACE/UP] Flap  |  [Q] Menu`;
    }

    // Add borders
    const border = '+' + '-'.repeat(width) + '+';
    const lines = grid.map(row => '|' + row.join('') + '|');

    return [
      border,
      ...lines,
      border,
      statusText
    ].join('\n');
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
