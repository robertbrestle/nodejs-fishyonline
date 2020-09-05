var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const game = require('./game.js');

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	console.log(socket.id + ' connected');
	
	socket.on('registration', (player) => {
		// attempt to start game
		game.startGameLoop(io);
		
		game.addPlayer(socket.id, player.name, player.team, player.color);
		
		socket.emit('registration', game.players);
		socket.emit('chatMessage', {message: "Welcome to Fishy Online!"});
		socket.broadcast.emit('players', game.players);
		socket.broadcast.emit('chatMessage', {message: game.players[socket.id].name + ' has connected'});
	});
	socket.on('disconnect', () => {
		console.log(socket.id + ' disconnected');
		if(typeof game.players[socket.id] !== 'undefined') {
			socket.broadcast.emit('chatMessage', {message: game.players[socket.id].name + ' has disconnected'});
			game.removePlayer(socket.id);
		}
		io.emit('disconnect', socket.id);
	});
	socket.on('playerMovement', function(data) {
		if(typeof game.players[socket.id] !== 'undefined') {
			game.players[socket.id].x = data.x;
			game.players[socket.id].y = data.y;
			game.players[socket.id].isLeft = data.isLeft;
			game.addMovement(socket.id, data);
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
	socket.on('playerPoop', () => {
		game.addPoop(socket.id);
	});
	socket.on('chatMessage', function(m) {
		if(m.startsWith('/')) {
			game.command(m.split('/')[1]);
		}else if(typeof game.players[socket.id] !== 'undefined') {
			var resp = {};
			resp.message = game.players[socket.id].name + '[' + game.players[socket.id].team + ']: ' + m;
			resp.id = socket.id;
			io.emit('chatMessage', resp);
		}
	});
});

http.listen(25565, () => {
	console.log('listening on *:25565');
});