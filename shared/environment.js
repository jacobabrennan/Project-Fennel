'use strict';

/*===========================================================================
    Constants
  ===========================================================================*/

    // Project Info
var PROJECT_NAME = 'Project Fennel';
var VERSION = 'Internal.13';
    // Global Metrics:
var debug = false;
var TILE_SIZE = 16;
var DEFAULT_MAP_SIZE = 15;
    // Client Metrics:
var CLIENT_SPEED = 1000/30;
var FONT_FAMILY = 'press_start_kregular';
var FONT_SIZE = 8;
var displayWidth =  TILE_SIZE*DEFAULT_MAP_SIZE;//26//19;
var displayHeight = TILE_SIZE*DEFAULT_MAP_SIZE;//15//11;
var HIGHLIGHT = 'highlight';
var ANIMATION_FRAME_DELAY = 16;
var KEY_UP = 1 << 16;
var PREVIEW_DISPLAY_TIME = 8000;
    // Display Layers
var LAYER_TILES = 0;
var LAYER_UNDER = 1;
var LAYER_SPRITES = 2;
    // Gameplay Metrics:
var GAME_SPEED = CLIENT_SPEED;
var MAX_PLAYERS = 5;
var WAVES_THEME_CHANGE = 2;
var MAX_DECK_SIZE = 3;
var CAST_TIME = 10;
var FLY_HEIGHT = TILE_SIZE; // The height at or above which collision detection fails.
var INVULNERABLE_TIME = 16;
var INVULNERABLE_TIME_SHIELD = 144;
var TOMB_TIME_LIMIT = 1024;
var ITEM_LIFESPAN = 256;
var ITEM_DROP_PROBABILITY = 1/4;
var ITEM_ARRAY = [
    'cherry','cherry','cherry','cherry','cherry','cherry','cherry','cherry',
    'cherry','cherry','cherry','cherry','cherry','cherry','cherry','cherry',
    'cherry','cherry','cherry','cherry',
    'coin_silver','coin_silver','coin_silver',
    'coin_silver','coin_silver','coin_silver',
    'coin_silver','coin_silver','coin_silver',
    'shield','shield','shield','shield',
    'bottle','bottle',
    'plum','plum',
    'coin_gold','coin_gold',
    'coin_diamond'
];
    // Directions:
var WAIT      = 0;
var NORTH     = 1;
var SOUTH     = 2;
var EAST      = 4;
var WEST      = 8;
var NORTHEAST = 5;
var NORTHWEST = 9;
var SOUTHEAST = 6;
var SOUTHWEST = 10;
    // Action Commands:
var COMMAND_PRIMARY     = 16;
var COMMAND_SECONDARY   = 32;
var COMMAND_TERTIARY    = 64;
var COMMAND_QUATERNARY  = 128;
var COMMAND_HELP        = 256;
var FLAG_COUNT          = 10000;
var COMMAND_MOVE        = FLAG_COUNT++;
var COMMAND_CANCEL      = FLAG_COUNT++;
var COMMAND_NEWGAME     = FLAG_COUNT++;
var COMMAND_HELP        = FLAG_COUNT++;
var COMMAND_CLOSE       = FLAG_COUNT++;
var COMMAND_ENTER       = FLAG_COUNT++;
var COMMAND_NONE        = FLAG_COUNT++;
var COMMAND_WAIT        = FLAG_COUNT++;
var COMMAND_TOGGLE_DECK = FLAG_COUNT++;
    // Commands from server.
var COMMAND_CONNECTION  = FLAG_COUNT++;
var COMMAND_SENSE       = FLAG_COUNT++;
var COMMAND_WAITING     = FLAG_COUNT++;
var COMMAND_SPECTATING  = FLAG_COUNT++;
var COMMAND_NEWWAVE     = FLAG_COUNT++;
var COMMAND_CLEARWAVE   = FLAG_COUNT++;
var COMMAND_GAMEOVER    = FLAG_COUNT++;
var COMMAND_HERO_ID     = FLAG_COUNT++; // Sent when the player is connected to a new hero.
var COMMAND_ADJUST_DECK = FLAG_COUNT++; // Sent when the player is awarded a new card.
    // Targeting system:
