'use strict';

let env = require('./env.js');
let movable = require('./movable.js');
//== END REQUIRES ==== (check for deferred modules) ============================

const item = module.exports = env.extend(movable, {
    width: 8,
    height: 8,
    graphic: 'items',
    graphicState: 'coin_silver',
    type: env.TYPE_ITEM,
    faction: env.FACTION_NONE,
    lifespan: env.ITEM_LIFESPAN,
    age: 0,
    collide(obstacle){
        if(obstacle.type !== env.TYPE_ACTOR){ return;}
        if(obstacle.faction & env.FACTION_PLAYER){
            obstacle.collectItem(this);
        }
    },
    iterate(){
        let result = movable.iterate.apply(this, arguments);
        this.age++;
        if(this.lifespan-- <= 0){ this.dispose();}
        return result;
    },
    use(/*user*/){
        this.dispose();
    }
});