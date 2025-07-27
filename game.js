const canvas = document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');
const groundY = 550;
const worldWidth = 3000;
const keys = {};
let scrollX = 0;
let lastTime = 0;
let isGameOver = false;

const marikoImg = new Image();
marikoImg.src = 'aa0f1de1-65f8-42fc-86f0-fd38917296a9.png';

const blockImg = new Image();
blockImg.src = 'block.png';

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

const clouds = [
  { x: 100, y: 100, width: 120, height: 60 },
  { x: 600, y: 150, width: 100, height: 50 },
  { x: 1200, y: 80, width: 130, height: 70 },
];

const blocks = [
  { x: 400, y: 450, width: 100, height: 30 },
  { x: 600, y: 400, width: 100, height: 30 },
  { x: 900, y: 350, width: 100, height: 30 },
];

const enemies = [
  { x: 800, y: 520, width: 40, height: 40, vx: 1, range: { min: 800, max: 1000 } },
  { x: 1400, y: 520, width: 40, height: 40, vx: 1, range: { min: 1400, max: 1600 } },
  { x: 2000, y: 520, width: 40, height: 40, vx: -1, range: { min: 1800, max: 2000 } },
];

let loaded = 0;
function checkLoaded() {
  loaded++;
  if (loaded === 2) init();
}
marikoImg.onload = checkLoaded;
blockImg.onload = checkLoaded;

function init() {
  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp, { passive: false });
  requestAnimationFrame(loop);
}

function onKeyDown(e) {
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
  if (isGameOver && e.code === "Space") {
    restartGame();
    return;
  }
  keys[e.code] = true;
}
function onKeyUp(e) {
  keys[e.code] = false;
}

function restartGame() {
  isGameOver = false;
  mariko.x = 50;
  mariko.y = 300;
  mariko.vx = 0;
  mariko.vy = 0;
  mariko.isOnGround = false;
  scrollX = 0;
  enemies.forEach(e => {
    e.x = e.range.min;
    e.vx = Math.abs(e.vx);
  });
}

function update(dt) {
  if (isGameOver) return;
  handleMovement();
  mariko.x += mariko.vx;
  checkBlockCollisionX();

  mariko.vy += mariko.gravity;
  mariko.y += mariko.vy;
  checkBlockCollisionY();
  checkGroundCollision();

  clampPosition();
  updateScroll();
  updateEnemies();
  checkEnemyCollision();
}

function handleMovement() {
  mariko.vx = keys['ArrowRight'] ? mariko.speed
           : keys['ArrowLeft']  ? -mariko.speed
           : 0;

  if (keys['Space'] && mariko.isOnGround) {
    mariko.vy = -mariko.jump;
    mariko.isOnGround = false;
  }
}

function clampPosition() {
  if (mariko.x < 0) mariko.x = 0;
  const maxX = worldWidth - mariko.width;
  if (mariko.x > maxX) mariko.x = maxX;
}

function checkGroundCollision() {
  if (mariko.y + mariko.height >= groundY) {
    mariko.y = groundY - mariko.height;
    mariko.vy = 0;
    mariko.isOnGround = true;
  }
}

function checkBlockCollisionX() {
  for (const block of blocks) {
    const blockRight = block.x + block.width;
    const marikoRight = mariko.x + mariko.width;
    const collideY = mariko.y + mariko.height > block.y && mariko.y < block.y + block.height;
    if (!collideY) continue;
    if (mariko.vx > 0 && marikoRight > block.x && mariko.x < block.x) {
      mariko.x = block.x - mariko.width;
      mariko.vx = 0;
    } else if (mariko.vx < 0 && mariko.x < blockRight && marikoRight > blockRight) {
      mariko.x = blockRight;
      mariko.vx = 0;
    }
  }
}

function checkBlockCollisionY() {
  mariko.isOnGround = false;
  for (const block of blocks) {
    const blockBottom = block.y + block.height;
    const marikoBottom = mariko.y + mariko.height;
    const collideX = mariko.x + mariko.width > block.x && mariko.x < block.x + block.width;
    if (!collideX) continue;
    if (mariko.vy > 0 && marikoBottom > block.y && mariko.y < block.y) {
      mariko.y = block.y - mariko.height;
      mariko.vy = 0;
      mariko.isOnGround = true;
    } else if (mariko.vy < 0 && mariko.y < blockBottom && marikoBottom > blockBottom) {
      mariko.y = blockBottom;
      mariko.vy = 0;
    }
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    enemy.x += enemy.vx;
    if (enemy.x < enemy.range.min || enemy.x + enemy.width > enemy.range.max) {
      enemy.vx *= -1;
    }
  }
}

function checkEnemyCollision() {
  for (const enemy of enemies) {
    const overlapX = mariko.x < enemy.x + enemy.width && mariko.x + mariko.width > enemy.x;
    const overlapY = mariko.y < enemy.y + enemy.height && mariko.y + mariko.height > enemy.y;
    if (overlapX && overlapY) {
      isGameOver = true;
    }
  }
}

function updateScroll() {
  const centerX = canvas.width / 2;
  let targetScroll = mariko.x > centerX ? mariko.x - centerX : 0;
  const maxScroll = worldWidth - canvas.width;
  scrollX = Math.min(Math.max(0, targetScroll), maxScroll);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawClouds();
  drawBlocks();
  drawEnemies();
  drawGround();
  drawPlayer();

  if (isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "80px sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2 - 250, canvas.height / 2);
    ctx.font = "30px sans-serif";
    ctx.fillText("スペースキーでリスタート", canvas.width / 2 - 180, canvas.height / 2 + 50);
  }
}

function drawClouds() {
  ctx.fillStyle = '#FFFFFF';
  for (const cloud of clouds) {
    ctx.beginPath();
    ctx.ellipse(cloud.x - scrollX, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBlocks() {
  for (const block of blocks) {
    ctx.drawImage(blockImg, block.x - scrollX, block.y, block.width, block.height);
  }
}

function drawEnemies() {
  ctx.fillStyle = 'purple';
  for (const enemy of enemies) {
    ctx.fillRect(enemy.x - scrollX, enemy.y, enemy.width, enemy.height);
  }
}

function drawGround() {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
}

function drawPlayer() {
  ctx.drawImage(marikoImg, mariko.x - scrollX, mariko.y, mariko.width, mariko.height);
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
