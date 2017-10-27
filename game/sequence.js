'use strict';

//== END REQUIRES ==== (check for deferred modules) ============================

const sequence = module.exports = {
    _new(regionId, options){
        this.setup(options);
        this.regionId = regionId;
        return this;
    },
    setup(/*options*/){},
    iterate(){},
    finish(){
        this.finished = true;
    },
    dispose(){}
};