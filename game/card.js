'use strict';
//== END REQUIRES ==== (check for deferred modules) ============================

const card = module.exports = {
    name: null,
    cost: 1,
    levelKnight: 0,
    levelPriest: 0,
    levelMage: 0,
    levelRogue:0,
    use: function (heroActor){
        let lk = Math.min(3, Math.max(0, heroActor.levelKnight + this.levelKnight));
        let lp = Math.min(3, Math.max(0, heroActor.levelPriest + this.levelPriest));
        let lm = Math.min(3, Math.max(0, heroActor.levelMage   + this.levelMage  ));
        let lr = Math.min(3, Math.max(0, heroActor.levelRogue  + this.levelRogue ));
        let classId = modelLibrary.classMap.get(lk, lp, lm, lr);
        if(!classId){
            classId = modelLibrary.classMap.get(
                heroActor.levelKnight,
                heroActor.levelPriest,
                heroActor.levelMage,
                heroActor.levelRogue
            );
        }
        if(!classId){ return false;}
        //let classModel = modelLibrary.getModel('actor', classId);
        let playerClient = clientManager.getClient(heroActor.playerId);
        if(!playerClient){ return false;}
        let success = playerClient.changeClass(classId);
        if(success){ return true;}
        return false;
    }
};

//== DEFERRED MODULES ==========================================================
const clientManager = require('./client_manager.js');
const modelLibrary = require('./model_library.js');