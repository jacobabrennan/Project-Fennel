'use strict';

const env = require('./env.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const gameManager = module.exports = {
    currentGame: undefined,
    newGame(options){
        // Must return a truthy value if a new game was started.
        if(this.currentGame){ return false;}
        let newGameData = this.generateGame(options);
        this.loadGame(newGameData);
        return this.currentGame;
    },
    gameOverCleanUp(){
        this.currentGame = null;
    },
    generateGame(options){
        let gameData = {
            id: 'Casual Quest',
            players: options.players,
            waveNumber: options.waveNumber || 1,
            startTheme: options.startTheme || 'plains',
            deck: []
        };
        gameData.deck.push('v1');
        gameData.deck.push('v2');
        gameData.deck.push('v3');
        gameData.deck.push('v4');
        gameData.deck.push('s1');
        gameData.deck.push('s2');
        gameData.deck.push('s3');
        gameData.deck.push('s4');
        gameData.deck.push('a1');
        gameData.deck.push('a2');
        gameData.deck.push('a3');
        gameData.deck.push('a4');
        gameData.deck.push('w1');
        gameData.deck.push('w2');
        gameData.deck.push('w3');
        gameData.deck.push('w4');
        return gameData;
    },
    loadGame(gameData){
        this.currentGame = env.instantiate(game, gameData);
        setTimeout(() => {
            this.currentGame.displayWave(this.currentGame.nextWave);
            setTimeout(() => {
                this.currentGame.startWave();
            }, env.NEW_GAME_JOIN_PERIOD); // START
        }, 1);
    },
    currentTime(){
        return this.currentGame.currentTime;
    },
    score(amount, show){
        if(!this.currentGame){ return null;}
        if(show && !this.interval){ // game not paused
            this.currentGame.players.forEach((playerClient) => {
                let pHero = playerClient.hero;
                if(pHero){
                    mapManager.event('score', pHero.regionId, {score: amount, center: pHero});
                }
            });
        }
        return this.currentGame.adjustScore(amount);
    },
    addPlayer(playerClient){
        // Must return a truthy value if player was added to current game.
        if(!this.currentGame){ return false;}
        if(
            this.currentGame.currentWave.started ||
            this.currentGame.players.length >= env.MAX_PLAYERS
        ){
            this.currentGame.waiting.push(playerClient);
        } else{
            this.currentGame.addLatePlayer(playerClient);
        }
        return true;
    },
    addWaiting(playerClient){
        if(!this.currentGame){ return false;}
        env.arrayRemove(this.currentGame.players, playerClient);
        return this.addPlayer(playerClient);
    },
    cancelPlayer(playerClient){
        if(!this.currentGame){ return false;}
        env.arrayRemove(this.currentGame.players   , playerClient);
        env.arrayRemove(this.currentGame.waiting   , playerClient);
        env.arrayRemove(this.currentGame.spectators, playerClient);
    }
};
const game = {
    speed: env.GAME_SPEED,
    id: null,
    currentTime: 0,
    lastWaveScore: 0,
    score: 0,
    players: null,
    waiting: null,
    spectators: null,
    currentTheme: null,
    deck: null,
    _new(options){
        // Prepare Object
        this.id = options.id;
        this.players = [];
        this.waiting = [];
        this.spectators = [];
        this.iterate = this.iterator.bind(this);
        this.theme = modelLibrary.getModel('theme', (options.startTheme || 'plains'));
        // Add the class deck
        this.deck = options.deck;
        // Add players to game
        options.players.forEach((player) => {
            this.waiting.push(player.client);
        });
        // Create first wave
        let waveData = {
            waveNumber: options.waveNumber,
            theme: this.theme,
            entrySide: env.SOUTH
        };
        if(!options.waveNumber || options.waveNumber === 1){
            waveData.mapName = "dangerous to go alone";
        }
        this.nextWave = this.loadWave(waveData);
        //
        return this;
    },
    dispose(){
        if(this.currentWave){
            this.currentWave.dispose();
            this.currentWave = null;
        }
        if(this.nextWave){
            this.nextWave.dispose();
            this.nextWave = null;
        }
        this.players = null;
        this.theme = null;
        this.iterate = null;
        this.locked = true;
        gameManager.gameOverCleanUp();
    },
    interval: null,
    iterate: null,
    locked: false,
    cleared: false,
    pause(){
        clearInterval(this.interval);
        this.interval = null;
    },
    unpause(){
        if(this.interval){ return;}
        // This may not be the most logical way or place to clear player commands,
        // But it requires the least extra spaghetti.
        this.players.forEach(function (player){
            if(player.hero){ player.hero.commandStorage = 0;}
        }, this);
        this.interval = setInterval(this.iterate, this.speed);
    },
    iterator(/*options*/){
        if(this.locked){ return;}
        this.locked = true;
        this.currentTime++;
        let updates = {};
        let activeFactions;
        if(this.currentWave){
            activeFactions = this.currentWave.iterate();
            updates[this.currentWave.id] = this.currentWave.updates;
            this.currentWave.clearUpdates();
        }
        for(let I = 0; I < this.players.length; I++){
            let player = this.players[I];
            player.sendUpdates(updates);
        }
        for(let I = 0; I < this.waiting.length; I++){
            let player = this.waiting[I];
            player.sendUpdates(updates);
        }
        mapManager.clearUpdates();
        if(!(activeFactions & env.FACTION_PLAYER)){
            this.gameOver();
            return;
        }
        if(!this.cleared && !(activeFactions & env.FACTION_ENEMY)){
            this.clearWave();
        }
        this.locked = false;
    },
    adjustScore(amount){
        this.score += amount;
    },
    currentWave: null,
    loadWave(options){
        if(!options){ options = {};}
        // Determine Wave Number.
        let waveNumber = options.waveNumber;
        if(!waveNumber){
            if(this.currentWave){
                waveNumber = this.currentWave.waveNumber+1;
            } else{
                waveNumber = 1;
            }
        }
        // Determine Theme.
        let theme;
        if(waveNumber !== 1 && !((waveNumber-1) % env.WAVES_THEME_CHANGE)){
            let possibleThemes = ['plains', 'castle', 'wastes', 'desert', 'ruins','inferno'];
            env.arrayRemove(possibleThemes, this.theme.name);
            let themeName = env.arrayPick(possibleThemes);
            theme = modelLibrary.getModel('theme', themeName);
        }
        if(!theme){
            theme = options.theme || this.theme || modelLibrary.getModel('theme', 'plains');
        }
        this.theme = theme;
        // Determine if Boss map.
        let boss = (!(waveNumber%env.WAVES_THEME_CHANGE))? true : false;
        // Generate Map.
        let mapData = {
            theme: theme,
            waveNumber: waveNumber,
            boss: boss
        };
        if(options.mapName){
            mapData.mapName = options.mapName;
        }
        let waveTemplate = mapManager.generateMap(mapData);
        mapManager.loadRegion(waveTemplate);
        let newWave = mapManager.getRegion(waveTemplate.id);
/*
         1         2         3         4         5         6         7    END
123456789012345678901234567890123456789012345678901234567890123456789012345
  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *  ^ *
1111111222222222222222333333333333333444444444444444555555555555555666--===
1111111111112222222222222223333333333333334444444444444445555555555555--===
11 1 11 1 11 1 11 2 22 2 22 2 22 3 33 3 33 3 33 4 44 4 44 4 44 5 55 5 -- =
  1    1    2    2    2    3    3    3    4    4    4    5    5    5    -
    1    1    2    2    2    3    3    3    4    4    4    5    5    5    -
*/
        // Populate with enemies.
            // Determine enemy types
        let infantryIndex = Math.max(0, Math.min(theme.infantry.length-1, Math.floor((waveNumber+7)/15)));
                // Change first on wave 8, then every 15 waves.
        let  cavalryIndex = Math.max(0, Math.min(theme.cavalry.length -1, Math.floor((waveNumber+2)/15)));
                // Change first on wave 13, then every 15 waves.
        let  officerIndex = Math.max(0, Math.min(theme.officer.length -1, Math.floor((waveNumber-3)/15)));
                // Change first on wave 18, then every 15 waves.
        let     bossIndex = Math.max(0, Math.min(theme.cavalry.length -1, Math.floor((waveNumber+4)/15)));
                // Change first on wave 11, then every 15 waves.
        let infantryModel = modelLibrary.getModel('actor', theme.infantry[infantryIndex]);
        let  cavalryModel = modelLibrary.getModel('actor', theme.cavalry[  cavalryIndex]);
        let  officerModel = modelLibrary.getModel('actor', theme.officer[  officerIndex]);
        let     bossModel = modelLibrary.getModel('actor', theme.boss[        bossIndex]);
            // Determine where enemies can be placed
        let entrySide = options.entrySide;
        let testSides = [env.NORTH, env.SOUTH, env.EAST, env.WEST];
        while(!entrySide && testSides.length){
            entrySide = env.arrayPick(testSides);
            env.arrayRemove(testSides, entrySide);
            if(!(entrySide & waveTemplate.openSides)){
                entrySide = null;
            }
        }
        newWave.entrySide = entrySide;
        let passages = [];
        waveTemplate.passages.forEach((passage) =>{
            switch(entrySide){
                case env.SOUTH:
                    if(passage.y !== 0){ passages.push(passage);}
                    break;
                case env.NORTH:
                    if(passage.y !== waveTemplate.height-1){ passages.push(passage);}
                    break;
                case env.WEST :
                    if(passage.x !== 0){ passages.push(passage);}
                    break;
                case env.EAST :
                    if(passage.x !== waveTemplate.width-1){ passages.push(passage);}
                    break;
            }
        });
            // Place Each Enemy
        let enemyAmounts = [9, env.randomInterval(2,4), boss? 0 : env.randomInterval(1,3)];
        let enemyModels = [infantryModel, cavalryModel, officerModel];
        for(let amountIndex = 0; amountIndex < enemyAmounts.length; amountIndex++){
            let enemyAmount = enemyAmounts[amountIndex];
            let enemyModel = enemyModels[amountIndex];
            for(let enemyIndex = 0; enemyIndex < enemyAmount; enemyIndex++){
                let E = env.instantiate(enemyModel);
                E.controlLock(env.randomInterval(0,16));
                let success = false;
                let tries = 0;
                while(!success){
                    let testPassage = env.arrayPick(passages);
                    let xOffset = 0;
                    let yOffset = 0;
                    if(E.width > env.TILE_SIZE){
                        xOffset = (passages.x !== waveTemplate.width -1)? 0 : -(E.width  - env.TILE_SIZE);
                    }
                    if(E.height > env.TILE_SIZE){
                        yOffset = (passages.y !== waveTemplate.height-1)? 0 : -(E.height - env.TILE_SIZE);
                    }
                    let fullX = testPassage.x*env.TILE_SIZE+xOffset;
                    let fullY = testPassage.y*env.TILE_SIZE+yOffset;
                    if(newWave.testBlock(fullX, fullY, E.width, E.height) & E.movement){
                        success = E.place(fullX, fullY, newWave.id);
                    }
                    if(tries++ > 15){ break;}
                }
            }
        }
            // Place Boss
        if(boss){
            let E = env.instantiate(bossModel);
            E.boss = true;
            let bossX = waveTemplate.bossLocation? waveTemplate.bossLocation.x : Math.floor(env.DEFAULT_MAP_SIZE/2);
            let bossY = waveTemplate.bossLocation? waveTemplate.bossLocation.Y : Math.floor(env.DEFAULT_MAP_SIZE/2);
            bossX *= env.TILE_SIZE; bossY *= env.TILE_SIZE;
            bossX += Math.floor((env.TILE_SIZE - E.width )/2);
            bossY += Math.floor((env.TILE_SIZE - E.height)/2);
            E.place(bossX, bossY, newWave.id);
        }
        //
        return newWave;
    },
    unloadWave(oldWave){
        this.players.forEach((playerClient) => {
            let removePlayer = false;
            if(!playerClient.hero){
                removePlayer = true;
            } else {
                playerClient.hero.unplace();
                if(playerClient.hero.dead){
                    playerClient.removeHero();
                    removePlayer = true;
                }
            }
            if(removePlayer){
                env.arrayRemove(this.players, playerClient);
                this.waiting.push(playerClient);
            }
        });
        oldWave.dispose();
    },
    displayWave: function (newWave){
        this.pause();
        // Clean up last wave
        let oldWave = this.currentWave;
        if(oldWave){
            this.unloadWave(oldWave);
        }
        this.currentWave = newWave || this.nextWave;
        this.nextWave = null;
        // Add waiting players to game
        for(let pI = this.players.length; pI < env.MAX_PLAYERS; pI++){
            let nextPlayer = this.waiting.shift();
            if(!nextPlayer){ break;}
            this.players.push(nextPlayer);
            nextPlayer.changeClass('adventurer');
        }
        // Place Players
        let firstSuccess;
        for(let pI = 0, ssI = 0; pI < this.players.length; pI++){
            let playerClient = this.players[pI];
            let center = Math.floor(env.DEFAULT_MAP_SIZE/2);
            let displaceRadius = Math.floor(env.DEFAULT_MAP_SIZE/2)-1;
            let success = false;
            for(let sI = ssI; sI < displaceRadius; sI++){
                if(     sI > 0){ sI *= -1;}
                else if(sI < 0){ sI *= -1;}
                let testX=0, testY=0;
                switch(this.currentWave.entrySide){
                    case env.SOUTH: testX = center+sI             ; testY = 0                     ; break;
                    case env.NORTH: testX = center+sI             ; testY = env.DEFAULT_MAP_SIZE-1; break;
                    case env.EAST : testX = env.DEFAULT_MAP_SIZE-1; testY = center+sI             ; break;
                    case env.WEST : testX = 0                     ; testY = center+sI             ; break;
                }
                success = playerClient.hero.place(testX*env.TILE_SIZE, testY*env.TILE_SIZE, this.currentWave.id);
                if(success){
                    playerClient.hero.direction = env.directionFlip(this.currentWave.entrySide);
                    playerClient.hero.update('direction');
                    if(sI < 0){ ssI = sI  ;}
                    else{       ssI = sI+1;}
                    if(!firstSuccess){ firstSuccess = {x: testX, y: testY};}
                    break;
                }
                if(sI < 0){ sI--;}
            }
            if(!success){
                if(!firstSuccess){
                    console.log('Problem:', this.currentWave.entrySide);
                } else{
                    playerClient.hero.place(firstSuccess.x*env.TILE_SIZE, firstSuccess.y*env.TILE_SIZE, this.currentWave.id);
                }
            }
        }
        // Compile and send wave data to each client
        let waveData = {
            regionData: this.currentWave.packageSetup(),
            players: [],
            waiting: [],
            spectators: []
        };
        for(let pI = 0; pI < this.players.length   ; pI++){ waveData.players.push(   this.players[   pI].id);}
        for(let wI = 0; wI < this.waiting.length   ; wI++){ waveData.waiting.push(   this.waiting[   wI].id);}
        for(let sI = 0; sI < this.spectators.length; sI++){ waveData.spectators.push(this.spectators[sI].id);}
        this.spectators.forEach((playerClient) => {
            playerClient.sendMessage(env.COMMAND_NEWWAVE, waveData);
        });
        this.waiting.forEach((playerClient) => {
            playerClient.sendMessage(env.COMMAND_NEWWAVE, waveData);
        });
        this.players.forEach((playerClient) => {
            playerClient.sendMessage(env.COMMAND_NEWWAVE, waveData);
        });
        this.cleared = false;
    },
    startWave(){
        this.currentWave.started = true;
        this.unpause();
    },
    clearWave(){
        this.cleared = true;
        this.nextWave = this.loadWave();
        // Score keeping
        let waveScore = this.score - this.lastWaveScore;
        this.lastWaveScore = this.score;
        // Compile end of wave data for delivery to players
        let clearData = {
            totalScore: this.score,
            waveScore: waveScore,
            playerScores: []
        };
        this.players.forEach((playerClient) => {
            playerClient.hero.adjustScore(waveScore);
            clearData.playerScores.push({
                id: playerClient.id,
                score: playerClient.hero.score
            });
        });
        // Send End of Wave message to player clients
        this.players.forEach((playerClient) => {
            playerClient.sendMessage(env.COMMAND_CLEARWAVE, clearData);
        });
        // Send card to each player
        let wait = 4000;
        let cardWave = this.currentWave.waveNumber%env.WAVES_THEME_CHANGE === 2 || true;
        let regionChange = !(this.currentWave.waveNumber%env.WAVES_THEME_CHANGE);
        let regionWait = regionChange? env.PREVIEW_DISPLAY_TIME : 2000;
        //if(cardWave){ wait += 4000;}
        this.players.forEach((playerClient) => {
            playerClient.hero.chips++;
            if(this.deck.length && cardWave){
                let heroDeck = playerClient.hero.deck;
                if(heroDeck.length >= env.MAX_DECK_SIZE){ heroDeck.shift();}
                let randomIndex = env.randomInterval(0, this.deck.length-1);
                let randomCard = this.deck.splice(randomIndex, 1)[0];
                heroDeck.push(randomCard);
            }
            playerClient.sendMessage(env.COMMAND_ADJUST_DECK, playerClient.hero.compileDeck());
        });
        // Scaffolding: Start new wave
        setTimeout(() => {
            this.displayWave();
        }, wait);
        setTimeout(() => {
            this.startWave();
        }, wait+regionWait);
    },
    gameOver(){
        this.pause();
        let gameOverData = {};
        this.spectators.forEach((playerClient) => {
            playerClient.sendMessage(env.COMMAND_GAMEOVER, gameOverData);
        });
        this.waiting.forEach((playerClient) => {
            playerClient.sendMessage(env.COMMAND_GAMEOVER, gameOverData);
        });
        this.players.forEach((playerClient) => {
            playerClient.removeHero();
            playerClient.sendMessage(env.COMMAND_GAMEOVER, gameOverData);
        });
        this.dispose();
    },
    addLatePlayer(latePlayer){
        this.players.push(latePlayer);
        latePlayer.changeClass('adventurer');
        let center = Math.floor(env.DEFAULT_MAP_SIZE/2);
        let displaceRadius = Math.floor(env.DEFAULT_MAP_SIZE/2)-1;
        let success = false;
        for(let sI = 0; sI < displaceRadius; sI++){
            if(     sI > 0){ sI *= -1;}
            else if(sI < 0){ sI *= -1;}
            let testX=0, testY=0;
            switch(this.currentWave.entrySide){
                case env.SOUTH: testX = center+sI             ; testY = 0                     ; break;
                case env.NORTH: testX = center+sI             ; testY = env.DEFAULT_MAP_SIZE-1; break;
                case env.EAST : testX = env.DEFAULT_MAP_SIZE-1; testY = center+sI             ; break;
                case env.WEST : testX = 0                     ; testY = center+sI             ; break;
            }
            success = latePlayer.hero.place(testX*env.TILE_SIZE, testY*env.TILE_SIZE, this.currentWave.id);
            if(success){
                latePlayer.hero.direction = env.directionFlip(this.currentWave.entrySide);
                latePlayer.hero.update('direction');
                break;
            }
            if(sI < 0){ sI--;}
        }
        if(!success){
            console.log('Problem:', this.currentWave.entrySide);
        }
        return success;
    }
};

//== DEFERRED MODULES ==========================================================
const mapManager = require('./map_manager.js');
require('./maps.js');
const modelLibrary = require('./model_library.js');
require('./library_models.js');