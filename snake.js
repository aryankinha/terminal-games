// snake.js - Minimalistic Classic Snake for Terminal with input queue and ANSI colors

import { C, createEmptyGrid, wrapFrame, createCountdown, clamp } from './common.js';

export function createSnakeGame() {
  const width = 50;               // Grid width
  const height = 14;              // Grid height
  const countdown = createCountdown(3000);

  // Snake body initialized at center moving right
  let snake = [
    { x: 25, y: 7 },
    { x: 24, y: 7 },
    { x: 23, y: 7 }
  ];

  let dir = { dx: 1, dy: 0 };      // Current moving direction
  let inputQueue = [];             // 2-step input buffer for snappy, drop-free turns
  let food = null;
  let bomb = null;
  let score = 0;                   // Apples eaten score
  let gameOver = false;            // Game over flag
  let vTick = 0;                   // Vertical tick balancer

  // Get all empty coordinates not occupied by snake, food, or bomb
  function getEmptyCells(excludeFood = true, excludeBomb = true) {
    const occupied = new Set();
    for (const seg of snake) {
      occupied.add(`${seg.x},${seg.y}`);
    }
    if (excludeFood && food) occupied.add(`${food.x},${food.y}`);
    if (excludeBomb && bomb) occupied.add(`${bomb.x},${bomb.y}`);

    const free = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y });
        }
      }
    }
    return free;
  }

  // Spawn apple safely in an unoccupied cell
  function spawnFood() {
    const free = getEmptyCells(false, true);
    if (free.length === 0) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  // Spawn hazard bomb safely away from snake head (at least 4 steps away)
  function spawnBomb() {
    const free = getEmptyCells(true, false);
    if (free.length === 0) return null;

    const head = snake[0];
    const safeCells = free.filter(c => Math.abs(c.x - head.x) + Math.abs(c.y - head.y) >= 4);
    const pool = safeCells.length > 0 ? safeCells : free;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  food = spawnFood();
  bomb = spawnBomb();

  // Handle steering inputs (Arrow keys or WASD) with 2-step buffering
  function handleInput(key, str) {
    const keyName = key ? key.name : str;
    let req = null;

    if (keyName === 'up' || str === 'w' || str === 'W') {
      req = { dx: 0, dy: -1 };
    } else if (keyName === 'down' || str === 's' || str === 'S') {
      req = { dx: 0, dy: 1 };
    } else if (keyName === 'left' || str === 'a' || str === 'A') {
      req = { dx: -1, dy: 0 };
    } else if (keyName === 'right' || str === 'd' || str === 'D') {
      req = { dx: 1, dy: 0 };
    }

    if (!req) return;

    // Compare with the last requested direction in queue, or current dir
    const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : dir;

    // Prevent reversing 180° into self or repeating the exact same direction
    const isReverse = (lastDir.dx + req.dx === 0 && lastDir.dy + req.dy === 0);
    const isDuplicate = (lastDir.dx === req.dx && lastDir.dy === req.dy);

    if (!isReverse && !isDuplicate && inputQueue.length < 2) {
      inputQueue.push(req);
    }
  }

  // Advance game by one tick
  function update() {
    if (gameOver) return;
    if (countdown.isActive()) return;

    // Dequeue next direction turn
    if (inputQueue.length > 0) {
      dir = inputQueue.shift();
      if (dir.dy !== 0) vTick = 0; // Immediate response on vertical turn
    }

    // Terminal characters are ~2x taller than wide: update vertical motion every 2 ticks
    if (dir.dy !== 0) {
      vTick++;
      if (vTick % 2 !== 0) return;
    } else {
      vTick = 0;
    }

    // Calculate new head position with toroidal border wrapping
    const newHead = {
      x: (snake[0].x + dir.dx + width) % width,
      y: (snake[0].y + dir.dy + height) % height
    };

    // Bomb collision check (kills the snake)
    if (bomb && newHead.x === bomb.x && newHead.y === bomb.y) {
      gameOver = true;
      return;
    }

    // Self collision check (hitting own body)
    const selfHit = snake.some(seg => seg.x === newHead.x && seg.y === newHead.y);
    if (selfHit) {
      gameOver = true;
      return;
    }

    // Check if apple is eaten
    if (food && newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      snake.unshift(newHead); // Grow snake
      food = spawnFood();
      bomb = spawnBomb();
    } else {
      snake.unshift(newHead); // Move head forward
      snake.pop();            // Remove tail
    }
  }

  // Render current frame
  function render() {
    const grid = createEmptyGrid(width, height);

    // Draw apple (@) in bright red
    if (food && food.y >= 0 && food.y < height && food.x >= 0 && food.x < width) {
      grid[food.y][food.x] = `${C.bold}${C.brightRed}@${C.reset}`;
    }

    // Draw hazard bomb (X) in high-contrast yellow/red
    if (bomb && bomb.y >= 0 && bomb.y < height && bomb.x >= 0 && bomb.x < width) {
      grid[bomb.y][bomb.x] = `${C.bold}${C.red}X${C.reset}`;
    }

    // Draw snake body (o) in green
    for (let i = 1; i < snake.length; i++) {
      const seg = snake[i];
      if (seg.y >= 0 && seg.y < height && seg.x >= 0 && seg.x < width) {
        grid[seg.y][seg.x] = `${C.green}o${C.reset}`;
      }
    }

    // Draw snake head (O) in bold bright green
    const head = snake[0];
    if (head.y >= 0 && head.y < height && head.x >= 0 && head.x < width) {
      grid[head.y][head.x] = `${C.bold}${C.brightGreen}O${C.reset}`;
    }

    // Overlay countdown message if still in pre-game countdown
    countdown.overlay(grid, width, 4);

    let statusText = '';
    if (countdown.isActive()) {
      const remaining = countdown.getSecondsRemaining();
      statusText = ` ${C.yellow}Score: 0${C.reset}  |  ${C.bold}Starting in ${remaining}...${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    } else {
      statusText = ` ${C.yellow}Score: ${score}${C.reset}  |  ${C.brightRed}[@] Apple${C.reset}  ${C.red}[X] Bomb${C.reset}  |  ${C.brightCyan}[ARROWS/WASD] Move${C.reset}  |  ${C.gray}[Q] Menu${C.reset}`;
    }

    return wrapFrame(grid, width, statusText, C.cyan);
  }

  return {
    interval: 80, // Responsive tick rate
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => score
  };
}
