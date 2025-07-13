const canvas = document.getElementById('gamecanvas');
const blockImage = document.getElementById('blockImg');
const ctx = canvas.getContext('2d');

const mariko = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    color: 'red',
    vx: 0,
    vy: 0,
    speed: 5,
    jump: 15,
    gravity: 0.8,
    isOnGround: false
};

const groundY = 550;
const keys = {};
const scrollX = 0;
const blocks = [];

document.addEventListener( 'keydown', e => keys[e.code] = true );
document.addEventListener( 'keyup', e => keys[e.code] = false );

const makeBlock = (x, y) => {
    return {
        x,
        y,
        width: 40,
        height: 40,
    };
};

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillStyle = mariko.color;
    ctx.fillRect(mariko.x - scrollX, mariko.y, mariko.width, mariko.height);

    // 現在の座標を表示
    ctx.fillStyle = 'yellow';
    ctx.font = '25px "Press Start 2P"';
    ctx.fillText(
        `X: ${Math.floor(mariko.x)}, Y: ${Math.floor(mariko.y)}`,
        mariko.x - scrollX,
        25
);
    // ブロック描画処理
    blocks.forEach(block => {
        ctx.drawImage(
            blockImage,
            block.x - scrollX,
            block.y,
            block.width,
            block.height
        );
    });
};

const action = () => {
    mariko.vx = keys['ArrowRight'] ? mariko.speed : keys['ArrowLeft'] ? -mariko.speed : 0;
    if ( keys['Space'] && mariko.isOnGround ){
        mariko.vy = -mariko.jump;
        mariko.isOnGround = false;
    }

    mariko.vy += mariko.gravity;

    mariko.x += mariko.vx;
    mariko.y += mariko.vy;

    if ( mariko.y + mariko.height >= groundY ){
        mariko.y = groundY - mariko.height;
        mariko.vy = 0;
        mariko.isOnGround = true;
    }

    // ブロックの当たり判定(上下左右)
    blocks.forEach(block => {
    const isColliding = 
        mariko.x < block.x + block.width &&
        mariko.x + mariko.width > block.x &&
        mariko.y < block.y + block.height &&
        mariko.y + mariko.height > block.y;

    if (isColliding) {
        const prevBottom = mariko.y + mariko.height - mariko.vy;
        const prevTop = mariko.y - mariko.vy;
        const prevRight = mariko.x + mariko.width - mariko.vx;
        const prevLeft = mariko.x - mariko.vx;

        const isFromTop = mariko.vy > 0 && prevBottom <= block.y;
        const isFromBottom = mariko.vy < 0 && prevTop >= block.y + block.height;
        const isFromLeft = mariko.vx > 0 && prevRight <= block.x;
        const isFromRight = mariko.vx < 0 && prevLeft >= block.x + block.width;

        if (isFromTop) {
            // 上
            mariko.y = block.y - mariko.height;
            mariko.vy = 0;
            mariko.isOnGround = true;
        } else if (isFromBottom) {
            // 下
            mariko.y = block.y + block.height;
            mariko.vy = 0;
        } else if (isFromLeft) {
            // 左
            mariko.x = block.x - mariko.width;
            mariko.vx = 0;
        } else if (isFromRight) {
            // 右
            mariko.x = block.x + block.width;
            mariko.vx = 0;
        }
    }
});
    // ブロックを追加
    blocks.push(makeBlock(250, 450));
    blocks.push(makeBlock(250, 410));

    draw();
    requestAnimationFrame(action);
};

action();