const helpers = require('./helpers.js');
const fishNames = require('./fishNames.js');
//const { v4: uuidv4 } = require('uuid');

var isStarted = false;
var reset = false;
var io = null;
var players = {};
var enemies = [];
var flakes = [];

var movementQueue = {};


var startTime, now, then, elapsed;
then = Date.now();
startTime = then;
var frameRate = 1000 / 30;

var stageVars = {
    width: 900,
    height: 700,
    end: {
        roundOver: false,
        winScore: 200,
        countdownMax: 10,
        countdown: 10,
        tickTime: then
    }
};

var playerVars = {
    maxNameLength: 12,
    isLeft: false,
    isPolyp: true,
    collisionWait: 3000,
    fish: {
        sizeX: 16,
        sizeY: 8,
        minSizeX: 10,
        maxSizeX: 150,
        scale: 0.5,
        spawnTop: 0,
        spawnBottom: 525,
        minSpeed: 1,
	    maxSpeed: 7
    },
    crab: {
        sizeX: 16,
        sizeY: 16,
        minSizeX: 16,
        maxSizeX: 64,
        scale: 1,
        spawnTop: 525,
        spawnBottom: 700,
        minSpeed: 1,
        maxSpeed: 2
    },
    clam: {
        sizeX: 16,
        sizeY: 16,
        minSizeX: 16,
        maxSizeX: 128,
        scale: 1,
        spawnTop: 525,
        spawnBottom: 700
    },
    jelly: {
        sizeX: 10,
        sizeY: 16,
        minSizeX: 10,
        maxSizeX: 100,
        scale: 1.5,
        minSpeed: 1,
        maxSpeed: 1,
        spawnTop: 550,
        spawnBottom: 700
    }
};

var enemyVars = {
    minNum: 10,
    maxNum: 30,
    reduceTo: 10,
    incNum: 5,
	minX: 10,
    maxX: 150,
    rareMinX: 300,
    rareMaxX: 500,
    rareChance: 0.2,
	minSpeed: 1,
	maxSpeed: 10,
	delay: 50,
    team: 'fish', //'crab'
    points: 2,
    crabSpawnChance: 0.2
};

var flakeVars = {
    maxNum: 10,
    reduceTo: 20,
    flakeYStart: -5,
    size: 5,
    sizeFish: 10,
    speed: 1,
    delay: 1000,
    points: 1,
    pointsFish: 2,
    flakeMaxSizeX: 100,
    flakeMaxSizeY: 100
};

var colors = [
    'orange',
    'blue',
    'green',
    'purple',
    'black',
    'red'
];

var teams = [
    'fish',
    'crab',
    'jelly',
    'clam'
];

////////////////////////////////////////////////////////

function command(cmd) {
    switch(cmd) {
        case 'reset':
            io.emit('chatMessage', {message: 'Resetting please wait..'});
            reset = true;
            stopGameLoop(true);
            break;
        case 'bigfish':
            addEnemy(1, undefined, true);
            break;
        case 'addenemies':
            enemyVars.reduceTo += 5;
            addEnemy(5);
            break;
        case 'removeenemies':
            enemyVars.reduceTo -= 5;
            break;
        case 'screenclear':
            enemies = [];
            enemyVars.reduceTo = 10;
            addEnemy(5);
            flakes = [];
            flakeVars.reduceTo = 20;
            addFlake(20);
            Object.keys(players).forEach(function(p) {
                if(enemies.length < enemyVars.maxNum) {
                    addEnemy(5);
                    enemyVars.reduceTo += 5;
                }
            });
            break;
        case 'fishfood':
            flakeVars.reduceTo += 5;
            addFlake(5);
            break;
        default:
            io.emit('chatMessage', {message: 'No command found'});
            break;
    }
}

function validatePlayer(player) {
    // player info validation :^)
    var isValid = true;

    if(typeof player.name === 'undefined' || player.name === '' || player.name.length >= playerVars.maxNameLength) {
        isValid = false;
    }
    if(typeof player.team === 'undefined' || player.team === '' || teams.indexOf(player.team) === -1) {
        isValid = false;
    }
    if(typeof player.color === 'undefined' || player.color === '' || colors.indexOf(player.color) === -1) {
        isValid = false;
    }

    return isValid;
}

