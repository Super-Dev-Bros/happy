const canvas = document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');

const groundY = 550;
const worldWidth = 3000;
let scrollX = 0;
let lastTime = 0;
let isGameOver = false;
let isGameClear = false;
const keys = {};

const marikoImg = new Image(); marikoImg.src = 'aa0f1de1-65f8-42fc-86f0-fd38917296a9.png';
const blockImg = new Image(); blockImg.src = 'block.png';
const goalImg = new Image(); goalImg.src = '8re7l5pj.jpg';

const mariko = {
  x: 50, 
  y: 300,
  width: 80, 
  height: 120,
  vx: 0, 
  vy: 0,
  speed: 5,
  jump: 35,
  gravity: 0.8,
  isOnGround: false
};

const blocks = [
  { x: 400, y: 450, width: 100, height: 30 },
  { x: 600, y: 400, width: 100, height: 30 },
  { x: 900, y: 350, width: 100, height: 30 },
];

const enemies = [
  { x: 800, y: 510, width: 40, height: 40, vx: 1, range: { min: 800, max: 1000 } },
  { x: 1400, y: 510, width: 40, height: 40, vx: 1, range: { min: 1400, max: 1600 } },
  { x: 2000, y: 510, width: 40, height: 40, vx: -1, range: { min: 1800, max: 2000 } },
];

const goal = { x: 2800, y: 250, width: 50, height: 300 };

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
    const initPos = [800, 1400, 2000][i];
    e.x = initPos; e.vx = (i === 2 ? -1 : 1);
  });
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

  if (mariko.y + mariko.height >= groundY) {
    mariko.y = groundY - mariko.height;
    mariko.vy = 0;
    mariko.isOnGround = true;
  }

  clampPosition();
  updateScroll();
  updateEnemies();
  checkEnemyCollision();
  checkGoal();
};

const clampPosition = () => {
  if (mariko.x < 0) mariko.x = 0;
  if (mariko.x > worldWidth - mariko.width) mariko.x = worldWidth - mariko.width;
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
const updateEnemies = () => {
  for (const enemy of enemies) {
    enemy.x += enemy.vx;
    if (enemy.x < enemy.range.min || enemy.x + enemy.width > enemy.range.max) {
      enemy.vx *= -1;
    }
  }
};
const checkEnemyCollision = () => {
  for (const enemy of enemies) {
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
  drawGround();
  drawBlocks();
  drawEnemies();
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
const drawGround = () => {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
};
const drawBlocks = () => {
  for (const block of blocks) ctx.drawImage(blockImg, block.x - scrollX, block.y, block.width, block.height);
};
const drawEnemies = () => {
  ctx.fillStyle = 'purple';
  for (const enemy of enemies) ctx.fillRect(enemy.x - scrollX, enemy.y, enemy.width, enemy.height);
};
const drawPlayer = () => {
  ctx.drawImage(marikoImg, mariko.x - scrollX, mariko.y, mariko.width, mariko.height);
};
const drawGoal = () => {
  ctx.drawImage(goalImg, goal.x - scrollX, goal.y, goal.width, goal.height);
};

requestAnimationFrame(loop);
