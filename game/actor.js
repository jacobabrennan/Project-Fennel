'use strict';

/*===========================================================================
 *
 *  This prototype represents an actor in the game capable of moving about
 *      world and interacting with all other kinds of data objects present on
 *      the map. Most notably, actors can take part in combat.
 *  This is a prototype. I must be instantiated and it's _new called
 *      in order to be used properly.
 *          
 *===========================================================================*/

const env = require('./env.js');
const movable = require('./movable.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const headstone = env.extend(movable, {
    graphic: 'headstone',
    _new(deadHero){
        let result = movable._new.apply(this, arguments);
        this.hero = deadHero;
        this.center(this.hero);
        this.hero.unplace();
        this.age = 0;
        return result;
    },
    iterate(){
        let heroPlayer = clientManager.getClient(this.hero.playerId);
        if(!heroPlayer){
            this.dispose();
            return;
        }
        if(this.age++ > env.TOMB_TIME_LIMIT){
            gameManager.addWaiting(heroPlayer);
            this.hero.dispose();
            delete this.hero;
            this.dispose();
        }
    },
    revive(){
        let heroPlayer = clientManager.getClient(this.hero.playerId);
        if(!heroPlayer && false){
            this.dispose();
            return null;
        }
        this.hero.dead = false;
        this.hero.center(this);
        this.hero.update(this.hero.pack());
        this.hero.adjustHp(1);
        this.hero.invulnerable(env.INVULNERABLE_TIME);
        let result = this.hero;
        //heroPlayer.attachHero(this.hero);
        this.hero = null;
        this.dispose();
        return result;
    },
    emptyTomb(){ // to be used by other functions to transform the headstone without reviving.
        let deadHero = this.hero;
        this.hero = null;
        this.dispose();
        return deadHero;
    },
    dispose(){
        if(this.hero){
            let heroPlayer = clientManager.getClient(this.hero.playerId);
            if(heroPlayer){ gameManager.addWaiting(heroPlayer);}
        }
        let result = movable.dispose.apply(this, arguments);
        delete this.hero;
        delete this.age;
        return result;
    }
});
const actor = module.exports = env.extend(movable, {
    // Redefined properties:
    type: env.TYPE_ACTOR,
    // Newly defined Properties:
    graphic: 'adventurer',
    taxonomy: env.TAXONOMY_NONE,
    //graphicState: 'character',
    intelligence: undefined,
    viewRange: 7,
    behavior: 'behaviorNormal',
    atomicMovement: true, // Will only turn at tile boundries
    turnRate: 4, // Average tiles moved through before turning
    //
    _new(){
        movable._new.apply(this, arguments);
        this.adjustHp(this.maxHp());
        this.adjustMp(this.maxMp());
        return this;
    },
    dispose(){
        /**
         *  This function is used to prepare the object for garbage disposal
         *      by removing it from the map and nulling out all references
         *      managed by this object.
         **/
        movable.dispose.apply(this, arguments);
    },
    pack(){
        /**
            This function creates a "sensory package" of the object for use by
                a client, possibly over the network. This allows a client to
                know enough about an object to make decisions without having a
                hard reference to it.
            This is a child function of containable.pack, and must call its
                parent in order to function properly.
            It returns a package representing the object. See containable.pack
                for basic structure. It adds the following to the returned
                package:
            {
                ... // Existing parent package.
                type: 'actor';
            }
         **/
        let sensoryData = movable.pack.apply(this, arguments);
        sensoryData.type = env.TYPE_ACTOR;
        sensoryData.maxHp = this.maxHp();
        sensoryData.maxMp = this.maxMp();
        sensoryData.hp = this.hp;
        sensoryData.mp = this.mp;
        sensoryData.faction = this.faction;
        return sensoryData;
    },
    //
    level: 1,
    dead: false,
    hp: 0,
    mp: 0,
    revivable: false,
    deathTimer: 0,
    faction: env.FACTION_PLAYER,
    touchDamage: 0,
    baseBody: 3,
    baseAura: 1,
    baseSpeed: 1,
    projectiles: [],
    frontProtection: false,
    invulnerableTime: 0,
    invincible: false,
    bodyRegenRate: 2048,
    auraRegenRate: 256,
    bodyWaitTime: -1,
    auraWaitTime: -1,
    //taxonomy: M_HUMAN,
    //primary: undefined,
    //shootFrequency: undefined,
    //projectileType: undefined,
    //boss: false,
    // Newly Defined Functions:
    command(command){
        if(this.dead){ return;}
        if(command & (env.NORTH|env.SOUTH|env.EAST|env.WEST)){
            this.move(command, this.speed());
        }
        if(command & env.PRIMARY){
            if(this.primary){
                this.primary.use(this);
            }
        }
        if(command & env.SECONDARY){
            if(this.secondary){
                this.secondary.use(this);
            }
        }
        if(command & env.TERTIARY){
            if(this.tertiary){
                this.tertiary.use(this);
            }
        }
    },
    augment(identity, value){
        /* Currently augmentable values:
         * body aura speed
         *
         * Non-augmentable values:
         * touchdDamage
         */
        /*for(let/skill/augmentator in skills){
            if(augmentator.innate){
                value = augmentator.augment(identity, value)
            }
        }*/
        /*for(let/item/gear/augmentator in list(armor,shield,charm)){
            value = augmentator.augment(identity, value)
        }*/
        /*for(let/enchantment/augmentator in enchantments){
            value = augmentator.augment(identity, value)
        }*/
        return value;
    },
    maxBody(){
        return this.augment("body", this.baseBody);
    },
    maxAura(){
        return this.augment("aura", this.baseAura);
    },
    maxHp(){
        let hpBonus = this.maxBody();
        /*if(this.shield){ hpBonus += this.shield.healthBonus}
        if(this.armor ){ hpBonus +=  this.armor.healthBonus}
        if(this.charm ){ hpBonus +=  this.charm.healthBonus}*/
        return hpBonus;
    },
    maxMp(){
        let mpBonus = this.maxAura();
        /*if(this.shield){ mpBonus += this.shield.magicBonus}
        if(this.armor ){ mpBonus +=  this.armor.magicBonus}
        if(this.charm ){ mpBonus +=  this.charm.magicBonus}*/
        return mpBonus;
    },
    speed(){
        return this.augment("speed", this.baseSpeed);
    },
    iterate(){
        movable.iterate.call(this);
        if(this.dead){
            if(--this.deathTimer <= 0){
                this.dispose();
            }
            return;
        }
        if(this.invulnerableTime){
            this.invulnerable(-1);
        }
        /*
        else if(invisibility){
            invisibility = 0
            }
        for(let/enchantment/E in enchantments){
            E.tick(src)
            }
        if(hp < maxBody()){
            if(!(game.time % augment("bodyRegen", bodyRegenRate))){
                adjustHp(1, src)
                }
            }
        */
        if(this.mp < this.maxMp()){
            if(this.auraWaitTime < 0){
                this.auraWaitTime = this.auraRegenRate;
            }
            this.auraWaitTime--;
            if(this.auraWaitTime === 0){
                this.adjustMp(1, this);
            }
        }
        if(this.lockTime){
            this.lockTime--;
            return;
        } else{
            this.trigger(env.TRIGGER_TAKE_TURN);
        }
        /*
        . = ..()
        }*/
    },
    trigger(/*trigger, options*/){
        let behaviorFunction = this[this.behavior];
        if(behaviorFunction){
            return behaviorFunction.apply(this, arguments);
        }
        return null;
    },
    /*
    behavior(){
        if(hascall(src, behavior)){
            let/_speed = speed()
            if(_speed >= 1){ // TODO:: Is this a good behavior? When do I ever call behavior with an "event"?
                call(src, behavior)()
                }
            else{
                let/modulos = 1/_speed
                if(!(game.time%modulos)){
                    call(src, behavior)()
                    }
                }
            }
        }*/
    stopHorizontal(){
        let result = movable.stopHorizontal.apply(this, arguments);
        this.trigger(env.TRIGGER_STOP);
        return result;
    },
    stopVertical(){
        let result = movable.stopHorizontal.apply(this, arguments);
        this.trigger(env.TRIGGER_STOP);
        return result;
    },
    shoot(projectileId){
        if(!projectileId){ projectileId = this.projectileType;}
        let projectileModel = modelLibrary.getModel('projectile', projectileId);
        if(!projectileModel){ return null;}
        return env.instantiate(projectileModel, this);//, null, this.direction);
    },
    adjustHp(amount){
        let oldHealth = this.hp;
        this.hp += amount;
        this.hp = Math.min(this.maxHp(), Math.max(0, this.hp));
        let deltaHealth = this.hp - oldHealth;
        let result = deltaHealth;
        this.update('hp');
        if(this.hp <= 0){
            this.die();
        }
        return result;
    },
    adjustMp(amount){
        let oldMagic = this.mp;
        this.mp += amount;
        this.mp = Math.min(this.maxMp(), Math.max(0, this.mp));
        let deltaMagic = this.mp - oldMagic;
        let result = deltaMagic;
        this.update('mp');
        return result;
    },
    attack(target, amount, proxy){
        return target.hurt(amount, this, proxy);
    },
    hurt(damage, attacker, proxy){
        if(this.dead || this.invulnerable()){ return 0;}
        let startHp = this.hp;
        let recoilDir;
        let recoilTime = 2;
        let recoilSpeed = 8;
        let shielded = false;
        if(proxy && this.frontProtection && !(proxy.omnidirectional || this.lockTime)){
            if(proxy.melee && attacker){
                recoilDir = attacker.direction;
            } else{
                recoilDir = proxy.cardinalTo(this);
            }
            let shieldedDirection = env.directionFlip(this.direction);
            if(proxy.direction === shieldedDirection){ shielded = true;}
            else if(shieldedDirection & recoilDir){ shielded = true;}
        }
        if(shielded){
            //recoilTime = 1;
            //recoilSpeed = 1;
            mapManager.event('animate', this.regionId, {graphic: 'items', graphicState: 'shield', attachId: this.id, repeat: 2});
        } else{
            this.adjustHp(-damage);
            /*if(spamAttackBlock){
                invulnerable = env.INVULNERABLE_TIME
            } else{*/
            this.invulnerable(env.INVULNERABLE_TIME);
        }
        recoilDir = (proxy || attacker).cardinalTo(this);
        //
        if(this.hp > 0 && !shielded){
            mapManager.sequence('shove', this.regionId, {
                targetId: this.id,
                direction: recoilDir,
                speed: recoilSpeed,
                duration: recoilTime
            });
        }
        return this.hp-startHp;
    },
    die(){
        if(this.dead){ return;}
        this.trigger(env.TRIGGER_DIED);
        if(this.boss){
        } else{
            mapManager.event('animate', this.regionId, {graphic: 'deathPuff', center: this});
        }
        if(this.revivable){
            this.dead = true;
            this.update({ dead: this.dead});
            env.instantiate(headstone, this);
        } else{
            this.dispose();
        }
    },
    invulnerable(amount){
        if(amount){
            if(amount < 0){
                if(this.invulnerableTime > 0){
                    this.invulnerableTime = Math.max(this.invulnerableTime + amount, 0);
                    if(this.invulnerableTime === 0){
                        this.update('invulnerable', this.invulnerableTime);
                    }
                }
            } else if(this.invulnerableTime){
                this.invulnerableTime = Math.max(this.invulnerableTime, amount);
                this.update('invulnerable', this.invulnerableTime);
            } else{
                this.invulnerableTime = amount;
                this.update('invulnerable', this.invulnerableTime);
            }
        }
        return this.invulnerableTime;
    },
    collectItem(item){
        item.use(this);
    },
    findTarget(minDist){
        if(minDist === undefined){ minDist = Infinity;}
        let movers = gameManager.currentGame.currentWave.movables;
        let closeMover = null;
        let closeDist = minDist;
        for(let moverIndex = 0; moverIndex < movers.length; moverIndex++){
            let indexedMover = movers[moverIndex];
            if(indexedMover.type !== env.TYPE_ACTOR || (indexedMover.faction&this.faction)){
                continue;
            }
            let moverDist = this.distanceTo(indexedMover);
            if(moverDist < closeDist){ closeMover = indexedMover;}
        }
        return closeMover;
    }
});