function addPlayer(id, name, team, color) {
    var newPlayer = {
        name: name.slice(0,playerVars.maxNameLength),
        color: color,
        team: team,
        x: Math.floor(Math.random() * Math.floor(stageVars.width/2)) + Math.floor(stageVars.width/4),
        y: Math.floor((Math.random() * (playerVars[team].spawnBottom - playerVars[team].spawnTop)) + playerVars[team].spawnTop),
        sizeX: playerVars[team].sizeX,
        sizeY: playerVars[team].sizeY,
        isLeft: playerVars.isLeft,
        isPolyp: playerVars.isPolyp,
        score: 0,
        lastCollision: Date.now() - playerVars.collisionWait
    };
    players[id] = newPlayer;
    
    if(enemies.length < enemyVars.maxNum) {
        addEnemy(5);
        enemyVars.reduceTo += 5;
        io.emit('enemies', enemies);
    }
}

function removePlayer(id) {
    enemyVars.reduceTo -= 5;
    if(typeof players[id] !== 'undefined') {
        delete players[id];
    }
}


function addEnemy(qty, index, spawnRare) {

    // remove enemy if reduceTo < enemies.length
    if(typeof index !== 'undefined' && enemyVars.reduceTo < enemies.length) {
        enemies.splice(index, 1);
        return;
    }

    var addQty = 1;
    if(typeof qty !== 'undefined') {
        addQty = qty;
    }

    for(var i = 0; i < addQty; i++) {
        
        var enemy = {};
        if(Math.random() < enemyVars.crabSpawnChance) {
            enemy.team = 'crab';
        }else {
            enemy.team = 'fish';
        }

        enemy.color = colors[Math.floor(Math.random() * colors.length)];
        
        // RARE BOI
        if((typeof spawnRare !== 'undefined' && spawnRare) || (enemy.sizeX === enemyVars.maxX && Math.random() < enemyVars.rareChance)) {
            enemy.team = 'fish';
            enemy.sizeX = Math.floor((Math.random() * enemyVars.rareMaxX) + enemyVars.rareMinX);
            enemy.sizeY = Math.floor(enemy.sizeX/2);
            enemy.speed = Math.random() + 0.5;
            enemy.name = fishNames[Math.floor(Math.random() * fishNames.length)];
        }else { // common enemies
            enemy.sizeX = Math.floor((Math.random() * playerVars[enemy.team].maxSizeX) + playerVars[enemy.team].minSizeX);
            enemy.sizeY = Math.floor(enemy.sizeX * playerVars[enemy.team].scale);
            enemy.speed = (Math.random() * playerVars[enemy.team].maxSpeed) + playerVars[enemy.team].minSpeed;
            enemy.name = enemy.color + ' ' + enemy.team;
        }
        
        // determine direction
        if(Math.floor(Math.random() * 2)) {
            enemy.x = enemy.sizeX * -1;
        }else {
            enemy.x = enemy.sizeX + stageVars.width;
            enemy.speed *= -1;
        }
        enemy.y = Math.floor((Math.random() * (playerVars[enemy.team].spawnBottom - playerVars[enemy.team].spawnTop)) + playerVars[enemy.team].spawnTop);

        enemy.delay = Math.floor(Math.random() * enemyVars.delay);


        if(addQty === 1 && typeof index !== 'undefined') {
            enemies[index].x = enemy.x;
            enemies[index].y = enemy.y;
            enemies[index].sizeX = enemy.sizeX;
            enemies[index].sizeY = enemy.sizeY;
            enemies[index].speed = enemy.speed;
            enemies[index].team = enemy.team;
            enemies[index].delay = enemy.delay;
            enemies[index].name = enemy.name;
            enemies[index].color = enemy.color;
        }else {
            enemies.push(helpers.clone(enemy));
        }
    }
}

