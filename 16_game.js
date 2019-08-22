var simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;

// this Class is the blueprint for each levels
var Level = class Level {
    // it accepts a string made out of characters that represents each tile within the level
    constructor(plan) {
        // the level is then broken down into two dimensional array
        let rows = plan.trim().split("\n").map(l => [...l]);
        // the height on the width of the level depends on the size of the array
        // if the rows array contains 4 rows and each of those row legth is 7
        // then the level will be 4 tiles in height and 7 tiles wide
        this.height = rows.length;
        this.width = rows[0].length;
        // this array will be containing objects that represents each tile
        this.startActors = [];
        // the lines below converts the characters of the two dimensional array into a string/word equivalent of that character
        // and then store it to a new rows property of the level
        this.rows = rows.map((row, y) => {
            return row.map((ch, x) => {
                let type = levelChars[ch];
                // if the it was a string simply return the string/word equivalent of the character
                if (typeof type == "string") return type;
                // if it was not a string add it to the startActors array
                console.log(type);
                this.startActors.push(type.create(new Vec(x, y), ch));
                // and instead of storing that characters equivalent word, is is replaced with empty instead
                // I think this is done because actors are moving objects and will be drawn on top after drawing the non moving part of the Level
                return "empty";
            });
        });
    }
}

// the state class below create an instance of the state of your game
// everytime you go to another level a different instance is created therefore leaving the old state/info of your game intact
//      but that doesnt mean you can still access it using the state variable within the runLevel function
//      you wont because everytime an new instance is created, that object or instance is then the on to be used by the state variable
//      but I think I may however be able to check all instances if I create an array that would contain it everytime a promise is completed
var State = class State {
    constructor(level, actors, status) {
        this.level = level;
        this.actors = actors;
        this.status = status;
    }

    // calling the start method of state creates a new instance of the State which will contain the level, actors and the status of the level/game being played
    static start(level) {
        return new State(level, level.startActors, "playing");
    }

    // this returns the state of the player which info includes the players position and speed
    get player() {
        return this.actors.find(a => a.type == "player");
    }
}

// Vec class is used for positions of things and also speed
var Vec = class Vec {
    // Vec have only 2 properties which are x and y
    // These x and y could be coordinates if Vec is used as a position or 
    // if it is used to determine speed of something x is how fast it travels horizontally and y is the speed it travels vertically
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    // Plus is used to get new positions of stuff 
    //      by incrementing the current position with the distance it may have traveled 
    //      depending on how much time have passed and the speed of that object
    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }
    // Times is mostly used to compute for how much distance the player/whatever traveled depending on how much time have passed and the speed of that actor
    times(factor) {
        return new Vec(this.x * factor, this.y * factor);
    }
}

var myChar = null;

// This class is the blueprint for the player
var Player = class Player {
    // upon making a new Player, it accepts 2 arguements which are then stored as its properties
    constructor(pos, speed) {
        // the pos would contain the inital position of the player in the Level
        this.pos = pos;
        // the speed would contain the initial speed of the player
        this.speed = speed;
    }

    // actors are saved in an array so that we can loop through it
    // we made this method so that while looping though the array of actors we can check what kind of actor we are currently using
    get type() { return "player"; }

    // making a create method makes it easier to create a new player
    // since a new player automatically is not moving then speed is not needed and we only need to input its initial position
    static create(pos) {
        let tempPlayer = new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
        myChar = tempPlayer;
        return tempPlayer;
    }
}

// This adds size to the prototype of the class Player
// It is coded like this so that instead of coding it in the constructor,
//      every instance of the player created will already will aready have this property since it is inherited from its prototype
// I think it also serve the same purpose as the methods added to prototype which is to save resources
// It saves resources because coding it like this is like having only one method but is inherited from the prototype
// Adding the method inside the class consume more resources because everytime an instace of that class is created,
//      each of those instancess have their own copy of the method which makes it consume more resources than adding it to the prototype
// NOTE: About this being the same purpose as methods added to the prototype which is to save resources, I am not too sure about that
//      What I am sure about is that this makes sure all instances of the player have a size property since it is added to its prototype
Player.prototype.size = new Vec(0.8, 1.5);

var Lava = class Lava {
    constructor(pos, speed, reset) {
        this.pos = pos;
        this.speed = speed;
        this.reset = reset;
    }

    get type() { return "lava"; }

    static create(pos, ch) {
        if (ch == "=") {
            return new Lava(pos, new Vec(2, 0));
        } else if (ch == "|") {
            return new Lava(pos, new Vec(0, 2));
        } else if (ch == "v") {
            return new Lava(pos, new Vec(0, 3), pos);
        }
    }
}

