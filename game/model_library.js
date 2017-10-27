'use strict';

//== END REQUIRES ==== (check for deferred modules) ============================


const modelLibrary = module.exports = {
    getModel(category, modelId){
        if(this[category]){
            return this[category][modelId];
        }
        return null;
    },
    theme: {
        /*
         * Bowser
         * Wizard
         * Eye mass
         * Reaper
         * Bat
         * Genie
         */
        plains: {
            name    : 'plains',
            infantry: ['bug1','bug2','bug3','goblin2','goblin3','spider1'],
            cavalry : ['bird1','bird2','bird3','vulture2','vulture3'],
            officer : ['goblin1','goblin2','goblin3','spider1','spider2'],
            boss    : ['spider1','spider2','spider3','spider3','spider3']
        },
        castle: {
            name    : 'castle',
            infantry: ['knight1','knight2','knight3','templar2','templar3','lordKnight1'],
            cavalry : ['templar1','templar2','templar3','lordKnight1','lordKnight2'],
            officer : ['knight3','lordKnight1','lordKnight2','lordKnight3','lordKnight3'],
            boss    : ['drake1','drake2','drake3','drake3','drake3']
        },
        wastes: {//
            name    : 'wastes',
            infantry: ['kzussy1','kzussy2','kzussy3'],
            cavalry : ['vulture1','vulture2','vulture3'],
            officer : ['evilEye1','evilEye2','evilEye3'],
            boss    : ['blobLarge1','blobLarge2','blobLarge3']
        },
        desert: {//
            name    : 'desert',
            infantry: ['cobra1','cobra2','cobra3'],
            cavalry : ['antLion1','antLion2','antLion3'],
            officer : ['bombshell1','bombshell2','bombshell3'],
            boss    : ['scorpion1', 'scorpion2', 'scorpion3']
        },
        ruins: {//
            name    : 'ruins',
            infantry: ['ghost1','ghost2','ghost3'],
            cavalry : ['mummy1','mummy2','mummy3'],
            officer : ['spine1','spine2','spine3'],
            boss    : ['skullLarge1','skullLarge2']
        },
        inferno: {//
            name    : 'inferno',
            infantry: ['imp1','imp2','imp3'],
            cavalry : ['fireWall1','fireWall2','fireWall3'],
            officer : ['vampire1','vampire2','vampire3'],
            boss    : ['demon1','demon2','demon3']
        }
    },
    item: {},
    sequence: {},
    classMap: {
        get(lk, lp, lm, lr){
            var levelKey = ''+lk+''+lp+''+lm+''+lr;
            var className = this[levelKey];
            return className;
        },
        '0000': 'adventurer',
        '1000': 'squire',
        '2000': 'knight',
        '3000': 'royalGuard',
        '0100': 'acolyte',
        '1100': 'paladin',
        '2100': 'crusader',
        '0200': 'cleric',
        '1200': 'templar',
        '0300': 'highPriest',
        '0010': 'mage',
        '1010': 'darkKnight',
        '2010': 'darkLancer',
        '0110': 'scholar',
        '1110': 'hero',
        '0210': 'alchemist',
        '0020': 'wizard',
        '1020': 'warlock',
        '0120': 'necromancer',
        '0030': 'sorcerer',
        '0001': 'archer',
        '1001': 'barbarian',
        '2001': 'warlord',
        '0101': 'bard',
        '1101': 'monk',
        '0201': 'diva',
        '0011': 'illusionist',
        '1011': 'ninja',
        '0111': 'gardener',
        '0021': 'conjurer',
        '0002': 'brigand',
        '1002': 'berserker',
        '0102': 'soloist',
        '0012': 'mystic',
        '0003': 'rogue',
        '1111': 'revolutionary'
    },
    actor: {},
    projectile: {},
    /*
    intelligence: {
        attack: {
            time_left: 6,
            _new(attacker, time){
                attacker.graphic_state = 'attack'
                if(time){
                    this.time_left = time;
                }
                return this;
            },
            handle_event(mover, event){
                if(event.type === DM.EVENT_INTELLIGENCE_REMOVED){
                    if(mover.graphic_state == 'attack'){
                        mover.graphic_state = null;
                    }
                }
                if(event.type === DM.EVENT_TAKE_TURN){
                    if(--this.time_left > 0){
                        mover.graphic_state = 'attack'
                        return false;
                    } else{
                        mover.intelligence_remove(this);
                    }
                }
                return true;
            }
        },
        cast: {
            time_left: 6,
            _new(caster, time){
                caster.graphic_state = 'cast'
                if(time){
                    this.time_left = time;
                }
                return this;
            },
            handle_event(mover, event){
                if(event.type === DM.EVENT_INTELLIGENCE_REMOVED){
                    if(mover.graphic_state == 'cast'){
                        mover.graphic_state = null;
                    }
                }
                if(event.type === DM.EVENT_TAKE_TURN){
                    if(--this.time_left > 0){
                        mover.graphic_state = 'cast'
                        return false;
                    } else{
                        mover.intelligence_remove(this);
                    }
                }
                return true;
            }
        },
        freeze: {
            time_left: DM.TRANSITION_INVULNERABILITY_TIME,
            _new(time){
                if(time){
                    this.time_left = time;
                }
                return this;
            },
            handle_event(mover, event){
                if(event.type === DM.EVENT_TAKE_TURN){
                    if(--this.time_left > 0){
                        return false;
                    } else{
                        mover.intelligence_remove(this);
                    }
                }
                return true;
            }
        }
    },*/
    skill: {},
    card: {}
};

//== DEFERRED MODULES ==========================================================