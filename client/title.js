

/*===========================================================================
 *
 *  !!!!!!!!!!!! Incorrect (copy/pasted) documentation) !!!!!!!!!!!!!!!!!!!!!
 *  TODO: Document.
 *  The gameplay driver is single point of contact between the game and
 *      the player once the game is running. It collects all input from the
 *      player, via keyboard, touch, and mouse, and displays the game state
 *      via a map and a menuing system.
 *  It is not a prototype, and should not be instanced.
 *      
  ===========================================================================*/

client.drivers.title = Object.create(driver, {
    drivers: {value: {}, writable: true},
    setup: {value: function (configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
         **/
    }},
    command: {value: function (command, options){
        // TODO: Document.
        var block = driver.command.apply(this, arguments);
        if(block){
            return block;
        }
        if(options && options.key){
            if(options.key == 'a' || options.key == 'A'){
                command = COMMAND_ENTER;}
            if(options.key == 'b' || options.key == 'B'){
                command = COMMAND_HELP;}
        }
        switch(command){
            case COMMAND_ENTER:
            case COMMAND_PRIMARY:
                this.newGame();
                return true;
            case COMMAND_HELP:
                clearInterval(this.drawInterval);
                this.focus(this.drivers.about);
                return true;
        }
        return false;
    }},
    focused: {value: function (){
        this.display();
        client.keyCapture.clearPress();
    }},
    blurred: {value: function (){
        this.focus(null);
    }},
    newGame: {value: function (){
        // TODO: Document.
        /**
         **/
        client.skin.clearCommands();
        client.networking.sendMessage(COMMAND_NEWGAME, {});
        client.display();
        //client.gameplay.newGame();
        //client.focus(client.gameplay);
    }},
    display: {value: function (options){
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        client.skin.black();
        client.skin.drawString(4.5, 6, 'Casual Quest');
        client.skin.drawString(2.25, 5, 'Spacebar - Start Game');
        client.skin.drawString(0, DEFAULT_MAP_SIZE-0.5, PROJECT_NAME, '#73920c');
        client.skin.drawString(0, DEFAULT_MAP_SIZE-1, ' Version '+VERSION, '#73920c');
        document.title = PROJECT_NAME+': '+VERSION;
        var portraits = client.resource('graphic', 'portraits');
        var count = 0;
        var keys = [];
        for(var key in portraits.states){
            if(!portraits.states.hasOwnProperty(key)){ continue;}
            keys.push(key);
        }
        client.skin.drawGraphic(
            'portraits',
            arrayPick(keys),
            displayWidth/2 - 32,
            (displayHeight)/2
        );
        return true;
    }}
});