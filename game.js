// ===== ゲームの基本設定 =====
const canvas = document.getElementById('gamecanvas');  // ゲーム画面のキャンバス
const ctx = canvas.getContext('2d');                  // 描画用のコンテキスト

// ===== ゲーム世界の設定 =====
const groundY = 550;        // 地面の高さ（Y座標）
const worldWidth = 5000;    // ゲーム世界の幅（X方向の長さ）

// ===== ゲーム状態の管理 =====
let scrollX = 0;            // 画面のスクロール位置（X方向）
let lastTime = 0;           // 前回のフレーム時間
let gameStartTime = 0;      // ゲーム開始時刻
let currentTime = 0;        // 現在時刻
let lastTimerUpdate = 0;    // タイマー更新時刻
let displayTime = 0;        // 表示用タイム
let isGameOver = false;     // ゲームオーバーフラグ
let isGameClear = false;    // ゲームクリアフラグ
const keys = {};            // 押されているキーの状態

// ===== 画像の読み込み =====
const marikoImg = new Image(); marikoImg.src = 'mariko.png';    // プレイヤーキャラクター
const blockImg = new Image(); blockImg.src = 'block.png';       // ブロック（足場）
const goalImg = new Image(); goalImg.src = 'Goal.png';          // ゴール
const enemyImg = new Image(); enemyImg.src = 'kurubo-.png';     // 敵キャラクター
const bossImg = new Image(); bossImg.src = 'kuppo.png';         // ボスキャラクター

// ===== 画像読み込みの管理 =====
let imagesLoaded = 0;        // 読み込み完了した画像の数
const totalImages = 5;       // 読み込む画像の総数

// 画像が1つ読み込まれるたびに呼ばれる関数
const onImageLoad = () => {
  imagesLoaded++;  // 読み込み完了数を増やす
  
  // すべての画像が読み込まれたらゲーム開始
  if (imagesLoaded === totalImages) {
    setupEventListeners();        // キー入力の設定
    spawnBossAtStart();           // ボスの出現判定
    gameStartTime = performance.now();  // ゲーム開始時刻を記録
    lastTime = performance.now();        // 前回フレーム時刻を記録
    requestAnimationFrame(loop);         // ゲームループ開始
  }
};

// 各画像の読み込み完了時にonImageLoadを呼ぶ
marikoImg.onload = onImageLoad;
blockImg.onload = onImageLoad;
goalImg.onload = onImageLoad;
enemyImg.onload = onImageLoad;
bossImg.onload = onImageLoad;

// ===== プレイヤーキャラクター（まりこ）=====
const mariko = {
  x: 50,           // X座標（初期位置）
  y: 300,          // Y座標（初期位置）
  width: 80,       // キャラクターの幅
  height: 120,     // キャラクターの高さ
  vx: 0,           // X方向の速度（左右移動の速度）
  vy: 0,           // Y方向の速度（上下移動の速度）
  speed: 2,        // 移動速度（左右キーを押した時の速さ）
  jump: 15,        // ジャンプ力（スペースキーを押した時の上向き速度）
  gravity: 0.6,    // 重力（毎フレーム下向きに加わる速度）
  isOnGround: false // 地面にいるかどうか（ジャンプ可能かどうか）
};

// ===== ステージの足場（ブロック）=====
const initialBlockCount = 9; // 初期ブロック数（ペナルティ計算用）

// 足場のブロックたち（x: X座標, y: Y座標, width: 幅, height: 高さ）
const blocks = [
  { x: 400, y: 450, width: 100, height: 30 },   // 1つ目の足場
  { x: 600, y: 400, width: 100, height: 30 },   // 2つ目の足場（少し高い）
  { x: 865, y: 350, width: 100, height: 30 },   // 3つ目の足場（もっと高い）
  { x: 2100, y: 450, width: 100, height: 30 },  // 4つ目の足場（遠くの足場）
  { x: 2350, y: 420, width: 100, height: 30 },  // 5つ目の足場
  { x: 2540, y: 300, width: 100, height: 30 },  // 6つ目の足場（高い位置）
  { x: 2800, y: 200, width: 100, height: 30 },  // 7つ目の足場（さらに高い）
  { x: 3200, y: 0, width: 100, height: 350 },   // 8つ目の足場（壁のような高いブロック）
  { x: 3200, y: 480, width: 130, height: 70 },  // 9つ目の足場（幅が広い）
];

// ===== トランポリン =====
const trampolines = [
  { x: 1500, y: 480, width: 80, height: 20, power: 2.5 },  // 通常のトランポリン
  { x: 3000, y: 480, width: 80, height: 20, power: 1.1 },  // 高く跳ねるトランポリン
];

