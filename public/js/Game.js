function init() {

	document.addEventListener("keydown", function(e) {
		// if not focused on the body, disable controls
		if(document.activeElement.tagName !== 'BODY') {
			return;
		}
		//wasd = 87, 65, 83, 68
		switch(e.keyCode) {
			case 87:
			case 38:
				wasd[0] = true;
				break;
			case 83:
			case 40:
				wasd[2] = true;
				break;
			case 65:
			case 37:
				wasd[1] = true;
				player.isLeft = true;
				break;
			case 68:
			case 39:
				wasd[3] = true;
				player.isLeft = false;
				break;
			case 219:	// [
				player.sizeX -= 2;
				player.sizeY = Math.floor(player.sizeX / 2);
				break;
			case 221:	// ]
				player.sizeX += 2;
				player.sizeY = Math.floor(player.sizeX / 2);
				break;
			default:
				console.log(e.keyCode);
				break;
		}
	}, false);
	
	document.addEventListener("keyup", function(e) {
		// if not focused on the body, disable controls
		if(document.activeElement.tagName !== 'BODY') {
			return;
		}
		//wasd = 87, 65, 83, 68
		switch(e.keyCode) {
			case 87:
			case 38:
				wasd[0] = false;
				break;
			case 83:
			case 40:
				wasd[2] = false;
				break;
			case 65:
			case 37:
				wasd[1] = false;
				break;
			case 68:
			case 39:
				wasd[3] = false;
				break;
			default:
				break;
		}
	}, false);
	
	/* LISTENERS */
}//init

function initGame() {
	gamestarted = true;
	gameover = false;

	// init canvas and context
	canvas = document.getElementById('stage');
	// check if canvas is supported
	if(!canvas.getContext) {
		alert("Your browser does not support HTML5 Canvas :(");
		return;
	}
	
	ctx = canvas.getContext('2d');
	ctx.font = "18px Courier New";
	
	// hide splash
	//document.getElementById("splash").className = "nodisplay";
	//document.getElementById("restart").className = "nodisplay";
	
	//goFullScreen(canvas);
	//refreshCanvasSize();
	fixedCanvasSize();
	
	// set canvas background
	canvas.background = new Image();
	canvas.background.src = 'img/background.png';

	canvas.sand_background = new Image();
	canvas.sand_background.src = 'img/sand_background.png';
	
	// reset arrays
	enemies = [];
	
	// reset player
	player.x = canvas.width/2 - (player.sizeX / 2);
	player.y = canvas.height/2;
	//player.sizeX = 16;
	//player.sizeY = 8;
	player.veloX = 0;
	player.veloY = 0;
	player.isLeft = false;
	wasd = [false, false, false, false];
	
	
	//	init first 10 enemies
	/* for(var i = 0; i < 10; i++) {
		addEnemy();
	} */

	// connect
	NetworkingJS.init();
	
	
	// set fps
	fpsInterval = 1000 / fps;
	then = Date.now();
	startTime = then;
	
	main();
}

