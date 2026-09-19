// snake.js - Minimalistic Classic Snake for Terminal

export function createSnakeGame() {
  const width = 50;               // Grid width (matching 50 characters)
  const height = 14;              // Grid height
  const countdownDuration = 3000; // 3-second countdown before snake starts moving

  // Snake body initialized at center moving right
  let snake = [
    { x: 25, y: 7 },
    { x: 24, y: 7 },
    { x: 23, y: 7 }
  ];

  let dir = { dx: 1, dy: 0 };      // Current moving direction
  let nextDir = { dx: 1, dy: 0 };  // Buffered next direction
  let food = spawnFood();          // Current apple position
  let bomb = spawnBomb();          // Hazard bomb position
  let score = 0;                   // Apples eaten score
  let gameOver = false;            // Game over flag
  let vTick = 0;                   // Vertical tick counter to balance vertical vs horizontal speed
  const startTime = Date.now();   // Session start timestamp for countdown

  // Spawn apple at a random position not occupied by the snake
  function spawnFood() {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (width - 2)) + 1,
        y: Math.floor(Math.random() * (height - 2)) + 1
      };
      const collision = snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      if (!collision) break;
    }
    return newFood;
  }

  // Spawn bomb at a random position away from snake and food
  function spawnBomb() {
    let newBomb;
    while (true) {
      newBomb = {
        x: Math.floor(Math.random() * (width - 2)) + 1,
        y: Math.floor(Math.random() * (height - 2)) + 1
      };
      const onSnake = snake.some(seg => seg.x === newBomb.x && seg.y === newBomb.y);
      const onFood = (food && food.x === newBomb.x && food.y === newBomb.y);
      if (!onSnake && !onFood) break;
    }
    return newBomb;
  }

  // Check if still in initial 3-second countdown
  function isCountingDown() {
    return (Date.now() - startTime) < countdownDuration;
  }

  // Remaining seconds (3, 2, 1)
  function getRemainingSeconds() {
    const elapsed = Date.now() - startTime;
    return Math.max(1, Math.ceil((countdownDuration - elapsed) / 1000));
  }

  // Handle steering inputs (Arrow keys or WASD)
  function handleInput(key, str) {
    const keyName = key ? key.name : str;

    if (keyName === 'up' || str === 'w' || str === 'W') {
      if (dir.dy === 0) {
        nextDir = { dx: 0, dy: -1 };
        vTick = 0; // Immediate response on vertical turn
      }
    } else if (keyName === 'down' || str === 's' || str === 'S') {
      if (dir.dy === 0) {
        nextDir = { dx: 0, dy: 1 };
        vTick = 0; // Immediate response on vertical turn
      }
    } else if (keyName === 'left' || str === 'a' || str === 'A') {
      if (dir.dx === 0) nextDir = { dx: -1, dy: 0 };
    } else if (keyName === 'right' || str === 'd' || str === 'D') {
      if (dir.dx === 0) nextDir = { dx: 1, dy: 0 };
    }
  }

  // Advance game by one tick
  function update() {
    if (gameOver) return;
    if (isCountingDown()) return;

    // Apply buffered direction
    dir = nextDir;

    // Smooth vertical speed: terminal characters are ~2x taller than wide,
    // so update vertical movement every 2 ticks to match visual horizontal pace
    if (dir.dy !== 0) {
      vTick++;
      if (vTick % 2 !== 0) return;
    } else {
      vTick = 0;
    }

    // Calculate new head position with border wrapping (toroidal field)
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
    if (newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      snake.unshift(newHead); // Grow snake by not removing tail
      food = spawnFood();     // Spawn next apple
      bomb = spawnBomb();     // Relocate bomb to a fresh position
    } else {
      snake.unshift(newHead); // Move head forward
      snake.pop();            // Remove tail segment
    }
  }

  // Render the current game frame
  function render() {
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width).fill(' ');
    }

    // Draw apple (@)
    if (food.y >= 0 && food.y < height && food.x >= 0 && food.x < width) {
      grid[food.y][food.x] = '@';
    }

    // Draw bomb (X)
    if (bomb && bomb.y >= 0 && bomb.y < height && bomb.x >= 0 && bomb.x < width) {
      grid[bomb.y][bomb.x] = 'X';
    }

    // Draw snake body (o)
    for (let i = 1; i < snake.length; i++) {
      const seg = snake[i];
      if (seg.y >= 0 && seg.y < height && seg.x >= 0 && seg.x < width) {
        grid[seg.y][seg.x] = 'o';
      }
    }

    // Draw snake head (O)
    const head = snake[0];
    if (head.y >= 0 && head.y < height && head.x >= 0 && head.x < width) {
      grid[head.y][head.x] = 'O';
    }

    // Overlay countdown message if still in ready countdown
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
      statusText = ` Score: ${score}  |  Apple: [@]  Bomb: [X]  |  [ARROWS/WASD] Move  |  [Q] Menu`;
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
    interval: 80, // Fast, responsive tick rate
    handleInput,
    update,
    render,
    isGameOver: () => gameOver,
    getScore: () => score
  };
}