// ===== 落とし穴（死亡トラップ）=====
const holes = [
  { x: 1200, width: 130 },   // 1つ目の穴（初期エリア）
  { x: 2000, width: 1500 },  // 2つ目の穴（巨大な穴）
  { x: 4700, width: 120 },   // 3つ目の穴（ゴール直前の緑色の穴）
];

// ===== 敵キャラクター（左右移動）=====
const enemies = [
  { x: 800, y: 510, width: 40, height: 60, vx: 5, minX: 750, maxX: 950 },      
  { x: 1400, y: 510, width: 40, height: 60, vx: 1, minX: 1350, maxX: 1550 },
  { x: 2150, y: 240, width: 40, height: 60, vx: 3, minX: 2150, maxX: 2700 },
];

// ===== ドッスン=====
const thwomps = [
  { x: 1800, y: 50, width: 80, height: 80, vy: 5, top: 50, bottom: groundY - 80, direction: 1 },
  { x: 4200, y: 50, width: 80, height: 80, vy: 4, top: 50, bottom: groundY - 80, direction: 1 },
];

// ===== ゴール=====
const goal = { x: 4800, y: 450, width: 50, height: 100 };

// ===== ボス=====
let boss = null;

// ゲーム開始時にボスを出現させるかどうかを決める関数
const spawnBossAtStart = () => {
  const appearChance = 0.1;  // 10%の確率でボス出現
  
  if (Math.random() < appearChance) {
    boss = { x: 2200, y: 120, width: 320, height: 600, vx: -10 };
  } else {
    boss = null;
  }
};

// ===== キー入力の管理 =====
let keydownHandler, keyupHandler;  // キー入力の処理関数

// キー入力の設定
const setupEventListeners = () => {
  if (keydownHandler) window.removeEventListener('keydown', keydownHandler);
  if (keyupHandler) window.removeEventListener('keyup', keyupHandler);
  
  keydownHandler = e => {
    if (["Space","ArrowUp","ArrowDown"].includes(e.code)) e.preventDefault();
    if ((isGameOver || isGameClear) && e.code === "Space") {
      restartGame(); return;
    }
    keys[e.code] = true;
    
    if (e.code === "Space" && mariko.isOnGround && !isGameOver && !isGameClear) {
      mariko.vy = -mariko.jump;
      mariko.isOnGround = false;
    }
  };
  
  keyupHandler = e => keys[e.code] = false;
  
  window.addEventListener('keydown', keydownHandler);
  window.addEventListener('keyup', keyupHandler);
};

// ゲームリスタート
const restartGame = () => {
  mariko.x = 50; mariko.y = 300;
  mariko.vx = 0; mariko.vy = 0;
  scrollX = 0;
  isGameOver = false; isGameClear = false;
  gameStartTime = performance.now();
  lastTime = performance.now();
  Object.keys(keys).forEach(key => keys[key] = false);
  enemies.forEach((e, i) => { 
    e.x = [800,1400,2150][i]; 
    e.vx = [5,1,3][i]; 
  });
  thwomps.forEach((t, i) => { 
    t.y = t.top; 
    t.vy = [5, 4][i];  // 各ドッスンの個別速度を設定
    t.direction = 1; 
  });
  spawnBossAtStart();
};

// メインループ
const loop = timestamp => {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  currentTime = timestamp;
  update();
  draw();
  requestAnimationFrame(loop);
};

// ゲーム状態更新
const update = () => {
  if (isGameOver || isGameClear) return;

  mariko.vx = keys['ArrowRight'] ? mariko.speed :
              keys['ArrowLeft']  ? -mariko.speed : 0;
  mariko.x += mariko.vx;
  checkBlockCollisionX();

  mariko.vy += mariko.gravity;
  mariko.y += mariko.vy;

  checkBlockCollisionY();
  checkTrampolineCollision();
  checkGroundCollision();
  clampPosition();
  checkHole();

  updateScroll();
  updateEnemies();
  updateThwomps();
  updateBoss();
  checkEnemyCollision();
  checkGoal();
};

// プレイヤー位置制限
const clampPosition = () => {
  if (mariko.x < 0) mariko.x = 0;
  if (mariko.x > worldWidth - mariko.width) mariko.x = worldWidth - mariko.width;
};

// 地面当たり判定
const checkGroundCollision = () => {
  const onHole = holes.some(h => 
    mariko.x + mariko.width/2 > h.x &&
    mariko.x + mariko.width/2 < h.x + h.width
  );
  if (!onHole && mariko.y + mariko.height >= groundY) {
    mariko.y = groundY - mariko.height;
    mariko.vy = 0;
    mariko.isOnGround = true;
  }
};

