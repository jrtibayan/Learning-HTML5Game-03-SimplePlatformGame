var results = [
    {name: "Satisfied", count: 1043, color: "lightblue"},
    {name: "Neutral", count: 563, color: "lightgreen"},
    {name: "Unsatisfied", count: 510, color: "pink"},
    {name: "No comment", count: 175, color: "silver"}
];

function flipHorizontally(context, around) {
    context.translate(around, 0);
    context.scale(-1, 1);
    context.translate(-around, 0);
}

// This class is the blueprint for the object that will be in charge of displaying everything on the canvas
var CanvasDisplay = class CanvasDisplay {
    // its constructor accepts 2 arguement
    //      parent is the DOM element in which the canvas will be appended
    //      and the level which will be drawn to the canvas
    constructor(parent, level) {
        // add a canvas property and set its width and height
        this.canvas = document.createElement("canvas");
        this.canvas.width = Math.min(600, level.width * scale);
        this.canvas.height = Math.min(450, level.height * scale);
        // append that canvas to the DOM element
        // this will make the canvas appear on your webpage
        parent.appendChild(this.canvas);
        // create another property that will be the context of the canvas
        // this will be used later to draw on the canvas
        this.cx = this.canvas.getContext("2d");
        // it is also on the canvas that some of the data needed to be displayed are stored
        // this property which side the player should be facing if while hes not moving
        this.flipPlayer = false;
        // this will be used by its updateViewport, drawActors, and drawBackground methods to
        //      (right now I haven't much looked into the three methods mentioned above i will be updating this later on when I am done with those functions)
        this.viewport = {
            left: 0,
            top: 0,
            width: this.canvas.width / scale,
            height: this.canvas.height / scale
        };
    }

    clear() {
        this.canvas.remove();
    }
}

CanvasDisplay.prototype.syncState = function(state) {
    this.updateViewport(state);
    this.clearDisplay(state.status);
    this.drawBackground(state.level);
    this.drawActors(state.actors);
};

CanvasDisplay.prototype.updateViewport = function(state) {
    // view is the the viewport
    // the map may be too big,
    // only an area of the map where the player is will be seen and 
    // that area displayed will only be as big as the viewport
    let view = this.viewport, margin = view.width / 3;
    // declare a player variable to easily access info regarding the player
    let player = state.player;
    // this is the players position
    let center = player.pos.plus(player.size.times(0.5));
    
    // after getting the position, that will be used as the center of the viewport
    // which means where ever the character walks, the player will be at the center of the screen unless
    //      the player is already at the further edge of the map
    // what happens is, if the player is walking and will be crossing through the margin,
    //      the view.left will then change making the background displayed or the level scroll to that direction
    if (center.x < view.left + margin) {
        // the view.left value will change but the least value it can have because of this line is 0
        // this helps prevent scrolling the map further to the left if the player is already at the left most part of it
        view.left = Math.max(center.x - margin, 0);
    } else if (center.x > view.left + view.width - margin) {
        // the view.left value will change but the max value it can have because of this line is the level width less than the viewport width
        // this helps prevent scrolling the map further to the right if the player is already at the right most part of it
        view.left = Math.min(center.x + margin - view.width, state.level.width - view.width);
    }
    // just the same functionality above but instead of being incharge of changing the view.left,
    //      this is in charged of changing the view.top to follow the player when going up and down the map
    if (center.y < view.top + margin) {
        view.top = Math.max(center.y - margin, 0);
    } else if (center.y > view.top + view.height - margin) {
        view.top = Math.min(center.y + margin - view.height, state.level.height - view.height);
    }
};

CanvasDisplay.prototype.clearDisplay = function(status) {
    if (status == "won") {
        this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (status == "lost") {
        this.cx.fillStyle = "rgb(44, 136, 214)";
    } else {
        this.cx.fillStyle = "rgb(52, 166, 251)";
    }
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

CanvasDisplay.prototype.drawBackground = function(level) {
    let {left, top, width, height} = this.viewport;
    let xStart = Math.floor(left);
    let xEnd = Math.ceil(left + width);
    let yStart = Math.floor(top);
    let yEnd = Math.ceil(top + height);

    for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
            let tile = level.rows[y][x];
            if (tile == "empty") continue;
            let screenX = (x - left) * scale;
            let screenY = (y - top) * scale;
            let tileX = tile == "lava" ? scale : 0;
            this.cx.drawImage(
                otherSprites,
                tileX, 0, scale, scale,
                screenX, screenY, scale, scale
            );
        }
    }
};

var playerSprites = document.createElement("img");
playerSprites.src = "img/player.png";
var playerXOverlap = 4;

CanvasDisplay.prototype.drawPlayer = function(player, x, y, width, height){
    width += playerXOverlap * 2;
    x -= playerXOverlap;
    if (player.speed.x != 0) {
        this.flipPlayer = player.speed.x < 0;
    }

    let tile = 8;
    if (player.speed.y != 0) {
        tile = 9;
    } else if (player.speed.x != 0) {
        tile = Math.floor(Date.now() / 60) % 8;
    }

    this.cx.save();
    if (this.flipPlayer) {
        flipHorizontally(this.cx, x + width / 2);
    }
    let tileX = tile * width;
    this.cx.drawImage(playerSprites, tileX, 0, width, height, x, y, width, height);
    this.cx.restore();
};

CanvasDisplay.prototype.drawActors = function(actors) {
    for (let actor of actors) {
        let width = actor.size.x * scale;
        let height = actor.size.y * scale;
        let x = (actor.pos.x - this.viewport.left) * scale;
        let y = (actor.pos.y - this.viewport.top) * scale;
        if (actor.type == "player") {
            this.drawPlayer(actor, x, y, width, height);
        } else {
            let tileX = (actor.type == "coin" ? 2 : 1) * scale;
            this.cx.drawImage(
                otherSprites,
                tileX, 0, width, height,
                x, y, width, height
            );
        }
    }
};