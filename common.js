// common.js - Shared utilities, ANSI color system, and game frame rendering

export const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  reverse: '\x1b[7m',
  blink: '\x1b[5m',

  // Standard foregrounds
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright foregrounds
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m'
};

// Math helper to clamp numbers
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Create empty 2D character grid
export function createEmptyGrid(width, height, fillChar = ' ') {
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid[y] = new Array(width).fill(fillChar);
  }
  return grid;
}

// Wrap a grid with ANSI border lines and a status bar
export function wrapFrame(grid, width, statusLine, borderColor = C.cyan) {
  const horizontal = `${borderColor}+${'-'.repeat(width)}+${C.reset}`;
  const lines = grid.map(row => `${borderColor}|${C.reset}${row.join('')}${borderColor}|${C.reset}`);
  return [horizontal, ...lines, horizontal, statusLine].join('\n');
}

// Standardized 3-second pre-game countdown
export function createCountdown(durationMs = 3000) {
  let startTime = Date.now();
  let duration = durationMs;

  return {
    start(newDuration = durationMs) {
      startTime = Date.now();
      duration = newDuration;
    },
    isActive() {
      return (Date.now() - startTime) < duration;
    },
    getSecondsRemaining() {
      const elapsed = Date.now() - startTime;
      return Math.max(1, Math.ceil((duration - elapsed) / 1000));
    },
    overlay(grid, width, row = 4) {
      if (!this.isActive()) return;
      const remaining = this.getSecondsRemaining();
      const msg = `Starting in ${remaining}...`;
      const startCol = Math.floor((width - msg.length) / 2);
      for (let i = 0; i < msg.length; i++) {
        grid[row][startCol + i] = `${C.bold}${C.brightYellow}${msg[i]}${C.reset}`;
      }
    }
  };
}
