'use strict';

const env = require('./env.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const clientManager = module.exports = {
    clients: {},
    registerClient(remoteClient){
        let newClient;
        if(remoteClient.id){
            let oldClient = this.clients[remoteClient.id];
            if(oldClient){
                newClient = oldClient;
            }
        }
        if(!newClient){
            newClient = env.instantiate(serverClient);
        }
        newClient.tc_attach(remoteClient);
        this.clients[newClient.id] = newClient;
        return newClient;
    },
    cancelClient(clientId){
        delete this.clients[clientId];
    },
    getClient(clientId){
        return this.clients[clientId];
    }
};
const serverClient = {
    //== Networking ==//
    lagTimeout: null,
    tc_attach(remoteClient){
        if(this.lagTimeout){
            clearTimeout(this.lagTimeout);
        }
        this.remoteClient = remoteClient;
        this.id = remoteClient.id || 'Guest_'+Math.floor(Math.random()*8999+1000);
        this.sendMessage(env.COMMAND_CONNECTION, {id: this.id});
        remoteClient.on('buffer', (buffer) => {
            this.receiveBuffer(buffer);
        });
        remoteClient.on('disconnect', () => {
            this.lagTimeout = setTimeout(() => {
                this.disconnect();
            }, env.LAGOUT_TIME);
        });
    },
    disconnect(){
        if(this.hero){
            this.hero.dispose();
            this.hero = null;
        }
        gameManager.cancelPlayer(this);
        
    },
    sendMessage(command, options){
        this.remoteClient.emit('gameData', [command, options]);
    },
    receiveMessage(command, options){
        switch(command){
            case env.COMMAND_NEWGAME:
                let gameOptions = {
                    players: [
                        {client: this}
                    ],
                    startTheme: 'plains' // plains:: Change this line to change start theme.
                };
                let gameData = gameManager.newGame(gameOptions);
                if(gameData){
                    this.sendMessage(env.COMMAND_NEWGAME, {}); // TODO: What game data needs to be passed at first, if any?
                } else if(gameManager.addPlayer(this)){
                    this.sendMessage(env.COMMAND_WAITING, {});
                    if(gameManager.currentGame && gameManager.currentGame.currentWave){
                        let waveData = {
                            regionData: gameManager.currentGame.currentWave.packageSetup()
                        };
                        this.sendMessage(env.COMMAND_NEWWAVE, waveData);
                    }
                }
                break;
            default:
                this.heroControl(command, options);
                break;
        }
    },
    receiveBuffer(messageBuffer){
        for(let I = 0; I < messageBuffer.length; I++){
            let message = messageBuffer[I];
            this.receiveMessage(message.command, message.options);
        }
    },
    //== Player ==//
    tilesSeen: null,
    oldUpdates: null,
    sendUpdates(updates){
        /*
        // Loops through regions:
        for(let regionId in updates){
            if(!updates.hasOwnProperty(regionId)){ continue;}
            let regionUpdate = updates[regionId];
            // Loops through containable updates in each region:
            for(let key in regionUpdate){
                // Skip the list of revealed tiles:
                if(key === "reveal"){
                    continue;
                }
                // Skip inherited keys:
                if(!regionUpdate.hasOwnProperty(key)){ continue;}
                
                if(!(this.oldUpdates[regionId]) || !(key in this.oldUpdates[regionId])){
                    let keyUpdate = regionUpdate[key];
                    if(!keyUpdate || !keyUpdate.id){
                        let content = mapManager.idManager.get(key);
                        if(content){
                            regionUpdate[key] = content.pack();
                        }
                    }
                }
            }
        }*/
        /*let viewPacks = {};
        for(regionId in mapManager.regions){
            if(!mapManager.regions.hasOwnProperty(regionId)){ continue;}
            let theRegion = mapManager.regions[regionId];
            viewPacks[regionId] = theRegion.packageView(11,11,10);
            
            //updates.reveal
        }*/
        //client.drivers.gameplay.memory.sense(viewPacks);
        //this.oldUpdates = updates;
        /*let sensoryPackage = {
            updates: updates
        };*/
        this.sendMessage(env.COMMAND_SENSE, {'updates': updates});
    },
    changeClass(className){
        let classModel = modelLibrary.getModel('actor', className);
        if(!classModel){ return false;}
        let newX;
        let newY;
        let regionId;
        let direction;
        let oldScore;
        let oldDeck;
        let oldChips;
        if(this.hero){
            let oldHero = this.hero;
            oldScore = oldHero.score;
            oldDeck = oldHero.deck;
            oldChips = oldHero.chips;
            newX = oldHero.x + oldHero.width /2;
            newY = oldHero.y + oldHero.height/2;
            regionId = oldHero.regionId;
            direction = oldHero.direction;
            this.removeHero();
            oldHero.dispose();
        }
        let newHero = env.instantiate(classModel);
        newHero.direction = direction;
        newX -= newHero.width /2;
        newY -= newHero.height/2;
        this.attachHero(newHero);
        if(oldScore){ newHero.score = oldScore;}
        if(oldDeck){ newHero.deck = oldDeck;}
        if(oldChips){ newHero.chips = oldChips;}
        if(regionId){
            newHero.place(newX, newY, regionId);
        }
        return true;
    },
    attachHero(newHero){
        if(!newHero){ return;}
        if(!newHero.heroic){ hero(newHero);}
        this.hero = newHero;
        this.hero.playerId = this.id;
        this.sendMessage(env.COMMAND_HERO_ID, {id: newHero.id});
    },
    removeHero(){
        if(this.hero){
            this.hero.playerId = null;
            this.hero = null;
            this.sendMessage(env.COMMAND_HERO_ID, {id: null});
        }
    },
    heroControl(command, options){
        if(!this.hero){ return;}
        switch(command){
            case env.COMMAND_MOVE:
                this.hero.direct(options.direction);
                break;
            case env.COMMAND_SECONDARY:
            case env.COMMAND_PRIMARY:
            case env.COMMAND_TERTIARY:
            case env.COMMAND_QUATERNARY:
                this.hero.direct(command);
                break;
            case env.COMMAND_ADJUST_DECK:
                if(!this.hero.deck){ return;}
                this.hero.useCard(options.cardName, options.index);
        }
    }
};

//== DEFERRED MODULES ==========================================================
const gameManager = require('./game_manager.js');
const modelLibrary = require('./model_library.js');
const hero = require('./hero.js');