Lava.prototype.size = new Vec(1, 1);

var Coin = class Coin {
    constructor(pos, basePos, wobble) {
        this.pos = pos;
        this.basePos = basePos;
        this.wobble = wobble;
    }

    get type() { return "coin"; }

    static create(pos) {
        let basePos = pos.plus(new Vec(0.2, 0.1));
        return new Coin(basePos, basePos, Math.random() * Math.PI * 2);
    }
}

Coin.prototype.size = new Vec(0.6, 0.6);

// this is the part that tells what the characters on the levels.js file represents in the game
var levelChars = {
    ".": "empty", "#": "wall", "+": "lava",
    "@": Player, "o": Coin,
    "=": Lava, "|": Lava, "v": Lava
};

var simpleLevel = new Level(simpleLevelPlan);

function elt(name, attrs, ...children) {
    let dom = document.createElement(name);
    for (let attr of Object.keys(attrs)) {
        dom.setAttribute(attr, attrs[attr]);
    }
    for (let child of children) {
        dom.appendChild(child);
    }
    return dom;
}

var DOMDisplay = class DOMDisplay {
    constructor(parent, level) {
        this.dom = elt("div", {class: "game"}, drawGrid(level));
        this.actorLayer = null;
        parent.appendChild(this.dom);
    }

    clear() { this.dom.remove(); }
}

var scale = 20;

function drawGrid(level) {
    return elt(
        "table", {
            class: "background",
            style: `width: ${level.width * scale}px`
        }, 
        ...level.rows.map(row => elt(
            "tr", {style: `height: ${scale}px`},
            ...row.map(type => elt("td", {class: type}))
        ))
    );
}

function drawActors(actors) {
    return elt(
        "div", {}, ...actors.map(actor => {
            let rect = elt("div", {class: `actor ${actor.type}`});
            rect.style.width = `${actor.size.x * scale}px`;
            rect.style.height = `${actor.size.y * scale}px`;
            rect.style.left = `${actor.pos.x * scale}px`;
            rect.style.top = `${actor.pos.y * scale}px`;
            return rect;
        })
    );
}

DOMDisplay.prototype.syncState = function(state) {
    if (this.actorLayer) this.actorLayer.remove();
    this.actorLayer = drawActors(state.actors);
    this.dom.appendChild(this.actorLayer);
    this.dom.className = `game ${state.status}`;
    this.scrollPlayerIntoView(state);
};

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
    let width = this.dom.clientWidth;
    let height = this.dom.clientHeight;
    let margin = width / 3;

    // The viewport
    let left = this.dom.scrollLeft, right = left + width;
    let top = this.dom.scrollTop, bottom = top + height;

    let player = state.player;
    let center = player.pos.plus(player.size.times(0.5)).times(scale);

    if (center.x < left + margin) {
        this.dom.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
        this.dom.scrollLeft = center.x + margin - width;
    }
    if (center.y < top + margin) {
        this.dom.scrollTop = center.y - margin;
    } else if (center.y > bottom - margin) {
        this.dom.scrollTop = center.y + margin - height;
    }
};

// checks if from certain position and size touches a certain type of actor
// this was often used to either check if       player is touching the wall
//                                              player is touching the lava
//                                              the moving lava is touching the wall
Level.prototype.touches = function(pos, size, type) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);

    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            // check first if the starting and ending x and y coordiates are outside the canvas
            let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
            // if it is outside the it will be considered a wall
            // and if not, use the what ever type is in this.rows[y][x]
            let here = isOutside ? "wall" : this.rows[y][x];
            // return true if any of the values in the two dimentional array using the range of x and y given above is the same as the one you are looking for
            if (here == type) return true;
        }
    }
    // return false if the loop did not find that same type
    return false;
};

// update the state depending on changes that events that have occured
State.prototype.update = function(time, keys) {
    // create an actors variable within the state.update method which will contain the actors after they have been updated/change value of the properties
    let actors = this.actors.map(actor => actor.update(time, this, keys));
    
    // created a newState variable within the state.update method that will contain the same status and level but will have the updated actors instead of the old one
    let newState = new State(this.level, actors, this.status);

    // check if player has already won or lost and then return the newState to update the state to contain values of the newState
    if (newState.status != "playing") return newState;

    let player = newState.player;
    // if this levels lava touches the player, player loses
    if (this.level.touches(player.pos, player.size, "lava")) {
        return new State(this.level, actors, "lost");
    }

    // check if any actors has collided with the player
    for (let actor of actors) {
        if (actor != player && overlap(actor, player)) {
            // if they have that actor will return a more updated value of the newState
            // changes may be either of the following
            // if it collided with lava obviously the status will become lost
            // if it collided with a coin that coin will be removed from the actors
            newState = actor.collide(newState);
        }
    }
    
    // newState will be returned and the state variable will now contain the updated state of the game
    return newState;
};

