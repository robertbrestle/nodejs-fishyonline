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
		//socket.broadcast.emit('newPlayer', game.players[socket.id]);
		socket.broadcast.emit('chatMessage', {message: game.players[socket.id].name + ' has connected'});
	});
	socket.on('disconnect', () => {
		console.log(socket.id + ' disconnected');
		if(typeof game.players[socket.id] !== 'undefined') {
			socket.broadcast.emit('chatMessage', {message: game.players[socket.id].name + ' has disconnected'});
			delete game.players[socket.id];
		}
		io.emit('disconnect', socket.id);
		console.log('# enemies: ' + game.enemies.length);
	});
	socket.on('playerMovement', function(data) {
		if(typeof game.players[socket.id] !== 'undefined') {
			game.players[socket.id].x = data.x;
			game.players[socket.id].y = data.y;
			game.players[socket.id].isLeft = data.isLeft;
			socket.broadcast.emit('playerMoved', {player: game.players[socket.id], id: socket.id});
		}else {
			socket.disconnect();
		}
	});
	socket.on('chatMessage', function(m) {
		if(typeof game.players[socket.id] !== 'undefined') {
			var resp = {};
			resp.message = game.players[socket.id].name + '[' + game.players[socket.id].score + ']: ' + m;
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