/**
 * プレイヤーとブロックの横方向の当たり判定を処理する関数
 * ブロックに横からぶつかった時の処理を行う
 */
const checkBlockCollisionX = () => {
  for (const block of blocks) {
    const collideY = mariko.y + mariko.height > block.y && mariko.y < block.y + block.height;
    if (!collideY) continue;
    
    if (mariko.vx > 0 && mariko.x + mariko.width > block.x && mariko.x < block.x) {
      mariko.x = block.x - mariko.width;
      mariko.vx = 0;
    } 
    else if (mariko.vx < 0 && mariko.x < block.x + block.width && mariko.x + mariko.width > block.x + block.width) {
      mariko.x = block.x + block.width;
      mariko.vx = 0;
    }
  }
};

/**
 * プレイヤーとブロックの縦方向の当たり判定を処理する関数
 * ブロックの上に着地したり、下からぶつかった時の処理を行う
 */
const checkBlockCollisionY = () => {
  mariko.isOnGround = false;
  
  for (const block of blocks) {
    const collideX = mariko.x + mariko.width > block.x && mariko.x < block.x + block.width;
    if (!collideX) continue;  
    if (mariko.vy > 0 && mariko.y + mariko.height > block.y && mariko.y < block.y) {
      mariko.y = block.y - mariko.height;
      mariko.vy = 0;
      mariko.isOnGround = true;
    } 
    else if (mariko.vy < 0 && mariko.y < block.y + block.height && mariko.y + mariko.height > block.y + block.height) {
      mariko.y = block.y + block.height;
      mariko.vy = 0;
    }
  }
};

/**
 * プレイヤーとトランポリンの当たり判定を処理する関数
 * トランポリンに触れたら高く跳ねる
 */
const checkTrampolineCollision = () => {
  for (const trampoline of trampolines) {
    const collideX = mariko.x + mariko.width > trampoline.x && mariko.x < trampoline.x + trampoline.width;
    const collideY = mariko.y + mariko.height > trampoline.y && mariko.y < trampoline.y + trampoline.height;
    
    if (collideX && collideY && mariko.vy > 0) {
      mariko.vy = -mariko.jump * trampoline.power;
      mariko.isOnGround = false;
    }
  }
};

/**
 * プレイヤーが穴に落ちたかチェックする関数
 * 穴に落ちた場合はゲームオーバーにする
 */
const checkHole = () => {
  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    const playerCenterX = mariko.x + mariko.width / 2;
    
    if (playerCenterX > hole.x && playerCenterX < hole.x + hole.width) {
      if (mariko.y + mariko.height/2 > groundY) {
        if (i === holes.length - 1) {
          alert("ザラキ‼️");
        }
        isGameOver = true;
      }
    }
  }
};

/**
 * 敵キャラクターの動きを更新する関数
 * 敵の移動とブロックとの当たり判定を処理する
 */
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
        enemy.x = block.x - enemy.width;
        enemy.vx *= -1;
      } 
      else if (enemy.vx < 0 && enemy.x < block.x + block.width && enemy.x + enemy.width > block.x + block.width) {
        enemy.x = block.x + block.width;
        enemy.vx *= -1;
      }
    }
  }
};

/**
 * ドッスン（上下移動する敵）の動きを更新する関数
 * ドッスンの上下移動とブロックとの当たり判定を処理する
 */
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
        t.y = block.y - t.height;
        t.direction *= -1;
      } 
      else if (t.direction < 0 && t.y < block.y + block.height && t.y + t.height > block.y + block.height) {
        t.y = block.y + block.height;
        t.direction *= -1;
      }
    }
  }
};

/**
 * ボスキャラクターの動きを更新する関数
 * ボスの移動とプレイヤーとの当たり判定を処理する
 */
const updateBoss = () => {
  if (!boss) return;
  
  boss.x += boss.vx;
  
  const overlapX = mariko.x < boss.x + boss.width && mariko.x + mariko.width > boss.x;
  const overlapY = mariko.y < boss.y + boss.height && mariko.y + mariko.height > boss.y;
  
  if (overlapX && overlapY) isGameOver = true;
  
  if (boss.x + boss.width < 0) boss = null;
};

/**
 * プレイヤーと敵の当たり判定をチェックする関数
 * 敵に触れたらゲームオーバーにする
 */
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

/**
 * プレイヤーがゴールに到達したかチェックする関数
 * ゴールに到達したらゲームクリアにする
 */
