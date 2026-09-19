#!/usr/bin/env node

// index.js - Terminal Arcade Hub Launcher

import readline from 'readline';
import fs from 'fs';

// --- High Scores (Persistent in local scores.json) ---
const SCORES_FILE = './scores.json';
let highScores = { flappy: 0, dino: 0 };

try {
  if (fs.existsSync(SCORES_FILE)) {
    highScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  }
} catch (e) {
  // Use defaults
}

function saveScores() {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(highScores, null, 2));
  } catch (e) {}
}

// --- Application State ---
let state = 'MENU';
let currentGameId = null;
let currentGameName = '';
let activeGame = null;
let lastScore = 0;

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
    `|  1. Flappy Bird (High: ${String(highScores.flappy || 0).padEnd(4)})   |`,
    `|  2. Dino Runner (High: ${String(highScores.dino || 0).padEnd(4)})   |`,
    '|  Q. Quit                       |',
    '|                                |',
    '+--------------------------------+',
    ' Select [1] or [2] to play | [Q] to quit'
  ];
  return lines.join('\n');
}

// --- Input Event Router ---
process.stdin.on('keypress', (str, key) => {
  if (key && key.ctrl && key.name === 'c') {
    cleanupAndExit();
  }

  if (state === 'MENU') {
    if (str === 'q' || str === 'Q') {
      cleanupAndExit();
    }
  }
});

// --- Engine Loop ---
setInterval(() => {
  if (state === 'MENU') {
    process.stdout.write('\x1b[H' + renderMenu() + '\n');
  }
}, 75);
