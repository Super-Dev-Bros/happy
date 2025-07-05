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

// ブロックのステータス x,yはユーザー側にいじってもらうか？　大きさは固定のほうがよさげ
// 複数ブロックが作れるように配列として扱う
const blocks = [
    {
        x: 150,
        y: 510,
        width: 40,
        height: 40,
        //color: 'brown',
    },
    {
        x: 300,
        y: 400,
        width: 40,
        height: 40,
        //color: 'brown',
    }
];
const groundY = 550;
const keys = {};
const scrollX = 0;

document.addEventListener( 'keydown', e => keys[e.code] = true );
document.addEventListener( 'keyup', e => keys[e.code] = false );

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillStyle = mariko.color;
    ctx.fillRect(mariko.x - scrollX, mariko.y, mariko.width, mariko.height);

    // clearRectされた後にブロック描画処理
    blocks.forEach(block => {
        // 画像にしてみたけど周りの2D感に負けてる
        // またつまらぬものを浮かせてしまった、、、
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

    blocks.forEach(block => {
        const isColliding = 
            mariko.x < block.x + block.width &&
            mariko.x + mariko.width > block.x &&
            mariko.y < block.y + block.height &&
            mariko.y + mariko.height > block.y;
    
        if (isColliding) {
            // marikoがブロックに着地したかどうか
            if (mariko.vy > 0 && mariko.y + mariko.height - mariko.vy <= block.y) {
                // 着地判定
                mariko.y = block.y - mariko.height;
                mariko.vy = 0;
                mariko.isOnGround = true;
            }
        }
    });

    draw();
    requestAnimationFrame(action);
};

action();