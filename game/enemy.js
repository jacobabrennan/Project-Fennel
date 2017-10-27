'use strict';

const env = require('./env.js');
const actor = require('./actor.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const enemy = module.exports = env.extend(actor, {
    faction: env.FACTION_ENEMY,
    //
    baseSpeed: 1,
    baseBody: 1,
    graphic: 'bug1',
    touchDamage: 1,
    shootFrequency: 64,
    projectileType: undefined, //'test',
    behavior: 'behaviorNormal',
    score: 5,
    boss: false,
    collide(obstacle){
        let result = actor.collide.apply(this, arguments);
        if(obstacle.hurt && !(obstacle.faction & this.faction)){
            this.attack(obstacle, this.touchDamage);
        }/* else{
          * Same factions don't collide.
            let deltaX = (obstacle.x+obstacle.width /2) - (this.x+this.width /2);
            let deltaY = (obstacle.y+obstacle.height/2) - (this.y+this.height/2);
            if(deltaX === 0){ deltaX = 1;}
            if(deltaY === 0){ deltaY = 1;}
            this.translate(-env.sign(deltaX), -env.sign(deltaY));
            obstacle.translate(env.sign(deltaX), env.sign(deltaY));
            //console.log(!(obstacle.faction & this.faction))
        }*/
        return result;
    },
    die(){
        gameManager.score(this.score);
        return actor.die.apply(this, arguments);
    }
});

enemy.archetypeDiagonal = () => { return enemyDiagonal;};
const enemyDiagonal = env.extend(enemy, {
	movement: env.MOVEMENT_ALL,
    behavior: "behaviorDiagonal",
    _new(){
        let result = enemy._new.apply(this, arguments);
        this.direction = env.pick(env.NORTHEAST, env.NORTHWEST, env.SOUTHWEST, env.SOUTHEAST);
        this.update('direction');
        return result;
    },
    behaviorDiagonal(trigger, options){
        let result;
        switch(trigger){
            case env.TRIGGER_TAKE_TURN:
                let deltaX = 0;
                let deltaY = 0;
                if(     this.direction & env.NORTH){ deltaY++;}
                else if(this.direction & env.SOUTH){ deltaY--;}
                if(     this.direction & env.EAST ){ deltaX++;}
                else if(this.direction & env.WEST ){ deltaX--;}
                let speed = this.speed();
                this.translate(deltaX*speed, deltaY*speed);
                break;
            case env.TRIGGER_STOP:
                break;
            default:
                result = this.behaviorNormal(trigger, options);
                break;
        }
        return result;
    },
    stopHorizontal(){
        switch(this.direction){
            case env.NORTHEAST: this.direction = env.NORTHWEST; break;
            case env.NORTHWEST: this.direction = env.NORTHEAST; break;
            case env.SOUTHWEST: this.direction = env.SOUTHEAST; break;
            case env.SOUTHEAST: this.direction = env.SOUTHWEST; break;
        }
        this.update('direction');
    },
    stopVertical(){
        switch(this.direction){
            case env.NORTHEAST: this.direction = env.SOUTHEAST; break;
            case env.NORTHWEST: this.direction = env.SOUTHWEST; break;
            case env.SOUTHWEST: this.direction = env.NORTHWEST; break;
            case env.SOUTHEAST: this.direction = env.NORTHEAST; break;
        }
        this.update('direction');
    }
});

