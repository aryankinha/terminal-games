#!/usr/bin/env node

// index.js - Terminal Arcade Hub Launcher

import readline from 'readline';
import fs from 'fs';
import { createFlappyGame } from './flappy.js';
import { createDinoGame } from './dino.js';
import { createSnakeGame } from './snake.js';
import { createBreakoutGame } from './breakout.js';

// --- High Scores (Persistent in local scores.json) ---
const SCORES_FILE = './scores.json';
let highScores = { flappy: 0, dino: 0, snake: 0, breakout: 0 };

try {
  if (fs.existsSync(SCORES_FILE)) {
    const loaded = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
    highScores = { ...highScores, ...loaded };
  }
} catch (e) {
  // If file doesn't exist or is invalid, use defaults
}

function saveScores() {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(highScores, null, 2));
  } catch (e) {}
}

// --- Application State ---
let state = 'MENU';           // 'MENU' | 'PLAYING' | 'GAMEOVER'
let currentGameId = null;     // 'flappy' | 'dino' | 'snake' | 'breakout'
let currentGameName = '';     // Display name
let activeGame = null;        // Active game instance
let lastScore = 0;            // Last game score
let gameOverTimestamp = 0;    // Prevent accidental keypress skips on game over
let selectedMenuIndex = 0;    // Interactive menu slide bar (0..4)

// --- Terminal & Raw Input Setup ---
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdout.write('\x1b[?25l'); // Hide cursor

// Cleanly restore terminal on exit
function cleanupAndExit() {
  process.stdout.write('\x1b[?25h'); // Restore cursor
  process.stdout.write('\x1b[2J\x1b[H'); // Clear screen
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.exit();
}

// Catch unexpected errors to prevent silent exit
process.on('uncaughtException', (err) => {
  process.stdout.write('\x1b[?25h\n');
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  console.error('An error occurred:', err);
  process.exit(1);
});

// Start a chosen game
function startGame(id, name, gameFactory) {
  currentGameId = id;
  currentGameName = name;
  activeGame = gameFactory();
  state = 'PLAYING';
  process.stdout.write('\x1b[2J\x1b[H'); // Clean screen before game begins
}

// Return to the main menu
function returnToMenu() {
  state = 'MENU';
  activeGame = null;
  process.stdout.write('\x1b[2J\x1b[H');
}

// Format each menu item with an interactive highlight slide bar
function formatMenuItem(idx, title, extra = '') {
  const isSelected = selectedMenuIndex === idx;
  const prefix = isSelected ? ' ▶ [ ' : '     ';
  const suffix = isSelected ? ' ]' : '  ';
  const label = (prefix + title + suffix).padEnd(26);
  const scoreStr = extra ? extra.padEnd(20) : ''.padEnd(20);
  const rawText = (label + scoreStr).padEnd(48);

  if (isSelected) {
    // Reverse video creates a filled, highlighted selection bar
    return '| \x1b[7m' + rawText + '\x1b[0m |';
  } else {
    return '| ' + rawText + ' |';
  }
}

// Main Menu Screen (width 50)
function renderMenu() {
  const lines = [
    '+--------------------------------------------------+',
    '|               TERMINAL ARCADE HUB                |',
    '+--------------------------------------------------+',
    '|                                                  |',
    formatMenuItem(0, '1. Flappy Bird', `(High: ${highScores.flappy || 0})`),
    formatMenuItem(1, '2. Dino Runner', `(High: ${highScores.dino || 0})`),
    formatMenuItem(2, '3. Snake Game',  `(High: ${highScores.snake || 0})`),
    formatMenuItem(3, '4. Breakout',    `(High: ${highScores.breakout || 0})`),
    formatMenuItem(4, 'Q. Quit'),
    '|                                                  |',
    '+--------------------------------------------------+',
    '  [↑/↓] Slide  |  [ENTER/SPACE] Select  |  [Q] Quit'
  ];
  return lines.join('\n');
}

// Game Over Screen (width 50)
function renderGameOver() {
  const lines = [
    '+--------------------------------------------------+',
    '|                    GAME OVER!                    |',
    '+--------------------------------------------------+',
    '|                                                  |',
    `|   Game:        ${currentGameName.padEnd(33)} |`,
    `|   Final Score: ${String(lastScore).padEnd(33)} |`,
    `|   High Score:  ${String(highScores[currentGameId] || 0).padEnd(33)} |`,
    '|                                                  |',
    '+--------------------------------------------------+',
    '  [SPACE/ENTER] Play Again  |  [Q/M/ESC] Menu'
  ];
  return lines.join('\n');
}

