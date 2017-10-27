'use strict';

let env = {};
module.exports = env;

/*===========================================================================
    Constants
  ===========================================================================*/

    // Project Info
env.PROJECT_NAME = 'Project Fennel';
env.VERSION = 'Internal.13';
    // Global Metrics:
env.debug = false;
env.TILE_SIZE = 16;
env.DEFAULT_MAP_SIZE = 15;
    // Client Metrics:
env.CLIENT_SPEED = 1000/30;
env.FONT_FAMILY = 'press_start_kregular';
env.FONT_SIZE = 8;
env.displayWidth =  env.TILE_SIZE*env.DEFAULT_MAP_SIZE;//26//19;
env.displayHeight = env.TILE_SIZE*env.DEFAULT_MAP_SIZE;//15//11;
env.HIGHLIGHT = 'highlight';
env.ANIMATION_FRAME_DELAY = 16;
env.KEY_UP = 1 << 16;
env.PREVIEW_DISPLAY_TIME = 8000;
    // Display Layers
env.LAYER_TILES = 0;
env.LAYER_UNDER = 1;
env.LAYER_SPRITES = 2;
    // Gameplay Metrics:
env.GAME_SPEED = env.CLIENT_SPEED;
env.MAX_PLAYERS = 5;
env.WAVES_THEME_CHANGE = 2;
env.MAX_DECK_SIZE = 3;
env.CAST_TIME = 10;
env.FLY_HEIGHT = env.TILE_SIZE; // The height at or above which collision detection fails.
env.INVULNERABLE_TIME = 16;
env.INVULNERABLE_TIME_SHIELD = 144;
env.TOMB_TIME_LIMIT = 1024;
env.NEW_GAME_JOIN_PERIOD = 2500;
env.LAGOUT_TIME = 526*env.GAME_SPEED;
env.ITEM_LIFESPAN = 256;
env.ITEM_DROP_PROBABILITY = 1/4;
env.ITEM_ARRAY = [
    'cherry','cherry','cherry','cherry','cherry',
    'cherry','cherry','cherry','cherry','cherry',
    'coin_silver','coin_silver','coin_silver','coin_silver','coin_silver',
    'shield','shield',
    'bottle',
    'plum',
    'coin_gold'
];
    // Directions:
env.WAIT      = 0;
env.NORTH     = 1;
env.SOUTH     = 2;
env.EAST      = 4;
env.WEST      = 8;
env.NORTHEAST = 5;
env.NORTHWEST = 9;
env.SOUTHEAST = 6;
env.SOUTHWEST = 10;
    // Action Commands:
env.COMMAND_PRIMARY     = 16;
env.COMMAND_SECONDARY   = 32;
env.COMMAND_TERTIARY    = 64;
env.COMMAND_QUATERNARY  = 128;
env.COMMAND_HELP        = 256;
let FLAG_COUNT = 10000;
env.COMMAND_MOVE        = FLAG_COUNT++;
env.COMMAND_CANCEL      = FLAG_COUNT++;
env.COMMAND_NEWGAME     = FLAG_COUNT++;
env.COMMAND_HELP        = FLAG_COUNT++;
env.COMMAND_CLOSE       = FLAG_COUNT++;
env.COMMAND_ENTER       = FLAG_COUNT++;
env.COMMAND_NONE        = FLAG_COUNT++;
env.COMMAND_WAIT        = FLAG_COUNT++;
env.COMMAND_TOGGLE_DECK = FLAG_COUNT++;
    // Commands from server.
env.COMMAND_CONNECTION  = FLAG_COUNT++;
env.COMMAND_SENSE       = FLAG_COUNT++;
env.COMMAND_WAITING     = FLAG_COUNT++;
env.COMMAND_SPECTATING  = FLAG_COUNT++;
env.COMMAND_NEWWAVE     = FLAG_COUNT++;
env.COMMAND_CLEARWAVE   = FLAG_COUNT++;
env.COMMAND_GAMEOVER    = FLAG_COUNT++;
env.COMMAND_HERO_ID     = FLAG_COUNT++; // Sent when the player is connected to a new hero.
env.COMMAND_ADJUST_DECK = FLAG_COUNT++; // Sent when the player is awarded a new card.
    // Targeting system:
env.TARGET_SELF = 1; // Allow the self to be targetted. Will skip selection if this is the only flag set.
env.TARGET_FRIEND = 2; // Allow targeting of friendly actors.
env.TARGET_ENEMY = 4; // Allow enemies to be targetted.
env.TARGET_OTHER = env.TARGET_ENEMY|env.TARGET_FRIEND; // Allow any other actor to be targeted.
env.TARGET_ANYONE = env.TARGET_OTHER|env.TARGET_SELF; // Allow any actor to be targeted.
env.TARGET_ALL = 8; // All viable targets will be effected, not just one (no selection).
env.TARGET_FURNITURE = 16; // Allow to target furniture.
env.TARGET_RANGE = 32; // Allow targets in range, not just those in view.
env.TARGET_DIRECTION = 64; // The player will be prompted to select a direction.
env.RANGE_VIEW = -1; // Targeting will use the actors view range.
    // Containable object types:
env.TYPE_MOVABLE = 1;
env.TYPE_ITEM  = 2;
env.TYPE_ACTOR = 3;
env.TYPE_EVENT = 4;
env.TYPE_PROJECTILE = 5;
    // Actor Factions (bit flags):
env.FACTION_NONE = 0;
env.FACTION_PLAYER = 1;
env.FACTION_ENEMY = 2;
    // Enemy Taxonomies:
env.TAXONOMY_NONE   = 0;
env.TAXONOMY_HUMAN  = 1<<0;
env.TAXONOMY_UNDEAD = 1<<1;
env.TAXONOMY_DEMON  = 1<<2;
    // Movement Abilities
env.MOVEMENT_NONE  = 0;
env.MOVEMENT_FLOOR = 1;
env.MOVEMENT_WATER = 2;
env.MOVEMENT_WALL  = 4;
env.MOVEMENT_ALL   = env.MOVEMENT_FLOOR | env.MOVEMENT_WATER | env.MOVEMENT_WALL;
    // AI Triggers:
FLAG_COUNT = 0;
env.TRIGGER_DIED = FLAG_COUNT++;
env.TRIGGER_STOP = FLAG_COUNT++;
env.TRIGGER_TAKE_TURN = FLAG_COUNT++;


/*===========================================================================
    Default Object Extentions
  ===========================================================================*/

env.instantiate = function (aPrototype){
    if(!aPrototype){ return null;}
    if(aPrototype._new){
        // Create arguments, minus prototype, to pass to _new.
        let cleanArguments = [];
        for(let argI = 1; argI < arguments.length; argI++){
            cleanArguments.push(arguments[argI]);
        }
        // Call _new, return new object.
        let newObject = Object.create(aPrototype);
        aPrototype._new.apply(
            newObject,
            cleanArguments
        );
        return newObject;
    }
    return Object.create(aPrototype);
};
env.extend = function (aPrototype, extention){
    let valueConfiguration = {};
    for(let key in extention){
        if(!extention.hasOwnProperty(key)){ continue;}
        let keyValue = extention[key];
        if(keyValue && keyValue.value){
            valueConfiguration[key] = keyValue;
            continue;
        }
        valueConfiguration[key] = {
            value: extention[key],
            configurable: true,
            enumerable: true,
            writable: true
        };
    }
    return Object.create(aPrototype, valueConfiguration);
};

/*===========================================================================
    Useful functions.
  ===========================================================================*/

env.alphabet = 'abcdefghijklmnopqrstuvwxyz';
env.characterIndex = function (character){
    // Converts a letter to it's position in the alphabet. Returns a number.
    character = character.toLowerCase();
    return env.alphabet.indexOf(character);
};

/*=== Common tasks when dealing with arrays. ================================*/

env.pick = function (){
    return env.arrayPick(arguments);
};
env.arrayPick = function (sourceArray){
    // Returns a randomly chosen element from the source array.
    if(sourceArray.length === 0){ return null;}
    let randomIndex = Math.floor(Math.random()*sourceArray.length);
    let randomElement = sourceArray[randomIndex];
    if(!randomElement && randomElement !== 0){
        console.log("Problem: "+randomIndex+'/'+sourceArray.length);
    }
    return randomElement;
};
env.arrayRemove = function (sourceArray, element){
    // Removes element from sourceArray, if present. Returns undefined.
    let elementIndex = sourceArray.indexOf(element);
    if(elementIndex != -1){
        sourceArray.splice(elementIndex, 1);
    }
};

/*=== Math. =================================================================*/

