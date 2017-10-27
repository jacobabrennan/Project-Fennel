(function (){ // Open new namespace for traps.
//==============================================================================

modelLibrary.registerModel('trap', Object.create(trap, {
    generationId: {value: 'acid'},
    name: {value: 'acid puddle'},
    background: {value: '#690'},
    character: {value: null},
    hidden: {value: false, writable: true},
    faction: {value: FACTION_ENEMY},
    constructor: {value: function (){
        var self = this;
        gameManager.registerEvent(function (){
            self.dispose();
        }, gaussRandom(20,2));
        return trap.constructor.apply(this, arguments);
    }},
    trigger: {value: function (content){
        if(content.type != TYPE_ACTOR){ return;}
        if(content.faction & this.faction){ return;}
        content.hear('acid', 10, null, "You're splashed with acid!");
        content.hurt(5, DAMAGE_ACID);
        this.dispose();
    }, writable: true},
    // Description
    viewText: {value: "You see a puddle of acid. Hot vapors rise from the surface and sting your eyes."}
}));
(function (base){
    base.move = (function (parentFunction){
        return function (){
            if(!this.immobile){
                return parentFunction.apply(this, arguments);
            }
            if(this.hear){
                this.hear('web', 10, null, "You cannot move!");
            }
            return false;
        };
    })(base.move);
    base.takeTurn = (function (parentFunction){
        return function (callback){
            if(this.immobile){
                this.immobile--;
            }
            return parentFunction.apply(this, arguments);
        }
    })(base.takeTurn);
})(person);
modelLibrary.registerModel('trap', Object.create(trap, {
    generationId: {value: 'web'},
    name: {value: 'web'},
    color: {value: '#888'},
    character: {value: '%'},
    hidden: {value: false, writable: true},
    faction: {value: FACTION_ENEMY},
    opaque: {value: true, writable: true}, 
    /*constructor: {value: function (){
        var self = this;
        gameManager.registerEvent(function (){
            self.dispose();
        }, gaussRandom(20,2));
        return trap.constructor.apply(this, arguments);
    }},*/
    trigger: {value: function (content){
        if(content.type != TYPE_ACTOR){ return;}
        if(content.faction & this.faction){ return;}
        content.hear('web', 10, null, "You've become stuck in a web!");
        content.immobile = 10;
        this.dispose();
    }, writable: true},
    // Description
    viewText: {value: "You see a puddle of acid. Hot vapors rise from the surface and sting your eyes."}
}));
//==============================================================================
    // Close namespace.
})();