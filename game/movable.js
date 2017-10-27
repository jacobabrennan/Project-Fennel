'use strict';

const env = require('./env.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const movable = module.exports = {
    // TODO: Document.
    graphic: undefined,
    graphicState: null, // do not change to undefined.
    graphicLayer: undefined,
    regionId: undefined,
    x: undefined,
    y: undefined,
    width: env.TILE_SIZE,
    height: env.TILE_SIZE,
    name: 'something',
    id: undefined,
    type: env.TYPE_MOVABLE,
    movement: env.MOVEMENT_FLOOR,
    lockTime: 0,
    _new(){
        // TODO: Document.
        this.id = mapManager.idManager.assignId(this);
        return this;
    },
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        this.disposed = true;
        this.update('disposed', true);
        this.unplace();
        this.regionId = undefined;
        mapManager.idManager.cancelId(this.id);
    },
    // TODO: Document.
    direction: env.SOUTH,
    stopHorizontal(){/*console.log('Stop Horizontal')*/},
    stopVertical(){/*console.log('Stop Vertical')*/},
    place(x, y, regionId){
        /**
            This function is used to place the object at specific coordinates
                on a specific region, referenced by id.
            It returns true if the placement is successful, and false otherwise.
         **/
        if(isNaN(x) || isNaN(y) || ((x == this.x && y == this.y) && regionId == this.regionId)){
            return false;
        }
        regionId = regionId || this.regionId;
        if(!regionId){
            return false;
        }
        var placeRegion = mapManager.getRegion(regionId);
        if(!placeRegion){ return false;}
        return placeRegion.placeContainable(x, y, this);
    },
    unplace(){
        /**
            This function removes the containable from the region. This allows
                it to be placed in the player's inventory, into a shop, a
                chest, or prepared for garbage collection, etc.
            It returns true if the containable is no longer placed on any region
                (I see no current reason this shouldn't always be true).
         **/
        let success = true;
        if(success){
            this.update('x', undefined);
            this.update('y', undefined);
            this.update('regionId', undefined);
        }
        if(this.regionId !== undefined){
            let currentRegion = mapManager.getRegion(this.regionId);
            if(!currentRegion){ success = true;}
            else{ success = currentRegion.unplaceContainable(this);}
        }
        this.x = undefined;
        this.y = undefined;
        this.regionId = undefined;
        return success;
    },
    translate(deltaX, deltaY){
        let moved = false;
        deltaX = Math.max(-(env.TILE_SIZE-1), Math.min((env.TILE_SIZE-1), deltaX));
        deltaY = Math.max(-(env.TILE_SIZE-1), Math.min((env.TILE_SIZE-1), deltaY));
        if(!deltaX && !deltaY){ return moved;}
        // Determine if movement will cause the object's edge to cross a border between turfs.
        let gameX = this.x;
        let gameY = this.y;
        let poleX = deltaX > 0 ? 1 : -1;
        let poleY = deltaY > 0 ? 1 : -1;
        let checkX = false;
        let checkY = false;
        if(poleX == 1){
            let limit = (env.TILE_SIZE - (gameX + this.width)%env.TILE_SIZE)%env.TILE_SIZE;
            if(deltaX >= limit){
                moved = true;
                gameX += limit;
                deltaX -= limit;
                if(deltaX > 0){ checkX = true;}
            }
        }
        else if(poleX == -1){
            let limit = gameX%env.TILE_SIZE;
            if(Math.abs(deltaX) > limit){
                moved = true;
                gameX -= limit;
                deltaX += limit;
                checkX = true;
            }
        }
        if(poleY == 1){
            let limit = (env.TILE_SIZE - (gameY + this.height)%env.TILE_SIZE)%env.TILE_SIZE;
            if(deltaY >= limit){
                moved = true;
                gameY += limit;
                deltaY -= limit;
                if(deltaY > 0){checkY = true;}
            }
        }
        else if(poleY == -1){
            let limit = gameY%env.TILE_SIZE;
            if(Math.abs(deltaY) > limit){
                moved = true;
                gameY -= limit;
                deltaY += limit;
                checkY = true;
            }
        }
        // Determine size of border crossed, in tiles
            // If the object is centered in a tile and is less than or equal to env.TILE_SIZE, this number will be 1
            // If the object is 3x env.TILE_SIZE, then this number could be as much as 4.
        let baseWidth  = 1+Math.floor((gameX+this.width -1)/env.TILE_SIZE) - Math.floor(gameX/env.TILE_SIZE);
        let sideHeight = 1+Math.floor((gameY+this.height-1)/env.TILE_SIZE) - Math.floor(gameY/env.TILE_SIZE);
        //var baseWidth  = Math.max(1, Math.floor(this.width /env.TILE_SIZE)) + (((gameX%env.TILE_SIZE)+this.width -1)>=env.TILE_SIZE? 1 : 0);
        //var sideHeight = Math.max(1, Math.floor(this.height/env.TILE_SIZE)) + (((gameY%env.TILE_SIZE)+this.height-1)>=env.TILE_SIZE? 1 : 0);
        if(checkX){
            if(poleX == 1){
                let targetX = Math.floor((gameX+this.width+deltaX)/env.TILE_SIZE);//+1;
                for(let I = 0; I < sideHeight; I++){
                    let targetY = Math.floor(gameY/env.TILE_SIZE)+I;
                    if(mapManager.dense(targetX, targetY, this.regionId, this)){
                        deltaX = 0;
                        this.stopHorizontal();
                        gameX = (targetX*env.TILE_SIZE)-this.width;
                        moved = true;
                        break;
                    }
                }
            }
            else if(poleX == -1){
                let targetX = Math.floor((gameX+deltaX)/env.TILE_SIZE);
                for(let I = 0; I < sideHeight; I++){
                    let targetY = Math.floor(gameY/env.TILE_SIZE)+I;
                    if(mapManager.dense(targetX, targetY, this.regionId, this)){
                        deltaX = 0;
                        this.stopHorizontal();
                        gameX = (targetX+1)*env.TILE_SIZE;
                        moved = true;
                        break;
                    }
                }
            }
        }
        if(deltaX){
            moved = true;
            gameX += deltaX;
        }
        baseWidth  = 1+Math.floor((gameX+this.width -1)/env.TILE_SIZE) - Math.floor(gameX/env.TILE_SIZE);
        sideHeight = 1+Math.floor((gameY+this.height-1)/env.TILE_SIZE) - Math.floor(gameY/env.TILE_SIZE);
        if(checkY){
            if(poleY == 1){
                let targetY = Math.floor((gameY+this.height+deltaY)/env.TILE_SIZE);
                for(let I = 0; I < baseWidth; I++){
                    let targetX = Math.floor(gameX/env.TILE_SIZE)+I;
                    if(mapManager.dense(targetX, targetY, this.regionId, this)){
                        deltaY = 0;
                        this.stopVertical();
                        gameY = (targetY*env.TILE_SIZE)-this.height;
                        moved = true;
                        break;
                        }
                    }
                }
            else if(poleY == -1){
                let targetY = Math.floor((gameY+deltaY)/env.TILE_SIZE);
                for(let I = 0; I < baseWidth; I++){
                    let targetX = Math.floor(gameX/env.TILE_SIZE)+I;
                    if(mapManager.dense(targetX, targetY, this.regionId, this)){
                        deltaY = 0;
                        this.stopVertical();
                        gameY = (targetY+1)*env.TILE_SIZE;
                        moved = true;
                        break;
                    }
                }
            }
        }
        if(deltaY){
            gameY += deltaY;
            moved = true;
        }
        if(moved){
            this.place(gameX, gameY, this.regionId);
            //var boundryCross = !(this.x === startX && this.y === startY);
            /*if(boundryCross){
                //entryTile.entered(this);
                var revealRegion = mapManager.getRegion(this.regionId);
                revealRegion.revealTile(this.x, this.y, 6);
            }*/
        }
        //this.checkCollisions();
        return moved;
    },
    walk(direction, amount){
        if(direction){
            let oldDirection = this.direction;
            this.direction = direction;
            if(this.direction & (env.NORTH|env.SOUTH) && this.direction & (env.EAST|env.WEST)){
                this.direction &= (env.EAST|env.WEST);
            }
            if((this.direction === (env.NORTH|env.SOUTH)) || (this.direction === (env.EAST|env.WEST))){
                this.direction &= (env.NORTH|env.EAST);
            }
            if(this.direction !== oldDirection){
                this.update('direction', this.direction);
            }
        } else{
            direction = this.direction;
        }
        if(!amount){ amount = 1;}
        let deltaX = 0;
        let deltaY = 0;
        if(direction & env.NORTH){ deltaY += amount;}
        if(direction & env.SOUTH){ deltaY -= amount;}
        if(direction & env.EAST ){ deltaX += amount;}
        if(direction & env.WEST ){ deltaX -= amount;}
        return this.translate(deltaX, deltaY);
    },
    shove(direction, amount){
        let deltaX = 0;
        let deltaY = 0;
        if(direction & env.NORTH){ deltaY += amount;}
        if(direction & env.SOUTH){ deltaY -= amount;}
        if(direction & env.EAST ){ deltaX += amount;}
        if(direction & env.WEST ){ deltaX -= amount;}
        this.translate(deltaX, deltaY);
    },
    controlLock(amount){
        this.lockTime = Math.max(this.lockTime, amount);
    },
    center(center, offsetDir){
        let centerX = center.x + (center.width -this.width )/2;
        let centerY = center.y + (center.height-this.height)/2;
        if(offsetDir){
            if(offsetDir & env.NORTH){ centerY += (center.height+this.height)/2;}
            if(offsetDir & env.SOUTH){ centerY -= (center.height+this.height)/2;}
            if(offsetDir & env.EAST ){ centerX += (center.width +this.width )/2;}
            if(offsetDir & env.WEST ){ centerX -= (center.width +this.width )/2;}
        }
        centerX = Math.max(0, Math.min(env.DEFAULT_MAP_SIZE*env.TILE_SIZE-this.width , centerX));
        centerY = Math.max(0, Math.min(env.DEFAULT_MAP_SIZE*env.TILE_SIZE-this.height, centerY));
        this.place(centerX, centerY, center.regionId);
    },
    collide(/*obstacle*/){
    },
    update(keyOrUpdate, value){
        if((value === undefined) && (typeof(keyOrUpdate) === 'string')){
            value = this[keyOrUpdate];
        }
        var ownRegion = mapManager.getRegion(this.regionId);
        if(ownRegion){
            ownRegion.update(this.id, keyOrUpdate, value);
        }
    },
    pack(){
        /**
            This function creates a "sensory package" of the object for use by
                a client, possibly over the network. This allows a client to
                know enough about an object to make decisions without having a
                hard reference to it.
            It returns a package representing the object, with the following
                structure:
            {
                id: uniqueId,
                name: "string",
                graphic: "resource id",
                graphicState: "string", // optional
                direction: MACRO
            }
         **/
        let sensoryData = {
            id: this.id,
            type: this.type,
            name: this.name,
            graphic: this.graphic,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            direction: this.direction
        };
        if(this.graphicState){ sensoryData.graphicState = this.graphicState;}
        if(this.graphicLayer){ sensoryData.graphicLayer = this.graphicLayer;}
        return sensoryData;
    },
    handleEvent(/*mover, event*/){
        let result = true;
        /*if(this.intelligences){
            var int_copy = this.intelligences.copy()
            for(var I = 0; I < int_copy.length; I++){
                var next_intelligence = int_copy[I];
                if(!next_intelligence){ continue;}
                if(next_intelligence.disposed){
                    this.intelligence_remove(next_intelligence);
                    continue;
                }
                if(this.intelligences.indexOf(next_intelligence) == -1){ continue;}
                if(typeof next_intelligence.handle_event === 'function'){
                    result = next_intelligence.handle_event(mover, event);
                }
                if(!result){
                    break;
                }
            }
        } else if(this.behavior_name && this[this.behavior_name]){
            this[this.behavior_name].call(this, mover, event);
        }*/
        return result;
    },
    iterate(){},
    distanceTo(otherMover){
        let deltaX = Math.abs((this.x+this.width /2) - (otherMover.x+otherMover.width /2));
        let deltaY = Math.abs((this.y+this.height/2) - (otherMover.y+otherMover.height/2));
        deltaX -= (this.width +otherMover.width )/2;
        deltaY -= (this.height+otherMover.height)/2;
        return Math.max(deltaX, deltaY);
    },
    angleTo(other){
        if(!other || other.regionId !== this.regionId){ return null;}
        return env.angleTo(
            this.x +this.width /2, this.y +this.height /2,
            other.x+other.width/2, other.y+other.height/2
        );
    },
    directionTo(other){
        if(!other || other.regionId !== this.regionId){ return null;}
        return env.directionTo(
            this.x +this.width /2, this.y +this.height /2,
            other.x+other.width/2, other.y+other.height/2
        );
    },
    cardinalTo(other){
        if(!other || other.regionId !== this.regionId){ return null;}
        return env.cardinalTo(
            this.x +this.width /2, this.y +this.height /2,
            other.x+other.width/2, other.y+other.height/2
        );
    },
    sound(name, options){
        let ownRegion = mapManager.getRegion(this.regionId);
        ownRegion.sound(name, options);
    }
};

//== DEFERRED MODULES ==========================================================
const mapManager = require('./map_manager.js');