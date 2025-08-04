const canvas = document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');

const groundY = 550;
const worldWidth = 3000;
let scrollX = 0;
let lastTime = 0;
let isGameOver = false;
let isGameClear = false;
let isFallingInHole = false;
const keys = {};

const marikoImg = new Image(); marikoImg.src = 'aa0f1de1-65f8-42fc-86f0-fd38917296a9.png';
const blockImg = new Image(); blockImg.src = 'block.png';
const goalImg = new Image(); goalImg.src = '8re7l5pj.jpg';

const mariko = {
  x: 50, y: 300,
  width: 80, height: 120,
  vx: 0, vy: 0,
  speed: 5, jump: 15, gravity: 0.8,
  isOnGround: false
};

const blocks = [
  { x: 400, y: 450, width: 100, height: 30 },
  { x: 600, y: 400, width: 100, height: 30 },
  { x: 1800, y: 350, width: 100, height: 30 },
];

const holes = [
  { x: 1200, width: 120 }, 
];

const enemies = [
  { x: 800, y: 520, width: 40, height: 40, vx: 1, minX: 750, maxX: 950 },
  { x: 1400, y: 520, width: 40, height: 40, vx: 1, minX: 1350, maxX: 1550 },
];

const thwomps = [
  { x: 1800, y: 50, width: 80, height: 80, vy: 2, top: 50, direction: 1 },
];

const goal = { x: 2800, y: 450, width: 50, height: 100 };

window.addEventListener('keydown', e => {
  if (["Space","ArrowUp","ArrowDown"].includes(e.code)) e.preventDefault();
  if ((isGameOver || isGameClear) && e.code === "Space") {
    restartGame(); return;
  }
  keys[e.code] = true;
});
window.addEventListener('keyup', e => keys[e.code] = false);

const restartGame = () => {
  mariko.x = 50; mariko.y = 300;
  mariko.vx = 0; mariko.vy = 0;
  scrollX = 0;
  isGameOver = false; isGameClear = false;
  isFallingInHole = false;
  enemies.forEach((e, i) => {
    e.x = [800,1400][i]; e.vx = 1;
  });
  thwomps.forEach(t => { t.y = t.top; t.direction = 1; });
};

const loop = timestamp => {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  update();
  draw();
  requestAnimationFrame(loop);
};


const update = () => {
  if (isGameOver || isGameClear) return;

  mariko.vx = keys['ArrowRight'] ? mariko.speed :
              keys['ArrowLeft']  ? -mariko.speed : 0;
  mariko.x += mariko.vx;
  checkBlockCollisionX();

  if (keys['Space'] && mariko.isOnGround && !isFallingInHole) {
    mariko.vy = -mariko.jump;
    mariko.isOnGround = false;
  }
  mariko.vy += mariko.gravity;
  mariko.y += mariko.vy;

  if (!isFallingInHole) {
    checkBlockCollisionY();
    checkGroundCollision();
    checkHole();
  }

  clampPosition();
  updateScroll();
  updateEnemies();
  updateThwomps();
  checkEnemyCollision();
  checkGoal();

  if (isFallingInHole && mariko.y > canvas.height) {
    isGameOver = true;
  }
};

