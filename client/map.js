

/*==============================================================================

    The map object deals primarily with the display of the game world in a 2D
    grid of text. It also handles mouse and touch input for movement and
    targeting.
    
    It is not a prototype, and should not be instanced.

==============================================================================*/

client.gameplay.drivers.map = Object.create(driver, {
    gridWidth: {value: displayWidth/TILE_SIZE, writable: true},
    gridHeight: {value: displayHeight/TILE_SIZE, writable: true},
    setup: {value: function (configuration){
        /**
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.gameplay.setup It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.
            
            It should not be called more than once.
            
            It does not return anything.
         **/
    }},
    /*handleClick: {value: function (x, y, options){
        x -= displayWidth;
        if(x < 0){ return false;}
        var centerX = Math.floor(displayWidth/2);
        var centerY = Math.floor(displayHeight/2);
        //var coordX = Math.floor(x);
        //var coordY = Math.floor(y);
        var direction;
        if(Math.max(Math.abs(centerX-x), Math.abs(centerY-y)) <= 1){
            direction = COMMAND_WAIT;
        } else{
            direction = directionTo(centerX, centerY, x, y);
        }
        client.command(direction, {key: null});
        return true;
    }, writable: true},*/
    display: {value: function (displayOptions){
        /*
            This function displays a representation of the game map made from
            data supplied by the memory system.
            
            It returns true or false, based on the return value of
            driver.display, which is the prototype from which this object is
            derived. See driver.js for more info. At this time, the return value
            will always be false.
        */
        // TODO: Fill out documentation of actual code.
        // TODO: Consider refactoring. 'Do everything' function, long lines.
        if(!displayOptions){ displayOptions = {};}
        var gameplay = client.gameplay;
        var region = displayOptions.region || gameplay.memory.getDisplayRegion();
        if(!region){ return driver.display.apply(this, arguments);}
        var x;
        var y;
        var tileX;
        var tileY;
        var currentTime;
        if(displayOptions.x !== undefined){ x = displayOptions.x;}
        else {// x = gameplay.memory.character.x;}
            x = 10;
        }
        if(displayOptions.y !== undefined){ y = displayOptions.y;}
        else {// y = gameplay.memory.character.y;}
            y = 10;
        }
        x = Math.round(x);
        y = Math.round(y);
        tileX = Math.floor(x/TILE_SIZE);
        tileY = Math.floor(y/TILE_SIZE);
        pixelX = x-(tileX*TILE_SIZE);
        pixelY = y-(tileY*TILE_SIZE);
        if(displayOptions.currentTime !== undefined){
            currentTime = displayOptions.currentTime;
        } else{ currentTime = gameplay.memory.currentTime;}
        //== Clear Drawing Layers ==//
        client.skin.blank();
        //== Draw The Background Layer ==//
        client.skin.switchLayer(LAYER_TILES);
        var regionGraphic = region.theme.tileGraphic;
        for(var posY = 0; posY <= this.gridHeight; posY++){
            // <= because of partial tiles visible during pixel "sliding".
            var offsetY = tileY + posY;
            for(var posX = 0; posX <= this.gridWidth; posX++){
                var offsetX = tileX + posX;
                var indexedTile = region.getTile(offsetX, offsetY);
                var tileData = region.getTileData(offsetX, offsetY);
                var tileModel = null;
                if(indexedTile){
                    tileModel = region.tileTypes[indexedTile];
                }
                if(tileModel){
                    if(tileModel.graphicState === 'water'){
                        client.skin.drawGraphic(
                            regionGraphic,
                            'floor',
                            posX*TILE_SIZE-pixelX,
                            posY*TILE_SIZE-pixelY
                        );
                    }
                    client.skin.drawGraphic(
                        regionGraphic,
                        tileModel.graphicState,
                        posX*TILE_SIZE-pixelX,
                        posY*TILE_SIZE-pixelY,
                        {autoJoin: tileData}
                    );
                } else{
                    //this.drawText(posX, posY, character, charColor, charBackground);
                    client.skin.fillRect(
                        posX*TILE_SIZE-pixelX,
                        posY*TILE_SIZE-pixelY,
                        TILE_SIZE,
                        TILE_SIZE,
                        '#000'
                    );
                }
            }
        }
        //== Draw The Movables Layer ==//
        client.skin.switchLayer(LAYER_SPRITES);
        this.spritesLookup = [];
        for(var contentId in client.gameplay.memory.map.containables){
            if(!client.gameplay.memory.map.containables.hasOwnProperty(contentId)){
                continue;
            }
            var indexedContent = client.gameplay.memory.map.containables[contentId];
            if(indexedContent.x === null || indexedContent.y === null){ continue;}
            if(indexedContent.graphicLayer){
                client.skin.switchLayer(indexedContent.graphicLayer);
            } else{
                client.skin.switchLayer(LAYER_SPRITES);
            }
            var pixelX = indexedContent.x;
            var pixelY = indexedContent.y;
            var drawOptions = {
                direction: indexedContent.direction
            };
            // Add drawing effects
            var effects = [];
            if(indexedContent.invulnerable){ effects.push('flash');}
            if(effects.length){ drawOptions.effects = effects;}
            // Take into account flick animations
            var graphicState = indexedContent.graphicState;
            if(indexedContent.flickState){
                var graphicResource = client.resource('graphic', indexedContent.graphic);
                if(!graphicResource || !graphicResource.states){ continue;}
                graphicResource = graphicResource.states[indexedContent.flickState];
                if(!graphicResource){ continue;}
                var frames = graphicResource.frames || 1;
                var frameDelay = graphicResource.frameDelay || ANIMATION_FRAME_DELAY;
                var flickLength = frames * frameDelay;
                if(indexedContent.flickTime++ < flickLength){
                    graphicState = indexedContent.flickState;
                    drawOptions.frame = Math.floor(indexedContent.flickTime/frameDelay)
                } else{
                    indexedContent.flickTime = undefined;
                    indexedContent.flickState = null;
                }
            }
            /*if(!indexedContent.graphic){
                client.skin.fillRect(
                    pixelX-x,
                    pixelY-y,
                    indexedContent.width,
                    indexedContent.height,
                    'rgba(0,0,0,0.25)'
                );
            }*/
            if(indexedContent.z > 0){
                drawOptions.z = indexedContent.z;
                client.skin.drawOval(
                    pixelX-x+indexedContent.width/2,
                    pixelY-y+4,
                    indexedContent.width,
                    8,
                    'rgba(0,0,0,0.25)'
                );
            }
            // Construct Sprite data
            var spriteData = client.skin.drawGraphic(
                indexedContent.graphic,
                graphicState,
                pixelX-x,
                pixelY-y,
                drawOptions
            );
            if(spriteData){
                spriteData.attachment = indexedContent;
                this.spritesLookup.push(spriteData);
            }
            if(indexedContent.type === TYPE_ACTOR && indexedContent.maxHp > 1 && indexedContent.faction & FACTION_PLAYER){
                var hpPercent = indexedContent.hp/indexedContent.maxHp;
                client.skin.fillRect(
                    pixelX-x, pixelY-y+indexedContent.height+2,
                    indexedContent.width, 2,
                    '#888'
                )
                client.skin.fillRect(
                    pixelX-x, pixelY-y+indexedContent.height+2,
                    indexedContent.width*hpPercent, 2,
                    '#f00'
                )
            }
        }
        //== Draw The Events Layer ==//
        //client.skin.switchLayer(2);
        var events = client.gameplay.memory.map.events;
        for(var eventIndex = 0; eventIndex < events.length; eventIndex++){
            var indexedEvent = events[eventIndex];
            indexedEvent.iterate();
            if(indexedEvent.finished){
                arrayRemove(client.gameplay.memory.map.events, indexedEvent);
                eventIndex--;
            } else{
                if(indexedEvent.graphicLayer){
                    client.skin.switchLayer(indexedEvent.graphicLayer);
                } else{
                    client.skin.switchLayer(LAYER_SPRITES);
                }
                indexedEvent.draw({});
            }
        }
        /*for(var posY = 0; posY <= this.gridHeight; posY++){
            // <= because of partial tiles visible during pixel "sliding".
            var offsetY = tileY + posY;
            for(var posX = 0; posX <= this.gridWidth; posX++){
                var offsetX = tileX + posX;
                var indexedTile = region.getTile(offsetX, offsetY);
                if(indexedTile){
                    var cL = indexedTile.contents? indexedTile.contents.length : 0;
                    for(var cI = 0; cI < cL; cI++){
                        indexedId = indexedTile.contents[cI];
                        var indexedC = client.gameplay.memory.getContainable(indexedId);
                        if(!(indexedC && indexedC.graphic)){ continue;}
                        var spriteData = client.skin.drawGraphic(
                            indexedC.graphic,
                            indexedC.graphicState,
                            posX*TILE_SIZE-pixelX,
                            posY*TILE_SIZE-pixelY
                        );
                        if(spriteData){
                            spriteData.attachment = indexedC;
                            this.spritesLookup.push(spriteData);
                        }
                    }
                }
            }
        }*/
        var result = driver.display.apply(this, arguments);
        //this.drawText(-this.gridWidth, 0, client.skin.graphicsTimer.time, 'white', 'transparent')
        return result;
    }},
    coordinateTransform: {value: function (x, y){
        /* Accepts a coordinate from the DOM's event / drawing perspective,
         * returns a coordinate from the map's perspective.
         */
        var adjustX = x;
        var adjustY = displayHeight-y;
        adjustX /= client.skin.scale;
        adjustY /= client.skin.scale;
        return { 'x': x, 'y': y};
    }, writable: true},
    findSprites: {value: function (x, y){
        /* Finds sprite data for all sprites drawn that overlap with the given
         * point.
         */
        var overlapping = [];
        for(var sI = this.spritesLookup.length-1; sI >= 0; sI--){
            var indexedS = this.spritesLookup[sI];
            if(x >= indexedS.x && x <= indexedS.x+indexedS.width){
                if(y >= indexedS.y && y <= indexedS.y+indexedS.height){
                    overlapping.push(indexedS);
                }
            }
        }
        return overlapping;
    }, writable: true},
    drawText: {value: function (x, y, character, color, background){
        x += this.gridWidth;
        client.skin.drawCharacter(x, y, character, color, background);
    }, writable: true}
});
