const helpers = require('./helpers.js');
const fishNames = require('./fishNames.js');
//const { v4: uuidv4 } = require('uuid');

var isStarted = false;
var io = null;
var players = {};
var enemies = [];
var flakes = [];

var fps = 60;
var fpsInterval, startTime, now, then, elapsed;
fpsInterval = 1000 / fps;
then = Date.now();
startTime = then;

var stageVars = {
    width: 700,
    height: 700
};

var playerVars = {
    minSizeX: 16,
    isLeft: false,
    collisionInit: 3000,
    collisionWait: 250,
    fish: {
        sizeX: 16,
        sizeY: 8,
        minSizeX: 10,
        maxSizeX: 150,
        scale: 0.5,
        screenTop: 0,
        screenBottom: 525,
        minSpeed: 1,
	    maxSpeed: 7
    },
    crab: {
        sizeX: 32,
        sizeY: 32,
        minSizeX: 16,
        maxSizeX: 64,
        scale: 1,
        screenTop: 500,
        screenBottom: 700,
        minSpeed: 1,
        maxSpeed: 2
    },
    clam: {
        sizeX: 32,
        sizeY: 32,
        minSizeX: 16,
        maxSizeX: 64,
        scale: 1,
        screenTop: 500,
        screenBottom: 700
    }
};

var enemyVars = {
    minNum: 10,
    maxNum: 30,
    incNum: 5,
	minX: 10,
    maxX: 150,
    rareX: 300,
    rareChance: 0.1,
	minSpeed: 1,
	maxSpeed: 10,
	delay: 50,
    team: 'fish', //'crab'
    points: 2
};

var flakeVars = {
    maxNum: 10,
    flakeYStart: -10,
    size: 5,
    speed: 1,
    delay: 400,
    points: 1
}

////////////////////////////////////////////////////////

function addPlayer(id, name, team, color) {
    var newPlayer = {
        name: name,
        color: color,
        team: team,
        x: Math.floor(Math.random() * Math.floor(stageVars.width/2)) + Math.floor(stageVars.width/4),
        y: Math.floor((Math.random() * (playerVars[team].screenBottom - playerVars[team].screenTop)) + playerVars[team].screenTop),
        sizeX: playerVars[team].sizeX,
        sizeY: playerVars[team].sizeY,
        isLeft: playerVars.isLeft,
        score: 0,
        lastCollision: Date.now() - playerVars.collisionInit
    };
    players[id] = newPlayer;
    
    if(enemies.length < enemyVars.maxNum) {
        addEnemy(5);
        io.emit('enemies', enemies);
    }
}


function addEnemy(qty, index) {

    var addQty = 1;
    if(typeof qty !== 'undefined') {
        addQty = qty;
    }

    for(var i = 0; i < addQty; i++) {
        
        var enemy = {};
        if(Math.random() < 0.2) {
            enemy.team = 'crab';
        }else {
            enemy.team = 'fish';
        }
        enemy.sizeX = Math.floor((Math.random() * playerVars[enemy.team].maxSizeX) + playerVars[enemy.team].minSizeX);
        enemy.sizeY = Math.floor(enemy.sizeX * playerVars[enemy.team].scale);
        //enemy.y = Math.floor((Math.random() * playerVars[enemy.team].screenBottom) - (enemy.sizeY / 2) - playerVars[enemy.team].screenTop);
        enemy.y = Math.floor((Math.random() * (playerVars[enemy.team].screenBottom - playerVars[enemy.team].screenTop)) + playerVars[enemy.team].screenTop);
        //enemy.speed = Math.floor((Math.random() * Math.floor(enemyVars.maxSpeed - (enemy.sizeX/100))) + enemyVars.minSpeed);
        enemy.speed = Math.floor(Math.random() * playerVars[enemy.team].maxSpeed) + playerVars[enemy.team].minSpeed;
        if(enemy.sizeX === enemyVars.maxX && Math.random() < enemyVars.rareChance) {
            enemy.team = 'fish';
            enemy.sizeX = enemyVars.rareX;
            enemy.sizeY = Math.floor(enemy.sizeX/2);
            enemy.speed = 1;
        }
        
        // determine direction
        if(Math.floor(Math.random() * 2)) {
            enemy.x = enemy.sizeX * -1;
        }else {
            enemy.x = enemy.sizeX + stageVars.width;
            enemy.speed *= -1;
        }
        
        // set spawn delay
        enemy.delay = Math.floor(Math.random() * enemyVars.delay);
        
        //console.log(JSON.stringify(enemy));

        if(addQty === 1 && typeof index !== 'undefined') {
            enemies[index].x = enemy.x;
            enemies[index].y = enemy.y;
            enemies[index].sizeX = enemy.sizeX;
            enemies[index].sizeY = enemy.sizeY;
            enemies[index].speed = enemy.speed;
            enemies[index].team = enemy.team;
        }else {
            enemies.push(helpers.clone(enemy));
        }
    }
}


