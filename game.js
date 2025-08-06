const canvas = document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');

const groundY = 550;
const worldWidth = 5000;
let scrollX = 0;
let lastTime = 0;
let isGameOver = false;
let isGameClear = false;
const keys = {};

const marikoImg = new Image(); marikoImg.src = 'aa0f1de1-65f8-42fc-86f0-fd38917296a9.png';
const blockImg = new Image(); blockImg.src = 'block.png';
const goalImg = new Image(); goalImg.src = '8re7l5pj.jpg';
const enemyImg = new Image(); enemyImg.src = 'kurubo-.png';
const bossImg = new Image(); bossImg.src = 'kuppo.png';

const mariko = {
  x: 50,
  y: 300,
  width: 80, 
  height: 120,
  vx: 0, 
  vy: 0,
  speed: 5, 
  jump: 15,
  gravity: 0.8,
  isOnGround: false
};

const blocks = [
  { x: 400, y: 450, width: 100, height: 30 },
  { x: 600, y: 400, width: 100, height: 30 },
  { x: 900, y: 350, width: 100, height: 30 },
  { x: 2100, y: 450, width: 100, height: 30 },
  { x: 2350, y: 420, width: 100, height: 30 },
  { x: 2540, y: 300, width: 100, height: 30 },
  { x: 2800, y: 200, width: 100, height: 30 },
  { x: 3200, y: 0, width: 100, height: 350 },
  { x: 3200, y: 480, width: 130, height: 70 },
];

// 穴
const holes = [
  { x: 1200, width: 120 },
  { x: 2000, width: 1500 },
];

const enemies = [
  { x: 800, y: 510, width: 40, height: 60, vx: 1, minX: 750, maxX: 950 },
  { x: 1400, y: 510, width: 40, height: 60, vx: 1, minX: 1350, maxX: 1550 },
  { x: 2150, y: 260, width: 40, height: 60, vx: 2, minX: 2150, maxX: 2700 },
];

const thwomps = [
  { x: 1800, y: 50, width: 80, height: 80, vy: 2, top: 50, bottom: groundY - 80, direction: 1 },
];

const goal = { x: 4800, y: 450, width: 50, height: 100 };

let boss = null;
const spawnBossAtStart = () => {
  const appearChance = 0.1; 
  if (Math.random() < appearChance) {
    boss = {
      x: 2200,
      y: 120,
      width: 320,
      height: 600,
      vx: -10
    };
  } else {
    boss = null;
  }
};

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
  enemies.forEach((e, i) => {
    e.x = [800,1400,2150][i]; e.vx = 1;
  });
  thwomps.forEach(t => { t.y = t.top; t.direction = 1; });
  spawnBossAtStart();
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

  if (keys['Space'] && mariko.isOnGround) {
    mariko.vy = -mariko.jump;
    mariko.isOnGround = false;
  }
  mariko.vy += mariko.gravity;
  mariko.y += mariko.vy;
  checkBlockCollisionY();
  checkGroundCollision();
  checkHole();

  clampPosition();
  updateScroll();
  updateEnemies();
  updateThwomps();
  updateBoss();
  checkEnemyCollision();
  checkGoal();
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
      if (mariko.y + mariko.height >= groundY) {
        isGameOver = true;
      }
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
    if (t.y <= t.top || t.y + t.height >= t.bottom) {
      t.direction *= -1;
    }
    for (const block of blocks) {
      const collideX = t.x + t.width > block.x && t.x < block.x + block.width;
      if (!collideX) continue;
      if (t.direction > 0 && t.y + t.height > block.y && t.y < block.y) {
        t.y = block.y - t.height; t.direction *= -1;
      } else if (t.direction < 0 && t.y < block.y + block.height && t.y + t.height > block.y + block.height) {
        t.y = block.y + block.height; t.direction *= -1;
      }
    }
  }
};
const updateBoss = () => {
  if (!boss) return;
  boss.x += boss.vx;

  const overlapX = mariko.x < boss.x + boss.width && mariko.x + mariko.width > boss.x;
  const overlapY = mariko.y < boss.y + boss.height && mariko.y + mariko.height > boss.y;
  if (overlapX && overlapY) isGameOver = true;

  if (boss.x + boss.width < 0) boss = null;
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

// --- 描画 ---
const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSky();
  drawGround();
  drawHoles();
  drawBlocks();
  drawEnemies();
  drawThwomps();
  drawBoss();
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
  ctx.fillStyle = 'black';
  for (const hole of holes) ctx.fillRect(hole.x - scrollX, groundY, hole.width, canvas.height - groundY);
};
const drawBlocks = () => {
  for (const block of blocks) ctx.drawImage(blockImg, block.x - scrollX, block.y, block.width, block.height);
};
const drawEnemies = () => {
  ctx.fillStyle = 'purple';
  for (const enemy of enemies) ctx.drawImage(enemyImg, enemy.x - scrollX, enemy.y, enemy.width, enemy.height);
};
const drawThwomps = () => {
  ctx.fillStyle = 'gray';
  for (const t of thwomps) ctx.fillRect(t.x - scrollX, t.y, t.width, t.height);
};
const drawBoss = () => {
  if (!boss) return;
  ctx.drawImage(bossImg, boss.x - scrollX, boss.y, boss.width, boss.height);
};
const drawPlayer = () => {
  ctx.drawImage(marikoImg, mariko.x - scrollX, mariko.y, mariko.width, mariko.height);
};
const drawGoal = () => {
  ctx.drawImage(goalImg, goal.x - scrollX, goal.y, goal.width, goal.height);
};

spawnBossAtStart();
requestAnimationFrame(loop);
