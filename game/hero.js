'use strict';

const env = require('./env.js');
const actor = require('./actor.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const hero = module.exports = (() => {
    actor.behaviorHero = function (trigger/*, options*/){
        switch(trigger){
            case env.TRIGGER_TAKE_TURN:
                let moveDir = this.commandStorage & 15;
                if(     this.commandStorage & env.COMMAND_PRIMARY   ){ this.useSkill(this.skillPrimary   );}
                else if(this.commandStorage & env.COMMAND_SECONDARY ){ this.useSkill(this.skillSecondary );}
                else if(this.commandStorage & env.COMMAND_TERTIARY  ){ this.useSkill(this.skillTertiary  );}
                else if(this.commandStorage & env.COMMAND_QUATERNARY){ this.useSkill(this.skillQuaternary);}
                else if(moveDir){
                    this.walk(moveDir, this.speed());
                }
                break;
        }
    };
    const heroTemplate = {
        faction: env.FACTION_PLAYER,
        //
        heroic: true,
        revivable: true,
        score: 0,
        chips: 0,
        commandStorage: 0,
        staleCommands: 0, // Used for things that snoop on the player's commands, like controllable projectiles.
        behavior: 'behaviorHero',
        //
        die(){
            if(!this.revivable){
                let heroPlayer = clientManager.getClient(this.playerId);
                if(heroPlayer){
                    gameManager.addWaiting(heroPlayer);
                }
            }
            let parent = Object.getPrototypeOf(this);
            return parent.die.apply(this, arguments);
        },
        dispose(){
            let playerClient = clientManager.getClient(this.playerId);
            if(playerClient){ playerClient.removeHero();}
            let parent = Object.getPrototypeOf(this);
            return parent.dispose.apply(this, arguments);
        },
        //
        direct(command){
            this.commandStorage |= command;
            this.clientCommands = this.commandStorage;
        },
        controlLock(){
            this.commandStorage = 0;
            let parent = Object.getPrototypeOf(this);
            return parent.controlLock.apply(this, arguments);
        },
        iterate(){
            this.clientCommands = this.commandStorage;
            let parent = Object.getPrototypeOf(this);
            let result = parent.iterate.apply(this, arguments);
            this.staleCommands = this.commandStorage;
            this.commandStorage = 0;
            return result;
        },
        useSkill(skillId){
            let skillObject;
            if(typeof skillId !== 'string'){ skillObject = skillId;}
            else{ skillObject = modelLibrary.getModel('skill', skillId);}
            if(skillObject){ skillObject.use(this);}
        },
        adjustScore(amount){
            this.score += amount;
        },
        useCard(clientCard, index){
            let serverCard = this.deck[index];
            if(serverCard !== clientCard){ return;}
            let cardModel = modelLibrary.getModel('card', serverCard);
            if(!cardModel){ return;}
            if(cardModel.cost > this.chips){ return;}
            let playerClient = clientManager.getClient(this.playerId);
            let success = cardModel.use(this);
            if(!success){ return;}
            playerClient.hero.chips -= cardModel.cost;
            playerClient.hero.deck.splice(index, 1);
            playerClient.sendMessage(env.COMMAND_ADJUST_DECK, playerClient.hero.compileDeck());
        },
        compileDeck(){
            let deckWithCost = [];
            this.deck.forEach((cardName) => {
                let cardModel = modelLibrary.getModel('card', cardName);
                deckWithCost.push({name: cardModel.name, cost: cardModel.cost});
            });
            let deckData = {
                chips: this.chips,
                deck: deckWithCost
            };
            return deckData;
        },
        skillQuaternary: {
            use(user){
                let playerClient = clientManager.getClient(user.playerId);
                let newClass = env.pick(
                    'squire', 'acolyte', 'mage', 'archer',
                    
                    'knight', 'cleric', 'wizard', 'brigand',
                    'paladin', 'darkKnight', 'barbarian', 'scholar', 'bard', 'illusionist',
                    
                    'royalGuard', 'crusader', 'darkLancer', 'warlord',
                    'templar', 'highPriest', 'alchemist', 'diva',
                    'warlock', 'necromancer', 'sorcerer', 'conjurer',
                    'berserker', 'soloist', 'mystic', 'rogue',
                    
                    'hero', 'monk', 'ninja', '????'
                );
                //newClass = 'mystic';
                playerClient.changeClass(newClass);
            }
        },
    };
    return (newHero) => {
        for(let key in heroTemplate){
            if(!heroTemplate.hasOwnProperty(key)){ continue;}
            newHero[key] = heroTemplate[key];
        }
        newHero.deck = [];
        if(typeof newHero.skillPrimary    === 'string'){
            newHero.skillPrimary    = env.instantiate(modelLibrary.getModel('skill', newHero.skillPrimary   ));
            if(newHero.skillPrimaryCost    !== undefined){ newHero.skillPrimary.cost    = newHero.skillPrimaryCost   ;}
        }
        if(typeof newHero.skillSecondary  === 'string'){
            newHero.skillSecondary  = env.instantiate(modelLibrary.getModel('skill', newHero.skillSecondary ));
            if(newHero.skillSecondaryCost  !== undefined){ newHero.skillSecondary.cost  = newHero.skillSecondaryCost ;}
        }
        if(typeof newHero.skillTertiary   === 'string'){
            newHero.skillTertiary   = env.instantiate(modelLibrary.getModel('skill', newHero.skillTertiary  ));
            if(newHero.skillTertiaryCost   !== undefined){ newHero.skillTertiary.cost   = newHero.skillTertiaryCost  ;}
        }
        if(typeof newHero.skillQuaternary === 'string'){
            newHero.skillQuaternary = env.instantiate(modelLibrary.getModel('skill', newHero.skillQuaternary));
            if(newHero.skillQuaternaryCost !== undefined){ newHero.skillQuaternary.cost = newHero.skillQuaternaryCost;}
        }
        return newHero;
    };
})();

//== DEFERRED MODULES ==========================================================
const gameManager = require('./game_manager.js');
const clientManager = require('./client_manager.js');
const modelLibrary = require('./model_library.js');