function overlap(actor1, actor2) {
    return actor1.pos.x + actor1.size.x > actor2.pos.x &&
            actor1.pos.x < actor2.pos.x + actor2.size.x &&
            actor1.pos.y + actor1.size.y > actor2.pos.y &&
            actor1.pos.y < actor2.pos.y + actor2.size.y;
}

// given the newState, return a new state with same level and actors but with status of lost
Lava.prototype.collide = function(state) {
    return new State(state.level, state.actors, "lost");
};

// given the newState
Coin.prototype.collide = function(state) {
    // remove the coin that collided with the player from state.actors
    let filtered = state.actors.filter(a => a != this);
    // get the current status of the game
    let status = state.status;
    // set status to won if there is no coin found on the filtered actors array
    if (!filtered.some(a => a.type == "coin")) status = "won";
    // return new state with same level, updated list of actors, and updated actors
    return new State(state.level, filtered, status);
};

Lava.prototype.update = function(time, state) {
    let newPos = this.pos.plus(this.speed.times(time));
    if (!state.level.touches(newPos, this.size, "wall")) {
        return new Lava(newPos, this.speed, this.reset);
    } else if (this.reset) {
        return new Lava(this.reset, this.speed, this.reset);
    } else {
        return new Lava(this.pos, this.speed.times(-1));
    }
};

var wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.update = function(time) {
    let wobble = this.wobble + time * wobbleSpeed;
    let wobblePos = Math.sin(wobble) * wobbleDist;
    return new Coin(this.basePos.plus(new Vec(0, wobblePos)), this.basePos, wobble);
};

var playerXSpeed = 7;
var gravity = 30;
var jumpSpeed = 17;

// The player have an update method that will update its position depending on the user input
// time contains how much time have elapsed since last frame
// state contains other info about the game
// keys contain what the are currenly pressed
Player.prototype.update = function(time, state, keys) {
    let xSpeed = 0;
    // if the player is pressing left, the x speed become less and less
    if (keys.ArrowLeft) xSpeed -= playerXSpeed;
    // if the player is pressing right, the x speed becomes higher
    if (keys.ArrowRight) xSpeed += playerXSpeed;
    

    // pos will contain the previous position of the player
    let pos = this.pos;
    // movedX will be the new x of the player
    // it will be depending on the current position plus how far the player has to travel, 
    //      which we can get by multiplying time elapased and how fast the player can travel horizontally
    // if the traveled distance is negative the character will be moving to the left and
    //      if the it is positive the character will be moving to the right
    let movedX = pos.plus(new Vec(xSpeed * time, 0));
    // if the player is not touching the wall the new position which is movedX is then passed to pos
    //      if the player is touching the wall no need to update the x position since you already hit the wall
    if (!state.level.touches(movedX, this.size, "wall")) {
        pos = movedX;
    }

    // it is asumed that the character is always falling down because of gravity
    // just like when walking the speed on which you are falling is increasing
    // this is not obvious on waling because whenever we stop walking the speed resets to 0
    // and I assume this will also reset but not by user input but by every time the player gets to step on the floor
    let ySpeed = this.speed.y + time * gravity;
    // calculate the new y position of the player
    // its just the same with the x
    // you get the current position and add the calculated distance the player has to travel
    let movedY = pos.plus(new Vec(0, ySpeed * time));
    // and then if the player is not touching the wall, that new y will be used on pos
    // it will not be used if the player hit the wall/floor
    if (!state.level.touches(movedY, this.size, "wall")) {
        pos = movedY;
    // when a player pressed the up, this makes the character jump
    } else if (keys.ArrowUp && ySpeed > 0) {
        ySpeed = -jumpSpeed;
    // and just like what I assumed earlier this is where the speed is reset so that it doesnt increment too much and reset every time a wall is hit
    } else {
        ySpeed = 0;
    }

    // return the new Player which will contain the updated position and  speed
    return new Player(pos, new Vec(xSpeed, ySpeed));
};

