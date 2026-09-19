// breakout.js - Minimalistic Classic Breakout for Terminal

export function createBreakoutGame() {
  const width = 50;               // Playfield width
  const height = 14;              // Playfield height
  const paddleW = 8;              // Paddle width in characters
  const paddleY = height - 2;     // Fixed paddle row (row 12)
  const countdownDuration = 3000; // 3-second countdown before ball launches

  let paddleX = Math.floor((width - paddleW) / 2); // Centered paddle
  let ballX = 25;                 // Ball X coordinate
  let ballY = paddleY - 1;        // Ball Y coordinate (rests above paddle)
  let vx = 0.7;                   // Horizontal velocity
  let vy = -0.45;                 // Vertical velocity (scaled for terminal aspect ratio)
  let score = 0;                  // Score
  let gameOver = false;           // Game over flag
  const startTime = Date.now();   // Countdown timer start

  // Initialize 3 rows of bricks (9 bricks per row = 27 bricks)
  let bricks = [];
  function initBricks() {
    bricks = [];
    for (let row = 1; row <= 3; row++) {
      for (let b = 0; b < 9; b++) {
        bricks.push({
          x: 3 + b * 5, // 4-char brick + 1 space
          y: row,
          w: 4,
          alive: true
        });
      }
    }
  }
  initBricks();

  // Check if currently in 3-second countdown
  function isCountingDown() {
    return (Date.now() - startTime) < countdownDuration;
  }

  // Remaining seconds for countdown (3, 2, 1)
  function getRemainingSeconds() {
    const elapsed = Date.now() - startTime;
    return Math.max(1, Math.ceil((countdownDuration - elapsed) / 1000));
  }

  // Handle steering inputs (Arrow keys or A/D)
  function handleInput(key, str) {
    const keyName = key ? key.name : str;

    if (keyName === 'left' || str === 'a' || str === 'A') {
      paddleX = Math.max(0, paddleX - 3);
    } else if (keyName === 'right' || str === 'd' || str === 'D') {
      paddleX = Math.min(width - paddleW, paddleX + 3);
    }
  }

  // Update ball movement, paddle hits, and brick collisions
  function update() {
    if (gameOver) return;

    // During countdown, keep ball on the paddle
    if (isCountingDown()) {
      ballX = paddleX + Math.floor(paddleW / 2);
      ballY = paddleY - 1;
      return;
    }

    // Move ball
    ballX += vx;
    ballY += vy;

    // Bounce off left & right walls
    if (ballX <= 0) {
      ballX = 0;
      vx = Math.abs(vx);
    } else if (ballX >= width - 1) {
      ballX = width - 1;
      vx = -Math.abs(vx);
    }

    // Bounce off ceiling
    if (ballY <= 0) {
      ballY = 0;
      vy = Math.abs(vy);
    }

    // Paddle collision
    if (ballY >= paddleY - 0.6 && ballY <= paddleY + 0.4 && vy > 0) {
      if (ballX >= paddleX - 0.5 && ballX <= paddleX + paddleW + 0.5) {
        vy = -Math.abs(vy);

        // Adjust horizontal angle based on where ball hits the paddle
        const hitOffset = (ballX - (paddleX + paddleW / 2)) / (paddleW / 2);
        vx = hitOffset * 0.85;
        if (Math.abs(vx) < 0.25) vx = vx < 0 ? -0.3 : 0.3;
      }
    }

    // Brick collision check
    const rBallY = Math.round(ballY);
    for (const brick of bricks) {
      if (brick.alive) {
        if (rBallY === brick.y && ballX >= brick.x - 0.5 && ballX <= brick.x + brick.w + 0.5) {
          brick.alive = false;
          score += 10;
          vy = -vy; // Reverse vertical direction
          break;
        }
      }
    }

    // Check if all bricks are cleared (Level cleared bonus!)
    const aliveCount = bricks.filter(b => b.alive).length;
    if (aliveCount === 0) {
      score += 50;
      initBricks(); // Respawn bricks
      // Slight speed boost
      vx *= 1.1;
      vy = -Math.abs(vy) * 1.1;
    }

    // Ball fell below screen -> Game Over
    if (ballY >= height) {
      gameOver = true;
    }
  }

  // Render current frame
  function render() {
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width).fill(' ');
    }

    // Draw bricks
    for (const brick of bricks) {
      if (brick.alive) {
        grid[brick.y][brick.x] = '[';
        grid[brick.y][brick.x + 1] = '#';
        grid[brick.y][brick.x + 2] = '#';
        grid[brick.y][brick.x + 3] = ']';
      }
    }

    // Draw paddle
    for (let i = 0; i < paddleW; i++) {
      grid[paddleY][paddleX + i] = '=';
    }

    // Draw ball (O)
    const rX = Math.max(0, Math.min(width - 1, Math.round(ballX)));
    const rY = Math.max(0, Math.min(height - 1, Math.round(ballY)));
    grid[rY][rX] = 'O';

    // Countdown overlay
    let statusText = '';
    const aliveCount = bricks.filter(b => b.alive).length;

    if (isCountingDown()) {
      const remaining = getRemainingSeconds();
      const message = `Starting in ${remaining}...`;
      const startCol = Math.floor((width - message.length) / 2);
      for (let i = 0; i < message.length; i++) {
        grid[6][startCol + i] = message[i];
      }
      statusText = ` Score: 0  |  Starting in ${remaining}...  |  [Q] Menu`;
    } else {
      statusText = ` Score: ${score}  |  Bricks: ${aliveCount}  |  [←/→, A/D] Move  |  [Q] Menu`;
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
    interval: 65, // Fast smooth ball update (~15 FPS)
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => score
  };
}