actor.behaviorNormal = function (trigger/*, options*/){
    switch(trigger){
        case env.TRIGGER_TAKE_TURN:
            // Half speed optionally
            if(this.moveDelay && (gameManager.currentGame.currentTime+this.id)%2){
                break;
            }
            // Randomly change direction
            let walkDir = this.direction;
            let turning = false;
            if(this.atomicMovement){
                if(!(this.x%env.TILE_SIZE || this.y%env.TILE_SIZE) && Math.random()*this.turnRate < 1){
                    turning = true;
                }
            } else if(Math.random()*this.turnRate*this.speed() < 1){
                turning = true;
            }
            if(turning){
                walkDir = 1 << Math.random()*4; // Operands coerced into integers.
            // Randomly shoot
            } else if(this.shootFrequency && this.projectileType){
                if(Math.random()*this.shootFrequency > this.shootFrequency-1){
                    mapManager.sequence('shootPause', this.regionId, {targetId: this.id});
                    //this.shoot();
                }
            }
            this.walk(walkDir, this.speed());
            break;
        case env.TRIGGER_STOP:
            // Change to a random direction
            this.direction = 1 << Math.random()*4; // Operands coerced into integers.
            this.update('direction');
            break;
        case env.TRIGGER_DIED:
            // Drop an item
            if(!this.boss){
                if(Math.random() < env.ITEM_DROP_PROBABILITY){
                    let itemName = env.arrayPick(env.ITEM_ARRAY);
                    let C = env.instantiate(modelLibrary.getModel('item', itemName));
                    C.center(this);
                }
            } else{
                for(let items = 10; items; items--){
                    let angle = Math.random() * Math.PI*2;
                    let radius = Math.random()*24;
                    let itemName = env.arrayPick(env.ITEM_ARRAY);
                    let C = env.instantiate(modelLibrary.getModel('item', itemName));
                    C.center(this);
                    C.translate(Math.cos(angle)*radius, Math.sin(angle)*radius);
                }
            }
        break;
    }
};
actor.behaviorPause = function (trigger, options){
    switch(trigger){
    case env.TRIGGER_TAKE_TURN:
        if(this.storagePausing){
            this.storagePausing--;
            return null;
        } else if(Math.random()*128 > 127){
            this.storagePausing = env.INVULNERABLE_TIME*3;
        }
    break;
    }
    return this.behaviorNormal(trigger, options);
};

//== DEFERRED MODULES ==========================================================
const modelLibrary = require('./model_library.js');
const clientManager = require('./client_manager.js');
const gameManager = require('./game_manager.js');
const mapManager = require('./map_manager.js');