'use strict';

const env = require('./env.js');
const movable = require('./movable.js');
const actor = require('./actor.js');
const item = require('./item.js');
const sequence = require('./sequence.js');
const projectile = require('./projectile.js');
const card = require('./card.js');
const enemy = require('./enemy.js');
const modelLibrary = require('./model_library.js');
//== END REQUIRES ==== (check for deferred modules) ============================


//==============================================================================
let skill = {
    cost: 0,
    use(user, cost){}
};
//==============================================================================


//==============================================================================
modelLibrary.item.cherry = env.extend(item, {
    graphicState: 'cherry',
    potency: 1,
    use(user){
        let healed = user.adjustHp(this.potency);
        if(healed){
            mapManager.event('animate', user.regionId, {graphic: 'healthSparkles', attachId: user.id, repeat: 2});
            this.dispose();
        }
    }
});
modelLibrary.item.plum = env.extend(item, {
    graphicState: 'plum',
    potency: 100,
    use(user){
        let healed = user.adjustHp(this.potency);
        if(healed){
            mapManager.event('animate', user.regionId, {graphic: 'healthSparkles', attachId: user.id, repeat: 2});
            this.dispose();
        }
    }
});
modelLibrary.item.bottle = env.extend(item, {
    graphicState: 'bottle',
    use(user){
        let healed = user.adjustMp(user.maxMp());
        if(healed){
            mapManager.event('animate', user.regionId, {graphic: 'auraSparkles', attachId: user.id, repeat: 2});
            this.dispose();
        }
    }
});
modelLibrary.item.shield = env.extend(item, {
    graphicState: 'shield',
    potency: env.INVULNERABLE_TIME_SHIELD,
    use(user){
        user.invulnerable(this.potency);
        mapManager.event('shields', user.regionId, {attachId: user.id});
        this.dispose();
    }
});
modelLibrary.item.coin_silver = env.extend(item, {
    graphicState: 'coin_silver',
    potency: 25,
    use(user){
        gameManager.score(this.potency, true);
        this.dispose();
    }
});
modelLibrary.item.coin_gold = env.extend(item, {
    graphicState: 'coin_gold',
    potency: 100,
    use(user){
        gameManager.score(this.potency, true);
        this.dispose();
    }
});
//==============================================================================


//==============================================================================
modelLibrary.sequence.shootPause = env.extend(sequence, {
    duration: 15,
    setup(options){
        this.time = 0;
        this.targetId = options.targetId;
    },
    iterate(){
        let target = mapManager.idManager.get(this.targetId);
        if(!target){
            this.finish();
            return;
        }
        target.controlLock(1);
        if(this.time++ > this.duration){
            target.shoot();
            this.finish();
        }
    }
});
modelLibrary.sequence.charge = env.extend(sequence, { // Mummy
    duration: 32,
    setup(options){
        this.time = 0;
        this.targetId = options.targetId;
    },
    iterate(){
        let target = mapManager.idManager.get(this.targetId);
        if(!target){
            this.finish();
            return;
        }
        target.controlLock(1);
        target.walk(target.direction, target.baseSpeed+1);
        if(this.time++ > this.duration){
            this.finish();
        }
    }
});
modelLibrary.sequence.webSnare = env.extend(sequence, {
    duration: 96,
    setup(options){
        this.time = 0;
        this.hunterId = options.hunterId;
        this.x = options.x;
        this.y = options.y;
    },
    iterate(){
        let hunter = mapManager.idManager.get(this.hunterId);
        if(!hunter){ this.finish(); return;}
        let deltaX = this.x - (hunter.x+hunter.width /2);
        let deltaY = this.y - (hunter.y+hunter.height/2);
        let speed = hunter.speed();
        deltaX = Math.min(speed, Math.abs(deltaX))*env.sign(deltaX);
        deltaY = Math.min(speed, Math.abs(deltaY))*env.sign(deltaY);
        let newDirection = 0;
        newDirection |= deltaX > 0? env.EAST  : (deltaX < 0? env.WEST  : 0);
        newDirection |= deltaY > 0? env.NORTH : (deltaY < 0? env.SOUTH : 0);
        if(newDirection){
            hunter.direction = newDirection;
            hunter.update('direction');
        }
        hunter.translate(deltaX, deltaY);
        hunter.controlLock(1);
        if(++this.time >= this.duration){
            this.finish();
        }
    }
});
modelLibrary.sequence.sword = env.extend(sequence, {
    setup(options){
        this.time = 0;
        this.attackerId = options.attackerId;
        let attacker = mapManager.idManager.get(this.attackerId);
        let graphic = options.graphic || 'sword';
        let projectileType = options.projectile || 'swordMelee';
        mapManager.event('flick', attacker.regionId, {graphicState: "attack", attachId: this.attackerId});
        mapManager.event('animate', attacker.regionId, {
            graphic: graphic,
            graphicState: 'default',
            attachId: attacker.id,
            offsetDirection:attacker.direction
        });
        //user.sound('test', {asdf: 'jkl;'})
        this.sword = attacker.shoot(projectileType);
    },
    iterate(){
        let attacker = mapManager.idManager.get(this.attackerId);
        if(!attacker || this.sword.disposed){
            this.finish();
            return;
        }
        this.sword.center(attacker, attacker.direction);
        attacker.controlLock(1);
        if(++this.time >= 6){
            this.finish();
        }
    }
});
modelLibrary.sequence.lance = env.extend(sequence, {
    setup(options){
        this.time = 0;
        this.attackerId = options.attackerId;
        let attacker = mapManager.idManager.get(this.attackerId);
        mapManager.event('flick', attacker.regionId, {graphicState: "attack", attachId: this.attackerId});
        mapManager.event('lance', attacker.regionId, {
            attachId: attacker.id,
            offsetDirection: attacker.direction
        });
        //user.sound('test', {asdf: 'jkl;'})
        this.lance = attacker.shoot('lanceMelee');
    },
    iterate(){
        let attacker = mapManager.idManager.get(this.attackerId);
        if(!attacker || this.lance.disposed){
            this.finish();
            return;
        }
        let length;
        switch(this.time){
            case 0: case 5: length = 11; break;
            case 1: case 4: length = 22; break;
            case 2: case 3: length = 32; break;
        }
        switch(attacker.direction){
            case env.NORTH: case env.SOUTH: this.lance.width  = 4; this.lance.height = length; break;
            case env.EAST : case env.WEST : this.lance.height = 4; this.lance.width  = length; break;
        }
        this.lance.update('width'); this.lance.update('height');
        this.lance.center(attacker, attacker.direction);
        attacker.controlLock(1);
        if(++this.time >= 6){
            this.finish();
        }
    }
});
modelLibrary.sequence.axe = env.extend(sequence, {
    setup(options){
        this.time = 0;
        this.attackerId = options.attackerId;
        let attacker = mapManager.idManager.get(this.attackerId);
        mapManager.event('flick', attacker.regionId, {graphicState: "attack", attachId: this.attackerId});
        mapManager.event('axe', attacker.regionId, {
            attachId: attacker.id,
            offsetDirection: attacker.direction
        });
        //user.sound('test', {asdf: 'jkl;'})
        this.axe = attacker.shoot('axeMelee');
    },
    iterate(){
        let attacker = mapManager.idManager.get(this.attackerId);
        if(!attacker || this.axe.disposed){
            this.finish();
            return;
        }
        let offsetX = 0;
        let offsetY = 0;
        let position = 0;
        switch(attacker.direction){
            case env.EAST : position = 7; break;
            case env.NORTH: position = 1; break;
            case env.WEST : position = 3; break;
            case env.SOUTH: position = 5; break;
        }
        position += Math.floor(this.time/2);
        let wP = attacker.width  - (attacker.width -this.axe.width )/2;
        let hP = attacker.height - (attacker.height-this.axe.height)/2;
        let drawDirection;
        let C = 4;
        switch(position%8){
            case 0: offsetX += wP  ;                  drawDirection = env.EAST     ; break;
            case 1: offsetX += wP-C; offsetY += hP-C; drawDirection = env.NORTHEAST; break;
            case 2:                  offsetY += hP  ; drawDirection = env.NORTH    ; break;
            case 3: offsetX -= wP-C; offsetY += hP-C; drawDirection = env.NORTHWEST; break;
            case 4: offsetX -= wP  ;                  drawDirection = env.WEST     ; break;
            case 5: offsetX -= wP-C; offsetY -= hP-C; drawDirection = env.SOUTHWEST; break;
            case 6:                  offsetY -= hP  ; drawDirection = env.SOUTH    ; break;
            case 7: offsetX += wP-C; offsetY -= hP-C; drawDirection = env.SOUTHEAST; break;
        }
        this.axe.center(attacker);
        let result = this.axe.place(this.axe.x+offsetX, this.axe.y+offsetY, this.axe.regionId);
        attacker.controlLock(1);
        if(++this.time >= 6){
            this.finish();
        }
    }
});
modelLibrary.sequence.shove = env.extend(sequence, {
    setup(options){
        this.time = 0;
        this.targetId = options.targetId;
        this.direction = options.direction;
        this.speed = options.speed || 4;
        this.duration = options.duration || 4;
    },
    iterate(){
        let target = mapManager.idManager.get(this.targetId);
        if(!target){
            this.finish();
            return;
        }
        //target.controlLock(1);
        target.shove(this.direction, this.speed);
        if(this.time++ > this.duration){
            this.finish();
        }
    }
});
modelLibrary.sequence.overload = env.extend(sequence, {
    duration: 15,
    radius: 32,
    setup(options){
        this.time = 0;
        this.targetId = options.targetId;
        this.duration = options.duration || this.duration;
        this.radius = options.radius || this.radius;
        this.callback = options.callback;
    },
    iterate(){
        let target = mapManager.idManager.get(this.targetId);
        if(!target){
            this.finish();
            return;
        }
        target.invulnerable(-10000);
        target.controlLock(1);
        if(this.time++ > this.duration){
            let effectRegion = mapManager.getRegion(target.regionId);
            effectRegion.movables.slice().forEach(function (aMovable){
                if(aMovable.faction&target.faction || aMovable.type !== env.TYPE_ACTOR){ return;}
                if(target.distanceTo(aMovable) >= this.radius){ return;}
                target.attack(aMovable, 2);
            }, this);
            mapManager.event('smallExplosion', target.regionId, {
                x: target.x+target.width /2,
                y: target.y+target.height/2,
                radius: this.radius
            });
            if(this.callback){ this.callback();}
            this.finish();
        } else{
            if(this.time === 1){
                target.x += 1;
            } else if(!(this.time%2)){
                target.x -= 2;
            } else{
                target.x += 2;
            }
            target.update('x');
        }
    }
});
modelLibrary.sequence.meditate = env.extend(sequence, {
    duration: 15,
    setup(options){
        this.time = 0;
        this.targetId = options.targetId;
        this.duration = options.duration || this.duration;
        let target = mapManager.idManager.get(this.targetId);
        this.graphicStateStorage = target.graphicState;
        target.graphicState = 'cast';
        target.update('graphicState');
    },
    iterate(){
        let target = mapManager.idManager.get(this.targetId);
        if(!target){
            this.finish();
            return;
        }
        target.controlLock(1);
        if(this.time++ > this.duration){
            this.finish();
        }
    },
    finish(){
        let target = mapManager.idManager.get(this.targetId);
        if(!target){
            this.finish();
            return;
        }
        target.graphicState = this.graphicStateStorage;
        target.update('graphicState');
        return sequence.finish.apply(this, arguments);
    },
    dispose(){
        this.finish();
        // Ensures that user graphic state goes back to normal.
        return sequence.dispose.apply(this, arguments);
    }
});
modelLibrary.sequence.timeStop = env.extend(sequence, {
    setup(options){
        this.time = 0;
    },
    iterate(){
        let stop = false;
        this.time++;
        if(this.time < 48){ stop = true;}
        else if(!(this.time%3)){ stop = true;}
        else if(this.time > 96){ this.finish(); return;}
        if(stop){
            let effectRegion = mapManager.getRegion(this.regionId);
            effectRegion.movables.forEach(function (aMovable){
                if(!(aMovable.faction&env.FACTION_ENEMY)){ return;}
                aMovable.controlLock(2);
            }, this);
        }
    }
});
//==============================================================================