const clampPosition = () => {
  if (mariko.x < 0) mariko.x = 0;
  if (mariko.x > worldWidth - mariko.width) mariko.x = worldWidth - mariko.width;
};
const checkGroundCollision = () => {
  if (mariko.y + mariko.height >= groundY) {
    mariko.y = groundY - mariko.height;
    mariko.vy = 0;
    mariko.isOnGround = true;
  }
};
const checkBlockCollisionX = () => {
  for (const block of blocks) {
    const collideY = mariko.y + mariko.height > block.y && mariko.y < block.y + block.height;
    if (!collideY) continue;
    if (mariko.vx > 0 && mariko.x + mariko.width > block.x && mariko.x < block.x) {
      mariko.x = block.x - mariko.width; mariko.vx = 0;
    } else if (mariko.vx < 0 && mariko.x < block.x + block.width && mariko.x + mariko.width > block.x + block.width) {
      mariko.x = block.x + block.width; mariko.vx = 0;
    }
  }
};
const checkBlockCollisionY = () => {
  mariko.isOnGround = false;
  for (const block of blocks) {
    const collideX = mariko.x + mariko.width > block.x && mariko.x < block.x + block.width;
    if (!collideX) continue;
    if (mariko.vy > 0 && mariko.y + mariko.height > block.y && mariko.y < block.y) {
      mariko.y = block.y - mariko.height; mariko.vy = 0; mariko.isOnGround = true;
    } else if (mariko.vy < 0 && mariko.y < block.y + block.height && mariko.y + mariko.height > block.y + block.height) {
      mariko.y = block.y + block.height; mariko.vy = 0;
    }
  }
};
const checkHole = () => {
  for (const hole of holes) {
    const playerCenterX = mariko.x + mariko.width / 2;
    if (playerCenterX > hole.x && playerCenterX < hole.x + hole.width) {
      isFallingInHole = true;
      mariko.isOnGround = false;
    }
  }
};
const updateEnemies = () => {
  for (const enemy of enemies) {
    enemy.x += enemy.vx;

    if (enemy.x <= enemy.minX || enemy.x + enemy.width >= enemy.maxX) {
      enemy.vx *= -1;
    }

    for (const block of blocks) {
      const collideY = enemy.y + enemy.height > block.y && enemy.y < block.y + block.height;
      if (!collideY) continue;
      if (enemy.vx > 0 && enemy.x + enemy.width > block.x && enemy.x < block.x) {
        enemy.x = block.x - enemy.width; enemy.vx *= -1;
      } else if (enemy.vx < 0 && enemy.x < block.x + block.width && enemy.x + enemy.width > block.x + block.width) {
        enemy.x = block.x + block.width; enemy.vx *= -1;
      }
    }
  }
};
const updateThwomps = () => {
  for (const t of thwomps) {
    t.y += t.vy * t.direction;

    
    if (t.y <= t.top) {
      t.y = t.top;
      t.direction = 1;
    }

    if (t.y + t.height >= groundY) {
      t.y = groundY - t.height;
      t.direction = -1;
    }

    for (const block of blocks) {
      const collideX = t.x + t.width > block.x && t.x < block.x + block.width;
      if (!collideX) continue;
      if (t.direction > 0 && t.y + t.height > block.y && t.y < block.y) {
        t.y = block.y - t.height; t.direction = -1;
      } else if (t.direction < 0 && t.y < block.y + block.height && t.y + t.height > block.y + block.height) {
        t.y = block.y + block.height; t.direction = 1;
      }
    }
  }
};
const checkEnemyCollision = () => {
  const allEnemies = [...enemies, ...thwomps];
  for (const enemy of allEnemies) {
    const overlapX = mariko.x < enemy.x + enemy.width && mariko.x + mariko.width > enemy.x;
    const overlapY = mariko.y < enemy.y + enemy.height && mariko.y + mariko.height > enemy.y;
    if (overlapX && overlapY) {
      isGameOver = true;
    }
  }
};
const checkGoal = () => {
  const overlapX = mariko.x < goal.x + goal.width && mariko.x + mariko.width > goal.x;
  const overlapY = mariko.y < goal.y + goal.height && mariko.y + mariko.height > goal.y;
  if (overlapX && overlapY) {
    isGameClear = true;
  }
};
const updateScroll = () => {
  const centerX = canvas.width / 2;
  let targetScroll = mariko.x > centerX ? mariko.x - centerX : 0;
  const maxScroll = worldWidth - canvas.width;
  scrollX = Math.min(Math.max(0, targetScroll), maxScroll);
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSky();
  drawGround();
  drawHoles();
  drawBlocks();
  drawEnemies();
  drawThwomps();
  drawGoal();
  drawPlayer();

  if (isGameOver || isGameClear) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "80px sans-serif";
    ctx.fillText(isGameOver ? "GAME OVER" : "GAME CLEAR", canvas.width/2-250, canvas.height/2);
    ctx.font = "30px sans-serif";
    ctx.fillText("スペースキーでリスタート", canvas.width/2-180, canvas.height/2 + 50);
  }
};
const drawSky = () => {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0,0,canvas.width,groundY);
};
const drawGround = () => {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
};
const drawHoles = () => {
  ctx.fillStyle = '#87CEEB';
  for (const hole of holes) ctx.fillRect(hole.x - scrollX, groundY, hole.width, canvas.height - groundY);
};
const drawBlocks = () => {
  for (const block of blocks) ctx.drawImage(blockImg, block.x - scrollX, block.y, block.width, block.height);
};
const drawEnemies = () => {
  ctx.fillStyle = 'purple';
  for (const enemy of enemies) ctx.fillRect(enemy.x - scrollX, enemy.y, enemy.width, enemy.height);
};
const drawThwomps = () => {
  ctx.fillStyle = 'gray';
  for (const t of thwomps) ctx.fillRect(t.x - scrollX, t.y, t.width, t.height);
};
const drawPlayer = () => {
  ctx.drawImage(marikoImg, mariko.x - scrollX, mariko.y, mariko.width, mariko.height);
};
const drawGoal = () => {
  ctx.drawImage(goalImg, goal.x - scrollX, goal.y, goal.width, goal.height);
};

requestAnimationFrame(loop);