function addFlake(qty, index) {
    var addQty = 1;
    if(typeof qty !== 'undefined') {
        addQty = qty;
    }

    for(var i = 0; i < addQty; i++) {
        
        var flake = {};
        flake.x = Math.floor((Math.random() * stageVars.width));
        flake.y = flakeVars.flakeYStart;
        flake.speed = flakeVars.speed;
        // set spawn delay
        flake.delay = Math.floor(Math.random() * flakeVars.delay);
        flake.sizeX = flakeVars.size;
        flake.sizeY = flakeVars.size;
        
        if(addQty === 1 && typeof index !== 'undefined') {
            flakes[index].x = flake.x;
            flakes[index].y = flake.y;
            //flakes[index].speed = flake.speed;
            flakes[index].delay = flake.delay;
        }else {
            flakes.push(helpers.clone(flake));
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////

function startGameLoop(myIO) {
    console.log('isStarted: ' + isStarted);
    if(!isStarted) {
        io = myIO;
        isStarted = true;

        // init enemies
        addEnemy(5);
        io.emit('enemies', enemies);

        // init flakes
        addFlake(20);
        io.emit('flakes', flakes);

        //broadcast();

        gameloop();
    }
}

function collision() {
    // TODO: validate player collision

    // enemies
    for(var e = 0; e < enemies.length; e++) {
        var ce = enemies[e];
        if(ce.delay > 0) {
            ce.delay--;
        }else {
            // move enemt
            ce.x += ce.speed;
            // if OOB
            if((ce.speed > 0 && ce.x - ce.sizeX > stageVars.width) ||
                (ce.speed < 0 && ce.x + ce.sizeX < 0)) {
                    addEnemy(1, e);
            }
            // if collision with enemy
            Object.keys(players).forEach(function(p) {
                if(players[p].team === 'clam') {
                    return;
                }
                if((players[p].lastCollision + playerVars.collisionWait < Date.now()) && 
                    helpers.intersect(ce, players[p])) {

                    // player is larger, consume enemy
                    if(players[p].sizeX > ce.sizeX) {
                        if(players[p].sizeX < playerVars[players[p].team].maxSizeX) {
                            if(players[p].sizeX < playerVars[players[p].team].maxSizeX) {
                                players[p].sizeX++;
                                players[p].sizeY = Math.floor(players[p].sizeX * playerVars[players[p].team].scale);
                            }
                            /*
                            if(players[p].sizeX - ce.sizeX < 5) {
                                players[p].sizeX += 2;
                            }else {
                                players[p].sizeX++;
                            }
                            players[p].sizeY = Math.floor(players[p].sizeX / 2);
                            */
                        }
                        players[p].score += enemyVars.points;
                        //io.emit('players', players);
                        //io.emit('playerMoved', {player:players[p], id:p});
                        io.emit('playerScore', {player:players[p], id:p});
                        addEnemy(1, e);
                    // enemy is larger, game over
                    }else {
                        players[p].x = Math.floor(stageVars.width/2);
                        players[p].y = stageVars.height - players[p].sizeY - 10;
                        players[p].lastCollision = Date.now();
                        players[p].score -= enemyVars.points;

                        var resp = {};
                        resp.id = p;
                        resp.message = players[p].name + '[' + players[p].sizeX + '] was eaten by ';
                        if(ce.sizeX < enemyVars.rareX) {
                            resp.message += 'fish [' + ce.sizeX + ']';
                            if(players[p].sizeX === ce.sizeX) {
                                resp.message += ' :^)';
                            }
                        }else {
                            resp.message += fishNames[Math.floor(Math.random() * fishNames.length)] + ' [' + ce.sizeX + ']';
                        }
                        io.emit('chatMessage', resp);
                        io.emit('playerMoved', {player: players[p], id: p});
                        io.emit('playerScore', {player:players[p], id:p});
                    }
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
            }
            // if collision with enemy
            Object.keys(players).forEach(function(p) {
                if((players[p].lastCollision + playerVars.collisionWait < Date.now()) && 
                    helpers.intersect(cf, players[p])) {

                        addFlake(1, f);
                        if(players[p].sizeX < playerVars[players[p].team].maxSizeX) {
                            players[p].sizeX++;
                            players[p].sizeY = Math.floor(players[p].sizeX * playerVars[players[p].team].scale);
                        }
                        players[p].score += flakeVars.points;
                        io.emit('playerScore', {player:players[p], id:p});
                }
            });
        }
    }
    io.emit('flakes', flakes);

}

function gameloop() {
	if(Object.keys(io.sockets.sockets).length > 0) {
		now = Date.now();
		elapsed = now - then;
		if(elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval);

            collision();
        }
        setImmediate(gameloop);
	}else {
        console.log('resetting');
        isStarted = false;
        enemies = [];
        flakes = [];
    }
	//console.log('end ' + Date.now().toString());
}

module.exports = {
    players,
    enemies,
    startGameLoop,
    addPlayer
};