//==============================================================================
let heroActor = env.extend(actor, {
    graphic: 'adventurer',
    taxonomy: env.TAXONOMY_HUMAN,
    baseBody: 4,
    baseAura: 0,
	auraRegenRate: 1024,
    skillPrimary: 'melee',
    projectileType: 'fist',
    levelKnight: 0,
    levelPriest: 0,
    levelMage: 0,
    levelRogue: 0,
    pack(){
        let sensoryPack = actor.pack.apply(this, arguments);
        if(typeof this.skillPrimary === 'object'){ sensoryPack.skillPrimary = this.skillPrimary.graphicState;}
        else{ sensoryPack.skillPrimary = this.skillPrimary;}
        if(typeof this.skillSecondary === 'object'){ sensoryPack.skillSecondary = this.skillSecondary.graphicState;}
        else{ sensoryPack.skillSecondary = this.skillSecondary;}
        if(typeof this.skillTertiary === 'object'){ sensoryPack.skillTertiary = this.skillTertiary.graphicState;}
        else{ sensoryPack.skillTertiary = this.skillTertiary;}
        if(typeof this.skillQuaternary === 'object'){ sensoryPack.skillQuaternary = this.skillQuaternary.graphicState;}
        else{ sensoryPack.skillQuaternary = this.skillQuaternary;}
        return sensoryPack;
    }
});
// Hero Classes
modelLibrary.actor.adventurer = env.extend(heroActor, { //
    skillPrimary: 'bowShort'
});
// Tier 1
modelLibrary.actor.squire = env.extend(heroActor, { //
    levelKnight: 1,
    graphic: 'squire',
    frontProtection: true,
    baseBody: 10,
    skillPrimary: 'sword'
});
modelLibrary.actor.acolyte = env.extend(heroActor, { //
    levelPriest: 1,
    graphic: 'acolyte',
    baseBody: 6,
    baseAura: 3,
    auraRegenRate: 256,
    skillSecondary: 'heal',
    skillTertiary: 'repel'
});
modelLibrary.actor.mage = env.extend(heroActor, { //
    levelMage: 1,
    graphic: 'mage',
    baseBody: 6,
    baseAura: 3,
    auraRegenRate: 128,
    skillPrimary: 'fireball',
    skillSecondary: 'fireblast'
});
modelLibrary.actor.archer = env.extend(heroActor, { //
    levelRogue: 1,
    graphic: 'archer',
    baseBody: 6,
    baseSpeed: 2,
    skillPrimary: 'bowLong'
});
// Tier 2
modelLibrary.actor.knight = env.extend(heroActor, { //
    levelKnight: 2,
    graphic: 'knight',
    frontProtection: true,
    baseBody: 10,
    skillPrimary: 'lance'
});
modelLibrary.actor.paladin = env.extend(heroActor, { //
    levelKnight: 1,
    levelPriest: 1,
    graphic: 'paladin',
    frontProtection: true,
    baseBody: 8,
    baseAura: 3,
    auraRegenRate: 256,
    skillPrimary: 'sword',
    skillSecondary: 'heal'
});
modelLibrary.actor.cleric = env.extend(heroActor, { //
    levelPriest: 2,
    graphic: 'cleric',
    baseBody: 6,
    baseAura: 6,
    auraRegenRate: 208,
    skillSecondary: 'heal',
    skillTertiaryCost: 6,
    skillTertiary: 'revive',
});
modelLibrary.actor.darkKnight = env.extend(heroActor, { //
    levelKnight: 1,
    levelMage: 1,
    graphic: 'darkKnight',
    frontProtection: true,
    baseBody: 10,
    baseAura: 4,
    auraRegenRate: 200,
    skillPrimary: 'sword',
    skillSecondaryCost: 1,
    skillSecondary: 'throwSword',
    skillTertiaryCost: 4,
    skillTertiary: 'shields',
});
modelLibrary.actor.scholar = env.extend(heroActor, { //
    levelPriest: 1,
    levelMage: 1,
    graphic: 'scholar',
    baseBody: 6,
    baseAura: 4,
    auraRegenRate: 130,
    skillPrimary: 'fireball',
    skillSecondary: 'heal',
    skillTertiaryCost: 1,
    skillTertiary: 'fireblast'
});
modelLibrary.actor.wizard = env.extend(heroActor, { //
    levelMage: 2,
    graphic: 'wizard',
    baseBody: 6,
    baseAura: 6,
    auraRegenRate: 75,
    skillPrimary: 'fireball',
    skillSecondaryCost: 1,
    skillSecondary: 'fireblast',
    skillTertiaryCost: 4,
    skillTertiary: 'fireExplosion'
});
modelLibrary.actor.barbarian = env.extend(heroActor, { //
    levelKnight: 1,
    levelRogue: 1,
    graphic: 'barbarian',
    baseBody: 8,
    skillPrimary: 'axe'
});
modelLibrary.actor.bard = env.extend(heroActor, { //
    levelPriest: 1,
    levelRogue: 1,
    graphic: 'bard',
    baseBody: 6,
    baseAura: 3,
    baseSpeed: 2,
    auraRegenRate: 256,
    projectileType: 'note',
    skillPrimary: 'shoot',
    skillSecondaryCost: 3,
    skillSecondary: 'shieldsAOE'
});
modelLibrary.actor.illusionist = env.extend(heroActor, { //
    levelMage: 1,
    levelRogue: 1,
    graphic: 'illusionist',
    baseBody: 6,
    baseAura: 3,
    auraRegenRate: 125,
    skillPrimary: 'fireball',
    skillSecondaryCost: 3,
    skillSecondary: 'illusion'
});
modelLibrary.actor.brigand = env.extend(heroActor, { //
    levelRogue: 2,
    graphic: 'brigand',
    baseBody: 6,
    baseAura: 2,
    baseSpeed: 2,
    auraRegenRate: 100,
    skillPrimary: 'bowLong',
    skillSecondaryCost: 1,
    skillSecondary: 'pirateBlink',
    skillTertiaryCost: 2,
    skillTertiary: 'bomb'
});
// Tier 3
modelLibrary.actor.royalGuard = env.extend(heroActor, { //
    levelKnight: 3,
    graphic: 'royalGuard',
    frontProtection: true,
    baseBody: 14,
    skillPrimary: 'lance',
    skillSecondary: 'swordGold',
    skillTertiary: 'axe'
});
modelLibrary.actor.crusader = env.extend(heroActor, {
    levelKnight: 2,
    levelPriest: 1,
    graphic: 'crusader',
    frontProtection: true,
    baseBody: 10,
    baseAura: 4,
    skillPrimary: 'lance',
    skillSecondary: 'axe',
    skillTertiary: 'repel'
});
modelLibrary.actor.templar = env.extend(heroActor, {
    levelKnight: 1,
    levelPriest: 2,
    graphic: 'templar',
    frontProtection: true,
    baseBody: 8,
    baseAura: 6,
    auraRegenRate: 208,
    skillPrimary: 'sword',
    skillSecondary: 'heal',
    skillTertiaryCost: 6,
    skillTertiary: 'revive',
});
modelLibrary.actor.highPriest = env.extend(heroActor, { //
    levelPriest: 3,
    graphic: 'highPriest',
    baseBody: 7,
    baseAura: 11,
    auraRegenRate: 150,
    skillSecondary: 'heal',
    skillTertiaryCost: 2,
    skillTertiary: 'revive',
});
modelLibrary.actor.darkLancer = env.extend(heroActor, { //
    levelKnight: 2,
    levelMage: 1,
    graphic: 'darkLancer',
    frontProtection: true,
    baseBody: 10,
    baseAura: 4,
    auraRegenRate: 200,
    skillPrimary: 'lance',
    skillSecondaryCost: 1,
    skillSecondary: 'throwSword',
    skillTertiaryCost: 4,
    skillTertiary: 'shields',
});
modelLibrary.actor.alchemist = env.extend(heroActor, {
    levelPriest: 2,
    levelMage: 1,
    graphic: 'alchemist',
    baseBody: 6,
    baseAura: 4,
    auraRegenRate: 130,
    skillPrimary: 'fireball',
    skillSecondaryCost: 2,
    skillSecondary: 'potionAura',
    skillTertiaryCost: 4,
    skillTertiary: 'potionFire',
});
modelLibrary.actor.warlock = env.extend(heroActor, {
    levelKnight: 1,
    levelMage: 2,
    graphic: 'warlock',
    frontProtection: true,
    baseBody: 6,
    baseAura: 6,
    auraRegenRate: 75,
    skillPrimary: 'sword',
    skillSecondaryCost: 1,
    skillSecondary: 'throwSword',
    skillTertiaryCost: 3,
    skillTertiary: 'controlSword',
});
modelLibrary.actor.necromancer = env.extend(heroActor, {
    levelPriest: 1,
    levelMage: 2,
    graphic: 'necromancer',
    baseBody: 6,
    baseAura: 3,
    auraRegenRate: 125,
    skillPrimary: 'fireball',
    skillSecondaryCost: 3,
    skillSecondary: 'summonSkeleton',
    skillTertiaryCost: 1,
    skillTertiary: 'raiseSkeleton',
    
});
modelLibrary.actor.sorcerer = env.extend(heroActor, {
    levelMage: 3,
    graphic: 'sorcerer',
    baseBody: 6,
    baseAura: 6,
    auraRegenRate: 75,
    skillPrimary: 'fireball',
    skillSecondaryCost: 1,
    skillSecondary: 'fireblast',
    skillTertiaryCost: 6,
    skillTertiary: 'fireSnake'
});
modelLibrary.actor.warlord = env.extend(heroActor, { 
    levelKnight: 2,
    levelRogue: 1,
    graphic: 'warlord',
    baseBody: 10,
    skillPrimary: 'axe',
    skillSecondaryCost: 0,
    skillSecondary: 'flail'
});
modelLibrary.actor.diva = env.extend(heroActor, {
    levelPriest: 2,
    levelRogue: 1,
    graphic: 'diva',
    baseBody: 6,
    baseAura: 4,
    baseSpeed: 2,
    auraRegenRate: 256,
    projectileType: 'note',
    skillPrimary: 'shoot',
    skillSecondaryCost: 3,
    skillSecondary: 'shieldsAOE',
    skillTertiaryCost: 4,
    skillTertiary: 'barrierAOE'
});
modelLibrary.actor.conjurer = env.extend(heroActor, {
    levelMage: 2,
    levelRogue: 1,
    graphic: 'conjurer',
    baseBody: 6,
    baseAura: 8,
    auraRegenRate: 150,
    skillPrimary: 'fireball',
    skillSecondaryCost: 4,
    skillSecondary: 'summonFire',
    skillTertiaryCost: 6,
    skillTertiary: 'summonAir',
    skillQuaternaryCost: 8,
    skillQuaternary: 'summonEarth'
});
modelLibrary.actor.berserker = env.extend(heroActor, { //
    levelKnight: 1,
    levelRogue: 2,
    graphic: 'berserker',
    baseBody: 4,
    baseAura: 4,
    skillPrimary: 'axe',
    deathDrain: 16,
    die(){
        if(this.mp <= 0){
            return heroActor.die.apply(this, arguments);
        }
    },
    attack(target, amount, proxy){
        let result = heroActor.attack.apply(this, arguments);
        if(target.dead || target.disposed){
            this.adjustHp(1);
        }
    },
    hurt(damage, attacker, proxy){
        if(this.dead || this.invulnerable()){ return 0;}
        let startHp = this.hp;
        this.adjustHp(-damage);
        this.invulnerable(env.INVULNERABLE_TIME);
        let result = this.hp-startHp;
        return result;
    },
    adjustHp(){
        let result = heroActor.adjustHp.apply(this, arguments);
        if(this.hp > 0){
            this.deathDrain = 16;
            this.adjustMp(this.maxMp());
        }
        return result;
    },
    iterate(){
        if(this.hp <= 0){
            if(--this.deathDrain <= 0){
                this.deathDrain = 16;
                this.adjustMp(-1);
                if(this.mp <= 0){
                    this.die();
                }
            }
        }
        return heroActor.iterate.apply(this, arguments);
    }
});
modelLibrary.actor.soloist = env.extend(heroActor, {
    levelPriest: 1,
    levelRogue: 2,
    graphic: 'soloist',
    baseBody: 6,
    baseAura: 4,
    baseSpeed: 2,
    auraRegenRate: 256,
    projectileType: 'note',
    skillPrimary: 'shoot',
    skillSecondaryCost: 3,
    skillSecondary: 'shieldsAOE',
    skillTertiaryCost: 4,
    skillTertiary: 'timeStop'
});
modelLibrary.actor.mystic = env.extend(heroActor, {
    levelMage: 1,
    levelRogue: 2,
    graphic: 'illusionist',
    baseSpeed: 2,
    baseBody: 6,
    baseAura: 3,
    auraRegenRate: 125,
    die(){
        let deathRegion = mapManager.getRegion(this.regionId);
        let movers = deathRegion.movables;
        for(let moverIndex = 0; moverIndex < movers.length; moverIndex++){
            let indexedMover = movers[moverIndex];
            if(!indexedMover || indexedMover.dead || indexedMover.disposed){ continue;}
            if(indexedMover.imageId === this.id){
                mapManager.event('illusionTransfer', this.regionId, {
                    center: this,
                    endX: indexedMover.x+indexedMover.width/2,
                    endY: indexedMover.y+indexedMover.height/2
                });
                this.center(indexedMover);
                this.direction = indexedMover.direction;
                this.hp = indexedMover.hp;
                indexedMover.dispose();
                this.update('direction');
                this.update('hp');
                this.controlLock(20);
                return;
            }
        }
        return heroActor.die.apply(this, arguments);
    },
    //skillPrimary: 'danceHeal',
    skillSecondaryCost: 0,
    skillSecondary: 'illusion2'
});
modelLibrary.actor.rogue = env.extend(heroActor, {
    levelRogue: 3,
    graphic: 'rogue',
    baseBody: 6,
    baseAura: 4,
    baseSpeed: 3,
    auraRegenRate: 100,
    skillPrimary: 'bowLong',
    skillSecondaryCost: 4,
    skillSecondary: 'ninjaBlink',
    skillTertiaryCost: 3,
    skillTertiary: 'arrowBomb',
    //skillQuaternaryCost: 1,
    //skillQuaternary: 'arrowSplit'
});
// Triads
modelLibrary.actor.hero = env.extend(heroActor, { //
    levelKnight: 1,
    levelPriest: 1,
    levelMage: 1,
    graphic: 'hero',
    frontProtection: true,
    baseBody: 8,
    baseAura: 4,
    auraRegenRate: 130,
    skillPrimary: 'sword',
    skillSecondary: 'heal',
    skillTertiaryCost: 1,
    skillTertiary: 'throwSword'
});
modelLibrary.actor.monk = env.extend(heroActor, {
    levelKnight: 1,
    levelPriest: 1,
    levelRogue: 1,
    graphic: 'monk',
    baseBody: 6,
    baseAura: 2,
    baseSpeed: 2,
    auraRegenRate: 100,
    skillPrimary: 'melee',
    projectileType: 'fist',
    skillSecondaryCost: 0,
    skillSecondary: 'meditate',
    skillTertiaryCost: 2,
    skillTertiary: 'ironFist'
});
modelLibrary.actor.ninja = env.extend(heroActor, { //
    levelKnight: 1,
    levelMage: 1,
    levelRogue: 1,
    graphic: 'ninja',
    baseBody: 3,
    baseAura: 4,
    baseSpeed: 2,
    auraRegenRate: 70,
    skillPrimaryCost: 1,
    skillPrimary: 'shuriken',
    skillSecondaryCost: 3,
    skillSecondary: 'ninjaBlink'
});
modelLibrary.actor.gardener = env.extend(heroActor, {
    levelPriest: 1,
    levelMage: 1,
    levelRogue: 1,
    graphic: 'gardener',
    baseBody: 8,
    baseAura: 4,
    auraRegenRate: 208,
    skillSecondary: 'healBerry',
    skillTertiaryCost: 4,
    skillTertiary: 'growTree'
});
// Tier 4
// Revolutionary
//==============================================================================


