#!/usr/bin/env node

// index.js - Terminal Arcade Hub Launcher

import readline from 'readline';
import fs from 'fs';
import { createDinoGame } from './dino.js';

// --- High Scores (Persistent in local scores.json) ---
const SCORES_FILE = './scores.json';
let highScores = { flappy: 0, dino: 0 };

try {
  if (fs.existsSync(SCORES_FILE)) {
    highScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  }
} catch (e) {}

function saveScores() {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(highScores, null, 2));
  } catch (e) {}
}

// --- Application State ---
let state = 'MENU';           // 'MENU' | 'PLAYING' | 'GAMEOVER'
let currentGameId = null;     // 'dino'
let currentGameName = '';     // Display name
let activeGame = null;        // Active game instance
let lastScore = 0;            // Last game score

// --- Terminal & Raw Input Setup ---
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdout.write('\x1b[?25l'); // Hide cursor

function cleanupAndExit() {
  process.stdout.write('\x1b[?25h');
  process.stdout.write('\x1b[2J\x1b[H');
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.exit();
}

function startGame(id, name, gameFactory) {
  currentGameId = id;
  currentGameName = name;
  activeGame = gameFactory();
  state = 'PLAYING';
  process.stdout.write('\x1b[2J\x1b[H');
}

function returnToMenu() {
  state = 'MENU';
  activeGame = null;
  process.stdout.write('\x1b[2J\x1b[H');
}

// Main Menu Screen
function renderMenu() {
  const lines = [
    '+--------------------------------+',
    '|      TERMINAL ARCADE HUB       |',
    '+--------------------------------+',
    '|                                |',
    `|  1. Flappy Bird (Coming Soon)  |`,
    `|  2. Dino Runner (High: ${String(highScores.dino || 0).padEnd(4)})   |`,
    '|  Q. Quit                       |',
    '|                                |',
    '+--------------------------------+',
    ' Select [2] to play Dino | [Q] to quit'
  ];
  return lines.join('\n');
}

// Game Over Screen
function renderGameOver() {
  const lines = [
    '+--------------------------------+',
    '|           GAME OVER!           |',
    '+--------------------------------+',
    '|                                |',
    `|  Game:        ${currentGameName.padEnd(16)} |`,
    `|  Final Score: ${String(lastScore).padEnd(16)} |`,
    `|  High Score:  ${String(highScores[currentGameId] || 0).padEnd(16)} |`,
    '|                                |',
    '+--------------------------------+',
    ' Press [SPACE] or [ENTER] for Menu'
  ];
  return lines.join('\n');
}

// --- Input Event Router ---
process.stdin.on('keypress', (str, key) => {
  if (key && key.ctrl && key.name === 'c') {
    cleanupAndExit();
  }

  const keyName = key ? key.name : str;

  if (state === 'MENU') {
    if (str === '2') {
      startGame('dino', 'Dino Runner', createDinoGame);
    } else if (str === 'q' || str === 'Q') {
      cleanupAndExit();
    }
  } else if (state === 'PLAYING') {
    if (str === 'q' || str === 'Q') {
      returnToMenu();
    } else if (activeGame) {
      activeGame.handleInput(key, str);
    }
  } else if (state === 'GAMEOVER') {
    if (keyName === 'return' || keyName === 'enter' || keyName === 'space' || str === ' ' || str === 'q' || str === 'Q') {
      returnToMenu();
    }
  }
});

// --- Engine Loop ---
function runLoop() {
  let delay = 75;

  if (state === 'MENU') {
    process.stdout.write('\x1b[H' + renderMenu() + '\n');
  } else if (state === 'PLAYING' && activeGame) {
    delay = activeGame.interval || 80;
    activeGame.update();

    if (activeGame.isGameOver()) {
      lastScore = activeGame.getScore();
      if (lastScore > (highScores[currentGameId] || 0)) {
        highScores[currentGameId] = lastScore;
        saveScores();
      }
      state = 'GAMEOVER';
      process.stdout.write('\x1b[2J\x1b[H');
    } else {
      process.stdout.write('\x1b[H' + activeGame.render() + '\n');
    }
  } else if (state === 'GAMEOVER') {
    process.stdout.write('\x1b[H' + renderGameOver() + '\n');
  }

  setTimeout(runLoop, delay);
}

runLoop();
