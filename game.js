const canvas   = document.getElementById('gamecanvas');
const ctx      = canvas.getContext('2d');


let gameState = 'play'; 


const mario = {
    x: 50, y: 300, width: 40, height: 40,
    color: 'red', vx: 0, vy: 0,
    left: 0, right: 0, top: 0, bottom: 0,
    speed: 5, jump: 15, gravity: 0.8,
    isOnGround: false,
};


const enemies = [];
const addKuribo = (x, y) => {
    enemies.push({
        type: 'kuribo', x, y, width: 40, height: 40, color: 'brown',
        vx: -2, vy: 0, left: 0, right: 0, top: 0, bottom: 0,
        gravity: 0.8, isOnGround: false,
    });
};

const pipe = {
    x: 800,
    y: 470,
    width: 90,
    height: 130,
    color: '#339933'
};

const thwomp = {
x: 300,
    y: 13,
    width: 90,
    height: 130,
    color: '#C0C0C0',
    vy: 6,
    direction: 0, // 1: 下へ, -1: 上へ, 0: 停止中
    topLimit: 13,
    bottomLimit: 400,
    isWaiting: false,
};

// ドッスン描画
const drawThwomp = (obj) => {
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x - scrollX, obj.y, obj.width, obj.height);
};

// 土管描画
const drawPipe = (obj) => {
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x - scrollX, obj.y, obj.width, obj.height);
};

// 初期敵
addKuribo(400, 300);


const groundY = 550;
const keys    = {};
let   scrollX = 0;


document.addEventListener('keydown', e => {
    // ゲームオーバー中に Enter を押したらリセット
    if (gameState === 'gameover' && e.code === 'Enter') {
        resetGame();
        return;
    }
    keys[e.code] = true;
});

document.addEventListener('keyup', e => keys[e.code] = false);


const updateBoundingBox = obj => {
    obj.left   = obj.x;
    obj.right  = obj.x + obj.width;
    obj.top    = obj.y;
    obj.bottom = obj.y + obj.height;
};

const isColliding = (a, b) => (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
);

const resetGame = () => {
    // プレイヤー初期化
    Object.assign(mario, {
        x: 50, y: 300, vx: 0, vy: 0,
        color: 'red', isOnGround: false,
    });
    updateBoundingBox(mario);

    // 敵を初期状態に戻す
    enemies.length = 0;
    addKuribo(400, 300);

    // スクロール / 入力リセット
    scrollX = 0;
    for (const k in keys) keys[k] = false;

    gameState = 'play';
};

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 地面
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // マリオ
    ctx.fillStyle = mario.color;
    ctx.fillRect(mario.x - scrollX, mario.y, mario.width, mario.height);

    // 敵
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - scrollX, e.y, e.width, e.height);
    });

    drawPipe (pipe);

    drawThwomp (thwomp);

    // ゲームオーバー表示
    if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '24px sans-serif';
        ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 30);
    }
};

const action = () => {
    if (gameState === 'play') {

        mario.vx = keys['ArrowRight'] ? mario.speed : keys['ArrowLeft'] ? -mario.speed : 0;
        if (keys['Space'] && mario.isOnGround) {
            mario.vy = -mario.jump;
            mario.isOnGround = false;
        }

const thwompTriggerDistance = 100;
        const dx = Math.abs((mario.x + mario.width / 2) - (thwomp.x + thwomp.width / 2));
        if (dx < thwompTriggerDistance && thwomp.direction === 0 && thwomp.y <= thwomp.topLimit + 1) {
            thwomp.direction = 1;
        }

        if (thwomp.direction !== 0) {
            thwomp.y += thwomp.vy * thwomp.direction;

            if (thwomp.y >= thwomp.bottomLimit) {
                thwomp.y = thwomp.bottomLimit;
                thwomp.direction = -1;
            } else if (thwomp.y <= thwomp.topLimit) {
                thwomp.y = thwomp.topLimit;
                thwomp.direction = 0;    
            }
        }

        mario.vy += mario.gravity;
        mario.x  += mario.vx;
        mario.y  += mario.vy;

        // 地面判定
        if (mario.y + mario.height >= groundY) {
            mario.y = groundY - mario.height;
            mario.vy = 0;
            mario.isOnGround = true;
        }
        updateBoundingBox(mario);

        // 敵の更新当たり判定
        enemies.forEach(e => {
            e.vy += e.gravity;
            e.x  += e.vx;
            e.y  += e.vy;

            if (e.y + e.height >= groundY) {
                e.y = groundY - e.height;
                e.vy = 0;
                e.isOnGround = true;
            }
            updateBoundingBox(e);

            if (gameState === 'play' && isColliding(mario, e)) {
                gameState = 'gameover';
            }
        });
    }

    draw();
    requestAnimationFrame(action);
};

action();