//==============================================================================
modelLibrary.projectile.fist = env.extend(projectile, {
    graphic: 'smallProjectiles',
    width: 8,
    height: 8,
    maxRange: 8,
    normalSpeed: 4,
    potency: 1,
    persistent: true,
    movement: env.MOVEMENT_ALL
});
modelLibrary.projectile.ironFist = env.extend(projectile, {
    graphic: 'smallProjectiles',
    graphicState: 'fist',
    width: 8,
    height: 8,
    maxRange: 24,
    normalSpeed: 8,
    potency: 2,
    persistent: true,
    movement: env.MOVEMENT_ALL,
    attack(target){
        mapManager.sequence('shove', this.regionId, {
            targetId: target.id,
            direction: this.direction,
            speed: 3,
            duration: 24
        });
        return projectile.attack.apply(this, arguments);
    }
});
modelLibrary.projectile.swordMelee = env.extend(projectile, {
    melee: true,
    graphic: null,
    maxTime: 5,
    persistent: true,
    normalSpeed: 0,
    width: 16,
    height: 16,
    potency: 2,
    _new(shooter){
        this.direction = shooter.direction;
        if(this.direction&(env.EAST|env.WEST)){
            this.height = 4;
            this.update('height');
        } else if(this.direction&(env.NORTH|env.SOUTH)){
            this.width = 4;
            this.update('width');
        }
        let result = projectile._new.apply(this, arguments);
        return result;
    }
});
modelLibrary.projectile.swordGoldMelee = env.extend(modelLibrary.projectile.swordMelee, {
    potency: 4
});
modelLibrary.projectile.axeMelee = env.extend(projectile, {
    melee: true,
    graphic: null,
    maxTime: 4,
    persistent: true,
    normalSpeed: 0,
    width: 16,
    height: 16,
    potency: 2
});
modelLibrary.projectile.lanceMelee = env.extend(projectile, {
    melee: true,
    graphic: null,
    maxTime: 5,
    persistent: true,
    normalSpeed: 0,
    width: 16,
    height: 16,
    potency: 2,
    _new(shooter){
        this.direction = shooter.direction;
        if(this.direction&(env.EAST|env.WEST)){
            this.height = 4;
            this.update('height');
        } else if(this.direction&(env.NORTH|env.SOUTH)){
            this.width = 4;
            this.update('width');
        }
        let result = projectile._new.apply(this, arguments);
        return result;
    }
});
modelLibrary.projectile.flail = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'flail',
    persistent: true,
    normalSpeed: 4,
    width: 11,
    height: 11,
    potency: 2,
    flipped: false,
    movement: env.MOVEMENT_FLOOR | env.MOVEMENT_WATER,
    _new(shooter){
        let result = projectile._new.apply(this, arguments);
        mapManager.event('chain', this.regionId, {end1Id: this.ownerId, end2Id: this.id});
        return result;
    },
    attack(){
        let result = projectile.attack.apply(this, arguments);
        if(!this.flipped){
            this.direction = env.directionFlip(this.direction);
            this.movement = env.MOVEMENT_ALL;
            this.flipped = true;
        }
        return result;
    },
    stopHorizontal(){
        if(!this.flipped){
            this.direction = env.directionFlip(this.direction);
            this.movement = env.MOVEMENT_ALL;
            this.flipped = true;
            return;
        }
        return projectile.stopHorizontal.apply(this, arguments);
    },
    stopVertical(){
        if(!this.flipped){
            this.direction = env.directionFlip(this.direction);
            this.movement = env.MOVEMENT_ALL;
            this.flipped = true;
            return;
        }
        return projectile.stopVertical.apply(this, arguments);
    },
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return;}
        owner.controlLock(3);
        mapManager.event('flick', this.regionId, {attachId: this.ownerId, graphicState: 'attack'});
        if(this.flipped){
            let deltaX = (this.x+this.width /2) - (owner.x+owner.width /2);
            let deltaY = (this.y+this.height/2) - (owner.y+owner.height/2);
            //let maxDelta = Math.min(Math.abs(deltaX), Math.abs(deltaY));
            if(this.direction&(env.NORTH|env.SOUTH)){
                this.translate(-deltaX/5, 0);
            } else{
                this.translate(0, -deltaY/5);
            }
            if(Math.abs(deltaX) < this.width && Math.abs(deltaY) < this.height){
                this.dispose();
                return;
            }
        }
        return projectile.iterate.apply(this, arguments);
    },
    translate(){
        let oldX = this.x;
        let oldY = this.y;
        let result = projectile.translate.apply(this, arguments);
        if(oldX === this.x && oldY === this.y){
            if(!this.flipped){
                this.direction = env.directionFlip(this.direction);
                this.movement = env.MOVEMENT_ALL;
                this.flipped = true;
                return;
            }
        }
        return result;
    }
});
modelLibrary.projectile.arrow = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'arrow',
    //maxRange: 5*env.TILE_SIZE,
    normalSpeed: 8,
    potency: 1,
    width: 16,
    height: 16,
    _new(shooter){
        this.direction = shooter.direction;
        if(this.direction&(env.EAST|env.WEST)){
            this.height = 4;
            this.update('height');
        } else if(this.direction&(env.NORTH|env.SOUTH)){
            this.width = 4;
            this.update('width');
        }
        let result = projectile._new.apply(this, arguments);
        return result;
    }
});
modelLibrary.projectile.arrowBomb = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'arrowBomb',
    //maxRange: 5*env.TILE_SIZE,
    normalSpeed: 8,
    potency: 2,
    width: 16,
    height: 16,
    explosive: true,
    terminalExplosion: true,
    omnidirectional: true,
    _new(shooter){
        this.direction = shooter.direction;
        if(this.direction&(env.EAST|env.WEST)){
            this.height = 4;
            this.update('height');
        } else if(this.direction&(env.NORTH|env.SOUTH)){
            this.width = 4;
            this.update('width');
        }
        let result = projectile._new.apply(this, arguments);
        return result;
    },/*
    attack(){
        this.explode();
    },*/
    explode(){
        let maxDistance = env.TILE_SIZE*2;
        let effectRegion = mapManager.getRegion(this.regionId);
        effectRegion.movables.slice().forEach(function (aMovable){
            if(aMovable.faction&this.faction || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(this.distanceTo(aMovable) >= maxDistance){ return;}
            this.attack(aMovable, this.potency);
        }, this);
        mapManager.event('smallExplosion', this.regionId, {
            x: this.x+this.width /2,
            y: this.y+this.height/2,
            radius: maxDistance
        });
        return projectile.explode.apply(this, arguments);
    }
});
modelLibrary.projectile.arrowEnemy = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'arrowEnemy',
    //maxRange: 5*env.TILE_SIZE,
    normalSpeed: 3,
    potency: 1,
    width: 16,
    height: 16,
    _new(shooter){
        this.direction = shooter.direction;
        if(this.direction&(env.EAST|env.WEST)){
            this.height = 4;
            this.update('height');
        } else if(this.direction&(env.NORTH|env.SOUTH)){
            this.width = 4;
            this.update('width');
        }
        let result = projectile._new.apply(this, arguments);
        return result;
    }
});
modelLibrary.projectile.magicSword = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'magicSword',
    //maxRange: 5*env.TILE_SIZE,
    normalSpeed: 6,
    potency: 2,
    width: 16,
    height: 16,
    _new(shooter){
        this.direction = shooter.direction;
        if(this.direction&(env.EAST|env.WEST)){
            this.height = 4;
            this.update('height');
        } else if(this.direction&(env.NORTH|env.SOUTH)){
            this.width = 4;
            this.update('width');
        }
        let result = projectile._new.apply(this, arguments);
        return result;
    }
});
modelLibrary.projectile.magicSwordControlled = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'magicSword',
    width: 16,
    height: 16,
    normalSpeed: 3,
    potency: 2,
    movement: env.MOVEMENT_ALL,
    explosive: true,
    terminalExplosion: true,
    _new(shooter){
        this.direction = shooter.direction;
        if(this.direction&(env.EAST|env.WEST)){
            this.height = 4;
            this.update('height');
        } else if(this.direction&(env.NORTH|env.SOUTH)){
            this.width = 4;
            this.update('width');
        }
        return projectile._new.apply(this, arguments);
    },
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let moveDir = (owner.commandStorage | owner.staleCommands) & 15;
        mapManager.event('flick', this.regionId, {graphicState: "cast", attachId: this.ownerId});
        owner.controlLock(env.CAST_TIME);
        let oldDirection = this.direction;
        if(moveDir){
            this.direction = (moveDir&env.EAST) || (moveDir&env.WEST) || (moveDir&env.NORTH) || (moveDir&env.SOUTH);
        }
        if(this.direction !== oldDirection){
            this.update('direction');
            if(this.direction !== env.directionFlip(oldDirection)){
                if(this.direction&(env.EAST|env.WEST)){
                    this.height = 4;
                    this.width = 16;
                    this.translate(-6,6);
                    this.update('width');
                    this.update('height');
                } else if(this.direction&(env.NORTH|env.SOUTH)){
                    this.width = 4;
                    this.height = 16;
                    this.translate(6,-6);
                    this.update('width');
                    this.update('height');
                }
            }
        }
        return projectile.iterate.apply(this, arguments);
    },
    explode(){
        const owner = mapManager.idManager.get(this.ownerId);
        if(owner){
            const oldDirection = owner.direction;
            for(let dirI = 0; dirI < 4; dirI++){
                owner.direction = 1 << dirI;
                let newSword = owner.shoot('magicSword');
                newSword.maxRange = 48;
                newSword.center(this);
                newSword.persistent = true;
            }
            owner.direction = oldDirection;
        }
        return projectile.explode.apply(this, arguments);
    }
});
modelLibrary.projectile.note = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'note',
    maxRange: env.TILE_SIZE*3,
    normalSpeed: 6,
    width:12,
    height: 12
});
modelLibrary.projectile.bomb = env.extend(projectile, {
    graphic: 'items',
    graphicState: 'bombLit',
    normalSpeed: 0,
    projecting: false,
    maxTime: 32,
    persistent: true,
    terminalExplosion: true,
    omnidirectional: true,
    potency: 2,
    collide(){},
    explode(){
        let maxDistance = env.TILE_SIZE*2;
        let effectRegion = mapManager.getRegion(this.regionId);
        effectRegion.movables.slice().forEach(function (aMovable){
            if(aMovable.faction&this.faction || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(this.distanceTo(aMovable) >= maxDistance){ return;}
            this.attack(aMovable, this.potency);
        }, this);
        mapManager.event('smallExplosion', this.regionId, {
            x: this.x+this.width /2,
            y: this.y+this.height/2,
            radius: maxDistance
        });
        /*mapManager.event('animate', this.regionId, {
            graphic: 'explosion',
            x: this.x+this.width /2,
            y: this.y+this.height/2,
        });*/
        return projectile.explode.apply(this, arguments);
    }
});
modelLibrary.projectile.silk = env.extend(projectile, {
    graphic: 'smallProjectiles',
    graphicState: 'silk',
    width: 8,
    height: 8,
    maxRange: 64,
    normalSpeed: 1,
    potency: 0,
    explosive: true,
    terminalExplosion: true,
    movement: env.MOVEMENT_ALL,
    omnidirectional: true,
    translate(){
        let oldX = this.x;
        let oldY = this.y;
        let result = projectile.translate.apply(this, arguments);
        if(oldX === this.x && oldY === this.y){ this.plantWeb();}
    },
    iterate(){
        this.movement = env.MOVEMENT_FLOOR;
        delete this.iterate;
        return projectile.iterate.apply(this, arguments);
    },
    explode(){
        this.plantWeb();
        this.dispose();
        //let web = env.instantiate(webModel, owner);
        //web.center(this);
        //this.dispose();
        //return projectile.explode.apply(this, arguments);
    },
    plantWeb(){
        if(this.webbed){ return;}
        this.webbed = true;
        let webModel = modelLibrary.getModel('projectile', 'web');
        let owner = mapManager.idManager.get(this.ownerId);
        if(owner){
            owner.shoot('web').center(this);
        }
        this.dispose();
    }
});
modelLibrary.projectile.web = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'web',
    width: 32,
    height: 32,
    normalSpeed: 0,
    projecting: 0,
    potency: 0,
    maxTime: 256,
    movement: env.MOVEMENT_ALL,
    omnidirectional: true,
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        return projectile.iterate.apply(this, arguments);
    },
    attack(mover){
        if(mover.invulnerable_time || mover.invincible){ return;}
        if(this.faction & mover.faction){ return;}
        mover.controlLock(74);
        mapManager.sequence('webSnare', this.regionId, {
            hunterId: this.ownerId,
            x: mover.x+mover.width/2,
            y: mover.y+mover.height/2
        });
        this.dispose();
    }
});
modelLibrary.projectile.quicksand = env.extend(projectile, {
    graphic: 'quicksand',
    //graphicState: 'quicksand',
    graphicLayer: env.LAYER_UNDER,
    width: 28,
    height: 28,
    normalSpeed: 0,
    projecting: 0,
    potency: 0,
    maxTime: 1024,
    movement: env.MOVEMENT_ALL,
    persistent: true,
    omnidirectional: true,
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner || owner.hidden){ this.dispose(); return undefined;}
        return projectile.iterate.apply(this, arguments);
    },
    attack(mover){
        if(mover.invulnerable_time || mover.invincible){ return;}
        if(this.faction & mover.faction){ return;}
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ return;}
        let deltaX = env.sign((owner.x+owner.width /2) - (mover.x+mover.width /2))*2/3;
        let deltaY = env.sign((owner.y+owner.height/2) - (mover.y+mover.height/2))*2/3;
        mover.translate(deltaX, deltaY);
    }
});
modelLibrary.projectile.acid = env.extend(projectile, {
    graphic: 'acid',
    graphicLayer: env.LAYER_UNDER,
    width: 28,
    height: 28,
    normalSpeed: 0,
    projecting: 0,
    potency: 1,
    maxTime: 192,
    movement: env.MOVEMENT_ALL,
    omnidirectional: true,
});
modelLibrary.projectile.barrier = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'barrierFull',
    //graphicLayer: env.LAYER_UNDER,
    width: 24,
    height: 24,
    normalSpeed: 0,
    projecting: 0,
    potency: 0,
    movement: env.MOVEMENT_ALL,
    persistent: true,
    omnidirectional: true,
    place(){
        // Make sure that barriers prevent projectile collisions with heros,
        // by placing them at the start of the movables list.
        let oldRegion = this.regionId;
        let result = projectile.place.apply(this, arguments);
        if(oldRegion !== this.regionId){
            let placeRegion = mapManager.getRegion(this.regionId);
            env.arrayRemove(placeRegion.movables, this);
            placeRegion.movables.unshift(this);
        }
        return result;
    },
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner || owner.dead || owner.disposed){ this.dispose(); return undefined;}
        this.center(owner);
        return projectile.iterate.apply(this, arguments);
    },
    collide(obstacle){
        if(obstacle.invulnerable_time || obstacle.invincible){ return}
        if(this.faction & obstacle.faction){ return;}
        if(obstacle.type === env.TYPE_ACTOR){
            obstacle.controlLock(env.INVULNERABLE_TIME_SHIELD);
            mapManager.sequence('shove', this.regionId, {
                targetId: obstacle.id,
                direction: this.directionTo(obstacle),
                speed: 3,
                duration: 1
            });
        } else if(obstacle.type === env.TYPE_PROJECTILE){
            obstacle.dispose();
        } else{
            return;
        }
        if(this.graphicState === 'barrierFull'){
            this.graphicState = 'barrierHalf';
            this.update('graphicState');
        } else{
            this.dispose();
        }
    }
});
modelLibrary.projectile.flame = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'fire1',
    width: 16,
    height: 16,
    projecting: false,
    normalSpeed: 0
});
modelLibrary.projectile.fireball = env.extend(projectile, {
    graphic: 'smallProjectiles',
    graphicState: 'fireball',
    width: 8,
    height: 8,
    maxRange: env.TILE_SIZE*5,
    normalSpeed: 6,
    potency: 1
});
modelLibrary.projectile.fireballEnemy = env.extend(projectile, {
    graphic: 'smallProjectiles',
    graphicState: 'fireballEnemy',
    width: 8,
    height: 8,
    maxRange: env.TILE_SIZE*5,
    normalSpeed: 3,
    potency: 1
});/*
modelLibrary.projectile.fireball_enemy = env.extend(projectile, {
    _graphic: 'fireball',
    width: 8},
    height: 8},
    max_range: 128},
    speed: 3},
    potency: 1},
    movement: DM.env.MOVEMENT_FLOOR}
});*/
modelLibrary.projectile.fireballLarge = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'fireball',
    width: 16,
    height: 16,
    normalSpeed: 6,
    potency: 2
});
modelLibrary.projectile.fireSnake = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'fireball',
    width: 16,
    height: 16,
    normalSpeed: 0,
    potency: 2,
    movement: env.MOVEMENT_ALL,
    persistent: true,
    omnidirectional: true,
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let moveDir = (owner.commandStorage | owner.staleCommands) & 15;
        if(moveDir){
            this.walk(moveDir, 4);
        }
        return projectile.iterate.apply(this, arguments);
    }
});
modelLibrary.projectile.bone = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'bone',
    width: 10,
    height: 10,
    normalSpeed: 2,
    potency: 1
});
modelLibrary.projectile.shuriken = env.extend(projectile, {
    graphic: 'smallProjectiles',
    graphicState: 'shuriken',
    width: 8,
    height: 8,
    maxRange: 80,
    normalSpeed: 6,
    potency: 2
});
modelLibrary.projectile.potionHeal = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'potionHeal',
    width: 16,
    height: 16,
    normalSpeed: 0,
    potency: 1,
    movement: env.MOVEMENT_ALL,
    persistent: true,
    explosive: true,
    terminalExplosion: true,
    attack(){},
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let moveDir = (owner.commandStorage | owner.staleCommands) & 15;
        owner.controlLock(env.CAST_TIME);
        mapManager.event('flick', this.regionId, {graphicState: "cast", attachId: this.ownerId});
        if((this.currentTime > 1) &&
           (owner.commandStorage | owner.staleCommands) &
           (env.COMMAND_PRIMARY|env.COMMAND_SECONDARY|env.COMMAND_TERTIARY|env.COMMAND_QUARTERNARY)){
            this.explode();
            return;
        }
        if(moveDir){
            this.walk(moveDir, 4);
        }
        return projectile.iterate.apply(this, arguments);
    },
    explode(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let effectRegion = mapManager.getRegion(this.regionId);
        effectRegion.movables.slice().forEach(function (aMovable){
            if(!(aMovable.faction&owner.faction) || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(this.distanceTo(aMovable) >= 24){ return;}
            let healed = aMovable.adjustHp(this.potency);
            if(!healed){ return;}
            mapManager.event('animate', this.regionId, {
                graphic: 'healthSparkles',
                attachId: aMovable.id,
                repeat: 2
            });
        }, this);
        let ops = mapManager.event('healAOE', this.regionId, {
            center: this,
            radius: 24
        });
        return projectile.explode.apply(this, arguments);
    }
});
modelLibrary.projectile.potionAura = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'potionAura',
    width: 16,
    height: 16,
    normalSpeed: 0,
    potency: 2,
    movement: env.MOVEMENT_ALL,
    persistent: true,
    explosive: true,
    terminalExplosion: true,
    attack(){},
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let moveDir = (owner.commandStorage | owner.staleCommands) & 15;
        owner.controlLock(env.CAST_TIME);
        mapManager.event('flick', this.regionId, {graphicState: "cast", attachId: this.ownerId});
        if((this.currentTime > 1) &&
           (owner.commandStorage | owner.staleCommands) &
           (env.COMMAND_PRIMARY|env.COMMAND_SECONDARY|env.COMMAND_TERTIARY|env.COMMAND_QUARTERNARY)){
            this.explode();
            return;
        }
        if(moveDir){
            this.walk(moveDir, 4);
        }
        return projectile.iterate.apply(this, arguments);
    },
    explode(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let effectRegion = mapManager.getRegion(this.regionId);
        effectRegion.movables.slice().forEach(function (aMovable){
            if(!(aMovable.faction&owner.faction) || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(this.distanceTo(aMovable) >= 24){ return;}
            let healed = aMovable.adjustMp(this.potency);
            if(!healed){ return;}
            mapManager.event('animate', this.regionId, {
                graphic: 'auraSparkles',
                attachId: aMovable.id,
                repeat: 2
            });
        }, this);
        let ops = mapManager.event('auraAOE', this.regionId, {
            center: this,
            radius: 24
        });
        return projectile.explode.apply(this, arguments);
    }
});
modelLibrary.projectile.potionFire = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'potionFire',
    width: 16,
    height: 16,
    normalSpeed: 0,
    potency: 0,
    movement: env.MOVEMENT_ALL,
    persistent: true,
    explosive: true,
    terminalExplosion: true,
    attack(){},
    iterate(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let moveDir = (owner.commandStorage | owner.staleCommands) & 15;
        owner.controlLock(env.CAST_TIME);
        mapManager.event('flick', this.regionId, {graphicState: "cast", attachId: this.ownerId});
        if((this.currentTime > 1) &&
           (owner.commandStorage | owner.staleCommands) &
           (env.COMMAND_PRIMARY|env.COMMAND_SECONDARY|env.COMMAND_TERTIARY|env.COMMAND_QUARTERNARY)){
            this.explode();
            return;
        }
        if(moveDir){
            this.walk(moveDir, 4);
        }
        return projectile.iterate.apply(this, arguments);
    },
    explode(){
        let owner = mapManager.idManager.get(this.ownerId);
        if(!owner){ this.dispose(); return undefined;}
        let newFlame = owner.shoot('flame');
        newFlame.maxTime = 256;
        newFlame.center(this);
        newFlame.persistent = true;
        return projectile.explode.apply(this, arguments);
    }
});
modelLibrary.projectile.pushPuff = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'airPuff',
    width: 16,
    height: 16,
    maxRange: 80,
    normalSpeed: 4,
    potency: 0,
    persistent: true,
    movement: env.MOVEMENT_ALL,
    attack(target){
        mapManager.sequence('shove', this.regionId, {
            targetId: target.id,
            direction: this.direction,
            speed: 3,
            duration: 1
        });
    }
});
modelLibrary.projectile.tree = env.extend(projectile, {
    graphic: 'projectiles',
    graphicState: 'tree',
    width: 16,
    height: 16,
    normalSpeed: 0,
    persistent: true,
    maxTime: 512,
    collide(target){
        // Will not collide with other projectiles, as per time saving trick in collision dectection.
        if(target.faction & this.faction){ return;}
        if(target.movement & env.MOVEMENT_WALL){ return;}
        if(target.type === env.TYPE_ACTOR){
            mapManager.sequence('shove', this.regionId, {
                targetId: target.id,
                direction: env.directionFlip(target.direction),
                speed: target.speed(),
                duration: 1
            });
        }
        let deltaX = Math.abs((target.x+target.width /2) - (this.x+this.width /2));
        let deltaY = Math.abs((target.y+target.height/2) - (this.y+this.height/2));
        if(deltaX < deltaY){
            target.stopVertical();
        } else{
            target.stopHorizontal();
        }
    }
});
//==============================================================================


