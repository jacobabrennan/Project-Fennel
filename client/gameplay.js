

/*==============================================================================

    The gameplay driver is single point of contact between the game and the
    player once the game is running. It collects all input from the player, via
    keyboard, touch, and mouse, and displays the game state via a map and a
    menuing system.

    It is not a prototype, and should not be instanced.

==============================================================================*/
client.gameplay = Object.extend(driver, {
    drivers: {},
    dead: false,
    x: 0,
    y: 0,
    setup: function (configuration){
        // TODO: Document.
        this.drivers.map.setup(configuration);
        //this.RPG.setup(configuration);
    },
    focused: function (options){
        client.keyCapture.clearPress();
        //this.focus(this.RPG);
    },
    waiting: function (gameData){
        this.memory.blank();
        client.focus(this);
        client.skin.blank();
    },
    newGame: function (gameData){
        this.deck = null;
        this.chips = 0;
        this.dead = false;
        this.memory.blank();
        client.focus(this);
        client.skin.blank();
    },
    gameOver: function (gameData){
        this.deck = null;
        this.chips = 0;
        this.memory.blank();
        this.focus(this.endGame);
    },
    newWave: function (waveData){
        var waveNumber = waveData.regionData.waveNumber;
        if(waveNumber !== 1 && !((waveNumber-1) % WAVES_THEME_CHANGE)){
            this.regionPreview.preview(waveData.regionData.theme);
            this.focus(this.regionPreview);
        } else{
            this.focus();
        }
        this.memory.sense(waveData.regionData);
        //this.focus(this.RPG);
    },
    clearWave: function (clearData){
        this.waveClear.recordData(clearData);
        this.focus(this.waveClear);
    },
    adjustDeck: function (deckData){
        if(deckData.deck  !== undefined){ this.deck  = deckData.deck ;}
        if(deckData.chips !== undefined){ this.chips = deckData.chips;}
    },
    /*command: function (command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){ return block;}
        return false;
    },*/
    command: function (command, options){
        var block = driver.command.apply(this, arguments);
        if(block){ return block;}
        if(command === COMMAND_TOGGLE_DECK){
            client.keyCapture.clearPress();
            this.focus(this.deckDisplay);
            return true;
        }
        return true;
    },
    commandMove: function (direction){
        if(direction === 0){
            client.networking.sendMessage(COMMAND_WAIT, {});
        } else{
            client.networking.sendMessage(COMMAND_MOVE, {'direction': direction});
        }
    },
    commandSkill: function (which){
        client.networking.sendMessage(which);
    },
    tick: function (){
        var block = driver.tick.apply(this, arguments);
        if(block){ return block;}
        if(client.keyCapture.check(NORTH)){ this.commandMove(NORTH);}
        if(client.keyCapture.check(SOUTH)){ this.commandMove(SOUTH);}
        if(client.keyCapture.check(EAST )){ this.commandMove(EAST );}
        if(client.keyCapture.check(WEST )){ this.commandMove(WEST );}
        if     (client.keyCapture.checkPress(COMMAND_PRIMARY   )){ this.commandSkill(COMMAND_PRIMARY   );}
        else if(client.keyCapture.checkPress(COMMAND_SECONDARY )){ this.commandSkill(COMMAND_SECONDARY );}
        else if(client.keyCapture.checkPress(COMMAND_TERTIARY  )){ this.commandSkill(COMMAND_TERTIARY  );}
        else if(client.keyCapture.checkPress(COMMAND_QUATERNARY)){ this.commandSkill(COMMAND_QUATERNARY);}
        client.keyCapture.clearPress()
        this.display();
        return false;
    },
    display: function (options){
        // TODO: Document.
        this.drivers.map.display({x:this.x, y:this.y});
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        var S = this.memory.getContainable(this.heroId);
        var region = this.memory.getDisplayRegion();
        if(region){
            var waveNumber = region.waveNumber;
            client.skin.drawString(0.5, 0.5, 'Wave '+waveNumber, '#fff');
        }
        if(S){
            //this.x = (S.x*TILE_SIZE + S.offsetX) - (displayWidth -S.width )/2;
            //this.y = (S.y*TILE_SIZE + S.offsetY) - (displayHeight-S.height)/2;
            var currentHp = S.hp;
            for(var I = 0; I < S.maxHp; I++){
                var state = 'heartFull';
                if(I >= currentHp){
                    state = 'heartEmpty';
                }
                client.skin.drawGraphic('hud', state, 8*TILE_SIZE+I*8, 8)
            }
            var currentMp = S.mp;
            for(var I = 0; I < S.maxMp; I++){
                var state = 'bottleFull';
                if(I >= currentMp){
                    state = 'bottleEmpty';
                }
                client.skin.drawGraphic('hud', state, 8*TILE_SIZE+I*8, 16)
            }
        }
        if(this.currentFocus){
            this.currentFocus.display(options);
        }
        // Display Dialogue, if any.
        this.dialogue.display()
        return false;
    }
});
client.gameplay.dialogue = Object.extend(driver, {
    portrait: null,
    body: null,
    lines: null,
    maxLength: 20,
    message: function (message){
        this.portrait = message.portrait;
        this.body = message.body;
        var words = this.body.split(' ');
        this.lines = [words[0]];
        for(var wordIndex = 1; wordIndex < words.length; wordIndex++){
            var indexedWord = words[wordIndex];
            var currentLine = this.lines[this.lines.length-1];
            if(currentLine.length+indexedWord.length <= this.maxLength){
                this.lines[this.lines.length-1] = currentLine+' '+indexedWord;
            } else{
                this.lines.push(indexedWord);
            }
        }
    },
    clear: function (){
        this.portrait = null;
        this.body = null;
    },
    display: function (options){
        if(!this.body){ return;}
        if(this.portrait){
            //var S = client.gameplay.memory.getContainable(client.gameplay.heroId);
            //this.portrait = S.graphic;
            client.skin.fillRect(0, displayHeight-64, displayWidth, 64, 'rgba(0,0,0,0.5)');
            client.skin.drawGraphic('portraits', this.portrait, 0, displayHeight-64);
            for(var lineIndex = 0; lineIndex < this.lines.length; lineIndex++){
                client.skin.drawString(
                    4.5,
                    (displayHeight/TILE_SIZE)-(1+lineIndex/2),
                    this.lines[lineIndex], '#fff'
                );
            }
        }
    }
});
//client.gameplay.dialogue.message({portrait: 'adventurer', body: 'The site could be temporarily unavailable or too busy. Try again in a few moments.'});

