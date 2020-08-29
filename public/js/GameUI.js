GameUIJS = {
    init:function() {
        document.getElementById('start')
			.addEventListener('click', function() {
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
                    player.color = Object.keys(fishes)[Math.floor(Math.random() * Object.keys(fishes).length)];
                }

                document.getElementById('splash').style='display:none;';
                document.getElementById('sidebar').style='';
                document.getElementById('chatbar').style='';
                initGame();
        }, false);

        document.getElementById('chatinputbar').addEventListener('submit', function(e) {
            e.preventDefault();
            var chatinput = document.getElementById('chatinput');
            console.log('message: ' + chatinput.value);
            socket.emit('chatMessage', chatinput.value);
            chatinput.value = '';
        });
    },
    updateConnectedPlayers:function() {
        var connectedPlayers = "";
        Object.keys(players).forEach(function(p) {
            if(socket.id === players[p].id) {
                connectedPlayers += '<b>';
            }
            connectedPlayers += players[p].name + '[' + players[p].sizeX + ']: ' + players[p].score;
            if(socket.id === players[p].id) {
                connectedPlayers += '</b>';
            }
            connectedPlayers += '<br>'
        });
        document.getElementById('totalPlayers').textContent = Object.keys(players).length;
        document.getElementById('totalEnemies').textContent = enemies.length;
        document.getElementById('connectedPlayers').innerHTML = connectedPlayers;
    },
    appendChatMessage:function(message, id) {
        var li = document.createElement('li');
        if(typeof id !== 'undefined') {
            li.className = players[id].team;
        }
        li.textContent = message;
        document.getElementById('chatmessages').append(li);
        document.getElementById('chatmessages').scrollTop = document.getElementById('chatmessages').scrollHeight;
    }
};