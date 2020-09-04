var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const game = require('./game.js');

var maxPlayers = 50;

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	console.log(socket.id + ' connected');
	
	socket.on('registration', (player) => {
		game.addPlayer(socket.id, player.name, player.team, player.color);
		
		socket.emit('registration', game.players);
		socket.emit('chatMessage', {message: "Welcome to Fishy Online!"});
		socket.broadcast.emit('players', game.players);
		socket.broadcast.emit('chatMessage', {message: game.players[socket.id].name + ' has connected'});
	});
	socket.on('disconnect', () => {
		console.log(socket.id + ' disconnected');
		game.removePlayer();
		if(typeof game.players[socket.id] !== 'undefined') {
			socket.broadcast.emit('chatMessage', {message: game.players[socket.id].name + ' has disconnected'});
			delete game.players[socket.id];
		}
		io.emit('disconnect', socket.id);
	});
	socket.on('playerMovement', function(data) {
		if(typeof game.players[socket.id] !== 'undefined') {
			game.players[socket.id].x = data.x;
			game.players[socket.id].y = data.y;
			game.players[socket.id].isLeft = data.isLeft;

			//console.log('add to queue: ' + data.x);
			//console.log('before:');
			//console.log(JSON.stringify(game.movementQueue));
			game.addMovement(socket.id, data);
			/*
			game.movementQueue[socket.id] = {
				x: data.x,
				y: data.y,
				isLeft: data.isLeft
			};
			*/
			//console.log('after:');
			//console.log(JSON.stringify(game.movementQueue));
			/*
			var thinPlayer = {
				x: data.x,
				y: data.y,
				id: socket.id,
				isLeft: data.isLeft
			};
			socket.broadcast.emit('playerMoved', thinPlayer);
			*/
		}else {
			socket.disconnect();
		}
	});
	socket.on('playerState', function(data) {
		if(typeof game.players[socket.id] !== 'undefined') {
			game.players[socket.id].isPolyp = data.isPolyp;
			var thinPlayer = {
				isPolyp: data.isPolyp,
				id: socket.id
			};
			socket.broadcast.emit('playerState', thinPlayer);
		}
	});
	socket.on('chatMessage', function(m) {
		if(m.startsWith('/')) {
			game.command(m.split('/')[1]);
		}else if(typeof game.players[socket.id] !== 'undefined') {
			var resp = {};
			resp.message = game.players[socket.id].name + '[' + game.players[socket.id].team + ']: ' + m;
			resp.id = socket.id;
			socket.emit('chatMessage', resp);
			socket.broadcast.emit('chatMessage', resp);
		}
	});

	// attempt to start game
	game.startGameLoop(io);
});

http.listen(3000, () => {
	console.log('listening on *:3000');
});