'use strict';

const env = require('./env.js');
//== END REQUIRES ==== (check for deferred modules) ============================

//== Variables to be Exported to Global Namespace ============================//
const mapManager = module.exports = {
    regions: {},
    generateMap(options){
        if(!options){ options = {};}
        // Scaffolding
        let waveNumber = options.waveNumber || 1;
        let theme = options.theme;
        let mapTemplate;
        if(options.mapName){
            mapTemplate = mapManager.templates.get({name: options.mapName});
        }
        if(!mapTemplate){
            mapTemplate = mapManager.templates.get({boss: options.boss});
        }
        let testRegion = {
            id: waveNumber,
            width: mapTemplate.height,
            height: mapTemplate.height,
            theme: theme,
            tiles: mapTemplate.textGrid,
            waveNumber: waveNumber,
            boss: options.boss,
            openSides: mapTemplate.openSides,
            passages: mapTemplate.passages,
            bossLocation: mapTemplate.bossLocation
        };
        //testRegion.tileContents.length = testRegion.width * testRegion.height;
        //
        return testRegion;
    },
    loadRegion(regionData){
        let regionId = regionData.id;
        if(!this.regions[regionId]){
            let newRegion = env.instantiate(region, regionData);
            this.regions[regionId] = newRegion;
            return newRegion;
        } else{
            return null;
        }
    },
    cancelRegion(regionId){
        delete this.regions[regionId];
    },
    updates: null,
    clearUpdates(){
        this.updates = null;
    },
    getRegion(regionId){
        /**
            This function allows any part of the game to access any region by
                region id.
            It returns the region, if found. Otherwise, it returns undefined.
         **/
        return this.regions[regionId];
    },
    getTile(x, y, regionId){
        /**
            This function allows any part of the game to access any tile in any
                region by coordinates and id.
            It returns a tile, if found. Otherwise, it returns undefined.
         **/
        let referencedRegion = this.getRegion(regionId);
        if(!referencedRegion){ return undefined;}
        return referencedRegion.getTile(x, y);
    },
    getTileCoords(x, y, regionId){
        return this.getTile(
            Math.floor(x/env.TILE_SIZE),
            Math.floor(y/env.TILE_SIZE),
            regionId
        );
    },
    dense(x, y, regionId, entrant){
        let referencedRegion = this.getRegion(regionId);
        if(!referencedRegion){ return true;}
        return referencedRegion.dense(x, y, entrant);
    },
    swapPlaces(content1, content2){
        let oldX = content1.x;
        let oldY = content1.y;
        let oldId = content1.regionId;
        let obsX = content2.x;
        let obsY = content2.y;
        let obsId = content2.regionId;
        content1.unplace();
        let success = content2.place(oldX, oldY, oldId);
        if(success){  content1.place(obsX, obsY, obsId);}
        else{         content1.place(oldX, oldY, oldId);}
        return success;
    },
    event(name, regionId, options){
        let idRegion = this.getRegion(regionId);
        if(!idRegion){ return null;}
        //var newEvent = env.instantiate(event, name, regionId, options);
        options.id = 'event';
        options.name = name;
        options.regionId = regionId;
        options.type = env.TYPE_EVENT;
        if(typeof options.center === 'object'){
            options.x = options.center.x+Math.floor(options.center.width /2);
            options.y = options.center.y+Math.floor(options.center.height/2);
            options.center = true;
        }
        idRegion.update(options.id, options);
        return options;
    },
    sequence(name, regionId, options){
        let idRegion = this.getRegion(regionId);
        if(!idRegion){ return null;}
        let sequenceModel = modelLibrary.getModel('sequence', name);
        if(!sequenceModel){ return null;}
        let newSequence = env.instantiate(sequenceModel, regionId, options);
        idRegion.sequences.push(newSequence);
        return newSequence;
    },
//==== Id Manager ============================================================//
    idManager: {
        // TODO: Document.
        ids: [],
        recycledIds: [],
        reset(){
            this.recycledIds = [];
            for(let id = 0; id < this.ids.length; id++){
                let idObject = this.ids[id];
                if(idObject && idObject.dispose){
                    idObject.dispose();
                }
            }
            this.ids = [];
        },
        assignId(thing){
            // TODO: Document.
            let newId;
            if(this.recycledIds.length){
                newId = this.recycledIds.shift();
            } else{
                newId = this.ids.length;
            }
            this.ids[newId] = thing;
            return newId;
        },
        cancelId(id){
            // TODO: Document.
            let identifiedThing = this.ids[id];
            if(!identifiedThing){ return;}
            this.ids[id] = null;
            let oldIndex = this.recycledIds.indexOf(id);
            if(oldIndex){ return;}
            this.recycledIds.push(id);
        },
        get(id){
            // TODO: Document.
            return this.ids[id];
        }
    }
};

//== DEFERRED MODULES ==========================================================
const modelLibrary = require('./model_library.js');
const region = require('./region.js');