//==============================================================================
/*
skillPrimary: 'fireball',
skillSecondary: 'fireblast',
*/
modelLibrary.skill.melee = env.extend(skill, {
    graphicState: 'melee',
    use(user){
        mapManager.event('flick', user.regionId, {graphicState: "attack", attachId: user.id});
        user.shoot(user.projectileType);
        user.controlLock(3);
    }
});
modelLibrary.skill.shoot = env.extend(skill, {
    graphicState: 'shoot',
    cost: 0,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        user.shoot(user.projectileType);
    }
});
modelLibrary.skill.sword = env.extend(skill, {
    graphicState: 'sword',
    use(user){
        mapManager.sequence('sword', user.regionId, {
            attackerId: user.id
        });
    }
});
modelLibrary.skill.swordGold = env.extend(skill, {
    graphicState: 'swordGold',
    use(user){
        mapManager.sequence('sword', user.regionId, {
            attackerId: user.id,
            graphic: 'swordGold',
            projectile: 'swordGoldMelee'
        });
    }
});
modelLibrary.skill.lance = env.extend(skill, {
    graphicState: 'lance',
    use(user){
        mapManager.sequence('lance', user.regionId, {
            attackerId: user.id
        });
    }
});
modelLibrary.skill.axe = env.extend(skill, {
    graphicState: 'axe',
    use(user){
        mapManager.sequence('axe', user.regionId, {
            attackerId: user.id
        });
    }
});
modelLibrary.skill.flail = env.extend(skill, {
    graphicState: 'flail',
    use(user){
        user.shoot('flail');
    }
});
modelLibrary.skill.bowShort = env.extend(skill, {
    graphicState: 'bowShort',
    use(user){
        let oldArrow = mapManager.idManager.get(this.arrowId);
        if(oldArrow){ oldArrow.dispose();}
        let shortArrow = user.shoot('arrow');
        shortArrow.maxRange = 4*env.TILE_SIZE;
        this.arrowId = shortArrow.id;
        user.controlLock(3);
    }
});
modelLibrary.skill.bowLong = env.extend(skill, {
    graphicState: 'bowLong',
    use(user){
        let oldArrow = mapManager.idManager.get(this.arrowId);
        if(oldArrow){ oldArrow.dispose();}
        let newArrow = user.shoot('arrow');
        this.arrowId = newArrow.id;
    }
});
modelLibrary.skill.uniqueDefaultShot = env.extend(skill, {
    graphicState: 'uniqueDefaultShot',
    use(user){
        let oldShot = mapManager.idManager.get(this.shotId);
        if(oldShot){ oldShot.dispose();}
        let newShot = user.shoot();
        newShot.maxRange = 4*env.TILE_SIZE;
        this.shotId = newShot.id;
        user.controlLock(3);
    }
});
modelLibrary.skill.throwSword = env.extend(skill, {
    graphicState: 'throwSword',
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        user.controlLock(env.CAST_TIME);
        user.shoot('magicSword');
    }
});
modelLibrary.skill.controlSword = env.extend(skill, {
    graphicState: 'controlSword',
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        user.controlLock(env.CAST_TIME);
        user.shoot('magicSwordControlled');
    }
});
modelLibrary.skill.heal = env.extend(skill, {
    graphicState: 'heal',
    potency: 1,
    aoeDistance: env.TILE_SIZE*3,
    cost: 1,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(env.CAST_TIME);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(!(aMovable.faction&user.faction) || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            let healed = aMovable.adjustHp(this.potency);
            if(!healed){ return;}
            mapManager.event('animate', user.regionId, {
                graphic: 'healthSparkles',
                attachId: aMovable.id,
                repeat: 2
            });
        }, this);
        mapManager.event('healAOE', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.healBerry = env.extend(skill, {
    graphicState: 'healBerry',
    potency: 1,
    aoeDistance: env.TILE_SIZE*3,
    cost: 1,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(env.CAST_TIME);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(!(aMovable.faction&user.faction) || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            let healed = aMovable.adjustHp(this.potency);
            if(!healed){ return;}
            mapManager.event('animate', user.regionId, {
                graphic: 'healthSparkles',
                attachId: aMovable.id,
                repeat: 2
            });
        }, this);
        mapManager.event('berryAOE', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.meditate = env.extend(skill, {
    graphicState: 'meditate',
    potency: 1,
    aoeDistance: env.TILE_SIZE*3,
    cost: 0,
    use(user){
        //if(user.mp < this.cost){ return;}
        //user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        mapManager.sequence('meditate', user.regionId, {
            targetId: user.id,
            duration: env.CAST_TIME*8
        });
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(!(aMovable.faction&user.faction) || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            if(user === aMovable){ return;}
            let healed = aMovable.adjustMp(this.potency);
            if(!healed){ return;}
            mapManager.event('animate', user.regionId, {
                graphic: 'auraSparkles',
                attachId: aMovable.id,
                repeat: 2
            });
        }, this);
        mapManager.event('auraAOE', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.ironFist = env.extend(skill, {
    graphicState: 'ironFist',
    cost: 2,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        mapManager.event('flick', user.regionId, {graphicState: "attack", attachId: user.id});
        user.shoot('ironFist');
        user.controlLock(3);
    }
});
modelLibrary.skill.repel = env.extend(skill, {
    graphicState: 'repel',
    potency: 2,
    aoeDistance: env.TILE_SIZE*3,
    cost: 1,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(env.CAST_TIME);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(aMovable.faction&user.faction || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(!(aMovable.taxonomy & (env.TAXONOMY_UNDEAD|env.TAXONOMY_DEMON))){ return;}
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            mapManager.event('animate', user.regionId, {
                graphic: 'holySparkles',
                center: aMovable,
                repeat: 2
            });
            user.attack(aMovable, this.potency);
        }, this);
        mapManager.event('repelAOE', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.revive = env.extend(skill, {
    graphicState: 'revive',
    potency: 1,
    aoeDistance: env.TILE_SIZE*3,
    cost: 6,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(env.CAST_TIME);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            if(typeof aMovable.revive === 'function'){
                let revivedHero = aMovable.revive();
                if(!revivedHero){ return;}
                mapManager.event('animate', user.regionId, {
                    graphic: 'healthSparkles',
                    attachId: revivedHero.id,
                    repeat: 2
                });
            } else if(!(aMovable.faction&user.faction) || aMovable.type == env.TYPE_ACTOR){
                if(!(aMovable.taxonomy & env.TAXONOMY_UNDEAD)){ return;}
                mapManager.event('animate', user.regionId, {
                    graphic: 'holySparkles',
                    center: aMovable,
                    repeat: 2
                });
                user.attack(aMovable, this.potency);
            }
        }, this);
        mapManager.event('reviveAOE', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.shieldsAOE = env.extend(skill, {
    graphicState: 'shieldsAOE',
    aoeDistance: env.TILE_SIZE*3,
    cost: 3,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(env.CAST_TIME);
        //mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(!(aMovable.faction&user.faction) || (aMovable.type !== env.TYPE_ACTOR)){ return;}
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            aMovable.invulnerable(env.INVULNERABLE_TIME_SHIELD);
        }, this);
        mapManager.event('shieldsAOE', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.shields = env.extend(skill, {
    graphicState: 'shields',
    cost: 4,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(4);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        user.invulnerable(env.INVULNERABLE_TIME_SHIELD);
        mapManager.event('shields', user.regionId, {attachId: user.id});
    }
});
modelLibrary.skill.barrierAOE = env.extend(skill, {
    graphicState: 'barrierAOE',
    aoeDistance: env.TILE_SIZE*3,
    cost: 4,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(env.CAST_TIME);
        //mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(!(aMovable.faction&user.faction) || (aMovable.type !== env.TYPE_ACTOR)){ return;}
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            aMovable.shoot('barrier');
        }, this);
        mapManager.event('barrierAOE', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.timeStop = env.extend(skill, {
    graphicState: 'timeStop',
    cost: 4,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        user.controlLock(env.CAST_TIME);
        mapManager.sequence('timeStop', user.regionId, {
            userId: user.id
        });
        mapManager.event('timeStop', user.regionId, {
            attachId: user.id
        });
    }
});
modelLibrary.skill.pirateBlink = env.extend(skill, {
    graphicState: 'pirateBlink',
    cost: 1,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        user.invulnerable(16);
        mapManager.event('pirateTalk', user.regionId, {attachId: user.id});
    }
});
modelLibrary.skill.ninjaBlink = env.extend(skill, {
    graphicState: 'ninjaBlink',
    cost: 3,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        user.invulnerable(env.INVULNERABLE_TIME*2);
        mapManager.event('animate', user.regionId, {graphic: 'deathPuff', center: user});
    }
});
modelLibrary.skill.shuriken = env.extend(skill, {
    graphicState: 'shuriken',
    cost: 1,
    use(user){
        if(user.mp >= this.cost+3){// Pay attention! Keep 3mp in reserve.
            user.adjustMp(-this.cost);
            user.shoot('shuriken');
        }
        mapManager.sequence('sword', user.regionId, {
            attackerId: user.id
        });
    }
});
modelLibrary.skill.arrowBomb = env.extend(skill, {
    graphicState: 'arrowBomb',
    cost: 2,
    use(user){
        if(user.mp >= this.cost){
            user.adjustMp(-this.cost);
            user.shoot('arrowBomb');
        }
    }
});
modelLibrary.skill.arrowSplit = env.extend(skill, {
    graphicState: 'arrowSplit',
    cost: 1,
    use(user){
        if(user.mp >= this.cost){
            user.adjustMp(-this.cost);
            let a1 = user.shoot('arrow');
            let a2 = user.shoot('arrow');
            let a3 = user.shoot('arrow');
            let projectAngle = 0;
            if(     a1.direction === env.NORTH){ projectAngle = Math.PI  /2;}
            else if(a1.direction === env.WEST ){ projectAngle = Math.PI    ;}
            else if(a1.direction === env.SOUTH){ projectAngle = Math.PI*3/2;}
            a2.angleProject(projectAngle + Math.PI/10, a1.normalSpeed*0.9);
            a3.angleProject(projectAngle - Math.PI/10, a1.normalSpeed*0.9);
        }
    }
});
modelLibrary.skill.illusion = (function (){
    const illusionActor = env.extend(heroActor, {
        _new(image){
            this.baseBody = 1;
            this.baseSpeed = image.baseSpeed+1;
            this.graphic = image.graphic;
            this.imageId = image.id;
            return heroActor._new.apply(this, arguments);
        },
        behavior: '__mirror',
        __mirror(trigger, options){
            if(trigger === env.TRIGGER_TAKE_TURN){
                let image = mapManager.idManager.get(this.imageId);
                if(!image || !image.regionId){ this.die(); this.dispose(); return;}
                this.commandStorage = image.clientCommands;
                let moveDir = this.commandStorage & 15;
                if(this.commandStorage & env.COMMAND_PRIMARY){
                    this.shoot('fireball');
                    mapManager.event('flick', this.regionId, {graphicState: "cast", attachId: this.id});
                    this.controlLock(6);
                }
                else if(moveDir){
                    this.walk(moveDir, this.speed());
                }
                this.commandStorage = null;
            }
        }
    });
    return env.extend(skill, {
        graphicState: 'illusion',
        cost: 3,
        use(user){
            if(user.mp < this.cost){ return;}
            user.adjustMp(-this.cost);
            let illusion = env.instantiate(illusionActor, user);
            illusion.center(user);
        }
    });
})();
modelLibrary.skill.illusion2 = (function (){
    const illusionActor = env.extend(heroActor, {
        graphic: 'mystic',
        shootFrequency: 64,
        baseSpeed: 1,
        baseBody: 6,
        skillPrimary: Object.create(modelLibrary.getModel('skill', 'uniqueDefaultShot')),
        projectileType: 'fireball',
        _new(image){
            this.birthday = gameManager.currentTime();
            this.imageId = image.id;
            this.direction = image.direction;
            return heroActor._new.apply(this, arguments);
        },
        trigger(trigger, options){
            if(trigger !== env.TRIGGER_TAKE_TURN){
                return heroActor.trigger.apply(this, arguments);
            }
            let image = mapManager.idManager.get(this.imageId);
            if(!image || image.disposed || image.dead){ this.dispose(); return;}
            let currentTime = gameManager.currentTime();
            if(
                Math.random() < 1/32 ||
                !((currentTime+this.birthday+1)%64)
            ){
                let target = this.findTarget(env.TILE_SIZE*3);
                if(target){
                    this.direction = this.cardinalTo(target);
                    this.update('direction');
                }
            }
            if(
                Math.random() < 1/this.shootFrequency || 
                !((currentTime+this.birthday)%64)
            ){
                this.skillPrimary.use(this);
                return;
            }
            if(currentTime%2){
                this.walk(this.direction, this.speed());
            }
        }
    });
    return env.extend(skill, {
        graphicState: 'illusion2',
        cost: 3,
        use(user){
            if(user.mp < this.cost){ return;}
            user.adjustMp(-this.cost);
            let illusion = env.instantiate(illusionActor, user);
            illusion.center(user);
        }
    });
})();
modelLibrary.skill.raiseSkeleton = (function (){
    const skeleton = env.extend(heroActor, {
        graphic: 'skeleton',
        baseSpeed: 1,
        baseBody: 6,
        //revivable: false,
        _new(){
            switch(env.randomInterval(1,3)){
                case 1: this.skillPrimary = 'lance'; break;
                case 2: this.skillPrimary = 'axe'; break;
                case 3:
                    this.skillPrimary = 'uniqueDefaultShot';
                    this.projectileType = 'bone';
                    break;
            }
            this.skillPrimary = Object.create(modelLibrary.getModel('skill', this.skillPrimary));
            return heroActor._new.apply(this, arguments);
        },
        imprint(deadHero){
            this.deadHero = deadHero;
            let deadPlayer = clientManager.getClient(deadHero.playerId);
            deadPlayer.attachHero(this);
        },
        revive(){
            let heroPlayer = clientManager.getClient(this.deadHero.playerId);
            if(!heroPlayer && false){
                this.dispose();
                return null;
            }
            let deadHero = this.deadHero;
            this.deadHero = null;
            deadHero.dead = false;
            deadHero.unplace();
            deadHero.direction = this.direction;
            deadHero.center(this);
            deadHero.update(deadHero.pack());
            deadHero.adjustHp(this.hp);
            deadHero.invulnerable(env.INVULNERABLE_TIME);
            let result = deadHero;
            heroPlayer.removeHero(this);
            heroPlayer.attachHero(deadHero);
            this.dispose();
            return result;
        }
    });
    Object.defineProperty(skeleton, 'revivable', {
        enumerable: true,
        configurable: true,
        writable: false,
        value: false
    });
    return env.extend(skill, {
        graphicState: 'raiseSkeleton',
        aoeDistance: env.TILE_SIZE*3,
        cost: 1,
        use(user){
            if(user.mp < this.cost){ return;}
            user.adjustMp(-this.cost);
            let effectRegion = mapManager.getRegion(user.regionId);
            user.controlLock(env.CAST_TIME);
            mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
            let maxDistance = this.aoeDistance;
            effectRegion.movables.slice().forEach(function (aMovable){
                if(user.distanceTo(aMovable) >= maxDistance){ return;}
                if(typeof aMovable.emptyTomb === 'function'){
                    let summon = env.instantiate(skeleton);
                    summon.center(aMovable);
                    let deadHero = aMovable.emptyTomb();
                    if(!deadHero){ return;}
                    summon.imprint(deadHero);
                    mapManager.event('animate', user.regionId, {
                        graphic: 'healthSparkles',
                        attachId: summon.id,
                        repeat: 2
                    });
                }
            }, this);
            mapManager.event('reviveAOE', user.regionId, {
                attachId: user.id,
                radius: this.aoeDistance
            });
        }
    })
})();
modelLibrary.skill.summonSkeleton = (function (){
    const skeleton = env.extend(heroActor, {
        graphic: 'skeleton',
        shootFrequency: 64,
        baseSpeed: 1,
        baseBody: 6,
        _new(image){
            this.birthday = gameManager.currentTime();
            /*this.baseBody = 1;
            this.baseSpeed = image.baseSpeed+1;
            this.graphic = image.graphic;
            this.imageId = image.id;*/
            switch(env.randomInterval(1,3)){
                case 1: this.skillPrimary = 'lance'; break;
                case 2: this.skillPrimary = 'axe'; break;
                case 3:
                    this.skillPrimary = 'uniqueDefaultShot';
                    this.projectileType = 'bone';
                    break;
            }
            this.skillPrimary = Object.create(modelLibrary.getModel('skill', this.skillPrimary));
            return heroActor._new.apply(this, arguments);
        },
        trigger(trigger, options){
            if(trigger !== env.TRIGGER_TAKE_TURN){
                return heroActor.trigger.apply(this, arguments);
            }
            let currentTime = gameManager.currentTime();
            if(
                Math.random() < 1/32 ||
                !((currentTime+this.birthday+1)%64)
            ){
                let target = this.findTarget(env.TILE_SIZE*3);
                if(target){
                    this.direction = this.cardinalTo(target);
                    this.update('direction');
                }
            }
            if(
                Math.random() < 1/this.shootFrequency || 
                !((currentTime+this.birthday)%64)
            ){
                this.skillPrimary.use(this);
                return;
            }
            if(currentTime%2){
                this.walk(this.direction, this.speed());
            }
            }
    });
    return env.extend(skill, {
        graphicState: 'summonSkeleton',
        cost: 3,
        use(user){
            if(user.mp < this.cost){ return;}
            user.adjustMp(-this.cost);
            let summon = env.instantiate(skeleton, user);
            summon.center(user);
            summon.direction = user.direction;
            summon.update('direction');
        }
    });
})();
modelLibrary.skill.summonFire = (function (){
    const summonFire = env.extend(heroActor, {
        graphic: 'summonFire',
        shootFrequency: 64,
        baseSpeed: 1,
        baseBody: 3,
        skillPrimary: 'uniqueDefaultShot',
        projectileType: 'fireball',
        _new(image){
            this.birthday = gameManager.currentTime();
            this.skillPrimary = Object.create(modelLibrary.getModel('skill', this.skillPrimary));
            return heroActor._new.apply(this, arguments);
        },
        trigger(trigger, options){
            if(trigger !== env.TRIGGER_TAKE_TURN){
                return heroActor.trigger.apply(this, arguments);
            }
            let currentTime = gameManager.currentTime();
            if(
                Math.random() < 1/32 ||
                !((currentTime+this.birthday+1)%64)
            ){
                let target = this.findTarget(env.TILE_SIZE*3);
                if(target){
                    this.direction = this.cardinalTo(target);
                    this.update('direction');
                }
            }
            if(
                Math.random() < 1/this.shootFrequency || 
                !((currentTime+this.birthday)%64)
            ){
                this.skillPrimary.use(this);
                return;
            }
            if(currentTime%2){
                this.walk(this.direction, this.speed());
            }
        }
    });
    return env.extend(skill, {
        graphicState: 'summonFire',
        cost: 3,
        use(user){
            if(user.mp < this.cost){ return;}
            user.adjustMp(-this.cost);
            let summon = env.instantiate(summonFire, user);
            summon.center(user);
            summon.direction = user.direction;
            summon.update('direction');
        }
    });
})();
modelLibrary.skill.summonAir = (function (){
    const summonAir = env.extend(heroActor, {
        graphic: 'summonAir',
        baseSpeed: 1,
        baseBody: 3,
        baseAura: 2,
        auraRegenRate: 300,
        projectileType: 'pushPuff',
        ownerId: undefined,
        movement: env.MOVEMENT_ALL,
        trigger(trigger, options){
            if(trigger !== env.TRIGGER_TAKE_TURN){
                return heroActor.trigger.apply(this, arguments);
            }
            let owner = mapManager.idManager.get(this.ownerId);
            if(!owner || owner.dead || owner.disposed){
                this.dispose();
                return;
            }
            let currentTime = gameManager.currentTime();
            if(currentTime%2 && this.distanceTo(owner) > env.TILE_SIZE/2){
                this.walk(this.directionTo(owner));
            }
            let shootContinue = (currentTime - this.lastFire) < 16;
            if(this.mp > 0 || shootContinue){
                let target = this.findTarget(env.TILE_SIZE*3);
                if(target){
                    if(!shootContinue){
                        this.adjustMp(-1);
                        this.lastFire = currentTime;
                    }
                    this.controlLock(3);
                    mapManager.event('flick', this.regionId, {graphicState: 'attack', attachId: this.id});
                    this.direction = this.cardinalTo(target);
                    this.update('direction');
                    let angle = this.angleTo(target)+(Math.random()-0.5)*Math.PI/6;
                    let puff = this.shoot();
                    puff.maxRange -= env.randomInterval(0,16);
                    puff.center(this);
                    puff.angleProject(angle, 3);
                }
            }
        }
    });
    return env.extend(skill, {
        graphicState: 'summonAir',
        cost: 3,
        use(user){
            if(user.mp < this.cost){ return;}
            user.adjustMp(-this.cost);
            let summon = env.instantiate(summonAir, user);
            summon.ownerId = user.id;
            summon.center(user);
            summon.direction = user.direction;
            summon.update('direction');
        }
    });
})();
modelLibrary.skill.summonEarth = (function (){
    const summonEarth = env.extend(heroActor, {
        graphic: 'summonEarth',
        baseSpeed: 1,
        baseBody: 10,
        touchDamage: 2,
        _new(image){
            this.birthday = gameManager.currentTime();
            return heroActor._new.apply(this, arguments);
        },
        hurt(damage, attacker, proxy){
            if(this.dead || this.invulnerable()){ return 0;}
            let startHp = this.hp;
            this.adjustHp(-damage);
            this.invulnerable(env.INVULNERABLE_TIME);
            let result = this.hp-startHp;
            return result;
        },
        collide(obstacle){
            let result = actor.collide.apply(this, arguments);
            if(obstacle.hurt && !(obstacle.faction & this.faction)){
                this.attack(obstacle, this.touchDamage);
            }
            return result;
        },
        trigger(trigger, options){
            if(trigger !== env.TRIGGER_TAKE_TURN){
                return heroActor.trigger.apply(this, arguments);
            }
            let currentTime = gameManager.currentTime();
            if(
                Math.random() < 1/32 ||
                !((currentTime+this.birthday)%64)
            ){
                let target = this.findTarget(env.TILE_SIZE*3);
                if(target){
                    this.direction = this.cardinalTo(target);
                    this.update('direction');
                } else{
                    this.direction = 1 << env.randomInterval(0,3);
                    this.update('direction');
                }
            }
            if(currentTime%2){
                this.walk(this.direction, this.speed());
            }
        }
    });
    return env.extend(skill, {
        graphicState: 'summonEarth',
        cost: 4,
        use(user){
            if(user.mp < this.cost){ return;}
            user.adjustMp(-this.cost);
            let summon = env.instantiate(summonEarth, user);
            summon.ownerId = user.id;
            summon.center(user);
            summon.direction = user.direction;
            summon.update('direction');
        }
    });
})();
modelLibrary.skill.fireball = env.extend(skill, {
    graphicState: 'fireball',
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        user.shoot('fireball');
        user.controlLock(env.CAST_TIME);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
    }
});
modelLibrary.skill.fireblast = env.extend(skill, {
    graphicState: 'fireblast',
    cost: 1,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        user.shoot('fireballLarge');
        user.controlLock(env.CAST_TIME);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
    }
});
modelLibrary.skill.bomb = env.extend(skill, {
    graphicState: 'bomb',
    potency: 2,
    aoeDistance: env.TILE_SIZE*2.5,
    cost: 2,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let bomb = env.instantiate(modelLibrary.getModel('projectile', 'bomb'), user);
        bomb.center(user);
    }
});
modelLibrary.skill.fireExplosion = env.extend(skill, {
    graphicState: 'fireExplosion',
    potency: 2,
    aoeDistance: env.TILE_SIZE*4,
    cost: 6,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let effectRegion = mapManager.getRegion(user.regionId);
        user.controlLock(env.CAST_TIME);
        mapManager.event('flick', user.regionId, {graphicState: "cast", attachId: user.id});
        let maxDistance = this.aoeDistance;
        effectRegion.movables.slice().forEach(function (aMovable){
            if(aMovable.faction&user.faction || aMovable.type !== env.TYPE_ACTOR){ return;}
            if(user.distanceTo(aMovable) >= maxDistance){ return;}
            user.attack(aMovable, this.potency);
        }, this);
        mapManager.event('largeExplosion', user.regionId, {
            attachId: user.id,
            radius: this.aoeDistance
        });
    }
});
modelLibrary.skill.fireSnake = env.extend(skill, {
    graphicState: 'fireSnake',
    cost: 6,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let fireSnake = env.instantiate(modelLibrary.getModel('projectile', 'fireSnake'), user);
        fireSnake.center(user);
    }
});
modelLibrary.skill.potionHeal = env.extend(skill, {
    graphicState: 'potionHeal',
    cost: 2,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let potion = env.instantiate(modelLibrary.getModel('projectile', 'potionHeal'), user);
        potion.center(user);
    }
});
modelLibrary.skill.potionAura = env.extend(skill, {
    graphicState: 'potionAura',
    cost: 2,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let potion = env.instantiate(modelLibrary.getModel('projectile', 'potionAura'), user);
        potion.center(user);
    }
});
modelLibrary.skill.potionFire = env.extend(skill, {
    graphicState: 'potionFire',
    cost: 4,
    use(user){
        if(user.mp < this.cost){ return;}
        user.adjustMp(-this.cost);
        let potion = env.instantiate(modelLibrary.getModel('projectile', 'potionFire'), user);
        potion.center(user);
    }
});
modelLibrary.skill.growTree = env.extend(skill, {
    graphicState: 'growTree',
    cost: 4,
    use(user){
        if(user.mp < this.cost){ return;}
        //user.adjustMp(-this.cost);
        user.shoot('tree');
    }
});
//==============================================================================


