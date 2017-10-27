

/*==============================================================================
  
    The memory object stores, manages, and provides access to everything the
    player knows about the world. It records what the character has seen of the
    map. It provides easy and organized access to this data so that the player
    can issue informed commands to the remote server.
    
    The memory object is not a prototype, and should not be instanced.
  
==============================================================================*/

// TODO: Complete comments for sub-objects.
client.gameplay.memory = (function (){
//== OPEN PRIVATE NAMESPACE ==================================================//
var memory = {
    currentTime: undefined,
    map: undefined,
    setup: function (configuration){
        /**
            Configures the memory object. It is invoked, as soon as the page
            loads, by client.gameplay.setup.
            
            It does not return anything.
        **/
    },
    blank: function (options){
        this.currentTime = 0;
        if(this.map){
            this.map.dispose();
        }
        this.map = Object.instantiate(mapMemory);
    },
    sense: function (sensoryData){
        /**
            Accepts information about the game world, usually at the start of
            the player's turn. This info is then stored for later access.
            
            It does not return anything.
        **/
        if(sensoryData.updates){
            this.map.recordUpdates(sensoryData.updates);
        }
        if(sensoryData.regionId){
            this.map.containables = {}; // Delete contents of old wave.
            this.map.events = [];
            this.currentDisplayRegion = sensoryData.regionId;
            this.map.recordRegion(sensoryData);
        }
    },
    getDisplayRegion: function (){
        /**
            Returns the memory representation of the current region, for display
            in the map.
        **/
        // TODO: Fix with actual data.
        var currentRegionId = this.currentDisplayRegion || '1';
            //client.gameplay.memory.character.regionId;
        var currentRegionMemory = this.map.getRegion(currentRegionId);
        return currentRegionMemory;
    },
    getContainable: function (id){
        return this.map.getContainable(id);
    },
    getView: function (x, y, range){
        /**
            This function returns an array of all tile contents (but not tiles)
            within the specified range of the specified coordinates on the
            character's current region. The array contains only items that are
            within view, not those that are remembered to be there.
            
            It returns an array.
        **/
        var currentRegion = this.map.getRegion(this.character.regionId);
        if(!currentRegion){ return [];}
        return currentRegion.getView(x, y, range);
    },
    getRange: function (x, y, range){
        /**
            This function returns an array of all tile contents (but not tiles)
            within the specified range of the specified coordinates on the
            character's current region.
            
            It returns an array.
        **/
        var currentRegion = this.map.getRegion(this.character.regionId);
        if(!currentRegion){ return [];}
        return currentRegion.getRange(x, y, range);
    }
};
    
    
/*==============================================================================

    The following objects are used by the main memory system for internal
    storage of game data.
    
    They are private properties of the main memory system. All interactions with
    the memory system should go through the main memory's methods, the
    sub-objects should not be accessed individually.
    
    They are prototypes, and must be instanced by the memory system for use.
    
==============================================================================*/

var characterMemory = {
    // TODO: Document.
    hp: undefined,
    mp: undefined,
    maxHp: undefined,
    maxMp: undefined,
    inventory: undefined,
    _new: function (){
        // TODO: Document.
        this.inventory = [];
        return this;
    }
};
var tileMemory = {
    // TODO: Document.
    id: undefined,
    _new: function (tileData, currentTime){
        // TODO: Document.
        this.id = tileData.id;
        this.contents = tileData.contents;
        this.timeStamp = currentTime;
        return this;
    }
};
var regionMemory = {
    // TODO: Document.
    width: undefined,
    height: undefined,
    tileGrid: undefined,
    tileData: undefined,
    tileTypes: undefined,
    id: undefined,
    _new: function (regionData){
        // TODO: Document.
        this.id = regionData.regionId;
        this.width = regionData.width;
        this.height = regionData.height;
        this.theme = client.resource('theme', regionData.theme);
        this.waveNumber = regionData.waveNumber;
        this.tileGrid = [];
        this.tileGrid.length = this.width * this.height;
        this.tileTypes = regionData.tileTypes;
        this.tileData = [];
        var self = this;
        var tileGrid = regionData.tileGrid || regionData.revealGrid;
        tileGrid.forEach(function (tileId, index){
            var tileX = index%self.width;
            var tileY = Math.floor(index/self.width);
            self.recordTile(tileId, tileX, tileY);
        });
        regionData.contents.forEach(function (content){
            client.gameplay.memory.map.recordContent(content.id, content);
        });
        // Autojoin:
        for(var posY = 0; posY < this.height; posY++){
            for(var posX = 0; posX < this.width; posX++){
                var autoJoinData = 0;
                var tileCenter = this.getTileObject(posX, posY);
                var tileNorth = this.getTileObject(posX, posY-1);
                var tileWest = this.getTileObject(posX-1, posY);
                var tileSouth = this.getTileObject(posX, posY+1);
                var tileEast = this.getTileObject(posX+1, posY);
                if(tileCenter.graphicState === 'water'){
                    if(!tileNorth || tileNorth.movement&tileCenter.movement){ autoJoinData |= NORTH;}
                    if(!tileSouth || tileSouth.movement&tileCenter.movement){ autoJoinData |= SOUTH;}
                    if(!tileWest  || tileWest.movement &tileCenter.movement){ autoJoinData |= WEST ;}
                    if(!tileEast  || tileEast.movement &tileCenter.movement){ autoJoinData |= EAST ;}
                }
                if(tileCenter.graphicState === 'bridge'){
                    if(     !tileNorth || tileNorth.graphicState === 'water'){ autoJoinData = NORTH;}
                    else if(!tileSouth || tileSouth.graphicState === 'water'){ autoJoinData = NORTH;}
                    if(     !tileWest  || tileWest.graphicState  === 'water'){ autoJoinData = WEST ;}
                    else if(!tileEast  || tileEast.graphicState  === 'water'){ autoJoinData = WEST ;}
                }
                this.tileData[posY*this.width + posX] = autoJoinData;
            }
        }
        return this;
    },
    recordTile: function (tileId, tileX, tileY){
        /*var compoundIndex = tileData.y*this.width + tileData.x;
        var newTileMemory = Object.instantiate(tileMemory, tileData);
        this.tileGrid[compoundIndex] = newTileMemory;*/
        var compoundIndex = tileY*this.width + tileX;
        this.tileGrid[compoundIndex] = tileId;
    },
    getTile: function (x, y){
        // TODO: Document.
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return undefined;
        }
        var compoundIndex = y*this.width + x;
        var result = this.tileGrid[compoundIndex];
        return result;
    },
    getTileObject: function (x, y){
        var tileId = this.getTile(x, y);
        var resultTile = null;
        if(tileId){
            resultTile = this.tileTypes[tileId];
        }
        return resultTile;
    },
    getTileData: function (x, y){
        // TODO: Document.
        if(x < 0 || x >= this.width || y < 0 || y >= this.height){
            return undefined;
        }
        var compoundIndex = y*this.width + x;
        var result = this.tileData[compoundIndex];
        return result;
    }
};
var mapMemory = {
    // TODO: Document.
    regions: undefined,
    containables: undefined,
    events: undefined,
    _new: function (){
        this.regions = {};
        this.containables = {};
        this.events = [];
        return this;
    },
    getRegion: function (regionId){
        return this.regions[regionId];
    },
    getContainable: function (containableId){
        return this.containables[containableId];
    },
    disposeContainable: function(id){
        var content = this.containables[id];
        if(content){ delete content.eventResource;}
        delete this.containables[id];
    },
    recordRegion: function (regionData){
        /**
         *  This function creates a new regionMemory from data, and stores
         *      it in the list of regions, accessibly by regionId.
         *  It returns a new regionMemory object.
         **/
        var newRegion = Object.instantiate(regionMemory, regionData);
        this.regions[regionData.regionId] = newRegion;
        return newRegion;
    },
    recordUpdates: function (updates){
        /**
         *  This function takes in containable data from the server and records
         *      it.
         *  It does not return a value.
         **/
        for(var regionId in updates){
            if(!updates.hasOwnProperty(regionId)){ continue;}
            var regionUpdate = updates[regionId];
            if(!regionUpdate){ continue;}
            for(var id in regionUpdate){
                if(!regionUpdate.hasOwnProperty(id)){ continue;}
                if(id === 'sound'){
                    client.audio.senseSounds(regionUpdate[id]);
                } else if(id === 'event'){
                    this.recordEvents(regionUpdate[id]);
                } else{
                    var idContent = regionUpdate[id];
                    this.recordContent(id, regionUpdate[id]);
                }
            }
        }
    },
    recordEvents: function (eventsArray){
        for(var eventIndex = 0; eventIndex < eventsArray.length; eventIndex++){
            var eventOptions = eventsArray[eventIndex];
            var eventTemplate = client.resource('event', eventOptions.name);
            if(!eventTemplate){ eventTemplate = client.resource('event', 'empty')}
            if(!eventTemplate){ continue;}
            var newEvent = Object.instantiate(eventTemplate, eventOptions);
            this.events.push(newEvent);
        }
    },
    recordContent: function (contentId, newContent){
        var oldContent = this.getContainable(contentId);
        if(!oldContent){
            this.containables[contentId] = newContent;
        } else{
            for(var key in newContent){
                if(!newContent.hasOwnProperty(key)){ continue;}
                oldContent[key] = newContent[key];
            }
        }
        if(newContent.disposed || newContent.dead){
            this.disposeContainable(contentId);
            return;
        }
    },
    dispose: function (){
        // TODO: Implement. Clean up references.
    }
};
//== CLOSE PRIVATE NAMESPACE =================================================//
    return memory;
})();