const checkGoal = () => {
  if (mariko.x + mariko.width/2 > goal.x + goal.width) {
    isGameClear = true;
    
    const clearTime = Math.floor((currentTime - gameStartTime) / 1000);
    const extraBlocks = blocks.length - initialBlockCount;
    const penaltyTime = extraBlocks * 3;
    const finalTime = clearTime + penaltyTime; 
    
    const minutes = Math.floor(finalTime / 60);
    const seconds = finalTime % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const penaltyMessage = extraBlocks > 0 ? `\nブロックペナルティ: +${penaltyTime}秒` : '';
    
    alert(`ゲームクリア！\nクリアタイム: ${timeString}${penaltyMessage}`);
  }
};

/**
 * 画面のスクロール位置を更新する関数
 * プレイヤーが画面中央を超えたら画面をスクロールさせる
 */
const updateScroll = () => {
  const centerX = canvas.width / 2;               
  let targetScroll = mariko.x > centerX ? mariko.x - centerX : 0; 
  const maxScroll = worldWidth - canvas.width;       
  scrollX = Math.min(Math.max(0, targetScroll), maxScroll);    
};

/**
 * ゲーム画面を描画する関数
 * 背景、オブジェクト、UIを順番に描画する
 */
const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawSky();      // 空を描画
  drawGround();   // 地面を描画
  drawHoles();    // 穴を描画
  drawBlocks();      // ブロックを描画
  drawTrampolines(); // トランポリンを描画
  drawEnemies();     // 敵を描画
  drawThwomps();  // ドッスンを描画
  drawBoss();     // ボスを描画
  drawGoal();     // ゴールを描画
  drawPlayer();   // プレイヤーを描画
  drawTimer();    // タイマーを描画

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
  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    ctx.fillStyle = i === holes.length - 1 ? '#228B22' : '#87CEEB';
    ctx.fillRect(hole.x - scrollX, groundY, hole.width, canvas.height - groundY);
  }
};

const drawBlocks = () => { 
  for (const block of blocks) {
    if (block.x - scrollX + block.width > 0 && block.x - scrollX < canvas.width) {
      ctx.drawImage(blockImg, block.x - scrollX, block.y, block.width, block.height);
    }
  }
};

const drawTrampolines = () => { 
  for (const trampoline of trampolines) {
    if (trampoline.x - scrollX + trampoline.width > 0 && trampoline.x - scrollX < canvas.width) {
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(trampoline.x - scrollX, trampoline.y, trampoline.width, trampoline.height);
      
      ctx.strokeStyle = '#000080';
      ctx.lineWidth = 2;
      ctx.strokeRect(trampoline.x - scrollX, trampoline.y, trampoline.width, trampoline.height);
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const x = trampoline.x - scrollX + (trampoline.width / 4) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(x, trampoline.y);
        ctx.lineTo(x, trampoline.y + trampoline.height);
        ctx.stroke();
      }
    }
  }
};

const drawEnemies = () => { 
  for (const enemy of enemies) {
    if (enemy.x - scrollX + enemy.width > 0 && enemy.x - scrollX < canvas.width) {
      ctx.drawImage(enemyImg, enemy.x - scrollX, enemy.y, enemy.width, enemy.height);
    }
  }
};

const drawThwomps = () => { 
  ctx.fillStyle = 'gray'; 
  for (const t of thwomps) {
    if (t.x - scrollX + t.width > 0 && t.x - scrollX < canvas.width) {
      ctx.fillRect(t.x - scrollX, t.y, t.width, t.height);
    }
  }
};

const drawBoss = () => { 
  if (!boss) return; 
  if (boss.x - scrollX + boss.width > 0 && boss.x - scrollX < canvas.width) {
    ctx.drawImage(bossImg, boss.x - scrollX, boss.y, boss.width, boss.height);
  }
};

const drawPlayer = () => { 
  ctx.drawImage(marikoImg, mariko.x - scrollX, mariko.y, mariko.width, mariko.height); 
};

const drawGoal = () => { 
  if (goal.x - scrollX + goal.width > 0 && goal.x - scrollX < canvas.width) {
    ctx.drawImage(goalImg, goal.x - scrollX, goal.y, goal.width, goal.height);
  }
};

const drawTimer = () => {
  if (isGameOver || isGameClear) return;
  
  if (currentTime - lastTimerUpdate >= 1000) {
    displayTime = Math.floor((currentTime - gameStartTime) / 1000);
    lastTimerUpdate = currentTime;
  }
  
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  ctx.fillStyle = "#000";
  ctx.font = "24px sans-serif";
  ctx.fillText(`TIME: ${timeString}`, 20, 40);
};

spawnBossAtStart();
gameStartTime = Date.now();
requestAnimationFrame(loop);
