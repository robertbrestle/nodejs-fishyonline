var wasd = [false, false, false, false];

var player = {
	id: '0',
	color: 'orange',
	team: 'fish',
	name: 'Jimmy',
	color: '',
	score: 0,
	x: 64,
	y: 64,
	lastX: 64,
	lastY: 64,
	sizeX: 16,
	sizeY: 8,
	veloX: 0,
	veloY: 0,
	isLeft: false,
	isPolyp: true,
	fish: {
        sizeX: 16,
		sizeY: 8,
		screenTop: 0,
		veloMax: 5,
		veloInc: 0.5,
		veloDec: 0.2
    },
    crab: {
        sizeX: 16,
		sizeY: 16,
		screenTop: 500,
		veloMax: 5,
		veloInc: 0.5,
		veloDec: 0.3
    },
    clam: {
        sizeX: 16,
		sizeY: 16,
		screenTop: 550
	},
	jelly: {
		sizeX: 10,
		sizeY: 16,
		screenTop: 0,
		polypMaxY: 550,
		veloMax: 1,
		veloInc: 0.1,
		veloDec: 0.2
	}
};
var players = {};

var teams = {
	fish: {
		orange: {
			right: document.getElementById("orange_right"),
			left: document.getElementById("orange_left"),
		},
		blue: {
			right: document.getElementById("blue_right"),
			left: document.getElementById("blue_left"),
		},
		green: {
			right: document.getElementById("green_right"),
			left: document.getElementById("green_left"),
		},
		purple: {
			right: document.getElementById("purple_right"),
			left: document.getElementById("purple_left"),
		},
		black: {
			right: document.getElementById("black_right"),
			left: document.getElementById("black_left"),
		},
		red: {
			right: document.getElementById("red_right"),
			left: document.getElementById("red_left"),
		}
	},
	crab: {
		orange: {
			img: document.getElementById("orange_crab")
		},
		blue: {
			img: document.getElementById("blue_crab")
		},
		green: {
			img: document.getElementById("green_crab")
		},
		purple: {
			img: document.getElementById("purple_crab")
		},
		black: {
			img: document.getElementById("black_crab")
		},
		red: {
			img: document.getElementById("red_crab")
		}
	},
	clam: {
		orange: {
			img: document.getElementById("purple_clam")
		},
		blue: {
			img: document.getElementById("purple_clam")
		},
		green: {
			img: document.getElementById("purple_clam")
		},
		purple: {
			img: document.getElementById("purple_clam")
		},
		black: {
			img: document.getElementById("purple_clam")
		},
		red: {
			img: document.getElementById("purple_clam")
		}
	},
	jelly: {
		orange: {
			polyp: document.getElementById("yellow_polyp"),
			jelly: document.getElementById("yellow_jelly"),
		},
		blue: {
			polyp: document.getElementById("yellow_polyp"),
			jelly: document.getElementById("yellow_jelly"),
		},
		green: {
			polyp: document.getElementById("yellow_polyp"),
			jelly: document.getElementById("yellow_jelly"),
		},
		purple: {
			polyp: document.getElementById("yellow_polyp"),
			jelly: document.getElementById("yellow_jelly"),
		},
		black: {
			polyp: document.getElementById("yellow_polyp"),
			jelly: document.getElementById("yellow_jelly"),
		},
		red: {
			polyp: document.getElementById("yellow_polyp"),
			jelly: document.getElementById("yellow_jelly"),
		}
	}
};

var enemyVars = {
	minX: 5,
	maxX: 100,
	minSpeed: 1,
	maxSpeed: 10,
	delay: 50,
	type: 0
};

var enemy = {
	x: 0,
	y: 0,
	sizeX: 16,
	sizeY: 8,
	speed: 0,	// movement direction X
	delay: 0,	// spawn delay
	type: 'man',
	img: 'man'
};

var settings = {
	soundEnabled: true
};

/* GLOBALS */
var canvas = document.getElementById('stage');
var ctx = {};

var enemies = [];
var flakes = [];

//var ding = new Audio('sounds/ding.wav');
//var bird = new Audio('sounds/bird.wav');
//var pain = new Audio('sounds/pain.wav');
//var boom = new Audio('sounds/boom1.wav');

var scoreFont = "24px Verdana";

// regulate fps
var fps = 60;
var fpsInterval, startTime, now, then, elapsed;
then = Date.now();
startTime = then;

var frameRate = 1000/60;
var aLastFrame = 0;
var aCurrentFrame = 0;
var aStartTime = 0;
var aDeltaTime = 0;

// networking
var socket = null;


/* GLOBALS */


function clone(obj) {
    if (null === obj || typeof obj != "object") return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function playSound(sound) {
	if(settings.soundEnabled) {
	    sound.pause();
		sound.currentTime = 0;
	    sound.play();
	}
}
function goFullScreen(element) {
    if(canvas.requestFullScreen)
        canvas.requestFullScreen();
    else if(canvas.webkitRequestFullScreen)
        canvas.webkitRequestFullScreen();
    else if(canvas.mozRequestFullScreen)
        canvas.mozRequestFullScreen();
}

function fixedCanvasSize() {
	canvas.width = 900;
	canvas.height = 700;
}

function refreshCanvasSize() {
	//	set screen size to window size
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

// if player and enemy intersect
function intersectPlayer(e) {
	return !(e.x > player.x + player.sizeX ||
			 e.x + e.sizeX < player.x ||
			 e.y > player.y + player.sizeY ||
			 e.y + e.sizeY < player.y);
}