enemy.archetypeSnake = () => { return enemySnake;};
const enemySnake = (() => {
//==============================================================================
const snakeBody = env.extend(enemy, {
    // redefined properties:
    movement: env.MOVEMENT_ALL,
    // new properties:
    behavior: 'snakeBodyBehavior',
    snakeBodyBehavior(trigger, options){
        if(trigger === env.TRIGGER_DIED){
            return this.behaviorNormal(trigger, options);
        }
        return null;
    },
    // redefined methods:
    hurt(amount, attacker/*, proxy*/){
        let head = mapManager.idManager.get(this.headId);
        if(!head){ return 0;}
        if(head.bodyInvulnerable){
            //game.audio.play_sound("defend")
            return 0;
        } else{
            return head.hurt(amount, attacker, this);
        }
    },
    die(){
        let head = mapManager.idManager.get(this.headId);
        env.arrayRemove(head.segments, this.id);
        return enemy.die.apply(this, arguments);
    }
});
const snake = env.extend(enemy, {
    // redefined properties:
    // new properties:
    segments: undefined,
    length: 4,
    bodyWidth: env.TILE_SIZE,
    oldPositions: undefined,
    bodyHealth: 1,
    bodyState: undefined,
    tailState: undefined,
    bodyInvulnerable: false,
    deathByParts: true,
    // redefined methods:
    _new: function (){
        this.segments = [];
        this.baseBody = this.bodyHealth*(this.length+1);
        this.oldPositions = [];
        let result = enemy._new.apply(this, arguments);
        let leadId = this.id;
        for(let segmentIndex = 0; segmentIndex < this.length; segmentIndex++){
            let bodySegment = env.instantiate(snakeBody, this);
            bodySegment.width = this.bodyWidth;
            bodySegment.height = this.bodyWidth;
            bodySegment.graphic = this.graphic;
            bodySegment.graphicState = this.bodyState;
            bodySegment.faction = this.faction;
            bodySegment.touchDamage = this.touchDamage;
            bodySegment.headId = this.id;
            this.segments.push(bodySegment.id);
            if(leadId != this.id){
                let leader = mapManager.idManager.get(leadId);
                leader.followId = bodySegment.id;
            }
            bodySegment.leadId = leadId;
            leadId = bodySegment.id;
            if(this.tailState && segmentIndex === this.length-1){
                bodySegment.graphicState = this.tailState;
                bodySegment.update('graphicState');
            }
        }
        return result;
    },
    trigger(trigger/*, options*/){
        let result;
        switch(trigger){
            case env.TRIGGER_TAKE_TURN:
                let oldCoord = {x: this.x, y: this.y};
                oldCoord.x += (this.width)/2;
                oldCoord.y += (this.height)/2;
                this.oldPositions.unshift(oldCoord);
                result = enemy.trigger.apply(this, arguments);
                for(let segmentIndex = 0; segmentIndex < this.segments.length; segmentIndex++){
                    let oldIndex = Math.floor((segmentIndex+1) * this.bodyWidth/this.speed());
                    if(oldIndex < this.oldPositions.length){
                        let segmentId = this.segments[segmentIndex];
                        let bodySegment = mapManager.idManager.get(segmentId);
                        if(!bodySegment){ continue;}
                        if(bodySegment.invulnerableTime < this.invulnerableTime){
                            bodySegment.invulnerable(this.invulnerableTime);
                        }
                        let newCoord = this.oldPositions[oldIndex];
                        if(bodySegment.leadId){
                            let leadSegment = mapManager.idManager.get(bodySegment.leadId);
                            let newDirection = bodySegment.cardinalTo(leadSegment);
                            if(newDirection !== bodySegment.direction){
                                bodySegment.direction = newDirection;
                                bodySegment.update('direction');
                            }
                        }
                        bodySegment.place(
                            newCoord.x-bodySegment.width/2,
                            newCoord.y-bodySegment.height/2,
                            this.regionId
                        );
                    }
                }
                this.oldPositions.length = Math.min(this.oldPositions.length, Math.floor(this.segments.length*this.bodyWidth/this.speed()));
                break;
            default:
                result = enemy.trigger.apply(this, arguments);
                break;
        }
        return result;
    },
    hurt(amount, attacker, proxy){
        let result = enemy.hurt.call(this, amount, attacker, proxy);
        if(this.deathByParts && this.segments.length){
            for(let segmentIndex = this.segments.length-1; segmentIndex >= 0; segmentIndex--){
                if(segmentIndex > this.segments.length){ continue;}
                let bodySegmentId = this.segments[segmentIndex];
                let bodySegment = mapManager.idManager.get(bodySegmentId);
                if(!bodySegment){ continue;}
                bodySegment.invulnerable(this.invulnerableTime);
                if((segmentIndex+1) * this.bodyHealth >= this.hp){
                    bodySegment.die();
                    if(this.tailState && this.segments.length){
                        let lastSegmentId = this.segments[this.segments.length-1];
                        let lastSegment = mapManager.idManager.get(lastSegmentId);
                        if(lastSegment){
                            lastSegment.graphicState = this.tailState;
                            lastSegment.update('graphicState');
                        }
                    }
                }
            }
        }
        return result;
    },
    die(){
        this.segments.forEach(function (segmentId){
            let bodySegment = mapManager.idManager.get(segmentId);
            bodySegment.die();
        }, this);
        return enemy.die.apply(this, arguments);
    },
    dispose(){
        this.segments.forEach(function (segmentId){
            let bodySegment = mapManager.idManager.get(segmentId);
            bodySegment.dispose();
        }, this);
        return enemy.dispose.apply(this, arguments);
    }
});
return snake;
//==============================================================================
})();

//== DEFERRED MODULES ==========================================================
const gameManager = require('./game_manager.js');
const mapManager = require('./map_manager.js');