//==============================================================================
modelLibrary.card.v1 = env.extend(card, {name: 'v1', levelPriest: 1});
modelLibrary.card.v2 = env.extend(card, {name: 'v2', levelPriest: 1, levelMage: -1});
modelLibrary.card.v3 = env.extend(card, {name: 'v3', levelPriest: 1, levelKnight: -1});
modelLibrary.card.v4 = env.extend(card, {name: 'v4', levelPriest: 1, levelRogue: -1});
modelLibrary.card.s1 = env.extend(card, {name: 's1', levelKnight: 1});
modelLibrary.card.s2 = env.extend(card, {name: 's2', levelKnight: 1, levelPriest: -1});
modelLibrary.card.s3 = env.extend(card, {name: 's3', levelKnight: 1, levelRogue: -1});
modelLibrary.card.s4 = env.extend(card, {name: 's4', levelKnight: 1, levelMage: -1});
modelLibrary.card.a1 = env.extend(card, {name: 'a1', levelRogue: 1});
modelLibrary.card.a2 = env.extend(card, {name: 'a2', levelRogue: 1, levelKnight: -1});
modelLibrary.card.a3 = env.extend(card, {name: 'a3', levelRogue: 1, levelMage: -1});
modelLibrary.card.a4 = env.extend(card, {name: 'a4', levelRogue: 1, levelPriest: -1});
modelLibrary.card.w1 = env.extend(card, {name: 'w1', levelMage: 1});
modelLibrary.card.w2 = env.extend(card, {name: 'w2', levelMage: 1, levelRogue: -1});
modelLibrary.card.w3 = env.extend(card, {name: 'w3', levelMage: 1, levelPriest: -1});
modelLibrary.card.w4 = env.extend(card, {name: 'w4', levelMage: 1, levelKnight: -1});
//==============================================================================        


