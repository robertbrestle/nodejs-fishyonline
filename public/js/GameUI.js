GameUIJS = {
    init:function() {
        document.getElementById('start')
			.addEventListener('click', function() {

                // check if canvas is supported
                if(!canvas.getContext) {
                    alert("Your browser does not support HTML5 Canvas :(");
                    return;
                }

                document.getElementById('error').style='display:none;';
                var name = document.getElementById('name').value.trim();
                if(name === "") {
                    document.getElementById('error').style='';
                    document.getElementById('error').textContent = 'Please enter your name!';
                    return;
                }
                player.name = name;

                player.team = document.getElementById('team').value;

                player.color = document.getElementById('color').value;
                if(document.getElementById('color').selectedIndex === 0) {
                    player.color = Object.keys(teams.fish)[Math.floor(Math.random() * Object.keys(teams.fish).length)];
                }

                player.sizeX = player[player.team].sizeX;
                player.sizeY = player[player.team].sizeY;

                document.getElementById('splash').style='display:none;';
                document.getElementById('bottombar').style='';
                document.getElementById('infobar').style='';
                GameJS.initGame();
                // connect
		        NetworkingJS.connect();
        }, false);

        document.getElementById('chatinputbar').addEventListener('submit', function(e) {
            e.preventDefault();
            var chatinput = document.getElementById('chatinput');
            if(chatinput.value.trim() !== '') {
                socket.emit('chatMessage', chatinput.value.trim());
                chatinput.value = '';
            }
        });
    },
    updateConnectedPlayers:function() {
        var connectedPlayers = "";
        Object.keys(players).forEach(function(p) {
            if(socket.id === players[p].id) {
                connectedPlayers += '<b>';
            }
            connectedPlayers += players[p].name + '[' + (players[p].team === 'jelly' ? players[p].sizeY : players[p].sizeX) + ']: ' + players[p].score;
            if(socket.id === players[p].id) {
                connectedPlayers += '</b>';
            }
            connectedPlayers += '<br>'
        });
        document.getElementById('totalPlayers').textContent = Object.keys(players).length;
        document.getElementById('connectedPlayers').innerHTML = connectedPlayers;
    },
    updateNumberEnemies:function() {
        document.getElementById('totalEnemies').textContent = enemies.length;
    },
    appendChatMessage:function(message, id) {
        var li = document.createElement('li');
        if(typeof id !== 'undefined') {
            li.className = players[id].color;
        }
        li.textContent = message;
        document.getElementById('chatmessages').append(li);
        document.getElementById('chatmessages').scrollTop = document.getElementById('chatmessages').scrollHeight;
    }
};