function main() {
	now = Date.now();
	elapsed = now - then;
	
	if(elapsed > fpsInterval) {
		then = now - (elapsed % fpsInterval);
	
		if(gameover) {
			renderGameOver();
		}else {
			collision();
			draw();
			network();
			//levels();
		}
	}// elapsed
	
	//	consistent framerate
	requestAnimationFrame(main);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// movement and collision
function collision() {
	
	player.lastX = player.x;
	player.lastY = player.y;
	
	// movement velocity
	player.x += player.veloX;
	player.y += player.veloY;
	
	if(wasd[3]) {
		player.veloX += player.veloInc;
	}
	if(wasd[1]) {
		player.veloX -= player.veloInc;
	}
	if(wasd[2] && player.y + player.sizeY < canvas.height) {
		player.veloY += player.veloInc;
	}
	if(wasd[0] && player.y > 0) {
		player.veloY -= player.veloInc;
	}
	
	// screen wrap around
	// right
	if(player.veloX > 0 && player.x > canvas.width) {
		player.x = player.sizeX * -1;
	// left
	}else if(player.veloX < 0 && player.x + player.sizeX < 0) {
		player.x = canvas.width;
	}
	
	// if no vertical movement
	if(!wasd[0] && !wasd[2]) {
		// apply negative velocity
		if(player.veloY < 0) {
			player.veloY += player.veloDec;
		}else if(player.veloY > 0) {
			player.veloY -= player.veloDec;
		}
		// if low velocity, reset to 0
		if(Math.abs(player.veloY) < player.veloDec) {
			player.veloY = 0;
		}
	}
	
	// if no horizontal movement
	if(!wasd[1] && !wasd[3]) {
		// apply negative velocity
		if(player.veloX < 0) {
			player.veloX += player.veloDec;
		}else if (player.veloX > 0) {
			player.veloX -= player.veloDec;
		}
		// if low velocity, reset to 0
		if(Math.abs(player.veloX) < player.veloDec) {
			player.veloX = 0;
		}
	}
	
	// cap max velocity
	if(player.veloX > player.veloMax) {
		player.veloX = player.veloMax
	}else if(player.veloX < player.veloMax * -1) {
		player.veloX = player.veloMax * -1;
	}
	if(player.veloY > player.veloMax) {
		player.veloY = player.veloMax;
	}else if(player.veloY < player.veloMax * -1) {
		player.veloY = player.veloMax * -1;
	}
	
	
	// handle Y offscreen
	if(player.y < 0) {
		player.veloY = Math.abs(player.veloY) / 2;
		player.y = 0;
	}else if (player.y + (player.sizeY) > canvas.height) {
		player.veloY = (Math.abs(player.veloY) / 2) * -1;
		player.y = canvas.height - (player.sizeY);
	}
	
	
	////////////////////////////////////////////////////////////////////////////////////////////////
	/*
	for(var e = 0; e < enemies.length; e++) {
		var ce = enemies[e];
		if(ce.delay > 0) {
			ce.delay--;
		}else {
			// move enemt
			ce.x += ce.speed;
			// if OOB
			if((ce.speed > 0 && ce.x - ce.sizeX > canvas.width) ||
			   (ce.speed < 0 && ce.x + ce.sizeX < 0)) {
				   addEnemy(e);
			}
			// if collision with enemy
			if(intersectPlayer(ce)) {
				// player is larger, consume enemy
			   if(player.sizeX > ce.sizeX) {
					if(player.sizeX - ce.sizeX < 5) {
						player.sizeX += 2;
					}else {
						player.sizeX++;
					}
				   player.sizeY = Math.floor(player.sizeX / 2);
				   addEnemy(e);
			   // enemy is larger, game over
			   }else {
				   player.eatenBy = ce.sizeX;
				   //gameover = true;
			   }
			}
		}
	}
	*/
}// collision



// -------------------------------------
function draw() {
	// draw background
	ctx.drawImage(canvas.background, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(canvas.sand_background, 0, 550, 700, 150);
	//ctx.fillRect(0, 550, 700, 700);
	
	// draw player
	ctx.drawImage(player.isLeft ? fishes[player.color].left : fishes[player.color].right, player.x, player.y, player.sizeX, player.sizeY);
	ctx.fillText(player.name, player.x + player.sizeX/2 - (player.name.length * 3) , player.y - 5);
	
	Object.keys(players).forEach(function(p) {
		if(socket.id !== p) {
			var v = players[p];
			ctx.drawImage(v.isLeft ? fishes[v.color].left : fishes[v.color].right, v.x, v.y, v.sizeX, v.sizeY);
			ctx.fillText(v.name, v.x + v.sizeX/2 - (v.name.length * 3), v.y - 5);
		}
	});

	enemies.forEach(function(e) {
		//var fishImg = Object.keys(fishes)[Math.floor(Math.random() * Object.keys(fishes).length)]
		ctx.drawImage(e.speed < 0 ? fishes['orange'].left : fishes['orange'].right, e.x, e.y, e.sizeX, e.sizeY);
	});

	flakes.forEach(function(f) {
		//ctx.drawImage(e.speed < 0 ? fishes['orange'].left : fishes['orange'].right, e.x, e.y, e.sizeX, e.sizeY);
		ctx.fillRect(f.x, f.y, f.sizeX, f.sizeY);
	});
}


function network() {
	if(player.x != player.lastX || player.y != player.lastY) {
		var thinPlayer = {
			x: player.x,
			y: player.y,
			isLeft: player.isLeft
		};
		socket.emit('playerMovement', thinPlayer);
	}
}