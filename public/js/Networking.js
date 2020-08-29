NetworkingJS = {
	init:function() {
		socket = io();

		socket.emit('registration', {
			name: player.name,
			team: player.team,
			color: player.color
		});

		socket.on('registration', function(p) {
			players = p;
			console.log('ME: ' + socket.id);
			player.id = players[socket.id];
			player.x = players[socket.id].x;
			player.y = players[socket.id].y;
			player.color = players[socket.id].color;
			player.team = players[socket.id].team;
			player.score = players[socket.id].score;
			GameUIJS.updateConnectedPlayers();
		});
		socket.on('newPlayer', function(p) {
			console.log(p.name + ' connected');
			players[p.id] = p;
			GameUIJS.updateConnectedPlayers();
		});
		socket.on('playerMoved', function(p) {
			if(typeof p.id === 'undefined') {
				console.log(JSON.stringify(p));
			}else {
				if(typeof players[p.id] !== 'undefined') {
					players[p.id].x = p.player.x;
					players[p.id].y = p.player.y;
					players[p.id].isLeft = p.player.isLeft;
					if(socket.id === p.id) {
						player.x = p.player.x;
						player.y = p.player.y;
					}
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
				player.x = players[socket.id].x;
				player.y = players[socket.id].y;
				player.sizeX = players[socket.id].sizeX;
				player.sizeY = players[socket.id].sizeY;
				player.score = players[socket.id].score;

				GameUIJS.updateConnectedPlayers();
			}
		});
		socket.on('enemies', function(eo) {
			enemies = eo;
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
		socket.on('error', function(e) {
			GameUIJS.appendChatMessage("Connection error: disconnected from the server :(");
		})
	}
}