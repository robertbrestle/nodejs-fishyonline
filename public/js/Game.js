GameJS = {
	init:function() {

		document.addEventListener("keydown", function(e) {
			// if not focused on the body, disable controls
			if(document.activeElement.tagName !== 'BODY') {
				return;
			}
			//wasd = 87, 65, 83, 68
			switch(e.code) {
				case 'KeyW':
				case 'ArrowUp':
					e.preventDefault();
					wasd[0] = true;
					break;
				case 'KeyS':
				case 'ArrowDown':
					e.preventDefault();
					wasd[2] = true;
					break;
				case 'KeyA':
				case 'ArrowLeft':
					e.preventDefault();
					wasd[1] = true;
					player.isLeft = true;
					break;
				case 'KeyD':
				case 'ArrowRight':
					e.preventDefault();
					wasd[3] = true;
					player.isLeft = false;
					break;
				case 'Space':	// space - special ability
					e.preventDefault();
					if(!wasd[4]) {
						wasd[4] = true;
						playSound(clank);
						// TODO: add timeout
						switch(player.team) {
							case 'jelly':
								if(player.isPolyp || player.y + player.sizeY >= player[player.team].polypMaxY) {
									player.isPolyp = !player.isPolyp;
									player.veloX = 0;
									player.veloY = 0;
									var thinPlayer = {
										isPolyp: player.isPolyp
									};
									socket.emit('playerState', thinPlayer);
								}
								break;
							case 'fish':
								if(player.sizeX > 1) {
									socket.emit('playerPoop');
								}
								break;
							default:
								break;
						}
					}
					break;
				default:
					console.log(e.code);
					break;
			}
		}, false);
		
		document.addEventListener("keyup", function(e) {
			// if not focused on the body, disable controls
			if(document.activeElement.tagName !== 'BODY') {
				return;
			}
			//wasd = 87, 65, 83, 68
			switch(e.code) {
				case 'KeyW':
				case 'ArrowUp':
					wasd[0] = false;
					break;
				case 'KeyS':
				case 'ArrowDown':
					wasd[2] = false;
					break;
				case 'KeyA':
				case 'ArrowLeft':
					wasd[1] = false;
					break;
				case 'KeyD':
				case 'ArrowRight':
					wasd[3] = false;
					break;
				case 'Space':
					wasd[4] = false;
					break;
				default:
					break;
			}
		}, false);

		// hit ESC from the chatbox to focus on the screen
		document.getElementById('chatinput')
				.addEventListener('keydown', function(e) {
			switch(e.code) {
				case 'Escape': // ESC
					document.activeElement.blur();
					break;
				default:
					break;
			}
		});
		
		/* LISTENERS */
	}//init
	,
	initGame:function() {

		ctx = canvas.getContext('2d');
		ctx.font = "18px Courier New";
		
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
		//player.x = canvas.width/2 - (player.sizeX / 2);
		//player.y = canvas.height/2;
		player.veloX = 0;
		player.veloY = 0;
		player.isLeft = false;
		wasd = [false, false, false, false, false];

		// focus on <body> to enable keyboard movement
		document.activeElement.blur();

		// music
		if(document.getElementById('musicToggle').checked) {
			music.play();
		}
		
		requestAnimationFrame(GameJS.main);
	}
	,
	main:function(time) {
		// this causes stuttering
		//var timeDelta = time - aStartTime;
		
		// network
		currentNetworkTick = Math.round((time - aStartTime) / networkTickRate);
		deltaNetworkTick = (currentNetworkTick - lastNetworkTick) * networkTickRate;
		lastNetworkTick = currentNetworkTick;
		// collision
		currentCollisionTick = Math.round((time - aStartTime) / collisionTickRate);
		deltaCollisionTick = (currentCollisionTick - lastCollisionTick) * collisionTickRate;
		lastCollisionTick = currentCollisionTick;
		// draw
		currentRenderTick = Math.round((time - aStartTime) / renderTickRate);
		deltaRenderTick = (currentRenderTick - lastRenderTick) * renderTickRate;
		lastRenderTick = currentRenderTick;
		// second
		currentSecondTick = Math.round((time - aStartTime) / secondTickRate);
		deltaSecondTick = (currentSecondTick - lastSecondTick) * secondTickRate;
		lastSecondTick = currentSecondTick;
		

		if(deltaNetworkTick > 0) {
			GameJS.network();
			GameJS.networkCollision();
		}
		if(deltaCollisionTick > 0) {
			GameJS.collision();
		}
		if(deltaRenderTick > 0) {
			GameJS.draw();
		}
		if(deltaSecondTick > 0) {
			GameJS.ping();
			GameJS.animation();
		}

		requestAnimationFrame(GameJS.main);
	}
	,


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// movement and collision
	collision:function() {

		// player movement
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
	,
	networkCollision:function() {
		// move enemies
		for(let i = 0; i < enemies.length; i++) {
			if(enemies[i].delay == 0) {
				enemies[i].x += enemies[i].speed;
			}
		}
		// move flakes
		for(let i = 0; i < flakes.list.length; i++) {
			if(flakes.list[i].delay <= 0) {
				flakes.list[i].y += flakes.speed;
			}
		}
	}//networkCollision
	,

	// -------------------------------------
	draw:function() {
		// draw background
		ctx.drawImage(canvas.background, 0, 0, canvas.width, canvas.height);
		ctx.drawImage(canvas.sand_background, 0, 550, canvas.width, 150);
		//ctx.fillRect(0, 550, 700, 700);

		// draw flakes
		flakes.list.forEach(function(f) {
			//ctx.drawImage(e.speed < 0 ? fishes['orange'].left : fishes['orange'].right, e.x, e.y, e.sizeX, e.sizeY);
			ctx.fillRect(f.x, f.y, f.size, f.size);
		});

		// draw enemies
		enemies.forEach(function(e) {
			if(e.team === 'fish') {
				ctx.drawImage(e.speed < 0 ? teams[e.team][e.color].left : teams[e.team][e.color].right, e.x, e.y, e.sizeX, e.sizeY);
			}else {
				ctx.drawImage(teams[e.team][e.color][teams[e.team].animationFrame], e.x, e.y, e.sizeX, e.sizeY);
			}
		});

		// draw other players
		Object.keys(players).forEach(function(p) {
			if(socket.id !== p && typeof players[p] !== 'undefined') {
				var v = players[p];
				if(v.team === 'jelly') {
					ctx.drawImage(v.isPolyp ? teams[v.team][v.color].polyp : teams[v.team][v.color].jelly, v.x, v.y, v.sizeX, v.sizeY);
				}else if(v.team === 'fish') {
					ctx.drawImage(v.isLeft ? teams[v.team][v.color].left : teams[v.team][v.color].right, v.x, v.y, v.sizeX, v.sizeY);
				}else {
					ctx.drawImage(teams[v.team][v.color][teams[v.team].animationFrame], v.x, v.y, v.sizeX, v.sizeY);
				}
				ctx.fillText(v.name, v.x + v.sizeX/2 - (v.name.length * 3), v.y - 5);
			}
		});

		// draw player
		// TODO: fix death animation
		if(player.deathFlicker === 0) {
			if(player.team === 'jelly') {
				ctx.drawImage(player.isPolyp ? teams[player.team][player.color].polyp : teams[player.team][player.color].jelly, player.x, player.y, player.sizeX, player.sizeY);
			}else if(player.team === 'fish') {
				ctx.drawImage(player.isLeft ? teams[player.team][player.color].left : teams[player.team][player.color].right, player.x, player.y, player.sizeX, player.sizeY);
			}else {
				ctx.drawImage(teams[player.team][player.color][teams[player.team].animationFrame], player.x, player.y, player.sizeX, player.sizeY);
			}
			if(player.diedAt > Date.now()) {
				player.deathFlicker = player.deathFlickerMax;
			}
		}else {
			player.deathFlicker--;
		}
		ctx.fillText(player.name, player.x + player.sizeX/2 - (player.name.length * 3) , player.y - 5);
	}//draw
	,
	network:function() {
		if(player.x != player.lastX || player.y != player.lastY) {
			var thinPlayer = {
				x: player.x,
				y: player.y,
				isLeft: player.isLeft
			};
			socket.emit('playerMovement', thinPlayer);

			player.lastX = player.x;
			player.lastY = player.y;
		}
	}//network
	,
	ping:function() {
		pingStart = Date.now();
		socket.emit('ping', () => {
			ping = Date.now() - pingStart;
			document.getElementById("pingDisplay").textContent = ping;
		});
	}//ping
	,
	animation:function() {
		Object.keys(teams).forEach(function(t) {
			if(teams[t].animationFrames > 1) {
				teams[t].animationFrame++;
				if(teams[t].animationFrame === teams[t].animationFrames) {
					teams[t].animationFrame = 0;
				}
			}
		});
	}//animation
};