'use strict';

const env = require('./env.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const region = module.exports = {
    id: undefined,
    width: undefined,
    height: undefined,
    theme: undefined,
    tileTypes: undefined,
    tileGrid: undefined,
    //tileContentsGrid: undefined,
    movables: undefined,
    sequences: undefined,
    //revealGrid: undefined,
    waveNumber: undefined,
    _new(options){
        // TODO: Document.
        if(!options){ options = {};}
        this.tileTypes = tile.genericTileTypes();
        this.id = options.id;
        this.width = options.width || 32;
        this.height = options.height || 32;
        this.waveNumber = options.waveNumber || 1;
        this.theme = options.theme || modelLibrary.getModel('theme', 'plains');
        this.tileGrid = [];
        //this.tileContentsGrid = options.tileContents || [];
        this.movables = [];
        this.sequences = [];
        if(options.tiles){
            for(let ci = 0; ci < options.tiles.length; ci++){
                let indexedChar = options.tiles.charAt(ci);
                this.tileGrid.push(this.tileTypes[indexedChar]);
            }
        } else{
            for(let ci = 0; ci < this.width*this.height; ci++){
                this.tileGrid.push(this.tileTypes['.']);
            }
        }
        return this;
    },
    dispose(){
        let disposeOrder = (oldContent) => {
            oldContent.dispose();
        };
        this.movables.forEach((theMovable) => {
            disposeOrder(theMovable);
        });
        this.sequences.forEach((theSequence) => {
            disposeOrder(theSequence);
        });
        this.tileTypes = undefined;
        this.tileGrid = undefined;
        //this.tileContentsGrid = undefined;
        this.movables = undefined;
        this.sequences = undefined;
        mapManager.cancelRegion(this.id);
        this.id = null;
    },
    iterate: (() => {
        const turnTaker = function (theMovable){
            theMovable.iterate();
        };
        const sequenceIterator = function (theSequence){
            if(theSequence.finished){
                env.arrayRemove(this.sequences, theSequence);
                return;
            }
            theSequence.iterate();
        };
        return function iterate(){
            let activeFactions = 0;
            for(let movableIndex = 0; movableIndex < this.movables.length; movableIndex++){
                let indexedMovable = this.movables[movableIndex];
                if(indexedMovable){ activeFactions |= indexedMovable.faction;}
            }
            this.movables.forEach(turnTaker, this);
            this.sequences.forEach(sequenceIterator, this);
            let checkMovables = this.movables.slice();
            for(let movableIndex = 0; movableIndex < checkMovables.length; movableIndex++){
                let movable1 = checkMovables[movableIndex];
                if(!movable1){ continue;}
                let m1x = movable1.x;
                let m1y = movable1.y;
                for(let index2 = movableIndex+1; index2 < checkMovables.length; index2++){
                    let movable2 = checkMovables[index2];
                    if(movable1.faction & movable2.faction){ continue;}
                    if(movable1.z >= env.FLY_HEIGHT || movable2.z >= env.FLY_HEIGHT){ continue;}
                    let m2x = movable2.x;
                    let m2y = movable2.y;
                    if(
                        Math.max(m1x, m2x) < Math.min(m1x+movable1.width , m2x+movable2.width ) &&
                        Math.max(m1y, m2y) < Math.min(m1y+movable1.height, m2y+movable2.height)
                    ){
                        movable1.collide(movable2);
                        movable2.collide(movable1);
                    }
                }
            }
            return activeFactions;
        };
    })(),
    updates: null,
    update(id, keyOrUpdate, value){
        if(!this.updates){ this.updates = {};}
        let updateObject = this.updates[id];
        // Handle Event Updates
        if(id === 'event'){
            if(!updateObject){
                updateObject = [];
                this.updates[id] = updateObject;
            }
            updateObject.push(keyOrUpdate);
            return;
        // Handle Sound Updates
        } else if(id === 'sound'){
            if(!updateObject){
                updateObject = [];
                this.updates[id] = updateObject;
            }
            updateObject.push(keyOrUpdate);
            return;
        // Handle Regular key / value updates (typeof(keyOrUpdate) === 'string').
        } else if(typeof(keyOrUpdate) === 'string'){
            if(!updateObject){
                updateObject = {};
                this.updates[id] = updateObject;
            }
            updateObject[keyOrUpdate] = value;
        // Handle object updates (typeof(keyOrUpdate) === 'object').
        } else{
            if(!updateObject){
                this.updates[id] = keyOrUpdate;
            } else{
                for(let key in keyOrUpdate){
                    if(!keyOrUpdate.hasOwnProperty(key)){ continue;}
                    updateObject[key] = keyOrUpdate[key];
                }
            }
        }
    },
    clearUpdates(){
        this.updates = null;
    },
    getTile(x, y){
        /**
            This function is used to get the tile referenced by a the given coordinates.
            Tiles are shared objects, and one tile object can be referenced
                at a multitude of coordinates.
            It returns the referenced tile if it is found, and undefined if no
                tile is referenced at those coordinates or the coordinates supplied
                are outside the region's dimensions.
         **/    
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return undefined;
        }
        let compoundIndex = y*this.width + x;
        return this.tileGrid[compoundIndex];
    },
    placeTile(x, y, tile){
        /**
            This function is used to place a tile at specific coordinates on
                this region.
            Tiles are shared objects, and one tile object can be referenced
                at a multitude of coordinates.
            It returns true if the placement is successful, and false otherwise.
         **/    
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return false;
        }
        let compoundIndex = y*this.width + x;
        this.tileGrid[compoundIndex] = tile;
        return true;
    },
    dense(x, y, entrant){
        let targetTile = this.getTile(x, y);
        if(!targetTile){
            return true;
        } else if(!(targetTile.movement & entrant.movement)){
            return targetTile;
        }
        return false;
    },
    getView(x, y, range){
        /**
            This function constructs a grid (an array with indexes ordered by
                width and height) where each coordinate index references
                either a tile in view at that position, or null. The grid
                includes all coordinates within the supplied range, including
                the center, giving dimensions of (range+1+range)^2.
            It returns said grid.
         **/
        // Check each tile within range for visibilty.
        let rangeGrid = [];
        for(let posY = y-range; posY <= y+range; posY++){
            for(let posX = x-range; posX <= x+range; posX++){
                rangeGrid.push(this.getTile(posX, posY));
            }
        }
        // Return the finished view grid.
        return rangeGrid;
    },
    testBlock(x, y, width, height){
        let tileX = Math.floor(x/env.TILE_SIZE);
        let tileY = Math.floor(y/env.TILE_SIZE);
        let tileWidth  = Math.floor((x+width -1)/env.TILE_SIZE)-tileX;
        let tileHeight = Math.floor((y+height-1)/env.TILE_SIZE)-tileY;
        let blockMovement = env.MOVEMENT_ALL;
        for(let posX = tileX; posX <= tileX+tileWidth; posX++){
            for(let posY = tileY; posY <= tileY+tileHeight; posY++){
                let containerTile = this.getTile(posX, posY);
                if(!containerTile){ return env.MOVEMENT_NONE;}
                blockMovement &= containerTile.movement;
            }
        }
        return blockMovement;
    },
    placeContainable(x, y, content){
        /**
            This function is used to place or move containable objects on the
                map. It takes into account the density of tiles and their
                contents.
            TODO: Take into account movement flags, such as water.
            It handles movement between any two locations on any two regions.
            Tile contents are handled via linked lists, so this function
                first removes an object from it's old linked list, and
                then adds it to the new linked list, starting a new one
                if necessary.
            Contents lists are maintained with actors at the front of the list.
                Because of this, new actors are always added at the head, while
                non actors are added to the tail.
            It returns true if the placement is successful and false otherwise.
         **/
        let tileX = Math.floor(x/env.TILE_SIZE);
        let tileY = Math.floor(y/env.TILE_SIZE);
        // Fail if no tile is found at supplied coordinates.
        let containerTile = this.getTile(tileX, tileY);
        if(!containerTile){
            return false;
        }
        // Fail if the tile will not permit the content to enter (perhaps
        // because of density.
        if(!containerTile.enter(content, tileX, tileY)){
            return false;
        }
        // Fail if content would spill over edge of map
        if(x < 0 || y < 0 || x+content.width > this.width*env.TILE_SIZE || y+content.height > this.height*env.TILE_SIZE){
            return false;
        }
        //
        if(content.regionId !== this.id){
            content.unplace();
            content.regionId = this.id;
            this.movables.push(content);
            content.update(content.pack());
        }
        // Change content's coordinates to reflect new placement.
        content.x = x;
        content.y = y;
        content.update('x', content.x);
        content.update('y', content.y);
        return true;
    },
    unplaceContainable(content){
        /**
            This function removes the containable from the region. This allows
                it to be placed in the player's inventory, into a shop, a
                chest, or prepared for garbage collection, etc.
            It returns true if the containable is not placed longer placed on
                this region. (I see no current reason this shouldn't always be
                true).
         **/
        // Skip if content is not on this region, or is not located on a tile.
        if(content.regionId !== this.id){ return true;}
        env.arrayRemove(this.movables, content);
        return true;
    },
    packageSetup(){
        /**
            This function creates a data package to send to clients,
                potentially over a network, to alert them to certain region
                metrics needed to setup a region memory.
            Ideally, this function wouldn't be needed. A proper AI / client
                should be able to construct an accurate memory of the region as
                it is revealed, without having to know the dimensions of the
                region beforehand. This turns out to be a huge logistical hassle
                in practice, however.
            It returns a data package with the following structure:
            {
                id: 'string',
                width: integer,
                height: integer,
                theme: 'string',
                waveNumer: integer,
                tileTypes: {
                    "tile id": {
                        id: "tile_id",
                        character: "#",
                        movement: MACRO,
                        opaque: boolean,
                        color: "#HEX", // optional
                        background: "#HEX", // optional
                        graphic: "resource id",
                        graphicState: "state name"
                    },
                    ... // And More tile models.
                },
                tileGrid: [
                    "tile_id",
                    ... // And More tile ids.
                ],
                content: [
                    { See containable.pack for structure },
                    ... // And more contained objects.
                ]
            }
         **/
        // Compile an array of tile types (tile models) used in this region.
        let tileTypesData = {};
        for(let tileKey in this.tileTypes){
            let indexedTileType = this.tileTypes[tileKey];
            let tileData = indexedTileType.pack();
            tileTypesData[indexedTileType.id] = tileData;
        }
        let tileIdGrid = [];
        this.tileGrid.forEach((element, eIndex) => {
            tileIdGrid[eIndex] = element.id;
        });
        let tileContents = [];
        this.movables.forEach((element) => {
            tileContents.push(element.pack());
        });
        // Construct and return final data package.
        let update = {
            regionId: this.id,
            width: this.width,
            height: this.height,
            theme: this.theme.name,
            waveNumber: this.waveNumber,
            tileTypes: tileTypesData,
            tileGrid: tileIdGrid,
            contents: tileContents
        };
        return update;
    },
    sound(name, options){
        this.update('sound', {'name': name, 'options': options});
    }
};

//== DEFERRED MODULES ==========================================================
const modelLibrary = require('./model_library.js');
const mapManager = require('./map_manager.js');
const tile = require('./tile.js');