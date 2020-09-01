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
			case 32:	// space - special ability
				if(player.team === 'jelly' && player.y + player.sizeY >= player[player.team].polypMaxY) {
					player.isPolyp = !player.isPolyp;
					player.veloX = 0;
					player.veloY = 0;
					var thinPlayer = {
						isPolyp: player.isPolyp
					};
					socket.emit('playerState', thinPlayer);
				}
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
	canvas.sand_background.src = 'img/sand_background2.png';
	
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

	if(player.team === 'clam' || (player.team === 'jelly' && player.isPolyp)) {
		return;
	}
	
	player.lastX = player.x;
	player.lastY = player.y;
	
	// movement velocity
	player.x += player.veloX;
	player.y += player.veloY;
	
	if(wasd[3]) {
		player.veloX += player[player.team].veloInc;
	}
	if(wasd[1]) {
		player.veloX -= player[player.team].veloInc;
	}
	if(wasd[2] && player.y + player.sizeY < canvas.height) {
		player.veloY += player[player.team].veloInc;
	}
	if(wasd[0] && player.y > 0) {
		player.veloY -= player[player.team].veloInc;
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
			player.veloY += player[player.team].veloDec;
		}else if(player.veloY > 0) {
			player.veloY -= player[player.team].veloDec;
		}
		// if low velocity, reset to 0
		if(Math.abs(player.veloY) < player[player.team].veloDec) {
			player.veloY = 0;
		}
	}
	
	// if no horizontal movement
	if(!wasd[1] && !wasd[3]) {
		// apply negative velocity
		if(player.veloX < 0) {
			player.veloX += player[player.team].veloDec;
		}else if (player.veloX > 0) {
			player.veloX -= player[player.team].veloDec;
		}
		// if low velocity, reset to 0
		if(Math.abs(player.veloX) < player[player.team].veloDec) {
			player.veloX = 0;
		}
	}
	
	// cap max velocity
	if(player.veloX > player[player.team].veloMax) {
		player.veloX = player[player.team].veloMax
	}else if(player.veloX < player[player.team].veloMax * -1) {
		player.veloX = player[player.team].veloMax * -1;
	}
	if(player.veloY > player[player.team].veloMax) {
		player.veloY = player[player.team].veloMax;
	}else if(player.veloY < player[player.team].veloMax * -1) {
		player.veloY = player[player.team].veloMax * -1;
	}
	
	
	// handle Y offscreen
	if(player.y < player[player.team].screenTop) {
		player.veloY = Math.abs(player.veloY) / 2;
		player.y = player[player.team].screenTop;
	}else if (player.y + (player.sizeY) > canvas.height) {
		player.veloY = (Math.abs(player.veloY) / 2) * -1;
		player.y = canvas.height - (player.sizeY);
	}
}// collision



// -------------------------------------
function draw() {
	// draw background
	ctx.drawImage(canvas.background, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(canvas.sand_background, 0, 550, 700, 150);
	//ctx.fillRect(0, 550, 700, 700);
	
	// draw player
	if(player.team === 'jelly') {
		ctx.drawImage(player.isPolyp ? teams[player.team][player.color].polyp : teams[player.team][player.color].jelly, player.x, player.y, player.sizeX, player.sizeY);
	}else if(player.team === 'fish') {
		ctx.drawImage(player.isLeft ? teams[player.team][player.color].left : teams[player.team][player.color].right, player.x, player.y, player.sizeX, player.sizeY);
	}else {
		ctx.drawImage(teams[player.team][player.color].img, player.x, player.y, player.sizeX, player.sizeY);
	}
	ctx.fillText(player.name, player.x + player.sizeX/2 - (player.name.length * 3) , player.y - 5);
	
	Object.keys(players).forEach(function(p) {
		if(socket.id !== p) {
			var v = players[p];
			if(player.team === 'jelly') {
				ctx.drawImage(v.isPolyp ? teams[v.team][v.color].polyp : teams[v.team][v.color].jelly, v.x, v.y, v.sizeX, v.sizeY);
			}else if(v.team === 'fish') {
				ctx.drawImage(v.isLeft ? teams[v.team][v.color].left : teams[v.team][v.color].right, v.x, v.y, v.sizeX, v.sizeY);
			}else {
				ctx.drawImage(teams[v.team][v.color].img, v.x, v.y, v.sizeX, v.sizeY);
			}
			ctx.fillText(v.name, v.x + v.sizeX/2 - (v.name.length * 3), v.y - 5);
		}
	});

	enemies.forEach(function(e) {
		if(e.team === 'fish') {
			ctx.drawImage(e.speed < 0 ? teams[e.team][e.color].left : teams[e.team][e.color].right, e.x, e.y, e.sizeX, e.sizeY);
		}else {
			ctx.drawImage(teams[e.team][e.color].img, e.x, e.y, e.sizeX, e.sizeY);
		}
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