env.sign = function (theNum){
    if(theNum === 0){ return 0;}
    else if(theNum > 0){ return 1;}
    else if(theNum < 0){ return -1;}
    else {return NaN;}
};
env.randomInterval = function (min, max){
    // Returns a randomly selected integer between min and max, inclusive.
    if(!min){ min = 0;}
    if(!max){ max = min; min = 0;}
    let range = max-min;
    return min + Math.floor(Math.random()*(range+1));
};
env.gaussRandom = function (mean, standardDeviation){
    /**
     *  Generates random integers with a gaussian (normal) distribution about
     *      the specified mean, with the specified standard deviation.
     *  Returns an integer.
     **/
    let leg1;
    let leg2;
    do{
        leg1 = Math.random();
        leg2 = Math.random();
    } while(!(leg1 && leg2));
    let normal = Math.cos(2*Math.PI*leg2) * Math.sqrt(-(2*Math.log(leg1)));
    let gaussian = mean + normal*standardDeviation;
    return Math.round(gaussian);
};
env.tileCoord = function (fullCoord){
    return Math.floor(fullCoord/env.TILE_SIZE);
};
env.distance = function (startX, startY, endX, endY){
    const deltaX = Math.abs(endX-startX);
    const deltaY = Math.abs(endY-startY);
    return Math.max(deltaX, deltaY);
};
env.trigDistance = function (startX, startY, endX, endY){
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
};
env.directionFlip = function (direction){
    return ((direction << 1) & env.SOUTHWEST) | ((direction&env.SOUTHWEST) >> 1);
};
env.getStepCoords = function (startX, startY, direction){
    if(direction & env.NORTH){ startY++;}
    if(direction & env.SOUTH){ startY--;}
    if(direction & env.EAST ){ startX++;}
    if(direction & env.WEST ){ startX--;}
    return {x: startX, y: startY};
};
env.angleTo = function (startX, startY, endX, endY){
    let deltaX = endX-startX;
    let deltaY = endY-startY;
    if(!deltaX && !deltaY){
        return 0;
    }
    let angle = Math.atan2(deltaY, deltaX); // Reversed, don't know why.
    return angle;
};
env.angleToDirection = function (angle){
    angle /= Math.PI;
    angle /= 2; // Convert to Tau.
    angle += 1/16;
    if(angle < 0){
        angle += 1;
    } else if(angle > 1){
        angle -= 1;
    }
    let direction = 0;
    if     (angle >=   0 && angle < 1/8){ direction = env.EAST     ;}
    else if(angle >= 1/8 && angle < 2/8){ direction = env.NORTHEAST;}
    else if(angle >= 2/8 && angle < 3/8){ direction = env.NORTH    ;}
    else if(angle >= 3/8 && angle < 4/8){ direction = env.NORTHWEST;}
    else if(angle >= 4/8 && angle < 5/8){ direction = env.WEST     ;}
    else if(angle >= 5/8 && angle < 6/8){ direction = env.SOUTHWEST;}
    else if(angle >= 6/8 && angle < 7/8){ direction = env.SOUTH    ;}
    else if(angle >= 7/8 && angle < 8/8){ direction = env.SOUTHEAST;}
    return direction;
};
env.directionTo = function (startX, startY, endX, endY){
    let angle = env.angleTo(startX, startY, endX, endY);
    return env.angleToDirection(angle);
};
env.cardinalTo = function (startX, startY, endX, endY){
    let angle = env.angleTo(startX, startY, endX, endY);
    angle /= Math.PI;
    angle /= 2; // Convert to Tau.
    //angle += 1/16;
    if(angle < 0){
        angle += 1;
    } else if(angle > 1){
        angle -= 1;
    }
    let direction = 0;
    if     (angle >=   0 && angle < 1/8){ direction = env.EAST ;}
    else if(angle >= 1/8 && angle < 3/8){ direction = env.NORTH;}
    else if(angle >= 3/8 && angle < 5/8){ direction = env.WEST ;}
    else if(angle >= 5/8 && angle < 7/8){ direction = env.SOUTH;}
    else if(angle >= 7/8 && angle < 8/8){ direction = env.EAST ;}
    return direction;
};
//==== Easing functions ======================================================//

env.easeInSin  = function (start, end, percentage){
    let difference = end-start;
    return start + Math.floor(difference * Math.sin(percentage*(Math.PI*2)/4));
};
env.easeOutSin = function (start, end, percentage){
    let difference = end-start;
    return start + Math.floor(difference * (1-Math.cos(percentage*(Math.PI*2)/4)));
};