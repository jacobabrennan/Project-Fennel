'use strict';

const env = require('./env.js');
const movable = require('./movable.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const projectile = module.exports = env.extend(movable, {
    // TODO: Document.
    width: env.TILE_SIZE/2,
    height: env.TILE_SIZE/2,
    type: env.TYPE_PROJECTILE,
    ownerId: null,
    _new(shooter){
        // TODO: Document.
        movable._new.call(this);
        this.currentTime = 0;
        this.currentRange = 0;
        if(shooter){
            this.ownerId = shooter.id;
            this.faction = shooter.faction;
            if(this.projecting){
                var projectionDirection = shooter.direction || env.SOUTH;
                this.center(shooter, projectionDirection);
                //var success = this.place(centerX, centerY, shooter.regionId);
                this.direction = projectionDirection
                this.update('direction');
                if(!this.regionId){ this.dispose();}
            } else{
                this.center(shooter);
            }
        }
        return this;
    },
    // TODO: Document.
    melee: false,
    projecting: true,
    explosive: false,
    terminalExplosion: false,
    normalSpeed: 4,
    potency: 1,
    persistent: false,
    maxRange: undefined,
    maxTime: undefined,
    currentRange: undefined,
    currentTime: undefined,
    sound: undefined,
    omnidirectional: false,
    projectAngle: null,
    //
    movement: env.MOVEMENT_ALL,
    stopHorizontal(){
        if(this.explosive){ this.explode();}
        else{ this.dispose();}
    },
    stopVertical(){
        if(this.explosive){ this.explode();}
        else{ this.dispose();}
    },
    collide(obstacle){
        if(obstacle.type === env.TYPE_ACTOR){
            this.attack(obstacle);
        } else{
            if(obstacle.type === env.TYPE_ITEM && (this.faction&env.FACTION_PLAYER)){
                var owner = mapManager.idManager.get(this.ownerId);
                if(owner && obstacle.age > 6){ owner.collectItem(obstacle);}
            }
            return;
        }
        if(!this.persistent){
            if(this.explosive){
                this.explode();
            } else{
                this.dispose();
            }
        }
    },
    attack(target){
        let owner = mapManager.idManager.get(this.ownerId);
        if(owner){
            return owner.attack(target, this.potency, this);
        } else{
            return target.hurt(this.potency, null, this);
        }
    },
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return;}
		if(this.maxRange){
			if(this.currentRange >= this.maxRange){
				if(this.terminalExplosion){ this.explode();}
				else{ this.dispose();}
			}
		}
		if(this.maxTime){
			if(this.currentTime >= this.maxTime ){
				if(this.terminalExplosion){ this.explode();}
				else{ this.dispose();}
			}
		}
        if(this.projectAngle || this.projectAngle === 0){
            this.translate(
                Math.cos(this.projectAngle)*this.normalSpeed,
                Math.sin(this.projectAngle)*this.normalSpeed
            );
            this.currentRange += this.normalSpeed;
        } else{
            var deltaX = this.x;
            var deltaY = this.y;
            if(this.normalSpeed){
                this.walk(null, this.normalSpeed);
            }
            deltaX = this.x - deltaX;
            deltaY = this.y - deltaY;
            this.currentRange += Math.max(Math.abs(deltaX), Math.abs(deltaY));
        }
		this.currentTime++;
    },
    angleProject(angle, speed){
        this.projectAngle = angle;
        this.normalSpeed = speed;
        this.direction = env.angleToDirection(angle);
    },
    /*pack: function (){
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
                dense: boolean,
                direction: MACRO
            }
         ** /
        var sensoryData = {
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
        return sensoryData;
    },*/
    handleEvent(/*mover, event*/){
        var result = true;
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
    explode(){
        this.dispose();
    }
});

//== DEFERRED MODULES ==========================================================
//const gameManager = require('./game_manager.js');
const mapManager = require('./map_manager.js');