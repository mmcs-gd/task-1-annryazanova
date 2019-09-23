const canvas = document.getElementById("cnvs");

const gameState = {};

const directionType = {
	none: 0,
	down: 1,
	up: 2,
	left: 3,
	right: 4,
}

function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY
}

function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

function draw(tFrame) {
    const context = canvas.getContext('2d');

    // clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawPlatform(context)
    drawBall(context)
    drawscore(context)
}

function update(tick) {

    const vx = (gameState.pointer.x - gameState.player.x) / 10
    gameState.player.x += vx

    const ball = gameState.ball
    ball.y += ball.vy
    ball.x += ball.vx

    const score = gameState.score
	
	// update score every 1 second
	if (gameState.lastTick - score.lastSave > 1000) {
		score.value += 1
		score.lastSave = gameState.lastTick
	}
	
	// update ball speed every 30 seconds
	if (gameState.lastTick - ball.lastSpeedIncrease > 30000) {
		ball.vx += ball.vx * .1;
		ball.vy += ball.vy * .1;
		ball.lastSpeedIncrease = gameState.lastTick;
	}
	
	checkPlayerCollision(ball);
	checkTopCollision(ball);
    checkGameEnd();
}

function run(tFrame) {
    gameState.stopCycle = window.requestAnimationFrame(run);

    const nextTick = gameState.lastTick + gameState.tickLength;
    let numTicks = 0;

    if (tFrame > nextTick) {
        const timeSinceTick = tFrame - gameState.lastTick;
        numTicks = Math.floor(timeSinceTick / gameState.tickLength);
    }
    queueUpdates(numTicks);
    draw(tFrame);
    gameState.lastRender = tFrame;
}

function stopGame(handle) {
    window.cancelAnimationFrame(handle);
}

function drawPlatform(context) {
    const {x, y, width, height} = gameState.player;
    context.beginPath();
    context.rect(x - width / 2, y - height / 2, width, height);
    context.fillStyle = "#FF0000";
    context.fill();
    context.closePath();
}

function drawBall(context) {
    const {x, y, radius} = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = "#0000FF";
    context.fill();
    context.closePath();
}

function drawscore(context) {
    const {x, y, width, height, value} = gameState.score;
    context.beginPath();
    context.rect(x, y, width, height);
    context.fillStyle = "#7573D9";
    context.fill();
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.font = "18px serif";
    context.fillText(value, x + width / 2, y + height / 2 + 5); 
    context.closePath();
}

function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', onMouseMove, false);

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms

    const platform = {
        width: 400,
        height: 50,
    };

    gameState.player = {
        x: 100,
        y: canvas.height - platform.height / 2,
        width: platform.width,
        height: platform.height,
    };
    gameState.pointer = {
        x: 0,
        y: 0,
    };
    gameState.ball = {
        x: canvas.width / 2,
        y: 0,
        radius: 25,
        vx: 0,
        vy: 5,
		direction: directionType.down,
		lastSpeedIncrease : 0,
    };
    gameState.score = {
        x : 5,
        y : 5,
        width : 100,
        height : 36,
        value : 0,
		lastSave: 0,
    }
}

// check bottom collision and finish game
function checkGameEnd() {
    const ball = gameState.ball
    if (ball.y >= canvas.height + ball.radius) {
        stopGame(gameState.stopCycle);
    }
}

function checkPlayerCollision(ball){
	player = gameState.player;
	leftPlatformPart = player.x - player.width / 2;
	rightPlatformPart = player.x + player.width / 2
	if (ball.y + ball.radius >= player.y && 
	ball.x > leftPlatformPart && 
	ball.x < rightPlatformPart) {
		ball.vy *= (-1);
		ball.direction = directionType.up;
	}
}

function checkTopCollision(ball){
	if (ball.y - ball.radius <= 0 &&
		ball.direction != directionType.down){
		ball.vy *= (-1);
		ball.direction = directionType.down;
	}
}

setup();
run();