// --- Input Event Router ---
process.stdin.on('keypress', (str, key) => {
  // Always handle Ctrl+C
  if (key && key.ctrl && key.name === 'c') {
    cleanupAndExit();
  }

  const keyName = key ? key.name : str;

  if (state === 'MENU') {
    // Slide bar navigation with arrow keys or W/S
    if (keyName === 'up' || str === 'w' || str === 'W') {
      selectedMenuIndex = (selectedMenuIndex + 4) % 5;
    } else if (keyName === 'down' || str === 's' || str === 'S') {
      selectedMenuIndex = (selectedMenuIndex + 1) % 5;
    } else if (str === '1') {
      selectedMenuIndex = 0;
      startGame('flappy', 'Flappy Bird', createFlappyGame);
    } else if (str === '2') {
      selectedMenuIndex = 1;
      startGame('dino', 'Dino Runner', createDinoGame);
    } else if (str === '3') {
      selectedMenuIndex = 2;
      startGame('snake', 'Snake Game', createSnakeGame);
    } else if (str === '4') {
      selectedMenuIndex = 3;
      startGame('breakout', 'Breakout', createBreakoutGame);
    } else if (str === 'q' || str === 'Q') {
      cleanupAndExit();
    } else if (keyName === 'return' || keyName === 'enter' || keyName === 'space' || str === ' ') {
      // Launch highlighted game
      if (selectedMenuIndex === 0) {
        startGame('flappy', 'Flappy Bird', createFlappyGame);
      } else if (selectedMenuIndex === 1) {
        startGame('dino', 'Dino Runner', createDinoGame);
      } else if (selectedMenuIndex === 2) {
        startGame('snake', 'Snake Game', createSnakeGame);
      } else if (selectedMenuIndex === 3) {
        startGame('breakout', 'Breakout', createBreakoutGame);
      } else if (selectedMenuIndex === 4) {
        cleanupAndExit();
      }
    }
  } else if (state === 'PLAYING') {
    if (str === 'q' || str === 'Q') {
      returnToMenu();
    } else if (activeGame) {
      activeGame.handleInput(key, str);
    }
  } else if (state === 'GAMEOVER') {
    // 400ms debounce to prevent buffered flap/jump keys from skipping game over screen
    if (Date.now() - gameOverTimestamp < 400) return;

    // Space or Enter restarts the game immediately
    if (keyName === 'return' || keyName === 'enter' || keyName === 'space' || str === ' ') {
      if (currentGameId === 'flappy') {
        startGame('flappy', 'Flappy Bird', createFlappyGame);
      } else if (currentGameId === 'dino') {
        startGame('dino', 'Dino Runner', createDinoGame);
      } else if (currentGameId === 'snake') {
        startGame('snake', 'Snake Game', createSnakeGame);
      } else if (currentGameId === 'breakout') {
        startGame('breakout', 'Breakout', createBreakoutGame);
      }
    } else if (str === 'q' || str === 'Q' || str === 'm' || str === 'M' || keyName === 'escape' || str === '\u001b') {
      // Q, M, or ESC returns to the main menu
      returnToMenu();
    }
  }
});

// --- Main Engine Loop (dynamic speed per game) ---
function runLoop() {
  let delay = 75;

  if (state === 'MENU') {
    process.stdout.write('\x1b[H' + renderMenu() + '\n');
  } else if (state === 'PLAYING' && activeGame) {
    delay = activeGame.interval || 85;
    activeGame.update();

    if (activeGame.isGameOver()) {
      lastScore = activeGame.getScore();
      if (lastScore > (highScores[currentGameId] || 0)) {
        highScores[currentGameId] = lastScore;
        saveScores();
      }
      state = 'GAMEOVER';
      gameOverTimestamp = Date.now();
      process.stdout.write('\x1b[2J\x1b[H'); // Clear for game over screen
    } else {
      process.stdout.write('\x1b[H' + activeGame.render() + '\n');
    }
  } else if (state === 'GAMEOVER') {
    process.stdout.write('\x1b[H' + renderGameOver() + '\n');
  }

  setTimeout(runLoop, delay);
}

runLoop();