// this function accepts an array containing the keys you want to keep track off
// and returns info on what keys are being pressed which is in an object with properties that has value set to true if pressed and false if not
function trackKeys(keys) {
    // create an empty object;
    let down = Object.create(null);
    // event contains info of what event happend
    function track(event) {
        // check if the keys you are keeping tack of is the one pressed or released
        if (keys.includes(event.key)) {
            // on the empty object the key that is being pressed or release will be added as its property 
            //      with value containing true if the event.type is keydown and false if the is not which means the user released the button
            down[event.key] = event.type == "keydown";
            event.preventDefault();
        }
    }
    // listen to keyup and keydowns and then execute track function if event did happen
    window.addEventListener("keydown", track);
    window.addEventListener("keyup", track);
    // returning down and storing it to arrowKeys only happened once
    // but everytime the value of down changes, arrowKeys will always be equal to it
    return down;
}

// arrowKeys starts out as a blank object like so {}
// and when the user start pushing a button either arrow left/right/up, the key that is pressed is added to the object 
// and set its value to true or false depending if it is currently pressed or not
// for example, holding down the right arrow will make arrowKey values as so {ArrowLeft: false, ArrowRight: true, ArrowUp: false}
var arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

// the actual game loop is contained here
function runAnimation(frameFunc) {
    let lastTime = null;
    let tempNum = 0;
    // this is the actual game loop
    function frame(time) {
        // on first run time is unidentified but as it run again it will contain the how many miliseconds it was since the loop started
        if (lastTime != null) {
            // timeStep is the seconds equivalent of either 
            //      the difference of present and the previous time or
            //      100 miliseconds if the difference is more than 100 miliseconds
            let timeStep = Math.min(time - lastTime, 100) / 1000;
            // if frameFunc return true the game loop with continue looping
            // if it returns false the game loop will end and return promise of the state.result and stored in the status variable within runGame function
            if (frameFunc(timeStep) === false) return;
        }
        lastTime = time;
        if(tempNum<10) {
            tempNum++;
            requestAnimationFrame(frame);
        }
    }
    // the game loop is started with the line below
    requestAnimationFrame(frame);
}

function runLevel(level, Display) {
    // here we are given a level and what display class to use
    // using that class we create an instance that would be used to draw to our canvas
    let display = new Display(document.body, level);
    // we also declared a state variable that will contain the level, actor within the level and the status of the game which may either be playing, won, lost
    let state = State.start(level);
    // I am not entirely sure 
    //      but to my understanding the value 1 on ending is the number of seconds for the delay to restarting the new game after losing or winning
    let ending = 1;
    return new Promise(resolve => {
        // I havent fully analyzed the runAnimation function yet
        //      from what I see it is out game loop
        //      it will continually check player input or keys pressed by the player and make the necessary updates
        //      then continually draw to the canvas
        //      it will also always check the state of the game to know if the player needs to advance a level or restart that level
        runAnimation(time => { // time here is the timeStep in frame function within the runAnimation function
            // state will be replaced with newState after the state.update method is finished checking for whatever needs updating
            state = state.update(time, arrowKeys);
            // ##############################################################################################
            // ###################### I will tell more about the display.syncState later on ####################################
            // ##############################################################################################
            display.syncState(state);
            // After updating check if the state status is still playing therefore it wont do anything
            if (state.status == "playing") {
                // returning true will make gameloop continue
                return true;
            // if the state is not playing anymore and the ending is > 0
            } else if (ending > 0) {
                ending -= time;
                // returning true will make gameloop continue
                return true;
            // then the new game will start after ending becomes less than  zero 
            } else {
                // this will remove the display in the DOM
                display.clear();
                // this will return the status of the game if won or lost
                resolve(state.status);
                // returning false will end the game loop
                return false;
            }
        });
    });
}

// this functtion accepts the array of levels and the dispay to be used on the game
async function runGame(plans, Display) {
    // it uses a for loop starting from level = 0
    // it started with level zero because the levels is in an array and arrays index start with 0 
    // which means the first level is at level[0]
    for (let level = 0; level < plans.length;) {
        // this for loop will not continously run line by line
        // this is because of the runLevel you see below
        // the runLevel was called with an await operator
        // this causes an async function to pause untile a promise is returned
        // as you can see above, our runGame function uses an async operator
        // this is because you can only use await inside an async function
        let status = await runLevel(new Level(plans[level]), Display);
        // after a promise is returned
        //      if the player won the player moves on to the next level
        //      if the player lost the level wont increment which make the player play again on the same/current level
        if (status == "won") level++;
    }
    // if the player beat all existing level you will exit the loop and the player beats the game!
    console.log("You've won!");
}