'use strict';

const env = require('./env.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const tile = module.exports = {
    /**
     *  Tiles are the basic unit of map layout. Tiles determine the layout of
     *      the map, and how other mappables move about and interact with the
     *      game map in the most basic ways. They also determine line of sight.
     *  This is a prototype, and must be instanced before use.
     **/
    id: undefined,
        /*  TODO: ID needs to be renamed or refactored, as it confuses matters
            as other objects derived from the same ancestor also have ids with
            different implementations. */
    movement: env.MOVEMENT_WALL,
    opaque: true,
    graphic: undefined,
    graphicState: undefined,
    pack(){
        return {
            id: this.id,
            movement: this.movement,
            opaque: this.opaque,
            graphic: this.graphic,
            graphicState: this.graphicState
        };
    },
    enter(content){
        /**
         *  This function determines whether content is allowed to enter the
         *      tile. It handles density checks. It is also a hook for further
         *      derived tiles, such as tiles that let actors enter, but not
         *      items.
         *  Density of contained objects is handled elsewhere.
         *  It returns true if the content is allowed to enter, and false if it
         *      is not.
         **/
        // Fail if tile is dense.
        if(!(this.movement & content.movement)){ return false;}
        // Movement is allowed, return true.
        return true;
    },
    entered(/*content*/){
        /**
         *  Entered is a hook for further derived tiles. It is called whenever
         *      a movable enters a tile, after movement is finished. It is not
         *      called after placement, or after containables like items are
         *      placed. It can be used to create, for examples, traps that
         *      spring when the user steps on them.
         *  It does not return anything.
         **/
    },
    genericTileTypes(){
        return genericTileTypes;
    }
};

const genericTileTypes = {
    '!': env.extend(tile, { // Testing Marker
        id: 'test',
        movement: 0,
        opaque: false,
    }),
    '%': env.extend(tile, { // Undefined
        id: 'undefined',
    }),
    '#': env.extend(tile, { // Wall
        id: 'wall',
        character: '#',
        graphicState: 'wall'
    }),
    '*': env.extend(tile, { // Wall
        id: 'pillar',
        character: '*',
        graphicState: 'pillar'
    }),
    '.': env.extend(tile, { // Floor
        id: 'floor',
        movement: env.MOVEMENT_FLOOR,
        opaque: false,
        graphicState: 'floor'
    }),
    '=': env.extend(tile, { // Wall
        id: 'bridge',
        character: '=',
        graphicState: 'bridge',
        opaque: false,
        movement: env.MOVEMENT_FLOOR | env.MOVEMENT_WATER
    }),
    '~': env.extend(tile, { // Wall
        id: 'water',
        character: '~',
        graphicState: 'water',
        opaque: false,
        movement: env.MOVEMENT_WATER
    }),
    ' ': env.extend(tile, { // Hall
        id: 'hall',
        movement: env.MOVEMENT_FLOOR,
        opaque: false,
        graphic: 'plains',
        graphicState: 'grass'
    })
};