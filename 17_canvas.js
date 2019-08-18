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

// fills the canvas with the color depenending on the status of the game
CanvasDisplay.prototype.clearDisplay = function(status) {
    if (status == "won") {
        // if won it displays a lighter shade of the blue background
        this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (status == "lost") {
        // if lost it will display the darker shade of the blue background
        this.cx.fillStyle = "rgb(44, 136, 214)";
    } else {
        // if playing it will display the regular blue background
        this.cx.fillStyle = "rgb(52, 166, 251)";
    }
    // draws a rectangle on the whole canvas
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

// this method will draw most of the items that needs to be displayed
CanvasDisplay.prototype.drawBackground = function(level) {
    // the this.viewport started with left and top equal to 0 but after updateViewport ran it will be dependin on where the player is in the level
    let {left, top, width, height} = this.viewport;
    // we then get the start and end of the x and y for the two dimensional array containing the elements we want to draw
    let xStart = Math.floor(left);
    let xEnd = Math.ceil(left + width);
    let yStart = Math.floor(top);
    let yEnd = Math.ceil(top + height);

    // we loop through the array doing the top row first then moving downward our two dimensional array
    for (let y = yStart; y < yEnd; y++) {
        // we loop through what is on the current row and display what is on left most first moving to the right
        for (let x = xStart; x < xEnd; x++) {
            // the tile represents the tile we want to draw to the canvas
            let tile = level.rows[y][x];
            // if it is empty we move on to the next one
            if (tile == "empty") continue;
            // if it is not empty get the x and y coordinate on where to draw that tile on the canvas
            let screenX = (x - left) * scale;
            let screenY = (y - top) * scale;
            // store the starting x of the lava within the otherSpite
            // if it is not lava then it is wall and its x is 0
            // coin is not inlcuded when drawing background. they are drawn when drawActors is executed
            let tileX = tile == "lava" ? scale : 0; 
            this.cx.drawImage( // drawImage is a built in function that allows us to use from the context to be able to draw on the canvas
                otherSprites, // this is the sprite atlas
                tileX, 0, // tileX is left most x of the image in otherSprite, 0 is the top most y of image in otherSprite. since all image are in 1 row then the top most y of all of them are 0
                scale, scale, // these are the width and height of the image in otherSprite
                screenX, screenY, // these coordinates is where the image will be drawn in the canvas. the image is not centered on this coordinates. that will be the location of the top left corner of the image
                scale, scale // these are the width and height of the image on canvas
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

// drawActors is reponsible for drawing the moving parts in the game
// these are the player, lava and coins
CanvasDisplay.prototype.drawActors = function(actors) {
    // for every actor in the actors array, do what is inside the for loop
    for (let actor of actors) {
        // set the width and height to be used to draw on canvas by getting the size of the actor * scale
        let width = actor.size.x * scale;
        let height = actor.size.y * scale;
        // set the x and y where the actor will be drawn to
        let x = (actor.pos.x - this.viewport.left) * scale;
        let y = (actor.pos.y - this.viewport.top) * scale;
        // if the actor is a player, use the drawPlayer method to draw the actor
        if (actor.type == "player") {
            this.drawPlayer(actor, x, y, width, height);
        // if it is not a player, it is either a coin or lava, do the stuff below
        } else {
            // if the actor type is coin use 2*scale to get its source x
            // if the actor type is not coin then it is a moving lava use 1*scale to get its source x
            let tileX = (actor.type == "coin" ? 2 : 1) * scale;
            // draw the coin/lava
            this.cx.drawImage(
                otherSprites,
                tileX, 0, width, height,
                x, y, width, height
            );
        }
    }
};