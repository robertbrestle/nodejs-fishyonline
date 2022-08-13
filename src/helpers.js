function clone(obj) {
    if (null === obj || typeof obj != "object") return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

// if player and enemy intersect
function intersect(p1, p2) {
	return !(p1.x > p2.x + p2.sizeX ||
             p1.x + p1.sizeX < p2.x ||
             p1.y > p2.y + p2.sizeY ||
             p1.y + p1.sizeY < p2.y);
}

function intersectFishPlayer(f, p) {
    if(f.speed < 0) {
        return !(f.x > p.x + p.sizeX ||
                 f.x + f.sizeX/3 < p.x ||
                 f.y > p.y + p.sizeY ||
                 f.y + f.sizeY < p.y);
    }else {
        return !(f.x + f.sizeX - f.sizeX/3 > p.x + p.sizeX ||
                 f.x + f.sizeX < p.x ||
                 f.y > p.y + p.sizeY ||
                 f.y + f.sizeY < p.y);
    }
}

module.exports = {
    clone,
    intersect,
    intersectFishPlayer
};