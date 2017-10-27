// Dependant on client.js
(function (){
//== OPEN NAMESPACE ==========================================================//
var resourcePath = 'rsc'
var resource = {};
var commonSpriteSheets = {
    actor: function (url, sprites){
        var commonOptions =  {directions: 4, frames: 2};
        var commonSprites = {
            "attack": {"offsetX":  0, "offsetY": 32, "frames": 1, "frameDelay": 8},
            "cast"  : {"offsetX":  0, "offsetY": 48, "frames": 1, "frameDelay": CAST_TIME}
        };
        if(sprites){
            for(key in sprites){
                if(!sprites.hasOwnProperty(key)){ continue;}
                commonSprites[key] = sprites[key];
            }
        }
        return spriteSheet(url, commonSprites, commonOptions);
    }
}
var graphicResource = Object.extend(resource, {
    url: null,
    width: undefined,
    height: undefined,
    effect: function (which, image, offsetX, offsetY, width, height){
        var drawEffect = this.effects[which];
        if(!drawEffect){ return image;}
        return drawEffect.call(this, image, offsetX, offsetY, width, height);
    },
    effects: {
        draw: function (image, offsetX, offsetY, width, height){
            client.skin.scrapBoard.drawImage(
                image,
                offsetX, offsetY, width, height,
                0, 0, width, height
            );
            return client.skin.scrapBoard;
        },
        flash: function (image, offsetX, offsetY, width, height){
            var scrapBoard = client.skin.scrapBoard;
            switch(Math.floor(Math.random()*4)){
                case 0: {scrapBoard.fillStyle = "rgb(255,   0,   0)"; break;}
                case 1: {scrapBoard.fillStyle = "rgb(  0,   0,   0)"; break;}
                case 2: {scrapBoard.fillStyle = "rgb(  0,   0, 255)"; break;}
                case 3: {scrapBoard.fillStyle = "rgb(255, 255, 255)"; break;}
            }
            scrapBoard.save();
            scrapBoard.globalCompositeOperation = "copy";
            scrapBoard.fillRect(0, 0, scrapBoard.canvas.width, scrapBoard.canvas.height);
            scrapBoard.globalCompositeOperation = "destination-in";
            scrapBoard.drawImage(
                image,
                offsetX, offsetY, width, height,
                0, 0, width, height
            );
            scrapBoard.restore();
            return scrapBoard.canvas;
        }
    }
});
var graphic = (function (){
    var drawFunction = function (x, y, options){
        if(!options){ options = {};}
        var direction = options.direction || SOUTH;
        var offsetX = this.offsetX || 0;
        var offsetY = this.offsetY || 0;
        var width  = this.width  || this.image.width;
        var height = this.height || this.image.height;
        var adjustX = Math.round(x);
        var adjustY = Math.round((displayHeight)-(y+height));
        if(this.nudgeX){ adjustX += this.nudgeX;}
        if(this.nudgeY){ adjustY -= this.nudgeY;}
        if(options.z){ adjustY -= options.z;}
        if(options.center){
            adjustX -= Math.floor(width/2);
            adjustY += Math.floor(height/2);
        }
        if(this.frames){
            var frame = 0;
            if(options.frame !== undefined){
                frame = Math.min(options.frame, this.frames-1);
            } else if(options.time){
                var delay = this.frameDelay || ANIMATION_FRAME_DELAY;
                frame = (Math.floor(options.time/delay) % this.frames);
            }
            offsetY += height*frame;
        }
        //
        if(this.directions === 4){
            switch(direction){
                case SOUTH: break;
                case NORTH: offsetX += width; break;
                case SOUTHEAST:
                case NORTHEAST:
                case EAST : offsetX += width*2; break;
                case SOUTHWEST:
                case NORTHWEST:
                case WEST : offsetX += width*3; break;
            }
        } else if(this.directions === 8){
            switch(direction){
                case SOUTH: break;
                case NORTH: offsetX += width; break;
                case EAST : offsetX += width*2; break;
                case WEST : offsetX += width*3; break;
                case SOUTHEAST: offsetX += width*4; break;
                case SOUTHWEST: offsetX += width*5; break;
                case NORTHEAST: offsetX += width*6; break;
                case NORTHWEST: offsetX += width*7; break;
            }
        }
        //
        var drawImage = client.resourceLibrary.images[this.url];
        if(options.effects){
            for(var effectIndex = 0; effectIndex < options.effects.length; effectIndex++){
                var indexedEffect = options.effects[effectIndex];
                drawImage = this.effect(indexedEffect, drawImage, offsetX, offsetY, width, height);
                offsetX = 0;
                offsetY = 0;
            }
        }
        client.skin.context.drawImage(
            drawImage,
            offsetX, offsetY, width, height,
            adjustX, adjustY, width, height
        );
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    };
    return function (url, width, height, offsetX, offsetY, options){
        if(!options){ options = {};}
        options.draw = drawFunction;
        if(url    ){ options.url     = url    ;}
        if(width  ){ options.width   = width  ;}
        if(height ){ options.height  = height ;}
        if(offsetX){ options.offsetX = offsetX;}
        if(offsetY){ options.offsetY = offsetY;}
        return Object.extend(graphicResource, options);
    };
})();
var spriteSheet = (function (){
    var drawFunction = function (x, y, options){
        if(!options){ options = {};}
        var state = options.state || 'default';
        var graphicState = this.states[state];
        if(!graphicState){ graphicState = this.states['default'];}
        if(!graphicState){ return false;}
        return graphicState.draw(x, y, options);
    };
    var result = function (url, mapping, options){
        if(!options){ options = {};}
        if(!mapping){ mapping = {};}
        var width  = options.width  || TILE_SIZE;
        var height = options.height || TILE_SIZE;
        var sheet = Object.extend(graphicResource, {
            url: url,
            anchorX: options.anchorX || 0,
            anchorY: options.anchorY || 0,
            draw: drawFunction
        });
        if(options.directions){ sheet.directions = options.directions;}
        if(options.frames){ sheet.frames = options.frames;}
        if(options.frameDelay){ sheet.frameDelay = options.frameDelay;}
        sheet.states = {};
        if(!mapping['default']){
            mapping['default'] = {}
        }
        for(var key in mapping){
            if(!mapping.hasOwnProperty(key)){
                continue;
            }
            var stateMap = mapping[key];
            var fullOffsetX = (stateMap.offsetX || 0) + sheet.anchorX;
            var fullOffsetY = (stateMap.offsetY || 0) + sheet.anchorY;
            var state = graphic(
                url,
                (stateMap.width  || width),
                (stateMap.height || height),
                fullOffsetX,
                fullOffsetY,
                stateMap
            );
            state.directions = stateMap.directions || sheet.directions;
            state.frames = stateMap.frames || sheet.frames;
            state.frameDelay = stateMap.frameDelay || sheet.frameDelay;
            sheet.states[key] = state;
        }
        return sheet;
    };
    result.drawFunction = drawFunction;
    // I appologize to whoever is reading this terrible workaround.
    return result;
})();
var regionSheet = (function (){
    var drawFunction = function (x, y, options){
        if(!options){ options = {};}
        if(options.state === 'water' || options.state === 'bridge'){
            options.state += options.autoJoin;
        }
        return spriteSheet.drawFunction.call(this, x, y, options);
    };
    return function (url){
        var sheet = spriteSheet(url, {
            "wall"   : {"offsetX": 32, "offsetY":  0},
            "pillar" : {"offsetX": 16, "offsetY":  0},
            "floor"  : {"offsetX":  0, "offsetY":  0},
            "bridge": {"offsetX":  0, "offsetY": 16},
            "bridge1": {"offsetX": 48, "offsetY":  0},
            "bridge8": {"offsetX": 0, "offsetY": 16},
            "water"  : {"offsetX": 16, "offsetY": 16},
            "water0"  : {"offsetX": 16, "offsetY": 16}, // isolated
            "water1"  : {"offsetX": 16, "offsetY": 16}, // open top
            "water2"  : {"offsetX": 16, "offsetY": 16}, // open bottom
            "water3"  : {"offsetX": 16, "offsetY": 16}, // open vertically
            "water4"  : {"offsetX": 16, "offsetY": 16}, // open right
            "water5"  : {"offsetX":  0, "offsetY": 48}, // open northeast
            "water6"  : {"offsetX": 16, "offsetY": 48}, // open southeast
            "water7"  : {"offsetX": 48, "offsetY": 32}, // closed left
            "water8"  : {"offsetX": 16, "offsetY": 16}, // open left
            "water9"  : {"offsetX": 16, "offsetY": 32}, // open northwest
            "water10"  : {"offsetX": 32, "offsetY": 32}, // open southwest
            "water11"  : {"offsetX":  0, "offsetY": 32}, // closed right
            "water12"  : {"offsetX": 16, "offsetY": 16}, // open horizontally
            "water13"  : {"offsetX": 32, "offsetY": 16}, // closed above
            "water14"  : {"offsetX": 48, "offsetY": 16}, // closed below
            "water15"  : {"offsetX": 16, "offsetY": 16}, // all open
        });
        sheet.draw = drawFunction;
        return sheet;
    }
})();
var event = (function (){
    var eventResource = {
        finished: false,
        timeLimit: null,
        width: 0,
        height: 0,
        setup: function (){},
        iterate: function (){
            this.time++;
            if(this.timeLimit && this.time >= this.timeLimit){
                this.finish();
            }
            return this.finished;
        },
        _new: function (options){
            this.time = -1; // Iterate is called before draw,
            // Time when drawing first frame should be 0.
            this.options = options;
            this.setup();
            return this;
        },
        draw: function (){},
        finish: function (){
            this.finished = true;
        },
        // Helpful functions:
        center: function (movableId, offsetDirection){
            var centerMover = client.gameplay.memory.getContainable(movableId);
            if(!centerMover){ return null;}
            var centerX = centerMover.x+(centerMover.width -this.width )/2;
            var centerY = centerMover.y+(centerMover.height-this.height)/2;
            if(offsetDirection){
                switch(offsetDirection){
                    case NORTH: centerY = centerMover.y+centerMover.height; break;
                    case SOUTH: centerY = centerMover.y-       this.height; break;
                    case EAST : centerX = centerMover.x+centerMover.width ; break;
                    case WEST : centerX = centerMover.x-       this.width ; break;
                }
            }
            return {x: centerX, y: centerY};
        }
    };
    return function (options){
        var configureObject = {};
        for(var key in options){
            if(options.hasOwnProperty(key)){
                configureObject[key] = {value: options[key], writable: true};
            }
        }
        var newEvent = Object.extend(eventResource, configureObject);
        return newEvent;
    };
})();
client.resource = function (category, identifier){
	return this.resourceLibrary.resource(category, identifier);
}
client.resourceLibrary = {
	resourceLoadReady: false,
	resourceLoadingIds: [],
	resource: function (category, identifier, fragment){
		if(this.library[category]){
            var resource = this.library[category][identifier];
            if(fragment && fragment.states){
                resource = fragment.states[resource];
            }
            return resource;
		}
        return null;
	},
    /*
        Animations
            Variable Number of Frames
            Variable Frame Rate
            Looping or One Time
    */
	images: {},
	library: {
		graphic: {
            // I - Graphics
			// I.a - Client Interface
			"titleIcon": graphic('img/title_icon.png'),
            "hud": spriteSheet('img/hud.png', {
                'heartFull' : {offsetX: 0, offsetY: 0},
                'heartEmpty': {offsetX: 8, offsetY: 0},
                'bottleFull' : {offsetX: 0, offsetY: 8},
                'bottleEmpty': {offsetX: 8, offsetY: 8},
                'crystal'    : {offsetX: 8, offsetY:16}
            }, {width: 8, height: 8}),
            status: graphic('img/status.png'),
            "preview": spriteSheet('img/preview.png', {
                "plainsBack" : {},
                "plainsMid"  : {"offsetX": 0, "offsetY": 240},
                "plainsFront": {"offsetX": 0, "offsetY": 480}
            }, {width: 240, height: 240}),
            // I.b - Cards, Skills
            "cards": spriteSheet('img/cards.png', {
                "back": {offsetX: 256, offsetY:   0},
                "v1": {"offsetX":  0, "offsetY":  0},
                "v2": {"offsetX": 32, "offsetY":  0},
                "v3": {"offsetX": 64, "offsetY":  0},
                "v4": {"offsetX": 96, "offsetY":  0},
                "s1": {"offsetX":  0, "offsetY": 48},
                "s2": {"offsetX": 32, "offsetY": 48},
                "s3": {"offsetX": 64, "offsetY": 48},
                "s4": {"offsetX": 96, "offsetY": 48},
                "a1": {"offsetX":  0, "offsetY": 96},
                "a2": {"offsetX": 32, "offsetY": 96},
                "a3": {"offsetX": 64, "offsetY": 96},
                "a4": {"offsetX": 96, "offsetY": 96},
                "w1": {"offsetX":  0, "offsetY":144},
                "w2": {"offsetX": 32, "offsetY":144},
                "w3": {"offsetX": 64, "offsetY":144},
                "w4": {"offsetX": 96, "offsetY":144},
            }, {width: 32, height: 48}),
            'skills': spriteSheet('img/skills.png', {
                'empty': {},
                'heal': {offsetX: 24},
                'repel': {offsetX: 48},
                'revive': {offsetX: 72},
                'healBerry': {offsetX: 96},
                'fireblast': {offsetX: 120},
                'fireExplosion': {offsetX: 144},
                'fireSnake': {offsetX: 168},
                'shields': {offsetX: 0, offsetY: 24},
                'throwSword': {offsetX: 24, offsetY: 24},
                'controlSword': {offsetX: 48, offsetY: 24},
                'shieldsAOE': {offsetX: 72, offsetY: 24},
                'barrierAOE': {offsetX: 96, offsetY: 24},
                'timeStop': {offsetX: 120, offsetY: 24},
                'potionAura': {offsetX: 144, offsetY: 24},
                'potionFire': {offsetX: 168, offsetY: 24},
                'illusion': {offsetX: 0, offsetY: 48},
                'illusion2': {offsetX: 24, offsetY: 48},
                'summonFire': {offsetX: 48, offsetY: 48},
                'summonAir': {offsetX: 72, offsetY: 48},
                'pirateBlink': {offsetX: 96, offsetY: 48},
                'ninjaBlink': {offsetX: 120, offsetY: 48},
                'bomb': {offsetX: 144, offsetY: 48},
                'arrowBomb': {offsetX: 168, offsetY: 48},
                'axe': {offsetX: 0, offsetY: 72},
                'swordGold': {offsetX: 24, offsetY: 72},
                'flail': {offsetX: 48, offsetY: 72},
                'raiseSkeleton': {offsetX: 72, offsetY: 72},
                'summonSkeleton': {offsetX: 96, offsetY: 72},
                'meditate': {offsetX: 120, offsetY: 72},
                'ironFist': {offsetX: 144, offsetY: 72},
                'growTree': {offsetX: 168, offsetY: 72},
            }, {width: 24, height: 24}),
            //"hud": {url: resourcePath + 'graphics/hud.png', x:0, y:0},*/
            // I.c - Portraits
            "portraits": spriteSheet('img/portraits.png', {
                'squire'     : {offsetX:   0, offsetY:  0},
                'knight'     : {offsetX:  64, offsetY:  0},
                'royalGuard' : {offsetX: 128, offsetY:  0},
                'acolyte'    : {offsetX: 192, offsetY:  0},
                'cleric'     : {offsetX: 256, offsetY:  0},
                'highPriest' : {offsetX: 320, offsetY:  0},
                'mage'       : {offsetX:   0, offsetY: 64},
                'wizard'     : {offsetX:  64, offsetY: 64},
                'sorcerer'   : {offsetX: 128, offsetY: 64},
                'archer'     : {offsetX: 192, offsetY: 64},
                'brigand'    : {offsetX: 256, offsetY: 64},
                'rogue'      : {offsetX: 320, offsetY: 64},
                'paladin'    : {offsetX:   0, offsetY:128},
                'crusader'   : {offsetX:  64, offsetY:128},
                'templar'    : {offsetX: 128, offsetY:128},
                'darkKnight' : {offsetX: 192, offsetY:128},
                'darkLancer' : {offsetX: 256, offsetY:128},
                'warlock'    : {offsetX: 320, offsetY:128},
                'barbarian'  : {offsetX:   0, offsetY:192},
                'warlord'    : {offsetX:  64, offsetY:192},
                'berserker'  : {offsetX: 128, offsetY:192},
                'scholar'    : {offsetX: 192, offsetY:192},
                'alchemist'  : {offsetX: 256, offsetY:192},
                'necromancer': {offsetX: 320, offsetY:192},
                'bard'       : {offsetX:   0, offsetY:256},
                'diva'       : {offsetX:  64, offsetY:256},
                'soloist'    : {offsetX: 128, offsetY:256},
                'illusionist': {offsetX: 192, offsetY:256},
                'conjurer'   : {offsetX: 256, offsetY:256},
                'mystic'     : {offsetX: 320, offsetY:256},
                'hero'       : {offsetX:   0, offsetY:320},
                'monk'       : {offsetX:  64, offsetY:320},
                'ninja'      : {offsetX: 128, offsetY:320},
                'gardener'   : {offsetX: 192, offsetY:320},
                'adventurer' : {offsetX: 256, offsetY:320},
                'rebel'      : {offsetX: 320, offsetY:320},
            }, {width: 64, height: 64}),
			// I.d - Mapping
			// I.d.1 - Tiles
			"plains": regionSheet('img/plains.png'),
            "castle": regionSheet('img/castle.png'),
            "wastes": regionSheet('img/wastes.png'),
            "desert": regionSheet('img/desert.png'),
            "ruins": regionSheet('img/ruins.png'),
            "inferno": regionSheet('img/inferno.png'),
            /*
			"castle": {url: resourcePath + 'graphics/castle.png', states: {
				"floor": {x:0, y:0},
				"pillar": {x:1, y:0},
				"wall": {x:2, y:0},
				"water": {x:1, y:1},
				"test": {x:1, y:1},
			}},*/
			// I.d.2 - Misc Mapping
			"headstone": graphic('img/tomb.png'),
			//"ladder_up": {url: resourcePath + 'graphics/common_tall.png', x:16, y:0, height: 32},
			//"ladder_down": {url: resourcePath + 'graphics/common_tall.png', x:0, y:0, height: 32, y_offset: -16},
			// I.e - Units
			// I.e.1 - Player Classes
            "adventurer" : commonSpriteSheets.actor('img/adventurer.png' ),
                // Tier 1
            "squire"     : commonSpriteSheets.actor('img/squire.png'     ),
            "acolyte"    : commonSpriteSheets.actor('img/acolyte.png'    ),
            "mage"       : commonSpriteSheets.actor('img/mage.png'       ),
            "archer"     : commonSpriteSheets.actor('img/archer.png'     ),
                // Tier 2
            "knight"     : commonSpriteSheets.actor('img/knight.png'     ),
            "paladin"    : commonSpriteSheets.actor('img/paladin.png'    ),
            "cleric"     : commonSpriteSheets.actor('img/cleric.png'     ),
            "darkKnight" : commonSpriteSheets.actor('img/dark_knight.png'),
            "scholar"    : commonSpriteSheets.actor('img/scholar.png'    ),
            "wizard"     : commonSpriteSheets.actor('img/wizard.png'     ),
            "barbarian"  : commonSpriteSheets.actor('img/barbarian.png'  ),
            "bard"       : commonSpriteSheets.actor('img/bard.png'       ),
            "illusionist": commonSpriteSheets.actor('img/illusionist.png'),
            "brigand"    : commonSpriteSheets.actor('img/brigand.png'    ),
                // Tier 3
            "royalGuard" : commonSpriteSheets.actor('img/royal_guard.png'),
            "crusader"   : commonSpriteSheets.actor('img/crusader.png'   ),
            "templar"    : commonSpriteSheets.actor('img/templar.png'    ),
            "highPriest" : commonSpriteSheets.actor('img/high_priest.png'),
            "darkLancer" : commonSpriteSheets.actor('img/dark_lancer.png'),
            "alchemist"  : commonSpriteSheets.actor('img/alchemist.png'  ),
            "warlock"    : commonSpriteSheets.actor('img/warlock.png'    ),
            "necromancer": commonSpriteSheets.actor('img/necromancer.png'),
            "sorcerer"   : commonSpriteSheets.actor('img/sorcerer.png'   ),
            "warlord"    : commonSpriteSheets.actor('img/warlord.png'    ),
            "diva"       : commonSpriteSheets.actor('img/diva.png'       ),
            "conjurer"   : commonSpriteSheets.actor('img/conjurer.png'   ),
            "berserker"  : commonSpriteSheets.actor('img/berserker.png'  ),
            "soloist"    : commonSpriteSheets.actor('img/soloist.png'    ),
            "mystic"     : commonSpriteSheets.actor('img/mystic.png'     ),
            "rogue"      : commonSpriteSheets.actor('img/rogue.png'      ),
                // Triads
            "hero"       : commonSpriteSheets.actor('img/hero.png'       ),
            "monk"       : commonSpriteSheets.actor('img/monk.png'       ),
            "ninja"      : commonSpriteSheets.actor('img/ninja.png'      ),
            "gardener"   : commonSpriteSheets.actor('img/gardener.png'   ),
                // Summons
            "skeleton"   : commonSpriteSheets.actor('img/skeleton.png'   ),
			// I.e.2 - Enemies
            "goblin1": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 32, "frames": 1, "frameDelay": 8}
            }, {anchorX: 608, anchorY: 192, directions: 4, frames: 2}),
            "goblin2": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 32, "frames": 1, "frameDelay": 8}
            }, {anchorX: 608, anchorY: 240, directions: 4, frames: 2}),
            "templar1": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 32, "frames": 1, "frameDelay": 8}
            }, {anchorX: 864, anchorY: 96, directions: 4, frames: 2}),
            "templar2": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 32, "frames": 1, "frameDelay": 8}
            }, {anchorX: 864, anchorY: 144, directions: 4, frames: 2}),
            "templar3": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 32, "frames": 1, "frameDelay": 8}
            }, {anchorX: 864, anchorY: 192, directions: 4, frames: 2}),
            "lordKnight1": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 48, "frames": 1, "frameDelay": 8}
            }, {anchorX: 29*2*TILE_SIZE, anchorY: 6*TILE_SIZE, width: 24, height: 24, directions: 4, frames: 2}),
            "lordKnight2": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 48, "frames": 1, "frameDelay": 8}
            }, {anchorX: 29*2*TILE_SIZE, anchorY: 10.5*TILE_SIZE, width: 24, height: 24, directions: 4, frames: 2}),
            "lordKnight3": spriteSheet('img/enemies.png', {
                "attack": {"offsetX":  0, "offsetY": 48, "frames": 1, "frameDelay": 8}
            }, {anchorX: 29*2*TILE_SIZE, anchorY: 15*TILE_SIZE, width: 24, height: 24, directions: 4, frames: 2}),
            "summonAir": spriteSheet('img/summons.png', {
                "attack": {"offsetY": 16}
            }, {directions: 4}),
            "summonFire": spriteSheet('img/summons.png', {}, {directions: null, anchorX: 64, frames: 2}),
            "summonEarth": spriteSheet('img/summons.png', {}, {directions: 4, anchorY: 32, frames: 2}),
            "enemiesNormal": spriteSheet('img/enemies.png', {
                "bug1": {},
                "bug2": {offsetX: 0*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "bug3": {offsetX: 0*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "bird1": {offsetX: 4*TILE_SIZE, offsetY: 0},
                "bird2": {offsetX: 4*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "bird3": {offsetX: 4*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "boar1": {offsetX: 8*TILE_SIZE, offsetY: 0},
                "boar2": {offsetX: 8*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "boar3": {offsetX: 8*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "mummy1": {offsetX: 12*TILE_SIZE, offsetY: 0},
                "mummy2": {offsetX: 12*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "mummy3": {offsetX: 12*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "kzussy1": {offsetX: 16*TILE_SIZE, offsetY: 0},
                "kzussy2": {offsetX: 16*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "kzussy3": {offsetX: 16*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "vampire1": {offsetX: 20*TILE_SIZE, offsetY: 0},
                "vampire2": {offsetX: 20*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "vampire3": {offsetX: 20*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "imp1": {offsetX: 24*TILE_SIZE, offsetY: 0},
                "imp2": {offsetX: 24*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "imp3": {offsetX: 24*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "knight1": {offsetX: 28*TILE_SIZE, offsetY: 0},
                "knight2": {offsetX: 28*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "knight3": {offsetX: 28*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "templar1": {offsetX: 46*TILE_SIZE, offsetY:  6*TILE_SIZE},
                "templar2": {offsetX: 46*TILE_SIZE, offsetY:  9*TILE_SIZE},
                "templar3": {offsetX: 46*TILE_SIZE, offsetY: 12*TILE_SIZE},
                "bombshell1": {offsetX: 32*TILE_SIZE, offsetY: 0},
                "bombshell2": {offsetX: 32*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "bombshell3": {offsetX: 32*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "bombshell1Hide": {offsetX: 36*TILE_SIZE, offsetY: 0},
                "bombshell2Hide": {offsetX: 36*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "bombshell3Hide": {offsetX: 36*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "bat1": {offsetX: 33*TILE_SIZE, offsetY: 6*TILE_SIZE, directions: 1},
                "bat2": {offsetX: 33*TILE_SIZE, offsetY: 8*TILE_SIZE, directions: 1},
                "bat3": {offsetX: 33*TILE_SIZE, offsetY:10*TILE_SIZE, directions: 1},
                "snake1": {offsetX: 40*TILE_SIZE, offsetY: 0},
                "snake2": {offsetX: 40*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "snake3": {offsetX: 40*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "ghost1": {offsetX: 44*TILE_SIZE, offsetY: 0, frames: 1},
                "ghost2": {offsetX: 44*TILE_SIZE, offsetY: 1*TILE_SIZE, frames: 1},
                "ghost3": {offsetX: 44*TILE_SIZE, offsetY: 2*TILE_SIZE, frames: 1},
                "eye1": {offsetX: 44*TILE_SIZE, offsetY: 3*TILE_SIZE, frames: 1},
                "eye2": {offsetX: 44*TILE_SIZE, offsetY: 4*TILE_SIZE, frames: 1},
                "eye3": {offsetX: 44*TILE_SIZE, offsetY: 5*TILE_SIZE, frames: 1},
                "skull1": {offsetX: 48*TILE_SIZE, offsetY: 0},
                "skull2": {offsetX: 48*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "skull3": {offsetX: 48*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "spine1": {offsetX: 52*TILE_SIZE, offsetY: 0},
                "spine2": {offsetX: 52*TILE_SIZE, offsetY: 2*TILE_SIZE},
                "spine3": {offsetX: 52*TILE_SIZE, offsetY: 4*TILE_SIZE},
                "antLionEyes": {offsetX: 32*TILE_SIZE, offsetY: 6*TILE_SIZE, width: 8, height: 8, directions: 1},
                "antLion1": {offsetX: 32*TILE_SIZE, offsetY: 7*TILE_SIZE, width: 8, height: 8, directions: 1},
                "antLion2": {offsetX: 32*TILE_SIZE, offsetY: 8*TILE_SIZE, width: 8, height: 8, directions: 1},
                "antLion3": {offsetX: 32*TILE_SIZE, offsetY: 9*TILE_SIZE, width: 8, height: 8, directions: 1},
            }, {directions: 4, frames: 2, anchorX: 128, anchorY: 0}),
            "enemiesLarge": spriteSheet('img/enemies.png', {
                "skull1" :     {offsetX: 0*2*TILE_SIZE, offsetY: 0*2*TILE_SIZE, frames: 8, frameDelay: 4, directions: 1, nudgeX: -2, nudgeY: -4},
                "skull1Open" : {offsetX: 1*2*TILE_SIZE, offsetY: 0*2*TILE_SIZE, frames: 8, frameDelay: 4, directions: 1, nudgeX: -2, nudgeY: -4},
                "skull2" :     {offsetX: 2*2*TILE_SIZE, offsetY: 0*2*TILE_SIZE, frames: 8, frameDelay: 4, directions: 1, nudgeX: -2, nudgeY: -4},
                "skull2Open" : {offsetX: 3*2*TILE_SIZE, offsetY: 0*2*TILE_SIZE, frames: 8, frameDelay: 4, directions: 1, nudgeX: -2, nudgeY: -4},
                "spider1": {offsetX: 4*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, frames: 4},
                "spider2": {offsetX: 8*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, frames: 4},
                "spider3": {offsetX: 12*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, frames: 4},
                "drake1" : {offsetX: 16*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, directions:1, nudgeX: -2, nudgeY: -2},
                "drake2" : {offsetX: 16*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, directions:1, nudgeX: -2, nudgeY: -2},
                "drake3" : {offsetX: 16*2*TILE_SIZE, offsetY: 7*2*TILE_SIZE, directions:1, nudgeX: -2, nudgeY: -2},
                "drakeFlap1" : {offsetX: 16*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, directions:1, frameDelay: 4, nudgeX: -2, nudgeY: -2},
                "drakeFlap2" : {offsetX: 16*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, directions:1, frameDelay: 4, nudgeX: -2, nudgeY: -2},
                "drakeFlap3" : {offsetX: 16*2*TILE_SIZE, offsetY: 7*2*TILE_SIZE, directions:1, frameDelay: 4, nudgeX: -2, nudgeY: -2},
                "demon1": {offsetX: 17*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, directions:1},
                "demon2": {offsetX: 18*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, directions:1},
                "demon3": {offsetX: 19*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, directions:1},
                "demonBreathe1": {offsetX: 17*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, directions:1, frames: 1},
                "demonBreathe2": {offsetX: 18*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, directions:1, frames: 1},
                "demonBreathe3": {offsetX: 19*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, directions:1, frames: 1},
                "demonBlack": {offsetX: 18*2*TILE_SIZE, offsetY: 6*2*TILE_SIZE, directions: 1, frames: 1},
                "blobFront1": {offsetX: 21*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, nudgeX: -4, directions:1},
                "blobBack1": {offsetX: 22*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, nudgeX: -4,  directions:1},
                "blobJump1": {offsetX: 23*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, nudgeX: -4, directions:1, frames: 1},
                "blobEmpty1": {offsetX: 23*2*TILE_SIZE, offsetY: 4*2*TILE_SIZE, nudgeX: -4, directions:1, frames: 1},
                "blobFront2": {offsetX: 21*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, nudgeX: -4, directions:1},
                "blobBack2": {offsetX: 22*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, nudgeX: -4, directions:1},
                "blobJump2": {offsetX: 23*2*TILE_SIZE, offsetY: 5*2*TILE_SIZE, nudgeX: -4, directions:1, frames: 1},
                "blobEmpty2": {offsetX: 23*2*TILE_SIZE, offsetY: 6*2*TILE_SIZE, nudgeX: -4, directions:1, frames: 1},
                "blobFront3": {offsetX: 21*2*TILE_SIZE, offsetY: 7*2*TILE_SIZE, nudgeX: -4, directions:1},
                "blobBack3": {offsetX: 22*2*TILE_SIZE, offsetY: 7*2*TILE_SIZE, nudgeX: -4, directions:1},
                "blobJump3": {offsetX: 23*2*TILE_SIZE, offsetY: 7*2*TILE_SIZE, nudgeX: -4, directions:1, frames: 1},
                "blobEmpty3": {offsetX: 23*2*TILE_SIZE, offsetY: 8*2*TILE_SIZE, nudgeX: -4, directions:1, frames: 1},
                "scorpion1": {offsetX: 24*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, nudgeX: -2, nudgeY: -2, directions:1, frames: 4},
                "scorpion2": {offsetX: 25*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, nudgeX: -2, nudgeY: -2, directions:1, frames: 4},
                "scorpion3": {offsetX: 26*2*TILE_SIZE, offsetY: 3*2*TILE_SIZE, nudgeX: -2, nudgeY: -2, directions:1, frames: 4},
                "scorpionClawLeft1": {offsetX: 48*TILE_SIZE, offsetY: 14*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionClawRight1": {offsetX: 49*TILE_SIZE, offsetY: 14*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionSegment1": {offsetX: 48*TILE_SIZE, offsetY: 15*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionTip1": {offsetX: 49*TILE_SIZE, offsetY: 15*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1, nudgeX: -1, nudgeY: -4},
                "scorpionClawLeft2": {offsetX: 50*TILE_SIZE, offsetY: 14*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionClawRight2": {offsetX: 51*TILE_SIZE, offsetY: 14*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionSegment2": {offsetX: 50*TILE_SIZE, offsetY: 15*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionTip2": {offsetX: 51*TILE_SIZE, offsetY: 15*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1, nudgeX: -1, nudgeY: -4},
                "scorpionClawLeft3": {offsetX: 52*TILE_SIZE, offsetY: 14*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionClawRight3": {offsetX: 53*TILE_SIZE, offsetY: 14*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionSegment3": {offsetX: 52*TILE_SIZE, offsetY: 15*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1},
                "scorpionTip3": {offsetX: 53*TILE_SIZE, offsetY: 15*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1, nudgeX: -1, nudgeY: -4},
                "scorpionTipAcid": {offsetX: 48*TILE_SIZE, offsetY: 16*TILE_SIZE, width: 16, height: 16, directions: 1, frames: 1, nudgeX: -1, nudgeY: -4},
            }, {width: 32, height: 32, directions: 4, frames: 2, anchorX: 0, anchorY: 0}),
            "snake_test": spriteSheet('img/snake_temp.png', {
                'head': {"offsetX": 0*TILE_SIZE, "offsetY": 0*TILE_SIZE},
                'body': {"offsetX": 0*TILE_SIZE, "offsetY": 1*TILE_SIZE},
                'tail': {"offsetX": 0*TILE_SIZE, "offsetY": 2*TILE_SIZE}
            }, {directions: 4}),
            /*
			"bat1": {url: resourcePath + 'graphics/enemies.png', x:192, y:0, animate:2},
			"bat2": {url: resourcePath + 'graphics/enemies.png', x:208, y:0, animate:2},
			"bat3": {url: resourcePath + 'graphics/enemies.png', x:224, y:0, animate:2},
			*/
			// I.f - Items
			// I.f.1 - Droppable Items
            items: spriteSheet('img/items.png', {
				"cherry":       {},
				"plum":         {"offsetX": 1*8, "offsetY": 0*8},
				"bottle":       {"offsetX": 2*8, "offsetY": 0*8},
				"shield":       {"offsetX": 3*8, "offsetY": 0*8, frames: 2},
				"coin_silver":  {"offsetX": 0*8, "offsetY": 1*8, frames: 4},
				"coin_gold":    {"offsetX": 1*8, "offsetY": 1*8, frames: 4},
				"coin_diamond": {"offsetX": 2*8, "offsetY": 1*8, frames: 4},
				"bombLit":      {"offsetX": 3*8, "offsetY": 2*8, frames: 2}
            }, {width: 8, height: 8, frameDelay: 4}),
			// Projectiles and Effects
            "sword": spriteSheet('img/melee_test.png', undefined, {directions: 4, frames: 6, frameDelay: 1}),
            "swordGold": spriteSheet('img/sword_gold.png', undefined, {directions: 4, frames: 6, frameDelay: 1}),
            "explosion": spriteSheet('img/explosion.png', undefined, {frames: 5, frameDelay: 2, width: 24, height:24}),
			smallProjectiles: spriteSheet('img/projectiles.png', {
                "fist": {},
                "fireball": {offsetX:32, offsetY:0, directions: 4, frames:2},
                "fireballEnemy": {offsetX:32, offsetY:16, directions: 4, frames:2},
                "silk": {offsetX:32, offsetY:32, directions: 4, frames:2},
                "spearTip": {offsetX: 0, offsetY:8, directions: 4},
                "shuriken": {offsetX: 64, offsetY: 0, directions: 1, width: 7, frames: 3, frameDelay: 1},
                "blueDot": {offsetX: 177, offsetY: 0, frames: 4, directions: null, width: 5, height: 5}
            }, {directions: 4, width: 8, height: 8}),
            projectiles: spriteSheet('img/projectiles.png', {
                "fireball": {offsetX:104, offsetY:0, directions: 4, frames: 2},
                "arrow": {offsetX:0, offsetY:80, directions: 4},
                "arrowEnemy": {offsetX:0, offsetY:96, directions: 4},
                "arrowBomb": {offsetX:0, offsetY:112, directions: 4},
                "magicSword": {offsetX:64, offsetY:48, directions: 4, frames: 4},
                "note": {offsetX:128, offsetY:48, frames: 4, width: 12, height: 13},
                "pirateTalk": {offsetX: 140, offsetY: 48},
                "axe": {offsetX: 64, offsetY: 32, directions: 8},
                "bone": {offsetX: 0, offsetY: 16, directions: null, frames: 4, width: 10, height: 10},
                "web": {offsetX: 71, offsetY: 0, directions: null, width: 32, height: 32},
                "fire1": {offsetX: 16, offsetY: 48, directions: null, frames: 2},
                "fire2": {offsetX: 32, offsetY: 48, directions: null, frames: 2},
                "fire3": {offsetX: 48, offsetY: 48, directions: null, frames: 2},
                "potionHeal": {offsetX:64, offsetY: 112, directions: null, frames: 4},
                "potionFire": {offsetX:80, offsetY: 112, directions: null, frames: 1},
                "potionAura": {offsetX:80, offsetY: 144, directions: null, frames: 1},
                "barrierSmall": {offsetX: 80, offsetY: 160, directions: null},
                "flail": {offsetX:128, offsetY: 100, directions: null, width: 11, height: 11},
                "chain": {offsetX:172, offsetY: 20, directions: null, width: 5, height: 5},
                "barrierFull": {offsetX: 96, offsetY: 112, directions: null, width: 24, height: 24},
                "barrierHalf": {offsetX: 96, offsetY: 136, directions: null, width: 24, height: 24},
                'airPuff': {offsetY: 64},
                'tree': {offsetX: 139, offsetY: 64}
            }, {width: 16, height: 16, frameDelay: 4}),
            /*
			"arrow": {url: resourcePath + 'graphics/projectiles.png', width: 16, height: 16, x:0, y:5*16, dirs: 4},
			"sword": {url: resourcePath + 'graphics/projectiles.png', width: 16, height: 16, x:0, y:32, dirs: 4, states: {
				"1": {}, "2": {y:1}, "3": {y:2},
			}},
			"lance": {url: resourcePath + 'graphics/projectiles.png', width: 16, height: 16, x:0, y:96, dirs: 4, states: {
				"1": {}, "2": {y:1}, "3": {y:2},
			}},
			"axe": {url: resourcePath + 'graphics/projectiles.png', width: 16, height: 16, x:64, y:32, dirs: 8},
			"shuriken": {url: resourcePath + 'graphics/projectiles.png', width: 8, height: 8, x:64, y:0, animate:3},
			"web": {url: resourcePath + 'graphics/projectiles.png', width: 32, height: 32, x:72, y:0},
			"magic1": {url: resourcePath + 'graphics/projectiles.png', width: 4, height: 4, x: 168, y: 0, animate:4},
			"magic2": {url: resourcePath + 'graphics/projectiles.png', width: 5, height: 5, x: 172, y: 0, animate:4},*/
            "deathPuff": graphic('img/projectiles.png', 24, 24, 320, 0, {frames: 4, frameDelay: 2}),
            "score25": graphic('img/projectiles.png', 16, 9, 156, 48, {frames: 2, frameDelay: 2}),
            "score100": graphic('img/projectiles.png', 16, 9, 172, 48, {frames: 2, frameDelay: 2}),
			"healthSparkles": graphic('img/projectiles.png', 32, 32, 192, 0, {frames: 4, frameDelay: 2}),
			"auraSparkles": graphic('img/projectiles.png', 32, 32, 224, 0, {frames: 4, frameDelay: 2}),
			"holySparkles": graphic('img/projectiles.png', 32, 32, 256, 0, {frames: 4, frameDelay: 2}),
			"quicksand": graphic('img/projectiles.png', 32, 32, 288, 0, {frames: 3, frameDelay: 5, nudgeX: -2, nudgeY: -2}),
			"acid": graphic('img/projectiles.png', 32, 32, 288, 96, {nudgeX: -2, nudgeY: -2}),
			//"blue_sparkles": {url: resourcePath + 'graphics/projectiles.png', width: 32, height: 32, x: 224, animate: 4, frame_rate: 24}
		},
		event: {
            'empty': event({}),
            'animate': event({
                setup: function (){
                    var options = this.options;
                    var graphicResource = client.resourceLibrary.resource('graphic', options.graphic);
                    if(graphicResource && options.graphicState){
                        graphicResource = graphicResource.states[options.graphicState];
                    }
                    if(!graphicResource){
                        this.finish();
                        return;
                    }
                    this.frames = graphicResource.frames || 1;
                    this.frameDelay = graphicResource.frameDelay || ANIMATION_FRAME_DELAY;
                    var repeat = options.repeat || 1;
                    this.width = graphicResource.width;
                    this.height = graphicResource.height;
                    this.timeLimit = options.timeLimit || this.frames * this.frameDelay * repeat;
                },
                draw: function (){
                    var fullX;
                    var fullY;
                    if(this.options.attachId){
                        var center = this.center(this.options.attachId, this.options.offsetDirection);
                        if(!center){ this.finish(); return;}
                        fullX = center.x;
                        fullY = center.y;
                    } else{
                        fullX = this.options.x;
                        fullY = this.options.y;
                    }
                    var drawOptions = {
                        frame: Math.floor(this.time/this.frameDelay)%this.frames,
                        center: this.options.center
                    };
                    if(this.options.offsetDirection){
                        drawOptions.direction = this.options.offsetDirection;
                    }
                    client.skin.drawGraphic(
                        this.options.graphic, this.options.graphicState,
                        fullX, fullY,
                        drawOptions
                    );
                }
            }),
            'flick': event({
                setup: function (){
                    var options = this.options;
                    var owner = client.gameplay.memory.getContainable(options.attachId);
                    if(!owner){
                        this.finish();
                        return;
                    }
                    owner.flickState = options.graphicState;
                    owner.flickTime = 0;
                    this.finish();
                },
            }),
            'test': event({
                setup: function (){
                    var options = this.options;
                    this.time = 16;
                    this.x = options.x;
                    this.y = options.y;
                },
                iterate: function (){
                    this.time--;
                    if(this.time <= 0){
                        this.finish();
                    }
                },
                draw: function (){
                    var fullX = this.x;
                    var fullY = this.y;
                    client.skin.drawCircle(fullX, fullY, this.time);
                }
            }),
            'smokey': event({
                setup: function (){
                    var options = this.options;
                    this.time = 16;
                    this.attachId = options.attachId;
                },
                iterate: function (){
                    this.time--;
                    if(this.time <= 0){
                        this.time = 16;
                    }
                },
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(this.attachId);
                    if(!attachment){
                        this.finish();
                        return;
                    }
                    var fullX = attachment.x + Math.floor(attachment.width /2);
                    var fullY = attachment.y + Math.floor(attachment.height/2);
                    client.skin.drawCircle(fullX, fullY, this.time);
                }
            }),
            healAOE: event({
                timeLimit: 10,
                setup: function (){
                    var options = this.options;
                    this.radius = this.options.radius;
                    if(options.attachId){
                        var attachment = client.gameplay.memory.getContainable(options.attachId);
                        if(attachment){
                            this.fullX = attachment.x + Math.floor(attachment.width /2);
                            this.fullY = attachment.y + Math.floor(attachment.height/2);
                        }
                    } else if(options.x !== undefined){
                        this.fullX = options.x;
                        this.fullY = options.y;
                    }
                },
                draw: function (){
                    if(this.finished){ console.log('problem');}
                    var options = this.options;
                    if(this.fullX === undefined){
                        this.finish();
                        return;
                    }
                    //
                    var radius = Math.floor(this.radius * Math.sin((this.time/this.timeLimit)*(Math.PI*2)/4));
                    //
                    client.skin.drawCircle(this.fullX, this.fullY, this.radius, null, null, 'rgba(0,0,0,0.125)');
                    client.skin.drawCircle(this.fullX, this.fullY,      radius, null, null, 'rgba(0,255,0,0.25)');
                }
            }),
            auraAOE: event({
                timeLimit: 10,
                setup: function (){
                    var options = this.options;
                    this.radius = this.options.radius;
                    if(options.attachId){
                        var attachment = client.gameplay.memory.getContainable(options.attachId);
                        if(attachment){
                            this.fullX = attachment.x + Math.floor(attachment.width /2);
                            this.fullY = attachment.y + Math.floor(attachment.height/2);
                        }
                    } else if(options.x !== undefined){
                        this.fullX = options.x;
                        this.fullY = options.y;
                    }
                },
                draw: function (){
                    if(this.finished){ console.log('problem');}
                    var options = this.options;
                    if(this.fullX === undefined){
                        this.finish();
                        return;
                    }
                    //
                    var radius = Math.floor(this.radius * Math.sin((this.time/this.timeLimit)*(Math.PI*2)/4));
                    //
                    client.skin.drawCircle(this.fullX, this.fullY, this.radius, null, null, 'rgba(0,0,0,0.125)');
                    client.skin.drawCircle(this.fullX, this.fullY,      radius, null, null, 'rgba(0,255,255,0.25)');
                }
            }),
            repelAOE: event({
                timeLimit: 10,
                setup: function (){
                    var options = this.options;
                    this.radius = this.options.radius;
                    this.attachId = options.attachId;
                },
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(this.attachId);
                    if(!attachment){ this.finish(); return;}
                    var fullX = attachment.x + Math.floor(attachment.width /2);
                    var fullY = attachment.y + Math.floor(attachment.height/2);
                    var radius = Math.floor(this.radius * Math.sin((this.time/this.timeLimit)*(Math.PI*2)/4));
                    client.skin.drawCircle(fullX, fullY, this.radius, null, null, 'rgba(0,0,0,0.125)');
                    client.skin.drawCircle(fullX, fullY,      radius, null, null, 'rgba(255,255,0,0.25)');
                }
            }),
            reviveAOE: event({
                timeLimit: 10,
                setup: function (){
                    var options = this.options;
                    this.radius = this.options.radius;
                    this.attachId = options.attachId;
                },
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(this.attachId);
                    if(!attachment){ this.finish(); return;}
                    var fullX = attachment.x + Math.floor(attachment.width /2);
                    var fullY = attachment.y + Math.floor(attachment.height/2);
                    var radius = Math.floor(this.radius * Math.sin((this.time/this.timeLimit)*(Math.PI*2)/4));
                    client.skin.drawCircle(fullX, fullY, this.radius, null, null, 'rgba(0,0,0,0.125)');
                    client.skin.drawCircle(fullX, fullY,      radius, null, null, 'rgba(255,255,255,0.25)');
                }
            }),
            score: event({
                timeLimit: 16,
                draw: function (){
                    var options = this.options;
                    var center = this.center(options.x, options.y);
                    if(options.score === 25){
                        client.skin.drawGraphic(
                            'score25', null, options.x, options.y+this.time, {center: true}
                        );
                    } else if(options.score === 100){
                        client.skin.drawGraphic(
                            'score100', null, options.x, options.y+this.time, {center: true}
                        );
                    }
                }
            }),
            smallExplosion: event({
                timeLimit: 10,
                setup: function (){
                    var options = this.options;
                    this.radius = this.options.radius;
                    this.attachId = options.attachId;
                },
                draw: function (){
                    var options = this.options;
                    var fullX = options.x;
                    var fullY = options.y;
                    var radius = Math.floor(this.radius * Math.sin(((this.time)/this.timeLimit)*(Math.PI*2)/4));
                    var P = Math.max(0, (this.time-4)/(this.timeLimit-5));
                    var innerRadius = Math.floor(this.radius * Math.sin(P*(Math.PI*2)/4));
                    client.skin.drawCircle(fullX, fullY,      radius, innerRadius, null, 'rgba(255,0,0,0.25)');
                    //
                    var graphicResource = client.resource('graphic', 'explosion');
                    var maxFrames = graphicResource.frames;
                    var drawOptions = {
                        frame: Math.floor(this.time/graphicResource.frameDelay)%graphicResource.frames,
                        center: true
                    };
                    client.skin.drawGraphic(
                        'explosion', null,
                        fullX, fullY,
                        drawOptions
                    );
                }
            }),
            largeExplosion: event({
                timeLimit: 20,
                setup: function (){
                    var options = this.options;
                    this.radius = this.options.radius;
                    this.attachId = options.attachId;
                    var angle = Math.PI*2/3 * Math.random();
                    this.sprite1 = {
                        delay: randomInterval(1,8),
                        radius: this.options.radius*(0.5 + (Math.random()-1/2)/5),
                        angle: angle+ Math.PI*2/3 + (Math.random()-1/2)*2*Math.PI/9
                    };
                    this.sprite2 = {
                        delay: randomInterval(1,8),
                        radius: this.options.radius*(0.5 + (Math.random()-1/2)/5),
                        angle: angle+ Math.PI*4/3 + (Math.random()-1/2)*2*Math.PI/9
                    };
                    this.sprite3 = {
                        delay: randomInterval(1,8),
                        radius: this.options.radius*(0.5 + (Math.random()-1/2)/5),
                        angle: angle+ Math.PI*6/3 + (Math.random()-1/2)*2*Math.PI/9
                    };
                    var attachment = client.gameplay.memory.getContainable(this.attachId);
                    if(!attachment){ this.finish(); return;}
                    this.fullX = attachment.x + Math.floor(attachment.width /2);
                    this.fullY = attachment.y + Math.floor(attachment.height/2);
                },
                draw: function (){
                    var timeLimit = 10
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(this.attachId);
                    if(!attachment){ this.finish(); return;}
                    var fullX = this.fullX;//attachment.x + Math.floor(attachment.width /2);
                    var fullY = this.fullY;//attachment.y + Math.floor(attachment.height/2);
                    var radius = Math.floor(this.radius * Math.sin(((this.time)/timeLimit)*(Math.PI*2)/4));
                    var P = Math.max(0, (this.time-4)/(timeLimit-5));
                    var innerRadius = Math.floor(this.radius * Math.sin(P*(Math.PI*2)/4));
                    //client.skin.drawCircle(fullX, fullY, this.radius, innerRadius, null, 'rgba(0,0,0,0.125)');
                    if(P <= 1){
                        client.skin.drawCircle(fullX, fullY,      radius, innerRadius, null, 'rgba(255,0,0,0.25)');
                    }
                    //
                    var gR/*graphicResource*/ = client.resource('graphic', 'explosion');
                    var drawOptions = {
                        frame: Math.floor(this.time/gR.frameDelay),
                        center: true
                    };
                    if(drawOptions.frame < gR.frames){
                        client.skin.drawGraphic(
                            'explosion', null,
                            fullX, fullY,
                            drawOptions
                        );
                    }
                    drawOptions.frame = Math.floor((this.time-this.sprite1.delay)/gR.frameDelay);
                    if(drawOptions.frame < gR.frames){
                        client.skin.drawGraphic(
                            'explosion', null,
                            fullX+this.sprite1.radius*Math.cos(this.sprite1.angle), fullY+this.sprite1.radius*Math.sin(this.sprite1.angle),
                            drawOptions
                        );
                    }
                    drawOptions.frame = Math.floor((this.time-this.sprite2.delay)/gR.frameDelay);
                    if(drawOptions.frame < gR.frames){
                        client.skin.drawGraphic(
                            'explosion', null,
                            fullX+this.sprite2.radius*Math.cos(this.sprite2.angle), fullY+this.sprite2.radius*Math.sin(this.sprite2.angle),
                            drawOptions
                        );
                    }
                    drawOptions.frame = Math.floor((this.time-this.sprite3.delay)/gR.frameDelay);
                    if(drawOptions.frame < gR.frames){
                        client.skin.drawGraphic(
                            'explosion', null,
                            fullX+this.sprite3.radius*Math.cos(this.sprite3.angle), fullY+this.sprite3.radius*Math.sin(this.sprite3.angle),
                            drawOptions
                        );
                    }
                }
            }),
            wind: event({
                timeLimit: 10,
                draw: function (){
                    var options = this.options;
                    var fullX = options.x;
                    var fullY = options.y;
                    var radius = Math.floor(options.radius * Math.sin(((this.time)/this.timeLimit)*(Math.PI*2)/4));
                    var P = Math.max(0, (this.time-4)/(this.timeLimit-5));
                    client.skin.drawCircle(fullX, fullY, radius, null, null, 'rgba(255,255,255,'+(1-P)/2+')');
                }
            }),
            shields: event({
                timeLimit: 16,
                width: 8,
                height: 8,
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(options.attachId);
                    if(!attachment){ this.finish(); return;}
                    var center = this.center(options.attachId);
                    if(!center){ this.finish(); return;}
                    var fullX = center.x;
                    var fullY = center.y;
                    var P = this.time/this.timeLimit;
                    var radius = TILE_SIZE * (1-P);
                    var angle = P*(Math.PI*1.3);
                    client.skin.drawGraphic(
                        'items', 'shield',
                        fullX+Math.cos(angle)*radius, fullY+Math.sin(angle)*radius
                    ); angle += Math.PI*2/3;
                    client.skin.drawGraphic(
                        'items', 'shield',
                        fullX+Math.cos(angle)*radius, fullY+Math.sin(angle)*radius
                    ); angle += Math.PI*2/3;
                    client.skin.drawGraphic(
                        'items', 'shield',
                        fullX+Math.cos(angle)*radius, fullY+Math.sin(angle)*radius
                    );
                }
            }),
            berryAOE: event({
                timeLimit: 16,
                width: 8,
                height: 8,
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(options.attachId);
                    if(!attachment){ this.finish(); return;}
                    var center = this.center(options.attachId);
                    if(!center){ this.finish(); return;}
                    var fullX = center.x;
                    var fullY = center.y;
                    console.log(center.x, center.y)
                    var P = this.time/this.timeLimit;
                    var radius = options.radius * (P);
                    var angle = P*(Math.PI*0.75);
                    var shieldNumber = 12;
                    for(var shieldIndex = 0; shieldIndex < shieldNumber; shieldIndex++){
                        var shieldRadius = radius*(shieldIndex%2 ? 1 : 0.3);
                        client.skin.drawGraphic(
                            'items', 'berry',
                            fullX+Math.cos(angle)*shieldRadius, fullY+Math.sin(angle)*shieldRadius
                        );
                        angle += Math.PI*2/shieldNumber;
                    }
                }
            }),
            shieldsAOE: event({
                timeLimit: 16,
                width: 8,
                height: 8,
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(options.attachId);
                    if(!attachment){ this.finish(); return;}
                    var center = this.center(options.attachId);
                    if(!center){ this.finish(); return;}
                    var fullX = center.x;
                    var fullY = center.y;
                    console.log(center.x, center.y)
                    var P = this.time/this.timeLimit;
                    var radius = options.radius * (P);
                    var angle = P*(Math.PI*0.75);
                    var shieldNumber = 7;
                    for(var shieldIndex = 0; shieldIndex < shieldNumber; shieldIndex++){
                        client.skin.drawGraphic(
                            'items', 'shield',
                            fullX+Math.cos(angle)*radius, fullY+Math.sin(angle)*radius
                        );
                        angle += Math.PI*2/shieldNumber;
                    }
                }
            }),
            barrierAOE: event({
                timeLimit: 16,
                width: 16,
                height: 16,
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(options.attachId);
                    if(!attachment){ this.finish(); return;}
                    var center = this.center(options.attachId);
                    if(!center){ this.finish(); return;}
                    var fullX = center.x;
                    var fullY = center.y;
                    console.log(center.x, center.y)
                    var P = this.time/this.timeLimit;
                    var radius = options.radius - this.width;
                    var angle = P*(Math.PI*1);
                    var shieldNumber = 3;
                    for(var shieldIndex = 0; shieldIndex < shieldNumber; shieldIndex++){
                        client.skin.drawGraphic(
                            'projectiles', 'barrierSmall',
                            fullX+Math.cos(angle)*radius, fullY+Math.sin(angle)*radius
                        );
                        angle += Math.PI*2/shieldNumber;
                    }
                }
            }),
            pirateTalk: event({
                timeLimit: 16,
                width: 16,
                height: 16,
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(options.attachId);
                    if(!attachment){ this.finish(); return;}
                    var center = this.center(options.attachId);
                    if(!center){ this.finish(); return;}
                    var fullX = center.x;
                    var fullY = center.y+attachment.height;
                    client.skin.drawGraphic(
                        'projectiles', 'pirateTalk',
                        fullX, fullY
                    );
                }
            }),
            lance: event({
                timeLimit: 6,
                draw: function (){
                    this.width = 8;
                    this.height = 8;
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(options.attachId);
                    if(!attachment){ this.finish(); return;}
                    var length;
                    var offsetX = 0;
                    var offsetY = 0;
                    switch(this.time){
                        case 0: case 5: length = 11; break;
                        case 1: case 4: length = 22; break;
                        case 2: case 3: length = 32; break;
                    }
                    switch(options.offsetDirection){
                        case NORTH: offsetY += length-8;
                        case SOUTH: this.height = length; break;
                        case EAST : offsetX += length-8;
                        case WEST : this.width  = length; break;
                    }
                    var center = this.center(options.attachId, options.offsetDirection);
                    if(!center){ this.finish(); return;}
                    switch(options.offsetDirection){
                        case NORTH: case SOUTH: this.width  = 2; break;
                        case EAST : case WEST : this.height = 2; break;
                    }
                    var shaftCenter = this.center(options.attachId, options.offsetDirection); 
                    if(!shaftCenter){ this.finish(); return;}
                    client.skin.fillRect(shaftCenter.x, shaftCenter.y, this.width, this.height, '#fff');
                    client.skin.drawGraphic(
                        'smallProjectiles', 'spearTip',
                        center.x+offsetX, center.y+offsetY,
                        {direction: options.offsetDirection}
                    );
                }
            }),
            axe: event({
                timeLimit: 6,
                width: 16,
                height: 16,
                draw: function (){
                    var options = this.options;
                    var attachment = client.gameplay.memory.getContainable(options.attachId);
                    if(!attachment){ this.finish(); return;}
                    var offsetX = 0;
                    var offsetY = 0;
                    var position = 0;
                    switch(attachment.direction){
                        case EAST : position = 7; break;
                        case NORTH: position = 1; break;
                        case WEST : position = 3; break;
                        case SOUTH: position = 5; break;
                    }
                    position += Math.floor(this.time/2);
                    var wP = attachment.width  - (attachment.width -this.width )/2;
                    var hP = attachment.height - (attachment.height-this.height)/2;
                    var drawDirection;
                    var C = 4;
                    switch(position%8){
                        case 0: offsetX += wP  ;                  drawDirection = EAST     ; break;
                        case 1: offsetX += wP-C; offsetY += hP-C; drawDirection = NORTHEAST; break;
                        case 2:                  offsetY += hP  ; drawDirection = NORTH    ; break;
                        case 3: offsetX -= wP-C; offsetY += hP-C; drawDirection = NORTHWEST; break;
                        case 4: offsetX -= wP  ;                  drawDirection = WEST     ; break;
                        case 5: offsetX -= wP-C; offsetY -= hP-C; drawDirection = SOUTHWEST; break;
                        case 6:                  offsetY -= hP  ; drawDirection = SOUTH    ; break;
                        case 7: offsetX += wP-C; offsetY -= hP-C; drawDirection = SOUTHEAST; break;
                    }
                    var center = this.center(options.attachId);
                    if(!center){ this.finish(); return;}
                    client.skin.drawGraphic(
                        'projectiles', 'axe',
                        center.x+offsetX, center.y+offsetY,
                        {direction: drawDirection}
                    );
                }
            }),
            illusionTransfer: event({
                timeLimit: 20,
                draw: function (){
                    var deltaX = this.options.endX - this.options.x;
                    var deltaY = this.options.endY - this.options.y;
                    var P = this.time/this.timeLimit;
                    var angle = Math.PI * P;
                    var radius = 6;
                    for(var angleIndex = 0; angleIndex < 3; angleIndex++){
                        client.skin.drawGraphic(
                            'smallProjectiles', 'blueDot',
                            this.options.x+deltaX*P + Math.cos(angle+Math.PI*(2/3)*angleIndex)*radius,
                            this.options.y+deltaY*P + Math.sin(angle+Math.PI*(2/3)*angleIndex)*radius
                        );
                    }
                    //console.log(deltaX, deltaY, P, angle)
                }
            }),
            chain: event({
                setup: function (){
                    var options = this.options;
                    this.end1Id = options.end1Id;
                    this.end2Id = options.end2Id;
                },
                draw: function (){
                    var end1 = client.gameplay.memory.getContainable(this.end1Id);
                    var end2 = client.gameplay.memory.getContainable(this.end2Id);
                    if(!(end1 && end2)){
                        this.finish();
                        return;
                    }
                    var deltaX = (end2.x+end2.width /2) - (end1.x+end1.width /2);
                    var deltaY = (end2.y+end2.height/2) - (end1.y+end1.height/2);
                    var centerX = end1.x+end1.width/2 - 2;
                    var centerY = end1.y+end1.height/2 - 3;
                    client.skin.drawGraphic(
                        'projectiles', 'chain',
                        Math.round(centerX + deltaX*(1/4)), Math.round(centerY + deltaY*(1/4))
                    );
                    client.skin.drawGraphic(
                        'projectiles', 'chain',
                        Math.round(centerX + deltaX*(2/4)), Math.round(centerY + deltaY*(2/4))
                    );
                    client.skin.drawGraphic(
                        'projectiles', 'chain',
                        Math.round(centerX + deltaX*(3/4)), Math.round(centerY + deltaY*(3/4))
                    );
                }
            }),
            dialogue: event({
                
            })
            /*
			"heal_sparkles": {
				finished: false,
				sprites: undefined,
				setup: function (data){
					this.x = data.x;
					this.y = data.y;
					this.time = 0;
					this.sprites = Object.create(DM.list);
					this.sprites.add({x: this.x, y: this.y, graphic: 'green_sparkles', width: 0, height: 0});
					this.sprites.add({x: this.x, y: this.y, graphic: 'green_sparkles', width: 0, height: 0});
					this.sprites.add({x: this.x, y: this.y, graphic: 'green_sparkles', width: 0, height: 0});
					this.sprites.add({x: this.x, y: this.y, graphic: 'green_sparkles', width: 0, height: 0});
				},
				iterate: function (){
					this.time++;
					var expand_rate = 3;
					this.sprites[0].x = this.x+this.time*expand_rate;
					this.sprites[0].y = this.y+this.time*expand_rate;
					this.sprites[1].x = this.x+this.time*expand_rate;
					this.sprites[1].y = this.y-this.time*expand_rate;
					this.sprites[2].x = this.x-this.time*expand_rate;
					this.sprites[2].y = this.y-this.time*expand_rate;
					this.sprites[3].x = this.x-this.time*expand_rate;
					this.sprites[3].y = this.y+this.time*expand_rate;
					if(this.time > 5){ this.finished = true}
				}
			},
			"heal_sparkle": {
				finished: false,
				sprites: undefined,
				setup: function (data){
					this.x = data.x;
					this.y = data.y;
					this.time = 0;
					this.sprites = Object.create(DM.list);
					this.sprites.add({x: this.x, y: this.y, graphic: 'green_sparkles', width: 0, height: 0});
				},
				iterate: function (){
					this.time++;
					if(this.time > 5){ this.finished = true}
				}
			},
			"aura_sparkle": {
				finished: false,
				sprites: undefined,
				setup: function (data){
					this.x = data.x;
					this.y = data.y;
					this.time = 0;
					this.sprites = Object.create(DM.list);
					this.sprites.add({x: this.x, y: this.y, graphic: 'blue_sparkles', width: 0, height: 0});
				},
				iterate: function (){
					this.time++;
					if(this.time > 5){ this.finished = true}
				}
			}*/
		},
        theme: {
            plains: {
                tileGraphic: 'plains',
                song: undefined
            },
            castle: {
                tileGraphic: 'castle',
                song: undefined
            },
            wastes: {
                tileGraphic: 'wastes',
                song: undefined
            },
            desert: {
                tileGraphic: 'desert',
                song: undefined
            },
            ruins: {
                tileGraphic: 'ruins',
                song: undefined
            },
            inferno: {
                tileGraphic: 'inferno',
                song: undefined
            }
        }
    },
	setup: function (callback){
		this.setupGraphics(callback);
	},
	setupGraphics: function (callback){
        var loadCaller = function (loopResource){
            return function (){
                var rIndex = client.resourceLibrary.resourceLoadingIds.indexOf(loopResource.url);
                client.resourceLibrary.resourceLoadingIds.splice(rIndex,1);
                if(client.resourceLibrary.resourceLoadReady){
                    if(!client.resourceLibrary.resourceLoadingIds.length){
                        callback();
                    }
                }
            }
        };
		for(var key in this.library.graphic){
			var resource = this.library.graphic[key];
			if(!(resource.url in this.images)){
				var newImage = new Image();
				this.resourceLoadingIds.push(resource.url);
				newImage.addEventListener("load", loadCaller(resource), false)
				newImage.src = resourcePath+'/'+resource.url;
				this.images[resource.url] = newImage;
			}
			resource.image = this.images[resource.url];
		}
		this.resourceLoadReady = true;
		if(!this.resourceLoadingIds.length){
			callback();
		}
	}
}
//== CLOSE NAMESPACE =========================================================//
})();