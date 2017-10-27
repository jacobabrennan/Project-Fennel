// TODO: Document.
//== Setup ===================================================================//
var client = Object.extend(driver, {
    drivers: {},
    setup: function (configuration){
        this.resourceLibrary.setup(function (){
            this.skin.setup(configuration);
            this.audio.setup(configuration);
            this.keyCapture.setup(configuration);
            this.drivers.title.setup(configuration);
            this.gameplay.setup(configuration);
            this.networking.setup(configuration);
            this.focus(this.drivers.title);
        }.bind(this));
    },
    tick: function (){
        this.networking.sendMessage('ping');
        var result = driver.tick.apply(this, arguments);
        this.networking.flushMessages();
        return result;
    }
});
//== Networking ==============================================================//
client.networking = {
    tc_remoteClient: null,
    bufferOut: [],
    setup: function (configuration){
        this.tc_remoteClient = configuration.socket;//clientManager.registerClient(this);
        this.tc_remoteClient.on('gameData', function(message){
            client.networking.receiveMessage(message[0], message[1]);
        });
    },
    sendMessage: function (command, options){
        this.bufferOut.push({command: command, options: options});
    },
    receiveMessage: function (command, options){
        switch(command){
            case COMMAND_SENSE:
                client.gameplay.memory.sense(options);
                //if(client.gameplay.memory.statusUpdate){
                //client.gameplay.display();
                //}
                break;
            case COMMAND_CONNECTION:
                client.id = options.id;
                break;
            case COMMAND_WAITING:
                client.gameplay.waiting(options);
                break;
            case COMMAND_NEWGAME:
                client.gameplay.newGame(options);
                break;
            case COMMAND_NEWWAVE:
                client.gameplay.newWave(options);
                break;
            case COMMAND_CLEARWAVE:
                client.gameplay.clearWave(options);
                break;
            case COMMAND_GAMEOVER:
                client.gameplay.gameOver(options);
                break;
            case COMMAND_HERO_ID:
                client.gameplay.heroId = options.id;
                //client.gameplay.focus()
                break;
            case COMMAND_ADJUST_DECK:
                client.gameplay.adjustDeck(options);
                break;
        }
    },
    flushMessages: function (){
        this.tc_remoteClient.emit('buffer', this.bufferOut);
        //this.tc_remoteClient.receiveBuffer(this.bufferOut);
        //this.tc_remoteClient.receiveMessage(command, options);
        //if(this.bufferOut.length > 1){ console.log(this.bufferOut)}
        this.bufferOut.length = 0;
    }
};
//== Keyboard Capture and Routing ============================================//
client.preferences = {
    /* Special Key Names: backspace, tab, enter, return, capslock, esc, escape,
       space, pageup, pagedown, end, home, left, up, right, down, ins, del,
       plus.*/
    // COMMAND_NONE needed to register alphabet keypresses with Mousetrap.
    // Uppercase aliases generated automatically by the client.
    "up": NORTH,
	"down": SOUTH,
	"left": WEST,
	"right": EAST,
    "home": NORTHWEST,
    "end": SOUTHWEST,
    "pageup": NORTHEAST,
    "pagedown": SOUTHEAST,
    //"Unidentified": WAIT, // See setup for special case.
    
    "tab": COMMAND_TOGGLE_DECK,
    "escape": COMMAND_CANCEL,
    "a": COMMAND_NONE,
    "b": COMMAND_NONE,
    "c": COMMAND_QUATERNARY,
    "d": COMMAND_NONE,
    "e": COMMAND_NONE,
    "f": COMMAND_NONE,
    "g": COMMAND_NONE,
    "q": COMMAND_NONE,
    "r": COMMAND_NONE,
    "s": COMMAND_NONE,
    "t": COMMAND_NONE,
    "v": COMMAND_HELP,
    "w": COMMAND_NONE,
    "x": COMMAND_TERTIARY,
    "z": COMMAND_SECONDARY,
    
    "h": COMMAND_NONE,
    "i": COMMAND_NONE,
    "j": COMMAND_NONE,
    "k": COMMAND_NONE,
    "l": COMMAND_NONE,
    "m": COMMAND_NONE,
    "n": COMMAND_NONE,
    "o": COMMAND_NONE,
    "p": COMMAND_NONE,
    "u": COMMAND_NONE,
    "y": COMMAND_NONE,
    
    "?": COMMAND_NONE,
    "<": COMMAND_NONE,
    ">": COMMAND_NONE,
    ",": COMMAND_NONE,
    ".": COMMAND_NONE,
    "[": COMMAND_NONE,
    "]": COMMAND_NONE,
    "space": COMMAND_PRIMARY,
    //"enter": COMMAND_PRIMARY,
    //"return": COMMAND_ENTER
        // Don't use. Mousetrap will fire events for both enter AND return.
    "backspace": COMMAND_NONE,
    "del": COMMAND_NONE
};
//============================================================================//
// TODO: Document.
client.keyCapture = {
	keyState: {},
    keyPress: {},
	setup: function (configuration){
        // TODO: Document.
        // TODO: Change focus to container in 'production'.
		// See note in skin.js about tabindex and focus.
        document.body.addEventListener('keydown', function (e){
            if(e.keyCode == 12){
                client.command(COMMAND_WAIT, {'key': null});
            }
        });
        var trapCreatorDown = function (key, command){
            return function(event){
                client.keyCapture.keyDown(command, {'key': key});
                event.preventDefault();
            };
        };
        var trapCreatorUp = function (key, command){
            return function(event){
                client.keyCapture.keyUp(command, {'key': key});
                event.preventDefault();
            };
        };
		var container = document.body; // See note above.
        this.mousetrap = Mousetrap(container);
        this.bindingsLookup = {};
        for(var key in client.preferences){
            if(!client.preferences.hasOwnProperty(key)){ continue;}
            var command = client.preferences[key];
            this.bindingsLookup[command] = key;
            this.mousetrap.bind(key, trapCreatorDown(key, command));
            this.mousetrap.bind(key, trapCreatorUp(key, command), 'keyup');
            var upperKey = key.toUpperCase();
            if(upperKey !== key){
                this.mousetrap.bind(upperKey, trapCreatorDown(upperKey, command));
                this.mousetrap.bind(upperKey, trapCreatorUp(upperKey, command), 'keyup');
            }
        }
	},
    check: function (command){
        var binding = this.bindingsLookup[command];
        if(!binding){ return false;}
        var result = this.keyState[binding.toString()];
        if(!result){ result = this.keyPress[binding.toString()];}
        return result;
    },
    keyDown: function (command, options){
		// Start key_down repeat work-around.
        if(this.check(command)){
            return;
        }
		this.keyState[options.key] = true;
			// End key_down repeat work-around.
        this.keyPress[options.key] = true;
		client.command(command, options);
	},
	keyUp: function (command, options){
		// Start key_down repeat work-around.
		delete this.keyState[options.key];
			// End key_down repeat work-around.
		client.command((command|KEY_UP), options);
	},
    clearPress: function (){
        this.keyPress = {};
    },
    checkPress: function (command){
        var binding = this.bindingsLookup[command];
        if(!binding){ return false;}
        return this.keyPress[binding.toString()];
    }
};