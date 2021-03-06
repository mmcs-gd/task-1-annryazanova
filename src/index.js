const canvas = document.getElementById("cnvs");

const gameState = {};

function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY;
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

    drawPlatform(context);
    drawBall(context);
    drawScore(context);
	drawBonus(context);
	drawDebugInfo(context);
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
		ball.vx *= 1.1;
		ball.vy *= 1.1;
		ball.lastSpeedIncrease = gameState.lastTick;
	}
	
    const bonus = gameState.bonus
	
	// create bonus in random place every 15 seconds
	if (gameState.lastTick - bonus.lastInstance > 15000 && !bonus.isCreated) { 
		bonus.radius = getRandomIntInclusive(10, 20);
		bonus.x = getRandomIntInclusive(0 + bonus.radius, canvas.width - bonus.radius); 
		bonus.y = getRandomIntInclusive(0 + bonus.radius, canvas.height / 2); 
		bonus.vx = getRandomIntInclusive(-7, 7);
		bonus.vy = getRandomIntInclusive(1, 5);
		bonus.width = getRandomIntInclusive(5, 10);
		bonus.isCreated = true; 
		bonus.lastInstance = gameState.lastTick;
	}
	
    checkGameEnd();
	checkBallState();
	checkBonusState();
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
    context.fillStyle = "#9FEE00";
    context.fill();
    context.closePath();
}

function drawBall(context) {
    const {x, y, radius} = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = "#162EAE";
    context.fill();
    context.closePath();
}

function drawScore(context) {
    const {x, y, width, height, value} = gameState.score;
    context.beginPath();
    context.rect(x, y, width, height);
    context.fillStyle = "#CD0074";
    context.fill();
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.font = "18px serif";
    context.fillText("score: " + value, x + width / 2, y + height / 2 + 5); 
    context.closePath();
}

function drawBonus(context) {
	if (gameState.bonus.isCreated) {
		const {x, y, radius, width} = gameState.bonus;
		context.beginPath();
		context.rect(x - radius, y - width / 2, 2 * radius, width);
		context.rect(x - width / 2, y - radius, width, 2 * radius);
		context.fillStyle = "#FFB600";
		context.fill();
		context.closePath();		
	}
}

function drawDebugInfo(context) {
    context.fillStyle = "#000000";
    context.textAlign = "left";
    context.font = "18px serif";
    //context.fillText("vx: " + gameState.bonus.vx + ", vy: " + gameState.bonus.vy + ", x: " + gameState.bonus.x + ", y: " + gameState.bonus.y, 5, 60);	
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
		lastSpeedIncrease: 0,
		isInitializedVx: false,
    };
    gameState.score = {
        x: 5,
        y: 5,
        width: 100,
        height: 36,
        value: 0,
		lastSave: 0,
    };
	gameState.bonus = {
		x: 0,
		y: 0, 
		radius: 0,
		width: 0,
		vx: 0,
		vy: 0,
		lastInstance: 0,
		isCreated: false,
	}
}

// check bottom collision and finish game
function checkGameEnd() {
    const ball = gameState.ball;
	checkBottomCollision(ball, function() {
		stopGame(gameState.stopCycle)
	});
}

function checkPlatformCollision(obj, checkRebound, callback){
	player = gameState.player;
	leftPlatformPart = player.x - player.width / 2;
	rightPlatformPart = player.x + player.width / 2
	if (obj.y + obj.radius >= player.y - player.height / 2 && 
	obj.y < player.y - player.height / 2 &&
	obj.x >= leftPlatformPart && 
	obj.x <= rightPlatformPart){  
		// if it's needed to check rebound from the platform
		if (checkRebound) {
			if (!obj.isInitializedVx){	
				if (obj.x >= leftPlatformPart && obj.x <= player.x && obj.vx >= 0) {   		// rebound from the left part of the platform
					obj.vx = getRandomIntInclusive(-7, -2);
					obj.isInitializedVx = true;
				} else if (obj.x <= rightPlatformPart && obj.x > player.x && obj.vx >= 0) {  // rebound from the right part of the platform
					obj.vx = getRandomIntInclusive(2, 7);
					obj.isInitializedVx = true;
				} 
			}
		}
		callback();
	}
}

function checkTopCollision(ball){
	if (ball.y - ball.radius <= 0 &&
		ball.vy < 0){
		ball.vy *= (-1);
	}
}

function checkBottomCollision(obj, callback){
	if (obj.y >= canvas.height + obj.radius) {
        callback();		
    }
}

function checkWallCollision(obj, callback){
	if (obj.x <= 0 + obj.radius ||				 // left wall
		obj.x >= canvas.width - obj.radius) {	 // right wall
        callback();		
    }
}

// Getting a random integer in a given interval, inclusive
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; 
}

function checkBonusState(){
	if (gameState.bonus.isCreated) {
		bonus = gameState.bonus;
		updateBonusPosition(bonus);
	}
}

function checkBallState(){
	ball = gameState.ball;
	
	checkPlatformCollision(ball, true, function() {
		ball.vy *= (-1);
	});
	
	checkTopCollision(ball);
	checkWallCollision(ball, function(){
		ball.vx *= (-1);
	});
}

function updateBonusPosition(bonus){
	bonus.y += bonus.vy;
	bonus.x += bonus.vx; 
	
	checkPlatformCollision(bonus, false, function() {
		gameState.score.value += 15;
		bonus.isCreated = false;
	});
	
	checkWallCollision(bonus, function(){
		gameState.bonus.vx *= (-1);
	});
	
	checkBottomCollision(bonus, function() {
		gameState.bonus.isCreated = false;
	});
}

setup();
run();