function addFlake(qty, index, location) {

    // remove enemy if reduceTo < enemies.length
    if(typeof index !== 'undefined' && flakeVars.reduceTo < flakes.length) {
        flakes.splice(index, 1);
        return;
    }

    var addQty = 1;
    if(typeof qty !== 'undefined') {
        addQty = qty;
    }

    for(var i = 0; i < addQty; i++) {
        
        var flake = {};
        if(typeof location !== 'undefined') {
            flake.x = location.x;
            flake.y = location.y;
            flake.sizeX = flakeVars.sizeFish;
            flake.sizeY = flakeVars.sizeFish;
            flake.delay = 0;
            flake.type = 'fish';
            flake.points = flakeVars.pointsFish;
        }else {
            flake.x = Math.floor((Math.random() * stageVars.width));
            flake.y = flakeVars.flakeYStart;
            flake.sizeX = flakeVars.size;
            flake.sizeY = flakeVars.size;
            flake.delay = Math.floor(Math.random() * flakeVars.delay);
            flake.type = '';
            flake.points = flakeVars.points;
        }
        flake.speed = flakeVars.speed;

        if(addQty === 1 && typeof index !== 'undefined') {
            flakes[index].x = flake.x;
            flakes[index].y = flake.y;
            flakes[index].sizeX = flake.sizeX;
            flakes[index].sizeY = flake.sizeY;
            flakes[index].delay = flake.delay;
            flakes[index].type = '';
            flake.points = flake.points;
        }else {
            flakes.push(helpers.clone(flake));
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

function startGameLoop(myIO) {
    if(!isStarted) {
        if(typeof myIO !== 'undefined') {
            io = myIO;
        }
        isStarted = true;
        reset = false;

        enemyVars.reduceTo = 10;
        flakeVars.reduceTo = 20;

        // init enemies
        addEnemy(5);

        Object.keys(players).forEach(function(p) {
            if(enemies.length < enemyVars.maxNum) {
                addEnemy(5);
                enemyVars.reduceTo += 5;
            }
        });

        // init flakes
        addFlake(20);

        gameloop();
    }
}

function stopGameLoop(isReset) {
    isStarted = false;
    enemies = [];
    flakes = [];

    // TODO: reset players (score + location)
    Object.keys(players).forEach(function(p) {
        players[p].sizeX = playerVars[players[p].team].sizeX;
        players[p].sizeY = playerVars[players[p].team].sizeY;
        players[p].score = 0;
        players[p].isPolyp = true;
        players[p].lastCollision = Date.now() - playerVars.collisionWait;
    });
    io.emit('players', players);

    if(typeof isReset !== 'undefined' && isReset) {
        setTimeout(function() {
            io.emit('chatMessage', {message: 'Reset complete!'});
            startGameLoop();
        }, 500);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

function collision() {
    // TODO: validate player collision

    var rightNow = Date.now();

    // enemies
    for(var e = 0; e < enemies.length; e++) {
        var ce = enemies[e];
        if(ce.delay > 0) {
            ce.delay--;
        }else {
            // move enemy
            ce.x += ce.speed;
            // if OOB
            if((ce.speed > 0 && ce.x - ce.sizeX > stageVars.width) ||
                (ce.speed < 0 && ce.x + ce.sizeX < 0)) {
                    addEnemy(1, e);
                    continue;
            }
            // if collision with enemy
            Object.keys(players).forEach(function(p) {
                if(players[p].team === 'clam' || (players[p].team === 'jelly' && players[p].isPolyp)) {
                    return;
                }
                if((players[p].lastCollision + playerVars.collisionWait < rightNow) && 
                    helpers.intersect(ce, players[p])) {

                    // player is larger, consume enemy
                    if((players[p].team === 'jelly' && players[p].sizeY > ce.sizeX) || (players[p].team !== 'jelly' && players[p].sizeX > ce.sizeX)) {
                        if(players[p].sizeX < playerVars[players[p].team].maxSizeX) {
                            if(players[p].sizeX < playerVars[players[p].team].maxSizeX) {
                                players[p].sizeX++;
                                players[p].sizeY = Math.floor(players[p].sizeX * playerVars[players[p].team].scale);
                            }
                        }
                        players[p].score += enemyVars.points;
                        addEnemy(1, e);
                        addFishFlake(p, false);
                        checkWinCondition(p);
                    // enemy is larger - deduct points, reset position, broadcast
                    }else {
                        players[p].x = Math.floor(stageVars.width/2 - (players[p].sizeX/2));
                        players[p].y = stageVars.height - players[p].sizeY - 10;
                        players[p].lastCollision = rightNow;
                        players[p].score -= enemyVars.points;
                        // player death time + collision wait = client to show invulnerable animation
                        players[p].diedAt = rightNow + playerVars.collisionWait;

                        var thinPlayerMove = {
                            x: players[p].x,
                            y: players[p].y,
                            isLeft: players[p].isLeft,
                            diedAt: players[p].diedAt
                        };
                        addMovement(p, thinPlayerMove);
                        //io.emit('playerMoved', thinPlayerMove);

                        var resp = {};
                        resp.id = p;
                        resp.message = players[p].name + '[' + (players[p].team === 'jelly' ? players[p].sizeY : players[p].sizeX) + '] was eaten by ' + ce.name + '[' + ce.sizeX + ']';
                        io.emit('chatMessage', resp);
                    }

                    var thinPlayerScore = {
                        id: p,
                        sizeX: players[p].sizeX,
                        sizeY: players[p].sizeY,
                        score: players[p].score
                    };
                    io.emit('playerScore', thinPlayerScore);
                }
            });
        }
    }
    io.emit('enemies', enemies);


    // flakes
    for(var f = 0; f < flakes.length; f++) {
        var cf = flakes[f];
        if(cf.delay > 0) {
            cf.delay--;
        }else {
            // move enemt
            cf.y += cf.speed;
            // if OOB
            if(cf.y > stageVars.height) {
                addFlake(1, f);
                continue;
            }
            // if collision with enemy
            //for(int p = 0; p < Object.keys(players).length; p++) {
            Object.keys(players).forEach(function(p) {
                if(typeof flakes[f] === 'undefined') {
                    return;
                }
                if(players[p].team === flakes[f].type) {
                    return;
                }
                if(players[p].team !== 'clam' && (players[p].sizeY >= flakeVars.flakeMaxSizeY || players[p].sizeX >= flakeVars.flakeMaxSizeX)) {
                    return;
                }
                if((players[p].lastCollision + playerVars.collisionWait < rightNow) && 
                    helpers.intersect(cf, players[p])) {

                        if(players[p].sizeX < playerVars[players[p].team].maxSizeX) {
                            players[p].sizeX++;
                            players[p].sizeY = Math.floor(players[p].sizeX * playerVars[players[p].team].scale);
                        }
                        players[p].score += flakes[f].points;

                        addFlake(1, f);
                        var thinPlayerScore = {
                            id: p,
                            sizeX: players[p].sizeX,
                            sizeY: players[p].sizeY,
                            score: players[p].score
                        };
                        io.emit('playerScore', thinPlayerScore);
                        checkWinCondition(p);
                }
            });
        }
    }
    io.emit('flakes', thinFlakes());
}

// use combination of setImmediate delay + delta time for smoothness
function gameloop() {
	if(Object.keys(io.sockets.sockets).length > 0 && !reset) {
		now = Date.now();
		elapsed = now - then;
		if(elapsed > frameRate) {
            then = now - (elapsed % frameRate);

            collision();
            movement();
            if(stageVars.end.roundOver) {
                roundOver(now);
            }
        }
        setImmediate(gameloop, frameRate);
	}else {
        stopGameLoop();
    }
}

function addMovement(id, data) {
    //console.log(JSON.stringify(data));
    if(movementQueue[id] === undefined) {
        movementQueue[id] = {};
    }
    movementQueue[id].x = data.x;
    movementQueue[id].y = data.y;
    movementQueue[id].isLeft = data.isLeft;
    if(typeof data.diedAt !== 'undefined') {
        movementQueue[id].diedAt = data.diedAt;
    }
}

function movement() {
    if(Object.keys(movementQueue).length > 0) {
        io.emit('playersMoved', movementQueue);
        movementQueue = {};
    }
}

function thinFlakes() {
    var tf = [];
    flakes.forEach(function(f) {
        tf.push({
            x: f.x,
            y: f.y,
            size: f.sizeX
        });
    });
    return tf;
}

function addFishFlake(id, reduceSize) {
    if(typeof players[id] !== 'undefined' && players[id].team === 'fish' && players[id].sizeX > 1) {
        var location = {
            x: players[id].x + (players[id].sizeX / 2),
            y: players[id].y + (players[id].sizeY / 2)
        };
        addFlake(1, undefined, location);

        if(typeof reduceSize !== 'undefined' && reduceSize) {
            players[id].sizeX--;
            players[id].sizeY = Math.floor(players[id].sizeX * playerVars[players[id].team].scale);
            
            var thinPlayerScore = {
                id: id,
                sizeX: players[id].sizeX,
                sizeY: players[id].sizeY,
                score: players[id].score
            };
            io.emit('playerScore', thinPlayerScore);
        }
    }
}

function checkWinCondition(id) {
    if(stageVars.end.roundOver || typeof players[id] === 'undefined') {
        return;
    }
    if(players[id].score >= stageVars.end.winScore) {
        stageVars.end.roundOver = true;
        io.emit('chatMessage', {message: players[id].name + '[' + players[id].team + '] has won the round!'});
    }
}
function roundOver(now) {
    if(stageVars.end.tickTime < now) {
        stageVars.end.countdown--;
        if(stageVars.end.countdown < 0) {
            stageVars.end.countdown = stageVars.end.countdownMax;
            stageVars.end.roundOver = false;
            io.emit('chatMessage', {message: 'Resetting please wait..'});
            reset = true;
            stopGameLoop(true);
        }else {
            io.emit('chatMessage', {message: 'Resetting in ' + stageVars.end.countdown});
            stageVars.end.tickTime = now + 1000;
        }
    }
}

module.exports = {
    players,
    startGameLoop,
    stopGameLoop,
    validatePlayer,
    addPlayer,
    removePlayer,
    command,
    addMovement,
    addFishFlake
};