NetworkingJS = {
	init:function() {
		socket = io();
		
		socket.on('registration', function(p) {
			players = p;
			player.id = players[socket.id];
			player.x = players[socket.id].x;
			player.y = players[socket.id].y;
			player.lastX = player.x;
			player.lastY = player.y;
			player.color = players[socket.id].color;
			player.team = players[socket.id].team;
			player.score = players[socket.id].score;
			player.isPolyp = players[socket.id].isPolyp;
			GameUIJS.updateConnectedPlayers();
		});
		socket.on('playersMoved', function(pm) {
			Object.keys(pm).forEach(function(p) {
				if(typeof players[p] !== 'undefined') {
					players[p].x = pm[p].x;
					players[p].y = pm[p].y;
					players[p].isLeft = pm[p].isLeft;
					if(typeof pm[p].diedAt !== 'undefined') {
						players[p].diedAt = pm[p].diedAt;
					}

					if(socket.id === p) {
						if(typeof pm[p].diedAt !== 'undefined') {
							player.x = pm[p].x;
							player.y = pm[p].y;
							player.diedAt = pm[p].diedAt;
							playSound(pain);
						}
					}
				}
			});
		});
		socket.on('chatMessage', function(m) {
			GameUIJS.appendChatMessage(m.message, m.id);
		});

		// new:
		socket.on('players', function(po) {
			if(typeof po === 'object') {
				// update all players
				players = po;

				// update self
				if(typeof players[socket.id] !== 'undefined') {
					player.x = players[socket.id].x;
					player.y = players[socket.id].y;
					player.sizeX = players[socket.id].sizeX;
					player.sizeY = players[socket.id].sizeY;
					player.score = players[socket.id].score;
					player.isPolyp = players[socket.id].isPolyp;
				}
				GameUIJS.updateConnectedPlayers();
			}
		});
		socket.on('playerScore', function(ps) {
			if(typeof ps.id !== 'undefined' && typeof players[ps.id] !== 'undefined') {
				players[ps.id].sizeX = ps.sizeX;
				players[ps.id].sizeY = ps.sizeY;
				players[ps.id].score = ps.score;
				// update self if dead
				if(socket.id === ps.id) {
					player.sizeX = ps.sizeX;
					player.sizeY = ps.sizeY;
					if(player.score < ps.score) {
						playSound(ding);
					}
					player.score = ps.score;
				}
				GameUIJS.updateConnectedPlayers();
			}
		});
		socket.on('playerState', function(ps) {
			if(typeof ps.id !== 'undefined') {
				players[ps.id].isPolyp = ps.isPolyp;
				// update self
				if(socket.id === ps.id) {
					player.isPolyp = ps.isPolyp;
				}
			}
		});
		socket.on('playerDeath', function(pd) {
			if(typeof pd.id !== 'undefined' && typeof pd.message !== 'undefined') {
				GameUIJS.appendChatMessage(pd.message, pd.id);
				players[pd.id].score = pd.score;
				GameUIJS.updateConnectedPlayers();
				if(socket.id === pd.id) {
					player.veloX = 0;
					player.veloY = 0;
					if(player.team == "jelly" && !player.isPolyp) {
						// change to polyp, send to server
						player.isPolyp = !player.isPolyp;
						socket.emit('playerState', {
							isPolyp: player.isPolyp
						});
					}
				}
			}
		});
		socket.on('enemy', function(eo) {
			enemies[eo.id] = eo.enemy;
		});
		socket.on('enemies', function(eo) {
			enemies = eo;
			GameUIJS.updateNumberEnemies();
		});
		socket.on('flake', function(fo) {
			flakes[fo.id] = fo.flake;
		});
		socket.on('flakes', function(fo) {
			flakes = fo;
		});

		/* disconnections/errors */
		socket.on('pdisconnect', function(pid) {
			if (pid === 'io server disconnect') {
				alert('The server has restarted. Please refresh this page.');
			}else {
				delete players[pid];
				GameUIJS.updateConnectedPlayers();
			}
		});
		socket.on('timeout', function(e) {
			GameUIJS.appendChatMessage("Connection error: timeout");
		});
		socket.on('error', function(e) {
			GameUIJS.appendChatMessage("Connection error: disconnected from the server :(");
		})
	},
	connect:function() {
		socket.emit('registration', {
			name: player.name,
			team: player.team,
			color: player.color
		});
	}
}