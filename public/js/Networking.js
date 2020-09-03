NetworkingJS = {
	init:function() {
		socket = io();
		
		socket.on('registration', function(p) {
			players = p;
			console.log('ME: ' + socket.id);
			player.id = players[socket.id];
			player.x = players[socket.id].x;
			player.y = players[socket.id].y;
			player.color = players[socket.id].color;
			player.team = players[socket.id].team;
			player.score = players[socket.id].score;
			player.isPolyp = players[socket.id].isPolyp;
			GameUIJS.updateConnectedPlayers();
		});
		socket.on('newPlayer', function(p) {
			console.log(p.name + ' connected');
			players[p.id] = p;
			GameUIJS.updateConnectedPlayers();
		});
		socket.on('playerMoved', function(p) {
			if(typeof p.id !== 'undefined' && typeof players[p.id] !== 'undefined') {
				players[p.id].x = p.x;
				players[p.id].y = p.y;
				players[p.id].isLeft = p.isLeft;
				if(socket.id === p.id) {
					player.x = p.x;
					player.y = p.y;
				}
			}
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
			if(typeof ps.id !== 'undefined') {
				players[ps.id].sizeX = ps.sizeX;
				players[ps.id].sizeY = ps.sizeY;
				players[ps.id].score = ps.score;

				// update self
				if(socket.id === ps.id) {
					player.sizeX = ps.sizeX;
					player.sizeY = ps.sizeY;
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
					player.isPolyp = players[ps.id].isPolyp;
				}
			}
		});
		socket.on('enemies', function(eo) {
			enemies = eo;
			GameUIJS.updateNumberEnemies();
		});
		socket.on('flakes', function(fo) {
			flakes = fo;
		});


		/* disconnections/errors */
		socket.on('disconnect', function(pid) {
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