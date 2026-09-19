// dino.js - Minimalistic Dinosaur Runner for Terminal

export function createDinoGame() {
  const width = 32;       // Screen width
  const height = 6;       // Screen height
  const groundRow = 5;    // Bottom row for the ground
  const dinoX = 4;        // Dino horizontal position

  let dinoY = 0;          // Height off the ground (0 = on ground, >0 = jumping)
  let vy = 0;             // Vertical velocity for jumping
  let obstacles = [];     // Array of obstacle x positions
  let score = 0;          // Distance/survival score
  let gameOver = false;   // Game over flag
  let tick = 0;           // Frame counter

  // Handle jump input
  function handleInput(key, str) {
    const isJump = (key && (key.name === 'space' || key.name === 'up')) || str === ' ' || str === '\u0020';
    if (isJump && dinoY === 0) {
      vy = 1.3; // Initial jump impulse
    }
  }

  // Update physics, obstacles, and collision
  function update() {
    if (gameOver) return;

    // Apply jumping physics
    if (dinoY > 0 || vy > 0) {
      dinoY += vy;
      vy -= 0.3; // Gravity pull down
      if (dinoY <= 0) {
        dinoY = 0;
        vy = 0;
      }
    }

    tick++;
    score++;

    // Random obstacle spawning with safe minimum distance (12 columns)
    const lastObstacle = obstacles[obstacles.length - 1];
    const canSpawn = !lastObstacle || (width - 1 - lastObstacle.x > 12);
    if (canSpawn && Math.random() < 0.12) {
      obstacles.push({ x: width - 1 });
    }

    // Move obstacles left
    for (const obs of obstacles) {
      obs.x -= 1;
    }

    // Remove obstacles that exited the screen
    obstacles = obstacles.filter(obs => obs.x >= 0);

    // Collision check: Dino hit if obstacle reaches dinoX while dino is on ground
    for (const obs of obstacles) {
      if (obs.x === dinoX && Math.round(dinoY) === 0) {
        gameOver = true;
        return;
      }
    }
  }

  // Render the current game frame
  function render() {
    // Initialize blank screen
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width).fill(' ');
    }

    // Draw ground
    for (let x = 0; x < width; x++) {
      grid[groundRow][x] = '=';
    }

    // Draw obstacles (cacti: '^') on the ground
    for (const obs of obstacles) {
      if (obs.x >= 0 && obs.x < width) {
        grid[groundRow - 1][obs.x] = '^';
      }
    }

    // Draw dino: 'D' at appropriate jump height
    const currentY = Math.max(0, (groundRow - 1) - Math.round(dinoY));
    grid[currentY][dinoX] = 'D';

    // Add borders
    const border = '+' + '-'.repeat(width) + '+';
    const lines = grid.map(row => '|' + row.join('') + '|');

    return [
      border,
      ...lines,
      border,
      ` Score: ${Math.floor(score / 2)}  |  [SPACE/UP] Jump  |  [Q] Menu`
    ].join('\n');
  }

  return {
    interval: 80,
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => Math.floor(score / 2)
  };
}
