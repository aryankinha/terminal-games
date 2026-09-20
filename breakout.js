// breakout.js - Minimalistic Classic Breakout with 3 lives, realistic side-bounces, and ANSI colors

import { C, createEmptyGrid, wrapFrame, createCountdown, clamp } from './common.js';

export function createBreakoutGame() {
  const width = 50;               // Playfield width
  const height = 14;              // Playfield height
  const paddleW = 8;              // Paddle width in characters
  const paddleY = height - 2;     // Fixed paddle row (row 12)
  const countdown = createCountdown(3000);

  let paddleX = Math.floor((width - paddleW) / 2); // Centered paddle
  let ballX = 25;                 // Ball X coordinate
  let ballY = paddleY - 1;        // Ball Y coordinate
  let vx = 0.7;                   // Horizontal velocity
  let vy = -0.45;                 // Vertical velocity
  let score = 0;                  // Score
  let lives = 3;                  // 3 Lives system
  let gameOver = false;           // Game over flag

  // 3 rows of bricks (9 bricks per row = 27 bricks)
  let bricks = [];
  function initBricks() {
    bricks = [];
    for (let row = 1; row <= 3; row++) {
      const color = (row === 1) ? C.brightRed : (row === 2 ? C.brightYellow : C.brightCyan);
      const points = (row === 1) ? 15 : (row === 2 ? 10 : 5);
      for (let b = 0; b < 9; b++) {
        bricks.push({
          x: 3 + b * 5, // 4-char brick + 1 space gap
          y: row,
          w: 4,
          color,
          points,
          alive: true
        });
      }
    }
  }
  initBricks();

  // Reset ball position onto paddle with a quick 2-second serve countdown
  function resetBall() {
    paddleX = Math.floor((width - paddleW) / 2);
    ballX = paddleX + Math.floor(paddleW / 2);
    ballY = paddleY - 1;
    vx = (Math.random() < 0.5 ? 1 : -1) * 0.7;
    vy = -0.45;
    countdown.start(2000);
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
    if (countdown.isActive()) {
      ballX = paddleX + Math.floor(paddleW / 2);
      ballY = paddleY - 1;
      return;
    }

    const prevX = ballX;
    const prevY = ballY;

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
    if (ballY >= paddleY - 0.6 && ballY <= paddleY + 0.5 && vy > 0) {
      if (ballX >= paddleX - 0.5 && ballX <= paddleX + paddleW + 0.5) {
        vy = -Math.abs(vy);

        // Adjust horizontal angle based on where ball hits the paddle
        const hitOffset = (ballX - (paddleX + paddleW / 2)) / (paddleW / 2);
        vx = hitOffset * 0.85;
        if (Math.abs(vx) < 0.25) vx = vx < 0 ? -0.3 : 0.3;
      }
    }

    // Brick collision check with realistic side-impact vs vertical bounce
    const rBallY = Math.round(ballY);
    for (const brick of bricks) {
      if (brick.alive) {
        if (rBallY === brick.y && ballX >= brick.x - 0.5 && ballX <= brick.x + brick.w + 0.5) {
          brick.alive = false;
          score += brick.points;

          // Check if ball hit the side or top/bottom of the brick
          const wasOutsideX = prevX < brick.x || prevX > brick.x + brick.w;
          if (wasOutsideX) {
            vx = -vx;
          } else {
            vy = -vy;
          }
          break;
        }
      }
    }

    // Check if all bricks are cleared (Level cleared bonus!)
    const aliveCount = bricks.filter(b => b.alive).length;
    if (aliveCount === 0) {
      score += 50;
      initBricks();
      resetBall();
      // Progressive speed boost
      vx *= 1.1;
      vy = -Math.abs(vy) * 1.1;
    }

    // Ball fell below screen -> lose life
    if (ballY >= height) {
      lives--;
      if (lives > 0) {
        resetBall();
      } else {
        gameOver = true;
      }
    }
  }

  // Render current frame
  function render() {
    const grid = createEmptyGrid(width, height);

    // Draw bricks with their respective row colors
    for (const brick of bricks) {
      if (brick.alive) {
        grid[brick.y][brick.x] = `${brick.color}[`;
        grid[brick.y][brick.x + 1] = '#';
        grid[brick.y][brick.x + 2] = '#';
        grid[brick.y][brick.x + 3] = `]${C.reset}`;
      }
    }

    // Draw paddle
    for (let i = 0; i < paddleW; i++) {
      grid[paddleY][paddleX + i] = `${C.bold}${C.white}=${C.reset}`;
    }

    // Draw ball (O) in bright bold white
    const rX = clamp(Math.round(ballX), 0, width - 1);
    const rY = clamp(Math.round(ballY), 0, height - 1);
    grid[rY][rX] = `${C.bold}${C.brightWhite}O${C.reset}`;

    // Countdown overlay
    countdown.overlay(grid, width, 6);

    let statusText = '';
    const aliveCount = bricks.filter(b => b.alive).length;
    const hearts = `${C.brightRed}${'♥ '.repeat(lives)}${C.gray}${'♡ '.repeat(Math.max(0, 3 - lives))}${C.reset}`;

    if (countdown.isActive()) {
      const remaining = countdown.getSecondsRemaining();
      statusText = ` ${C.yellow}Score: ${score}${C.reset}  |  Lives: ${hearts} |  ${C.bold}Starting in ${remaining}...${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    } else {
      statusText = ` ${C.yellow}Score: ${score}${C.reset}  |  Lives: ${hearts} |  ${C.brightCyan}[←/→, A/D] Move${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    }

    return wrapFrame(grid, width, statusText, C.cyan);
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
