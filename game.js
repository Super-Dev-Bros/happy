const canvas = document.getElementById('gamecanvas');
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

document.addEventListener( 'keydown', e => keys[e.code] = true );
document.addEventListener( 'keyup', e => keys[e.code] = false );

const draw = () => {
    ctx.clearRect( 0, 0, canvas.width, canvas.height );
    ctx.fillStyle = '#228B22';
    ctx.fillRect( 0, groundY, canvas.width, canvas.height - groundY );
    ctx.fillStyle = mariko.color;
    ctx.fillRect( mariko.x - scrollX, mariko.y, mariko.width, mariko.height )
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

    draw();
    requestAnimationFrame(action);
};

action();