// ==== Game Over =========================================================== //
client.gameplay.endGame = Object.extend(driver, {
    display: function (options){
        var message = 'Game Over';
        var stringSize = (message.length * FONT_SIZE);
        client.skin.drawString(
            ((displayWidth-stringSize)/2)/TILE_SIZE,
            ((displayHeight-FONT_SIZE)/2)/TILE_SIZE,
            message, '#fff'
        );
        return true;
    },
    command: function (command, options){
        // TODO: Document.
        var block = driver.command.apply(this, arguments);
        if(block){ return block;}
        switch(command){
            case COMMAND_ENTER:
            case COMMAND_PRIMARY:
                client.focus(client.drivers.title)
                return true;
        }
        return true;
    }
});
// ==== Wave Clear ========================================================== //
client.gameplay.waveClear = Object.extend(driver, {
    recordData: function (clearData){
        this.waveScore = clearData.waveScore;
        this.totalScore = clearData.totalScore;
        this.playerScores = clearData.playerScores;
        this.countTime = 0;
    },
    tick: function (){
        var result = driver.tick.apply(this, arguments);
        var waitPeriod = 24;
        var maxCount = 24;
        this.countPercent = Math.min(1, Math.max(0, (this.countTime-waitPeriod) / maxCount));
        this.countTime++;
        return result;
    },
    display: function (options){
        var greyPercent = Math.min(1, this.countTime/5);
        client.skin.colorOverlay('#110', 0.5*(greyPercent));
        var scoreAdjust = Math.floor(-this.waveScore*(1-this.countPercent));
        var message = 'Wave Score: '+(-scoreAdjust);
        var stringSize = (message.length * FONT_SIZE);
        client.skin.drawString(
            ((displayWidth-stringSize)/2)/TILE_SIZE,
            ((displayHeight-FONT_SIZE)/2)/TILE_SIZE+1,
            message, '#fff'
        );
        message = 'Total Score: '+(this.totalScore+scoreAdjust);
        stringSize = (message.length * FONT_SIZE);
        client.skin.drawString(
            ((displayWidth-stringSize)/2)/TILE_SIZE,
            ((displayHeight-FONT_SIZE)/2)/TILE_SIZE,
            message, '#fff'
        );
        for(var playerIndex = 0; playerIndex < this.playerScores.length; playerIndex++){
            var indexedPlayer = this.playerScores[playerIndex];
            message = indexedPlayer.id+': '+(indexedPlayer.score+scoreAdjust);
            stringSize = (message.length * FONT_SIZE);
            client.skin.drawString(
                ((displayWidth-stringSize)/2)/TILE_SIZE,
                ((displayHeight-FONT_SIZE)/2)/TILE_SIZE-(playerIndex+1),
                message, '#fff'
            );
        }
        return true;
    }
});
// ==== Deck Display ======================================================== //
client.gameplay.deckDisplay = Object.extend(driver, {
    transition: 0,
    setup: function (configuration){},
    command: function (command, options){
        if(this.transition){ return false;}
        switch(command){
            case COMMAND_TOGGLE_DECK:
                //client.gameplay.focus(client.gameplay.RPG);
                this.transition = -64;
                client.keyCapture.clearPress();
                return true;
            case COMMAND_SECONDARY:
                client.keyCapture.clearPress();
                this.useCard(0);
                break;
            case COMMAND_TERTIARY:
                client.keyCapture.clearPress();
                this.useCard(1);
                break;
            case COMMAND_QUATERNARY:
                client.keyCapture.clearPress();
                this.useCard(2);
                break;
        }
        return false;
    },
    focused: function (){
        this.transition = 64;
        return driver.focused.apply(this,arguments)
    },
    tick: function (){
        if(this.transition > 0){ this.transition -= 8}
        else if(this.transition < 0){
            this.transition += 8
            if(this.transition === 0){
                client.gameplay.focus();
            }
        }
        return driver.tick.apply(this,arguments)
    },
    display: function (options){
        var offsetY = 0;
        if(this.transition > 0){
            offsetY = easeInSin(-64, 0, 1-(this.transition/64));
        }
        if(this.transition < 0){
            offsetY = easeOutSin(0, -64, 1-(-this.transition/64));
        }
        client.skin.switchLayer(LAYER_SPRITES);
        // Draw Status (Portrait + Name)
        //client.skin.fillRect(0, offsetY, displayWidth, 72, 'rgba(0, 0, 0, 0.5)');
        client.skin.drawGraphic('status', null, 0, offsetY);
        var hero = client.gameplay.memory.getContainable(client.gameplay.heroId);
        client.skin.drawGraphic('portraits', hero.graphic, 16, 16+offsetY);
        var className = hero.graphic.charAt(0).toUpperCase() + hero.graphic.slice(1);
        var nameOffset = Math.min(12, className.length)/4;
        client.skin.drawString(3-nameOffset, 0.25+(offsetY/TILE_SIZE), className);
        // Draw Skills
        //client.skin.drawString(5, 2, 'Z');
        //client.skin.drawString(5.5, 3, 'X');
        if(hero.skillSecondary){ client.skin.drawGraphic('skills', hero.skillSecondary, 88, 59-8+offsetY);}
        if(hero.skillTertiary ){ client.skin.drawGraphic('skills', hero.skillTertiary , 88, 29-8+offsetY);}
        client.skin.drawGraphic('hud', 'crystal', 92, 8+offsetY);
        client.skin.drawString(
            6.25, 0.5+offsetY/TILE_SIZE, client.gameplay.chips
        )
        // Draw Cards
        //if(!client.gameplay.deck){ return;}
        for(var cardIndex = 0; cardIndex < 3; cardIndex++){
            if(!client.gameplay.deck || !client.gameplay.deck[cardIndex]){
                //client.skin.drawGraphic('cards', 'back', 0+(8+32)*cardIndex+displayWidth/2, 8+offsetY);
                continue;
            }
            var indexedCard = client.gameplay.deck[cardIndex];
            var cardName = indexedCard.name;
            var cardCost = indexedCard.cost;
            client.skin.drawGraphic('cards', cardName, 0+(8+32)*cardIndex+displayWidth/2, 8+offsetY);
            client.skin.drawGraphic('hud', 'crystal', 1+(8+32)*cardIndex+displayWidth/2, 38+offsetY);
            client.skin.drawString(
                ((1+(8+32)*cardIndex)+displayWidth/2)/TILE_SIZE,
                (8+offsetY)/TILE_SIZE+2.5,
                cardCost, '#00f', '#fff'
            );
            var keys = ['Z','X','C'];
            client.skin.drawString(
                ((1+(8+32)*cardIndex)+displayWidth/2)/TILE_SIZE + 0.75,
                (12+offsetY)/TILE_SIZE+3,
                keys[cardIndex]
            );
            /*client.skin.fillRect(
                8+(8+32)*cardIndex, 8+offsetY,
                32, 48, 'blue'
            );
            client.skin.drawString(
                (8+(8+32)*cardIndex)/TILE_SIZE,
                (8+offsetY)/TILE_SIZE+2.5,
                cardName
            );
            client.skin.drawString(
                (8+(8+32)*cardIndex)/TILE_SIZE,
                (offsetY)/TILE_SIZE+2.5,
                cardCost
            );*/
        }
        return true;
    },
    useCard: function (deckIndex){
        var usedCard = client.gameplay.deck[deckIndex];
        if(!usedCard){ return;}
        client.networking.sendMessage(COMMAND_ADJUST_DECK, {
            index: deckIndex,
            cardName: usedCard.name
        });
        //this.transition = -64;
    }
});
// ==== RPG Mode ============================================================ //

// ==== Region Preview ====================================================== //
client.gameplay.regionPreview = Object.extend(driver, {
    preview: function (theme){
        this.themeName = theme;
        this.countTime = 0;
    },
    tick: function (){
        var result = driver.tick.apply(this, arguments);
        var waitPeriod = 240;
        var maxCount = 24;
        this.countPercent = Math.min(1, Math.max(0, (this.countTime-waitPeriod) / maxCount));
        this.countTime++;
        if(!(this.countTime-waitPeriod)){
            client.gameplay.focus();
        }
        return result;
    },
    display: function (options){
        var greyPercent = Math.min(1, this.countTime/5);
        var capName = this.themeName[0].toUpperCase() + this.themeName.slice(1);
        client.skin.drawGraphic('preview', this.themeName+'Back' , 0, 0)
        //client.skin.drawGraphic('preview', this.themeName+'Mid'  , 0+this.countTime, 0)
        //client.skin.drawGraphic('preview', this.themeName+'Front', 0-this.countTime, 0)
        client.skin.drawString(4, DEFAULT_MAP_SIZE/2, 'Entering');
        client.skin.drawString(6, DEFAULT_MAP_SIZE/2-1, 'the '+capName);
        return true;
    }
});