//==============================================================================
const enemyDiagonal = enemy.archetypeDiagonal();
const enemySnake = enemy.archetypeSnake();
modelLibrary.actor['bug1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'bug1',
    score: 1,
    baseBody: 1,
    moveDelay: true,
});
modelLibrary.actor['bug2'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'bug2',
    score: 5,
    baseBody: 2,
    moveDelay: true,
});
modelLibrary.actor['bug3'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'bug3',
    score: 10,
    touchDamage: 2,
    baseBody: 4,
    moveDelay: true,
});
modelLibrary.actor['bird1'] = env.extend(enemyDiagonal, {
    graphic: 'enemiesNormal',
    graphicState: 'bird1',
    behavior: 'behaviorDiagonal',
    score: 5,
    baseBody: 1,
});
modelLibrary.actor['bird2'] = env.extend(enemyDiagonal, {
    graphic: 'enemiesNormal',
    graphicState: 'bird2',
    behavior: 'behaviorDiagonal',
    score: 15,
    baseBody: 2
});
modelLibrary.actor['bird3'] = env.extend(enemyDiagonal, {
    graphic: 'enemiesNormal',
    graphicState: 'bird1',
    behavior: 'behaviorDiagonal',
    score: 30,
    baseBody: 3,
    baseSpeed: 2
});
modelLibrary.actor['vulture1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'bird1',
    score: 10,
    movement: env.MOVEMENT_ALL,
    baseBody: 1,
    baseSpeed: 2,
    angle: 0,
    rotation: 1,
    radius: 64,
    //rotationSpeed: (Math.PI*2)/128,
    _new(){
        let result = enemy._new.apply(this, arguments);
        let TAU = Math.PI*2;
        switch(this.direction){
            case env.NORTH: case env.SOUTH: this.angle = env.pick(    0, TAU  /2); break;
            case env.WEST:  case env.EAST:  this.angle = env.pick(TAU/4, TAU*3/4); break;
            default: this.bearing = env.pick(0, TAU/4, TAU/2, TAU*3/4);
        }
        return result;
    },
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        let TAU = Math.PI*2;
        let angle2 = this.angle + TAU/2;
        if(     angle2 > TAU){ angle2 -= TAU;}
        else if(angle2 < 0  ){ angle2 += TAU;}
        let centerX = this.x + Math.cos(angle2)*this.radius;
        let centerY = this.y + Math.sin(angle2)*this.radius;
        this.angle += this.baseSpeed/this.radius;
        let deltaX = centerX + Math.cos(this.angle)*this.radius - this.x;
        let deltaY = centerY + Math.sin(this.angle)*this.radius - this.y;
        this.translate(deltaX, deltaY);
        if(Math.random() < 1/38){
            let radiusAdjust = env.pick(-16,-8, 8, 16);
            if(radiusAdjust === -this.radius){
                this.radius *= -1;
            } else{
                this.radius = Math.min(64, Math.max(-64, radiusAdjust));
            }
        } else if(Math.random() < 1/128){
            this.radius = 64*env.sign(this.radius);
        }
        return false;
    },
    /*behaviorDiagonal(trigger, options){
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
    },*/
    stopHorizontal(){
        let TAU = Math.PI*2;
        this.angle = TAU - this.angle;
    },
    stopVertical(){
        let TAU = Math.PI*2;
        if(this.angle < TAU/2){
            this.angle = TAU/2 - this.angle;
        } else{
            this.angle = TAU*(3/2) - this.angle;
        }
    }
});
modelLibrary.actor['vulture2'] = env.extend(modelLibrary.actor.vulture1, {
    graphicState: 'bird2',
    score: 30,
    baseBody: 2
});
modelLibrary.actor['vulture3'] = env.extend(modelLibrary.actor.vulture1, {
    graphicState: 'bird3',
    score: 60,
    baseBody: 3,
    baseSpeed: 3
});
modelLibrary.actor['goblin1'] = env.extend(enemy, {
    graphic: 'goblin1',
    //graphicState: 'goblin1',
    projectileType: 'arrowEnemy',
    score: 3,
    baseBody: 2,
    moveDelay: true,
});
modelLibrary.actor['goblin2'] = env.extend(enemy, {
    graphic: 'goblin1',
    //graphicState: 'goblin2',
    projectileType: 'arrowEnemy',
    score: 10,
    baseBody: 3,
    moveDelay: true,
});
modelLibrary.actor['goblin3'] = env.extend(enemy, {
    graphic: 'goblin2',
    //graphicState: 'goblin3',
    projectileType: 'arrowEnemy',
    touchDamage: 2,
    score: 20,
    baseBody: 4,
    moveDelay: true,
});
modelLibrary.actor['mummy1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'mummy1',
    score: 10,
    taxonomy: env.TAXONOMY_UNDEAD,
    baseBody: 3,
    moveDelay: true,
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        if(trigger === env.TRIGGER_TAKE_TURN && Math.random()*64 <= 1){
            this.direction = 1 << env.randomInterval(0,3);
            this.update('direction');
            this.invulnerable(12);
            mapManager.sequence('charge', this.regionId, {targetId: this.id});
            return true;
        } else{
            return enemy.trigger.apply(this, arguments);
        }
    }
});
modelLibrary.actor['mummy2'] = env.extend(modelLibrary.actor.mummy1, {
    graphicState: 'mummy2',
    score: 23,
    baseBody: 5,
    touchDamage: 2,   });