var TARGET_SELF = 1; // Allow the self to be targetted. Will skip selection if this is the only flag set.
var TARGET_FRIEND = 2; // Allow targeting of friendly actors.
var TARGET_ENEMY = 4; // Allow enemies to be targetted.
var TARGET_OTHER = TARGET_ENEMY|TARGET_FRIEND; // Allow any other actor to be targeted.
var TARGET_ANYONE = TARGET_OTHER|TARGET_SELF; // Allow any actor to be targeted.
var TARGET_ALL = 8; // All viable targets will be effected, not just one (no selection).
var TARGET_FURNITURE = 16; // Allow to target furniture.
var TARGET_RANGE = 32; // Allow targets in range, not just those in view.
var TARGET_DIRECTION = 64; // The player will be prompted to select a direction.
var RANGE_VIEW = -1; // Targeting will use the actors view range.
    // Containable object types:
var TYPE_MOVABLE = 1;
var TYPE_ITEM  = 2;
var TYPE_ACTOR = 3;
var TYPE_EVENT = 4;
var TYPE_PROJECTILE = 5;
    // Actor Factions (bit flags):
var FACTION_NONE = 0;
var FACTION_PLAYER = 1;
var FACTION_ENEMY = 2;
    // Enemy Taxonomies:
var TAXONOMY_NONE   = 0;
var TAXONOMY_HUMAN  = 1<<0;
var TAXONOMY_UNDEAD = 1<<1;
var TAXONOMY_DEMON  = 1<<2;
    // Movement Abilities
var MOVEMENT_NONE  = 0;
var MOVEMENT_FLOOR = 1;
var MOVEMENT_WATER = 2;
var MOVEMENT_WALL  = 4;
var MOVEMENT_ALL   = MOVEMENT_FLOOR | MOVEMENT_WATER | MOVEMENT_WALL;
    // AI Triggers:
FLAG_COUNT = 0;
var TRIGGER_DIED = FLAG_COUNT++;
var TRIGGER_STOP = FLAG_COUNT++;
var TRIGGER_TAKE_TURN = FLAG_COUNT++;


/*===========================================================================
    Default Object Extentions
  ===========================================================================*/

if(Object.instantiate){
    console.log('Cannot attach method "instantiate" to Object.');
} else{
    Object.instantiate = function (aPrototype){
        if(!aPrototype){ return null;}
        if(aPrototype._new){
            // Create arguments, minus prototype, to pass to _new.
            var cleanArguments = [];
            for(var argI = 1; argI < arguments.length; argI++){
                cleanArguments.push(arguments[argI]);
            }
            // Call _new, return new object.
            var newObject = Object.create(aPrototype);
            aPrototype._new.apply(
                newObject,
                cleanArguments
            );
            return newObject;
        }
        return Object.create(aPrototype);
    };
}
if(Object.extend){
    console.log('Cannot attach method "extend" to Object.');
} else{
    Object.extend = function (aPrototype, extention){
        var valueConfiguration = {};
        for(var key in extention){
            if(!extention.hasOwnProperty(key)){ continue;}
            var keyValue = extention[key];
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
}

/*===========================================================================
    Useful functions.
  ===========================================================================*/

var alphabet = 'abcdefghijklmnopqrstuvwxyz';
var characterIndex = function (character){
    // Converts a letter to it's position in the alphabet. Returns a number.
    character = character.toLowerCase();
    return alphabet.indexOf(character);
};

/*=== Common tasks when dealing with arrays. ================================*/

var pick = function (){
    return arrayPick(arguments);
};
var arrayPick = function (sourceArray){
    // Returns a randomly chosen element from the source array.
    if(sourceArray.length === 0){ return null;}
    var randomIndex = Math.floor(Math.random()*sourceArray.length);
    var randomElement = sourceArray[randomIndex];
    if(!randomElement && randomElement !== 0){
        console.log("Problem: "+randomIndex+'/'+sourceArray.length);
    }
    return randomElement;
};
var arrayRemove = function (sourceArray, element){
    // Removes element from sourceArray, if present. Returns undefined.
    var elementIndex = sourceArray.indexOf(element);
    if(elementIndex != -1){
        sourceArray.splice(elementIndex, 1);
    }
}

/*=== Math. =================================================================*/

var sign = function (theNum){
    if(theNum === 0){ return 0;}
    else if(theNum > 0){ return 1;}
    else if(theNum < 0){ return -1;}
    else {return NaN;}
}
var randomInterval = function (min, max){
    // Returns a randomly selected integer between min and max, inclusive.
    if(!min){ min = 0;}
    if(!max){ max = min; min = 0;}
    var range = max-min;
    return min + Math.floor(Math.random()*(range+1));
};
var gaussRandom = function (mean, standardDeviation){
    /**
     *  Generates random integers with a gaussian (normal) distribution about
     *      the specified mean, with the specified standard deviation.
     *  Returns an integer.
     **/
    var leg1;
    var leg2;
    do{
        leg1 = Math.random();
        leg2 = Math.random();
    } while(!(leg1 && leg2));
    var normal = Math.cos(2*Math.PI*leg2) * Math.sqrt(-(2*Math.log(leg1)));
    var gaussian = mean + normal*standardDeviation;
    return Math.round(gaussian);
};
var tileCoord = function (fullCoord){
    return Math.floor(fullCoord/TILE_SIZE);
};
var distance = function (startX, startY, endX, endY){
    var deltaX = Math.abs(endX-startX);
    var deltaY = Math.abs(endY-startY);
    return Math.max(deltaX, deltaY);
};
var trigDistance = function (startX, startY, endX, endY){
    var deltaX = endX - startX;
    var deltaY = endY - startY;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
};
var directionFlip = function (direction){
    return ((direction << 1) & SOUTHWEST) | ((direction&SOUTHWEST) >> 1);
};
var getStepCoords = function (startX, startY, direction){
    if(direction & NORTH){ startY++;}
    if(direction & SOUTH){ startY--;}
    if(direction & EAST ){ startX++;}
    if(direction & WEST ){ startX--;}
    return {x: startX, y: startY};
};
var directionTo = function (startX, startY, endX, endY){
    var deltaX = endX-startX;
    var deltaY = endY-startY;
    if(!deltaX && !deltaY){
        return 0;
    }
    var direction = 0;
    var angle = Math.atan2(deltaY, deltaX); // Reversed, don't know why.
    angle /= Math.PI;
    angle /= 2; // Convert to Tau.
    angle += 1/16;
    if(angle < 0){
        angle += 1;
    } else if(angle > 1){
        angle -= 1;
    }
    if     (angle >=   0 && angle < 1/8){ direction = EAST     ;}
    else if(angle >= 1/8 && angle < 2/8){ direction = NORTHEAST;}
    else if(angle >= 2/8 && angle < 3/8){ direction = NORTH    ;}
    else if(angle >= 3/8 && angle < 4/8){ direction = NORTHWEST;}
    else if(angle >= 4/8 && angle < 5/8){ direction = WEST     ;}
    else if(angle >= 5/8 && angle < 6/8){ direction = SOUTHWEST;}
    else if(angle >= 6/8 && angle < 7/8){ direction = SOUTH    ;}
    else if(angle >= 7/8 && angle < 8/8){ direction = SOUTHEAST;}
    return direction;
};
var cardinalTo = function (startX, startY, endX, endY){
    var deltaX = endX-startX;
    var deltaY = endY-startY;
    if(!deltaX && !deltaY){
        return 0;
    }
    var direction = 0;
    var angle = Math.atan2(deltaY, deltaX); // Reversed, don't know why.
    angle /= Math.PI;
    angle /= 2; // Convert to Tau.
    //angle += 1/16;
    if(angle < 0){
        angle += 1;
    } else if(angle > 1){
        angle -= 1;
    }
    if     (angle >=   0 && angle < 1/8){ direction = EAST ;}
    else if(angle >= 1/8 && angle < 3/8){ direction = NORTH;}
    else if(angle >= 3/8 && angle < 5/8){ direction = WEST ;}
    else if(angle >= 5/8 && angle < 7/8){ direction = SOUTH;}
    else if(angle >= 7/8 && angle < 8/8){ direction = EAST ;}
    return direction;
};
//==== Easing functions ======================================================//

var easeInSin  = function (start, end, percentage){
    var difference = end-start;
    return start + Math.floor(difference * Math.sin(percentage*(Math.PI*2)/4));
};
var easeOutSin = function (start, end, percentage){
    var difference = end-start;
    return start + Math.floor(difference * (1-Math.cos(percentage*(Math.PI*2)/4)));
};