modelLibrary.actor['mummy3'] = env.extend(modelLibrary.actor.mummy1, {
    graphicState: 'mummy3',
    score: 40,
    baseBody: 7,
    touchDamage: 2,
});
modelLibrary.actor['ghost1'] = env.extend(enemyDiagonal, {
    graphic: 'enemiesNormal',
    graphicState: 'ghost1',
    behavior: 'behaviorDiagonal',
    taxonomy: env.TAXONOMY_UNDEAD,
    score: 5,
    baseBody: 2
});
modelLibrary.actor['ghost2'] = env.extend(enemyDiagonal, {
    graphic: 'enemiesNormal',
    graphicState: 'ghost2',
    behavior: 'behaviorDiagonal',
    taxonomy: env.TAXONOMY_UNDEAD,
    score: 15,
    baseBody: 3
});
modelLibrary.actor['ghost3'] = env.extend(enemyDiagonal, {
    graphic: 'enemiesNormal',
    graphicState: 'ghost3',
    behavior: 'behaviorDiagonal',
    taxonomy: env.TAXONOMY_UNDEAD,
    touchDamage: 2,
    score: 25,
    baseBody: 5
});
modelLibrary.actor['cobra1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'snake1',
    score: 3,
    baseBody: 1,
});
modelLibrary.actor['cobra2'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'snake2',
    score: 10,
    baseBody: 2,
    baseSpeed: 2
});
modelLibrary.actor['cobra3'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'snake3',
    score: 20,
    baseBody: 2,
    baseSpeed: 3
});
modelLibrary.actor['bombshell1'] = env.extend(enemy, {
    baseSpeed: 2,
    projectileType: 'bomb',
    shootFrequency: 128,
    score: 10,
    hiding: false,
    hurt(amount,attacker,proxy){
        if(this.hiding){
            //game.audio.play_sound("defend")
            return 0;
        }
        return enemy.hurt.apply(this, arguments);
    },
    graphic: 'enemiesNormal',
    graphicState: 'bombshell1',
    graphicStateLevel: 1,
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        if(!this.hiding){
            if(Math.random() < 1/128){
                this.hiding = true;
                this.graphicState = 'bombshell'+this.graphicStateLevel+'Hide';
                this.update('graphicState');
            }
        } else{
            if(Math.random() < 1/32){
                let target = this.findTarget(env.TILE_SIZE*3);
                if(target){
                    this.shoot();
                    //change direction
                    this.graphicState = 'bombshell'+this.graphicStateLevel;
                    this.update('graphicState');
                    this.hiding = false;
                    return true;
                }
            }
        }
        if(!this.hiding){
            return enemy.trigger.apply(this, arguments);
        } else{
            return true;
        }
    },
});
modelLibrary.actor['bombshell2'] = env.extend(modelLibrary.actor.bombshell1, {
    shootFrequency: 96,
    score: 20,
    graphicState: 'bombshell2',
    graphicStateLevel: 2,
    baseBody: 3
});
modelLibrary.actor['bombshell3'] = env.extend(modelLibrary.actor.bombshell1, {
    shootFrequency: 64,
    score: 30,
    graphicState: 'bombshell3',
    graphicStateLevel: 3,
    baseSpeed: 2,
    baseBody: 3
});
modelLibrary.actor['antLion1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'antLion1',
    score: 5,
    height: 8,
    width: 8,
    appearance: 0,
    appearX: 0,
    appearY: 0,
    hidden: true,
    shove(){},
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        if(this.appearance <= 0){
            this.hidden = true;
            this.appearX = env.randomInterval(1,gameManager.currentGame.currentWave.width -2)*env.TILE_SIZE;
            this.appearY = env.randomInterval(1,gameManager.currentGame.currentWave.height-2)*env.TILE_SIZE;
            this.x = this.appearX;
            this.y = this.appearY;
            mapManager.event('animate', this.regionId, {
                graphic: 'enemiesNormal', graphicState: 'antLionEyes',
                center: this, timeLimit: 50
            });
            this.x = null;
            this.y = null;
            this.update('x', null);
            this.update('y', null);
            this.appearance = 200;
        } else if(this.appearance === 200-50){
            this.x = this.appearX;
            this.y = this.appearY;
            this.update('x');
            this.update('y');
            this.hidden = false;
            this.shoot('quicksand');
        } else if(this.appearance === 50){
            this.x = null;
            this.y = null;
            this.update('x', null);
            this.update('y', null);
            this.hidden = true;
        } else if(this.appearance < 140 && this.appearance > 60 && Math.random() < 1/80){
            this.appearance += 20;
        }
        this.appearance--;
        return true;
    }
});
modelLibrary.actor['antLion2'] = env.extend(modelLibrary.actor.antLion1, {
    graphicState: 'antLion2',
    baseBody: 3,
    touchDamage: 2,
    score: 13
});
modelLibrary.actor['antLion3'] = env.extend(modelLibrary.actor.antLion1, {
    graphicState: 'antLion3',
    baseBody: 5,
    touchDamage: 2,
    score: 28
});
modelLibrary.actor['knight1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'knight1',
    score: 5,
    baseBody: 1,
    frontProtection: true,
    moveDelay: true
});
modelLibrary.actor['knight2'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'knight2',
    score: 12,
    baseBody: 3,
    frontProtection: true,
    moveDelay: true
});
modelLibrary.actor['knight3'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'knight3',
    score: 20,
    baseBody: 5,
    frontProtection: true,
    moveDelay: true
});
modelLibrary.actor['templar1'] = env.extend(enemy, {
    graphic: 'templar1',
    score: 20,
    baseBody: 3,
    frontProtection: true,
    moveDelay: true,
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        if(Math.random() < 1/64){
            mapManager.sequence('sword', this.regionId, {
                attackerId: this.id
            });
        }
        return enemy.trigger.apply(this, arguments);
    }
});
modelLibrary.actor['templar2'] = env.extend(modelLibrary.actor.templar1, {
    graphic: 'templar2',
    score: 30,
    baseBody: 5,
    frontProtection: true,
    moveDelay: true
});
modelLibrary.actor['templar3'] = env.extend(modelLibrary.actor.templar1, {
    graphic: 'templar3',
    score: 30,
    baseBody: 7,
    frontProtection: true,
    moveDelay: true
});
modelLibrary.actor['kzussy1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'kzussy1',
    projectileType: 'acid',
    shootFrequency: 48,
    score: 3,
    moveDelay: true,
    shoot: function(){
        this.direction = env.directionFlip(this.direction);
        this.update('direction');
        return enemy.shoot.apply(this, arguments);
    }
});
modelLibrary.actor['kzussy2'] = env.extend(modelLibrary.actor.kzussy1, {
    graphic: 'enemiesNormal',
    graphicState: 'kzussy2',
    score: 10,
    baseBody: 2
});
modelLibrary.actor['kzussy3'] = env.extend(modelLibrary.actor.kzussy1, {
    graphic: 'enemiesNormal',
    graphicState: 'kzussy3',
    score: 20,
    baseBody: 3
});
modelLibrary.actor['evilEye1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'eye1',
    score: 20,
    baseBody: 2,
    moveDelay: true,
    exploding: false,
    explodeRadius: 24,
    die(){
        if(!this.exploding){
            this.exploding = true;
            let self = this;
            mapManager.sequence('overload', this.regionId, {
                targetId: this.id,
                duration: 32,
                radius: this.explodeRadius,
                callback(){
                    enemy.die.apply(self);
                }
            });
        } else{
            enemy.die.apply(this, arguments);
        }
    }
});
modelLibrary.actor['evilEye2'] = env.extend(modelLibrary.actor.evilEye1, {
    graphicState: 'eye2',
    score: 30,
    baseBody: 4
});
modelLibrary.actor['evilEye3'] = env.extend(modelLibrary.actor.evilEye1, {
    graphicState: 'eye3',
    score: 50,
    baseBody: 4,
    explodeRadius: 32
});
modelLibrary.actor['imp1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'imp1',
    taxonomy: env.TAXONOMY_DEMON,
    score: 2,
    moveDelay: true,
});
modelLibrary.actor['imp2'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'imp2',
    taxonomy: env.TAXONOMY_DEMON,
    score: 15,
    moveDelay: true,
    projectileType: 'fireballEnemy',
    baseBody: 2
});
modelLibrary.actor['imp3'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'imp3',
    taxonomy: env.TAXONOMY_DEMON,
    score: 30,
    moveDelay: true,
    projectileType: 'fireballEnemy',
    baseBody: 4
});
modelLibrary.actor['vampire1'] = env.extend(enemy, {
    graphic: 'enemiesNormal',
    graphicState: 'vampire1',
    taxonomy: env.TAXONOMY_UNDEAD,
    moveDelay: true,
    enemyLevel: 1,
    baseBody: 2,
    score: 10,
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        if(Math.random() < 1/64){
            if(!this.transformInfo){
                this.graphicState = 'bat'+this.enemyLevel;
                this.height = 8;
                this.update('graphicState');
                this.moveDelay = false;
                this.movement = env.MOVEMENT_ALL;
                this.transformInfo = {};
                let target = this.findTarget();
                if(target){
                    this.transformInfo.targetId = target.id;
                }
            } else{
                this.graphicState = 'vampire'+this.enemyLevel;
                this.height = 16;
                this.update('graphicState');
                this.update('height');
                this.moveDelay = true;
                this.movement = env.MOVEMENT_FLOOR;
                this.transformInfo = null;
            }
        }
        if(this.transformInfo && Math.random() < 1/16){
            let target = mapManager.idManager.get(this.transformInfo.targetId);
            if(target){
                this.direction = this.directionTo(target);
                this.update('direction');
                //return true;
            }
        }
        return enemy.trigger.apply(this, arguments);
    }
});
modelLibrary.actor['vampire2'] = env.extend(modelLibrary.actor.vampire1, {
    graphicState: 'vampire2',
    enemyLevel: 2,
    baseBody: 4,
    score: 20
});
modelLibrary.actor['vampire3'] = env.extend(modelLibrary.actor.vampire1, {
    graphicState: 'vampire3',
    enemyLevel: 3,
    baseBody: 6,
    score: 40
});
modelLibrary.actor['spine1'] = env.extend(enemySnake, {
    graphic: 'enemiesNormal',
    graphicState: 'skull1',
    width: 12,
    height: 16,
    length: 4,
    bodyWidth: 8,
    bodyState: 'spine1',
    bodyInvulnerable: true,
    score: 20,
    //
    bodyHealth: 1,
    taxonomy: env.TAXONOMY_UNDEAD,
});
modelLibrary.actor['spine2'] = env.extend(enemySnake, {
    graphic: 'enemiesNormal',
    graphicState: 'skull2',
    width: 12,
    height: 16,
    length: 4,
    bodyWidth: 8,
    bodyState: 'spine2',
    bodyInvulnerable: true,
    score: 50,
    projectileType: 'bone',
    //
    bodyHealth: 1,
    taxonomy: env.TAXONOMY_UNDEAD,
});
modelLibrary.actor['spine3'] = env.extend(enemySnake, {
    graphic: 'enemiesNormal',
    graphicState: 'skull3',
    width: 12,
    height: 16,
    length: 8,
    bodyWidth: 8,
    bodyState: 'spine3',
    bodyInvulnerable: true,
    score: 90,
    projectileType: 'bone',
    //
    bodyHealth: 4,
    taxonomy: env.TAXONOMY_UNDEAD,
});
modelLibrary.actor['fireWall1'] = env.extend(enemySnake, {
    graphic: 'projectiles',
    graphicState: 'fire1',
    bodyState: 'fire1',
    touchDamage: 2,
    length: 4,
    score: 15,
    baseBody: 1,
    bodyHealth: 1,
    baseSpeed: 1/2
});
modelLibrary.actor['fireWall2'] = env.extend(enemySnake, {
    graphic: 'projectiles',
    graphicState: 'fire2',
    bodyState: 'fire2',
    touchDamage: 2,
    length: 4,
    score: 15,
    baseBody: 2,
    bodyHealth: 2
});
modelLibrary.actor['fireWall3'] = env.extend(enemySnake, {
    graphic: 'projectiles',
    graphicState: 'fire3',
    bodyState: 'fire3',
    touchDamage: 2,
    length: 4,
    score: 70,
    baseBody: 1,
    bodyHealth: 3,
    baseSpeed: 2
});
modelLibrary.actor['lordKnight1'] = env.extend(enemy, {
    graphic: 'lordKnight1',
    width: 24,
    height: 24,
    baseBody: 6,
    touchDamage: 2,
    frontProtection: true,
    moveDelay: true,
    score: 40,
    shootFrequency: 96,
    hurt(damage, attacker, proxy){
        let shielded = false;
        if(proxy && this.frontProtection && !proxy.omnidirectional){
            if(proxy.melee){
                recoilDir = attacker.direction;
            } else{
                recoilDir = proxy.cardinalTo(this);
            }
            let shieldedDirection = env.directionFlip(this.direction);
            if(proxy.direction === shieldedDirection){ shielded = true;}
            else if(shieldedDirection & recoilDir){ shielded = true;}
        }
        if(shielded){
            return 0;
        } else{
            return enemy.hurt.apply(this, arguments);
        }
    },
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        if(Math.random() < 1/32){
            let target = this.findTarget();
            if(target){
                this.direction = this.directionTo(target);
                this.update('direction');
            }
        } else if(Math.random() < 1/this.shootFrequency){
            mapManager.sequence('lance', this.regionId, {
                attackerId: this.id
            });
        }
        return enemy.trigger.apply(this, arguments);
    }
});
modelLibrary.actor['lordKnight2'] = env.extend(modelLibrary.actor.lordKnight1, {
    graphic: 'lordKnight2',
    width: 24,
    height: 24,
    score: 80,
    baseBody: 9,
    shootFrequency: 64
});
modelLibrary.actor['lordKnight3'] = env.extend(modelLibrary.actor.lordKnight1, {
    graphic: 'lordKnight3',
    width: 24,
    height: 24,
    score: 160,
    baseBody: 12,
    shootFrequency: 48
});
modelLibrary.actor['spider1'] = env.extend(enemy, {
    graphic: 'enemiesLarge',
    graphicState: 'spider1',
    width: 32,
    height: 32,
    movement: env.MOVEMENT_ALL,
    projectileType: 'silk',
    shootFrequency: 64,
    moveDelay: true,
    baseBody: 4,
    touchDamage: 1,
    score: 30,
    shoot(projectileId){
        this.direction = env.directionFlip(this.direction);
        let result = enemy.shoot.apply(this, arguments);
        this.direction = env.directionFlip(this.direction);
        return result;
    }
});
modelLibrary.actor['spider2'] = env.extend(modelLibrary.actor.spider1, {
    graphicState: 'spider2',
    shootFrequency: 48,
    baseBody: 6,
    moveDelay: false,
    score: 60
});
modelLibrary.actor['spider3'] = env.extend(modelLibrary.actor.spider1, {
    graphicState: 'spider3',
    shootFrequency: 32,
    baseBody: 8,
    baseSpeed: 2,
    score: 120
});
modelLibrary.actor['scorpion1'] = env.extend(enemy, {
    graphic: 'enemiesLarge',
    graphicState: 'scorpion1',
    enemyLevel: 1,
    width: 28,
    height: 28,
    baseBody: 6,
    moveDelay: true,
    touchDamage: 2,
    score: 45,
    _new: (function (){
        let forcePlace = function (x, y, regionId){
            let success = movable.place.apply(this, arguments);
            if(success){ return success;}
            //
            let ownRegion = mapManager.getRegion(regionId || this.regionId);
            if(!ownRegion){ return false;}
            if(this.regionId !== ownRegion.id){
                this.unplace();
                this.regionId = ownRegion.id;
                ownRegion.movables.push(this);
                this.update(this.pack());
            }
            //
            this.x = x;
            this.y = y;
            this.update('x', x);
            this.update('y', y);
            return true;
        };
        let sClaw = env.extend(projectile, {
            graphic: 'enemiesLarge',
            melee: true,
            projecting: false,
            normalSpeed: 0,
            potency: 2,
            persistent: true,
            omnidirectional: true,
            place: forcePlace
        });
        let sSegment = env.extend(movable, {
            graphic: 'enemiesLarge',
            place: forcePlace
        });
        let sTip = env.extend(projectile, {
            graphic: 'enemiesLarge',
            melee: true,
            projecting: false,
            normalSpeed: 0,
            potency: 2,
            persistent: true,
            omnidirectional: true,
            place: forcePlace
        });
        return function (){
            let result = enemy._new.apply(this, arguments);
            this.clawRight = env.instantiate(sClaw, this);
            this.clawRight.graphicState = 'scorpionClawRight'+this.enemyLevel;
            this.clawRight.update('graphicState');
            this.clawLeft = env.instantiate(sClaw, this);
            this.clawLeft.graphicState = 'scorpionClawLeft'+this.enemyLevel;
            this.clawLeft.update('graphicState');
            this.segment1 = env.instantiate(sSegment);
            this.segment1.graphicState = 'scorpionSegment'+this.enemyLevel;
            this.segment1.update('graphicState');
            this.segment2 = env.instantiate(sSegment);
            this.segment2.graphicState = 'scorpionSegment'+this.enemyLevel;
            this.segment2.update('graphicState');
            this.segment3 = env.instantiate(sSegment);
            this.segment3.graphicState = 'scorpionSegment'+this.enemyLevel;
            this.segment3.update('graphicState');
            this.tailTip = env.instantiate(sTip, this);
            this.tailTip.graphicState = 'scorpionTip'+this.enemyLevel;
            this.tailTip.update('graphicState');
            return result;
        };
    })(),
    dispose(){
        this.clawLeft.dispose();
        this.clawRight.dispose();
        this.segment1.dispose();
        this.segment2.dispose();
        this.segment3.dispose();
        this.tailTip.dispose();
        return movable.dispose.apply(this, arguments);
    },
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        // Tail
        if(this.targetInfo){
            if(this.targetInfo.time++ === 0){
                this.tailTip.graphicState = 'scorpionTipAcid';
                this.tailTip.update('graphicState');
                this.tailTip.place(this.x-2+11, this.y+25+12, this.regionId);
            } else if(this.targetInfo.time < 16){
                this.tailTip.place(this.x-2+11, this.y+25+12, this.regionId);
            } else if(this.targetInfo.time < 32+16){
                let P = (this.targetInfo.time-16)/32;
                let deltaX = this.targetInfo.x - (this.x-2+11);
                let deltaY = this.targetInfo.y - (this.y+25+12);
                this.tailTip.place(
                    (this.x-2+11) + deltaX*P,
                    (this.y+25+12) + deltaY*P
                );
                this.segment1.place(this.x-2+11+(deltaX*P)*1/4, this.y+25+(deltaY*P)*1/4);
                this.segment2.place(this.x-2+11+(deltaX*P)*2/4, this.y+25+4+(deltaY*P)*2/4);
                this.segment3.place(this.x-2+11+(deltaX*P)*3/4, this.y+25+8+(deltaY*P)*3/4);
            } else if(this.targetInfo.time === 32+16){
                this.tailTip.place(this.targetInfo.x, this.targetInfo.y);
                let acid = this.shoot('acid');
                acid.center(this.tailTip);
                this.tailTip.graphicState = 'scorpionTip'+this.enemyLevel;
                this.tailTip.update('graphicState');
            } else if(this.targetInfo.time < 32+16+8){
                this.tailTip.place(this.targetInfo.x, this.targetInfo.y);
            } else{
                let P = 1-(this.targetInfo.time-(32+16+8))/48;
                let deltaX = this.targetInfo.x - (this.x-2+11);
                let deltaY = this.targetInfo.y - (this.y+25+12);
                this.tailTip.place(
                    (this.x-2+11) + deltaX*P,
                    (this.y+25+12) + deltaY*P
                );
                this.segment1.place(this.x-2+11+(deltaX*P)*1/4, this.y+25+(deltaY*P)*1/4);
                this.segment2.place(this.x-2+11+(deltaX*P)*2/4, this.y+25+4+(deltaY*P)*2/4);
                this.segment3.place(this.x-2+11+(deltaX*P)*3/4, this.y+25+8+(deltaY*P)*3/4);
            }
            if(this.targetInfo.time > 16+32+48){
                this.targetInfo = null;
            }
        } else if(Math.random() < 1/64){
            let target = this.findTarget();
            if(target){
                this.targetInfo = {
                    time: 0,
                    x: target.x+(target.width -this.tailTip.width )/2,
                    y: target.y+(target.height-this.tailTip.height)/2
                };
            }
        } else{
            enemy.trigger.apply(this, arguments);
            this.tailTip.place(this.x-2+11, this.y+25+12, this.regionId);
            this.segment1.place(this.x-2+11, this.y+25, this.regionId);
            this.segment2.place(this.x-2+11, this.y+25+4, this.regionId);
            this.segment3.place(this.x-2+11, this.y+25+8, this.regionId);
        }
        // Claws
        if(this.clawingLeft){
            if(this.clawingLeft < 12){
                this.clawLeft.place(this.x-5, (this.y-8)-this.clawingLeft, this.regionId);
                this.clawingLeft++
            } else if(this.clawingLeft < 24){
                this.clawLeft.place(this.x-5, (this.y-8)+(-24+this.clawingLeft), this.regionId);
                this.clawingLeft++
            } else{
                this.clawingLeft = 0;
            }
        } else{
            if(Math.random() < 1/32){ this.clawingLeft = 1;}
            this.clawLeft.place(this.x-5, this.y-8, this.regionId);
        }
        if(this.clawingRight){
            if(this.clawingRight < 12){
                this.clawRight.place(this.x+17, (this.y-8)-this.clawingRight, this.regionId);
                this.clawingRight++
            } else if(this.clawingRight < 24){
                this.clawRight.place(this.x+17, (this.y-8)+(-24+this.clawingRight), this.regionId);
                this.clawingRight++
            } else{
                this.clawingRight = 0;
            }
        } else{
            if(Math.random() < 1/32){ this.clawingRight = 1;}
            this.clawRight.place(this.x+17, this.y-8, this.regionId);
        }
        //
        return true;
    }
});
modelLibrary.actor['scorpion2'] = env.extend(modelLibrary.actor.scorpion1, {
    graphicState: 'scorpion2',
    enemyLevel: 2,
    baseBody: 9,
    score: 90
});
modelLibrary.actor['scorpion3'] = env.extend(modelLibrary.actor.scorpion1, {
    graphicState: 'scorpion3',
    enemyLevel: 3,
    baseBody: 12,
    score: 180,
});
modelLibrary.actor['skullLarge1'] = env.extend(enemy, {
    graphic: 'enemiesLarge',
    graphicState: 'skull1',
    taxonomy: env.TAXONOMY_UNDEAD,
    width: 22,
    height: 26,
    movement: env.MOVEMENT_ALL,
    enemyLevel: 1,
    baseBody: 8,
    touchDamage: 2,
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        let M = env.FLY_HEIGHT/2;
        if(!this.bounceTime){
            this.bounceTime = 0;
        }
        this.bounceTime = (++this.bounceTime)%(M*2);
        let P = Math.pow((this.bounceTime-M)/M, 2);
        if(P === 1){
            if(!this.smashy){
                if(Math.random()*16 < 3){
                    let smashyPlayer = env.arrayPick(gameManager.currentGame.players);
                    let smashyHero;
                    if(smashyPlayer && smashyPlayer.hero){
                        smashyHero = mapManager.idManager.get(smashyPlayer.hero.id);
                    }
                    if(smashyHero){
                        this.direction = this.directionTo(smashyHero);
                        this.smashyId = smashyHero.id;
                        this.smashy = 3;
                    }
                }
            } else{
                if(this.smashyId){
                    let target = mapManager.idManager.get(this.smashyId);
                    if(target){
                        this.direction = this.directionTo(target);
                    }
                }
                this.smashy--
            }
        }
        if(this.smashy){M = env.FLY_HEIGHT/4;}
        this.z = -(M*2)*(P)+(M*2);
        if(this.z > 10){ this.graphicState = 'skull'+this.enemyLevel+'Open';}
        else{ this.graphicState = 'skull'+this.enemyLevel;}
        if(!this.z){ this.z = 0.1;}
        this.update('graphicState')
        this.update('z');
        if(this.z > env.FLY_HEIGHT){console.log('oops', this.z)}
        return enemy.trigger.apply(this, arguments);
    },
    speed(){
        let result = enemy.speed.apply(this, arguments);
        if(this.smashy){
            result *= 2;
        }
        return result;
    }
});
modelLibrary.actor['skullLarge2'] = env.extend(modelLibrary.actor.skullLarge1, {
    graphicState: 'skull2',
    enemyLevel: 2,
    baseBody: 13,
    score: 60
});
/*modelLibrary.actor['skullLarge3'] = env.extend(modelLibrary.actor.skullLarge1, {
    graphicState: 'skull3',
    enemyLevel: 3,
    baseBody: 19,
    score: 100
});*/
modelLibrary.actor['blobLarge1'] = env.extend(enemy, {
    graphic: 'enemiesLarge',
    graphicState: 'blobFront1',
    blobLevel: 1,
    width: 24,
    height: 26,
    touchDamage: 2,
    underlay: undefined,
    moveDelay: true,
    baseBody: 7,
    score: 40,
    hostageId: undefined,
    _new: (function (){
        let blobUnderlay = env.extend(movable, {
            graphic: 'enemiesLarge',
            graphicLayer: env.LAYER_UNDER,
            movement: env.MOVEMENT_ALL,
            width: 24,
            height:24,
        });
        return function (){
            let result = enemy._new.apply(this, arguments);
            this.underlay = env.instantiate(blobUnderlay, this);
            this.underlay.graphicState = 'blobBack'+this.blobLevel;
            this.underlay.update('graphicState');
            return result;
        };
    })(),
    place(){
        let result = enemy.place.apply(this, arguments);
        this.underlay.place(this.x, this.y, this.regionId);
    },
    dispose(){
        this.underlay.dispose();
        return movable.dispose.apply(this, arguments);
    },
    attack(target, amount, proxy){
        if(target && (target.id === this.hostageId)){ return 0}
        if(this.jumpInfo){ return 0;}
        let result = enemy.attack.apply(this, arguments);
        // Capture target as hostage, but only if no hostage already.
        if(result && target && !this.hostageId &&
            (target.hp > 0 && this.distanceTo(target) < 1)
        ){
            this.hostageId = target.id;
            target.center(this);
        }
        return result;
    },
    hurt(damage, attacker, proxy){
        // Skip if attacker is hostage, unless proxy is omnidirectional.
        if(attacker && (attacker.id === this.hostageId)){
            if(!(proxy && proxy.omnidirectional)){
                return 0;
            }
        }
        // Do the normal thing.
        let result = enemy.hurt.apply(this, arguments);
        // If not jumping, jump randomly.
        if(!this.jumpInfo && this.hp > 0 && Math.random() < 1/4){
            this.jump();
        }
        // Return the normal result.
        return result;
    },
    walk(){
        let oldX = this.x;
        let oldY = this.y;
        let result = enemy.walk.apply(this, arguments);
        if(this.x !== oldX || this.y !== oldY){ this.jumpFrustration = 0;}
        else if( this.jumpFrustration++ > 3){
            this.jumpFrustration = 0;
            this.jump();
        }
        return result;
    },
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        // Center the hostage. Forget it if dead or disposed.
        if(this.hostageId){
            let hostage = mapManager.idManager.get(this.hostageId);
            if(!hostage){
                this.hostageId = null;
            } else if(this.distanceTo(hostage) > -hostage.width/2){
                this.hostageId = null;
            } else{
                hostage.center(this);
            }
        }
        // Calculate jump arc if jumping.
        if(this.jumpInfo){
            let maxT = 48;
            let T = this.jumpInfo.time++;
            let P = ((T/maxT)*2)-1;
            this.z = Math.floor((-Math.pow(P, 2)+1)*96);
            this.underlay.z = this.z;
            this.underlay.update('z');
            this.update('z');
            this.translate(
                Math.ceil((this.jumpInfo.x- this.width/2 - this.x)/10),
                Math.ceil((this.jumpInfo.y-this.height/2 - this.y)/10)
            );
            if(T >= maxT){ this.land()}
            return true;
        } else{
        // Jump Randomly.
            if(Math.random() < 1/128){
                this.jump();
            }
        // Return the normal result.
            return enemy.trigger.apply(this, arguments);
        }
    },
    jump(){
        // Return if already jumping.
        if(this.jumpInfo){ return;}
        // Find target. If the only player is the hostage, pick a random spot.
        let targetPlayer = env.arrayPick(gameManager.currentGame.players);
        if(!targetPlayer || !targetPlayer.hero){ return;}
        let targetHero = mapManager.idManager.get(targetPlayer.hero.id);
        this.jumpInfo = {time: 0};
        if(targetHero && (targetHero.id !== this.hostageId)){
            this.jumpInfo.x = Math.floor(targetHero.x + targetHero.width /2);
            this.jumpInfo.y = Math.floor(targetHero.y + targetHero.height/2);
        } else{ // pick a random spot;
            this.jumpInfo.x = env.randomInterval(1,env.DEFAULT_MAP_SIZE-2)*env.TILE_SIZE;
            this.jumpInfo.y = env.randomInterval(1,env.DEFAULT_MAP_SIZE-2)*env.TILE_SIZE;
        }
        this.movement = env.MOVEMENT_ALL;
        // Release hostage, give invulnerability
        let hostage = mapManager.idManager.get(this.hostageId);
        if(hostage){
            hostage.invulnerable(env.INVULNERABLE_TIME);
        }
        this.hostageId = null;
        // Change graphics
        this.graphicState = 'blobJump'+this.blobLevel;
        this.update('graphicState');
        this.underlay.graphicState = 'blobEmpty'+this.blobLevel;
        this.underlay.update('graphicState');
    },
    land(){
        this.jumpInfo = null;
        this.movement = env.MOVEMENT_FLOOR;
        this.z = 0;
        this.update('z');
        this.underlay.z = this.z;
        this.underlay.update('z');
        this.graphicState = 'blobFront'+this.blobLevel;
        this.update('graphicState');
        this.underlay.graphicState = 'blobBack'+this.blobLevel;
        this.underlay.update('graphicState');
    }
});
modelLibrary.actor['blobLarge2'] = env.extend(modelLibrary.actor.blobLarge1, {
    graphicState: 'blobFront2',
    blobLevel: 2,
    baseBody: 13,
    score: 65,
});
modelLibrary.actor['blobLarge3'] = env.extend(modelLibrary.actor.blobLarge1, {
    graphicState: 'blobFront3',
    blobLevel: 3,
    baseBody: 19,
    score: 120,
});
modelLibrary.actor['drake1'] = env.extend(enemy, {
    graphic: 'enemiesLarge',
    graphicState: 'drake1',
    enemyLevel: 1,
    width: 28,
    height: 28,
    baseBody: 6,
    score: 40,
    touchDamage: 2,
    projectileType: 'fireballLarge',
    hurt(){
        let result = enemy.hurt.apply(this, arguments);
        if(!this.flapping && result && this.hp > 0){
            this.graphicState = 'drakeFlap'+this.enemyLevel;
            this.update('graphicState');
            this.flapping = 96;
        }
        return result;
    },
    trigger(trigger, options){
        if(!(trigger === env.TRIGGER_TAKE_TURN && this.flapping)){
            return enemy.trigger.apply(this, arguments);
        }
        this.flapping--;
        if(!(this.flapping%8)){
            let maxDistance = env.TILE_SIZE*2;
            let effectRegion = mapManager.getRegion(this.regionId);
            /*effectRegion.movables.slice().forEach(function (aMovable){
                if(aMovable.faction&this.faction || aMovable.type !== env.TYPE_ACTOR){ return;}
                if(this.distanceTo(aMovable) >= maxDistance){ return;}
                mapManager.sequence('shove', this.regionId, {
                    targetId: aMovable.id,
                    direction: this.directionTo(aMovable),
                    speed: 2,
                    duration: 4
                });
            }, this);
            */
            let puffs = 4;
            while(puffs--){
                    let angle = Math.random() * Math.PI*2;
                    let puff = this.shoot('pushPuff');
                    puff.maxRange -= env.randomInterval(0,16);
                    puff.center(this);
                    puff.angleProject(angle, 3);
            }
            mapManager.event('wind', this.regionId, {
                x: this.x+this.width /2,
                y: this.y+this.height/2,
                radius: maxDistance+env.TILE_SIZE
            });
        }
        if(!this.flapping){
            this.graphicState = 'drake'+this.enemyLevel;
            this.update('graphicState');
        }
        return true;
    }
});
modelLibrary.actor['drake2'] = env.extend(modelLibrary.actor.drake1, {
    graphic: 'enemiesLarge',
    graphicState: 'drake2',
    enemyLevel: 2,
    baseBody: 9,
    moveDelay: false,
    score: 60
});
modelLibrary.actor['drake3'] = env.extend(modelLibrary.actor.drake1, {
    graphic: 'enemiesLarge',
    graphicState: 'drake3',
    enemyLevel: 3,
    baseBody: 12,
    baseSpeed: 2,
    moveDelay: false,
    score: 100
});
modelLibrary.actor['demon1'] = env.extend(enemy, {
    graphic: 'enemiesLarge',
    graphicState: 'demon1',
    taxonomy: env.TAXONOMY_DEMON,
    width: 32,
    height: 32,
    baseBody: 7,
    score: 40,
    enemyLevel: 1,
    moveDelay: true,
    touchDamage: 2,
    skillFrequency: 96,
    //
    batType: 'bat1',
    walk(){
        let oldX = this.x;
        let oldY = this.y;
        let result = enemy.walk.apply(this, arguments);
        if(this.x !== oldX || this.y !== oldY){ this.jumpFrustration = 0;}
        else if( this.jumpFrustration++ > 3){
            this.jumpFrustration = 0;
            this.skillInfo = {name: 'teleport', time: 0};
            this.graphicState = 'demonBlack';
            this.update('graphicState');
            this.movement = env.MOVEMENT_ALL;
            this.z = env.FLY_HEIGHT;
            this.update('z');
            let target = this.findTarget();
            if(!target){ return false;}
            this.skillInfo.x = target.x+(target.width -this.width )/2;
            this.skillInfo.y = target.y+(target.height-this.height)/2;
        }
        return result;
    },
    trigger(trigger, options){
        if(trigger !== env.TRIGGER_TAKE_TURN){
            return enemy.trigger.apply(this, arguments);
        }
        // If not doing skill, randomly start skill.
        if(!this.skillInfo && Math.random() < 1/this.skillFrequency){
            // Randomly select skill, set variables
            this.skillInfo = {
                name: env.pick('fire', 'fire', 'teleport'),
                time: 0
            }
            let target;
            switch(this.skillInfo.name){
                case 'fire':
                    this.graphicState = 'demonBreathe'+this.enemyLevel;
                    this.update('graphicState');
                    target = this.findTarget();
                    if(!target){ return false;}
                    this.skillInfo.angle = Math.atan2(target.y-this.y, target.x-this.x);
                    this.skillInfo.angle -= (Math.PI*2)/8
                    break;
                case 'teleport':
                    this.graphicState = 'demonBlack';
                    this.update('graphicState');
                    this.movement = env.MOVEMENT_ALL;
                    this.z = env.FLY_HEIGHT;
                    this.update('z');
                    target = this.findTarget();
                    if(!target){ return false;}
                    this.skillInfo.x = target.x+(target.width -this.width )/2;
                    this.skillInfo.y = target.y+(target.height-this.height)/2;
            }
        }
        // If doing skill
        if(this.skillInfo){
            switch(this.skillInfo.name){
                case 'fire':
                    if(!(this.skillInfo.time%3)){
                        let flame = this.shoot('flame');
                        flame.angleProject(this.skillInfo.angle, 4);
                        flame.maxRange = 64;
                        this.skillInfo.angle += (Math.PI*2)/30;
                    }
                    this.skillInfo.time++;
                    if(this.skillInfo.time > 24){
                        this.skillInfo = null;
                        this.graphicState = 'demon'+this.enemyLevel;
                        this.update('graphicState');
                    }
                    return true;
                    break;
                case 'teleport':
                    this.translate(
                        (this.skillInfo.x-this.x)/20,
                        (this.skillInfo.y-this.y)/20
                    );
                    if(this.skillInfo.time++ > 64){
                        this.movement = env.MOVEMENT_FLOOR;
                        this.graphicState = 'demon'+this.enemyLevel;
                        this.update('graphicState');
                        this.z = 0;
                        this.update('z');
                        this.skillInfo = null;
                    }
            }
        }
        // Otherwise, do normal.
        return enemy.trigger.apply(this, arguments);
    }
});
modelLibrary.actor['demon2'] = env.extend(modelLibrary.actor.demon1, {
    graphicState: "demon2",
    enemyLevel: 2,
    baseBody: 13,
    skillFrequency: 64,
    score: 65
});
modelLibrary.actor['demon3'] = env.extend(modelLibrary.actor.demon1, {
    graphicState: "demon3",
    enemyLevel: 2,
    baseBody: 19,
    skillFrequency: 32,
    score: 120
});
    /*bat1: env.extend(unit, {
				_graphic: 'bat1',
				faction: DM.F_ENEMY},
				touchDamage: 1},
				baseSpeed: 2},
				baseBody: 1},
				height: 8},
				behavior_name: "behavior_pause"}
			}),
			eyeball1: env.extend(unit, {
				_graphic: 'eyeball1',
				faction: DM.F_ENEMY},
				touchDamage: 1},
				baseSpeed: 1},
				baseBody: 2},
				movement: DM.MOVEMENT_ALL},
				behavior_name: "behavior_normal"},
			}),
			eyeball2: env.extend(unit, {
				_graphic: 'eyeball2',
				faction: DM.F_ENEMY},
				touchDamage: 2},
				baseSpeed: 1},
				baseBody: 4},
				movement: DM.MOVEMENT_ALL},
				behavior_name: "behavior_normal"},
			}),*/
//==============================================================================


//== DEFERRED MODULES ==========================================================
const clientManager = require('./client_manager.js');
const gameManager = require('./game_manager.js');
const mapManager = require('./map_manager.js');