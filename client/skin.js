// TODO: Document.
client.skin = Object.extend(driver, {
    container: undefined,
    context: undefined,
    scrapBoard: (function (){
        var scrapBoard = document.createElement('canvas');
		scrapBoard.width = TILE_SIZE*4;
		scrapBoard.height = TILE_SIZE*4;
		scrapBoard = scrapBoard.getContext("2d");
        return scrapBoard;
    })(),
    currentLayer: null,
    drawingLayers: {},
    scale: 2,
    setup: function (configuration){
        /**
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.gameplay.setup. It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.
            
            It should not be called more than once.
            
            It does not return anything.
        **/
        this.clearCommands();
        //this.mouseCapture.setup(configuration);
        this.font = configuration.font || 'monospace';
        this.highlightColor = configuration.highlightColor || '#ff0';
        var drawCanvas = document.createElement('canvas');
        drawCanvas.width = displayWidth;
        drawCanvas.height = displayHeight;
        drawCanvas.addEventListener('click', this.clickHandler);
        var displayCanvas = document.createElement('canvas');
        displayCanvas.width = displayWidth*this.scale;
        displayCanvas.height = displayHeight*this.scale;
        //displayCanvas.addEventListener('click', this.clickHandler.bind(this));
        /*this.context = drawCanvas.getContext('2d');
        this.context.imageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.font = FONT_SIZE+'px '+this.font;*/
        this.displayContext = displayCanvas.getContext('2d');
        this.displayContext.imageSmoothingEnabled = false;
        this.displayContext.webkitImageSmoothingEnabled = false;
        this.displayContext.mozImageSmoothingEnabled = false;
        this.container = document.getElementById(configuration.containerId);
        this.container.tabIndex = 1;
        this.container.focus();
        this.container.appendChild(displayCanvas);
        var self = this;
        [LAYER_TILES, LAYER_UNDER, LAYER_SPRITES].forEach(function (element){
            var layerCanvas = document.createElement('canvas');
            layerCanvas.width = displayWidth;//*this.scale;
            layerCanvas.height = displayHeight;//*this.scale;
            var context = layerCanvas.getContext('2d');
            context.imageSmoothingEnabled = false;
            context.webkitImageSmoothingEnabled = false;
            context.mozImageSmoothingEnabled = false;
            context.font = FONT_SIZE+'px '+self.font;
            self.drawingLayers[element] = context;
        });
        this.switchLayer(LAYER_TILES);
        this.graphicsTimer.start();
    },/*
    clickHandler: function (clickEvent){
        // Extract coordinates of click from DOM mouse event.
        var correctedX = clickEvent.pageX - clickEvent.target.offsetLeft;
        var correctedY = clickEvent.pageY - clickEvent.target.offsetTop;
        // Scale click coordinates.
        correctedX = Math.floor(correctedX / this.scale);
        correctedY = Math.floor(correctedY / this.scale);
        // Correct Y coordinate for difference of coordinate systems.
        correctedY = displayHeight-correctedY;
        var tileX = Math.floor(correctedX/TILE_SIZE);
        var tileY = Math.floor(correctedY/TILE_SIZE);
        if(!client.skin.triggerCommand(tileX, tileY)){
            client.handleClick(correctedX, correctedY, {
                'tileX':tileX, 'tileY':tileY
            });
        }
    },*/
    switchLayer: function (layer){
        if(layer === this.currentLayer){ return;}
        //var oldLayerData = this.context.getImageData(0, 0, displayWidth, displayHeight);
        //this.drawingLayers[this.currentLayer] = oldLayerData;
        var newContext = this.drawingLayers[layer];
        if(!newContext){ return;}
        this.currentLayer = layer;//this.drawingLayers[layer];
        this.context = this.drawingLayers[this.currentLayer];
        //this.clear();
        //var newLayerData = this.drawingLayers[layer];
        //if(newLayerData){
        //    this.context.putImageData(newLayerData, 0, 0);
        //}
    },
    blank: function (){
        //this.context.fillStyle = '#000';
        //this.context.fillRect(0, 0, displayWidth, displayHeight);
        //this.context.clearRect(0, 0, displayWidth, displayHeight);
        this.switchLayer(LAYER_SPRITES);
        this.clear();
        this.switchLayer(LAYER_UNDER);
        this.clear();
        this.switchLayer(LAYER_TILES);
        this.clear();
    },
    clear: function (){
        this.context.clearRect(0, 0, displayWidth, displayHeight);
    },
    black: function (){
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, displayWidth, displayHeight);
    },
    colorOverlay: function (color, alpha){
        this.context.fillStyle = color;
        this.context.globalAlpha = alpha;
        this.context.fillRect(0, 0, displayWidth, displayHeight);
        this.context.globalAlpha = 1;
    },
    fillRect: function (x, y, width, height, color){
        /*this.context.fillStyle = color || '#000';
        y = (displaySize) - y;
        var fillY = (y*TILE_SIZE)+2; // TODO: MAGIC NUMBERS!
            / * This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. * /
        var fillHeight = height*TILE_SIZE;
        var fillWidth  =  width*TILE_SIZE;
        fillY -= fillHeight;
        this.context.fillRect(x*TILE_SIZE, fillY, fillWidth, fillHeight);*/
        this.context.fillStyle = color || '#000';
        var adjustY = displayHeight-(y+height)
        this.context.fillRect(x, adjustY, width, height);
    },
    drawGraphic: function (resourceId, stateName, x, y, options){
        var resource = client.resourceLibrary.resource('graphic', resourceId);
        if(!options){ options = {};}
        options.state = stateName;
        options.time = this.graphicsTimer.time;
        if(!resource){ return null;}
        return resource.draw(x, y, options);
    },
    drawCircle: function (x, y, radius, innerRadius, color, fillColor, options){
        var adjustX = x;
        var adjustY = (displayHeight)-(y);
        //
        this.context.save();
        this.context.beginPath();
        this.context.arc(adjustX, adjustY, radius, 0, 2*Math.PI);
        if(innerRadius){
            this.context.arc(adjustX, adjustY, innerRadius, 0, -2*Math.PI);
        }
        this.context.closePath();
        if(fillColor){
            this.context.fillStyle = fillColor;
            this.context.fill('evenodd');
        }
        if(color){
            this.context.strokeStyle = color;
            this.context.stroke();
        }
        this.context.restore();
    },
    drawOval: function (x, y, width, height, fillColor) {
        var adjustX = x;
        var adjustY = (displayHeight)-(y);
        width *= 1.4;
        //
        this.context.save();
        this.context.beginPath();
        this.context.moveTo(adjustX, adjustY - height / 2);
        this.context.bezierCurveTo(
            adjustX+width/2, adjustY-height/2,
            adjustX+width/2, adjustY+height/2,
            adjustX        , adjustY+height/2
        );
        this.context.bezierCurveTo(
            adjustX-width/2, adjustY+height/2,
            adjustX-width/2, adjustY-height/2,
            adjustX        , adjustY-height/2
        );
        this.context.fillStyle = fillColor || '#000';
        this.context.fill();
        this.context.closePath();
        this.context.restore();
    },
    drawCharacter: function (x, y, character, color, background, font){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        y = (displayHeight/TILE_SIZE) - y;
        // Display Background
        this.context.fillStyle = background || '#000';
        var fillY = ((y-1)*TILE_SIZE)+2; // TODO: MAGIC NUMBERS!
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. */
        this.context.fillRect(x*TILE_SIZE, fillY, TILE_SIZE, TILE_SIZE);
        // Display character
        if(font){ this.context.font = FONT_SIZE+'px '+font;}
        this.context.fillStyle = color || '#fff';
        this.context.fillText(character, x*TILE_SIZE, y*TILE_SIZE);
        if(font){ this.context.font = FONT_SIZE+'px '+this.font;}
    },
    drawString: function (x, y, newText, color, background, font){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        // Reverse y (canvas origin problem):
        y = (displayHeight/TILE_SIZE) - y;
        // Display Background
        /*this.context.fillStyle = background || '#000';
        var fillY = ((y-1)*TILE_SIZE)+2; // TODO: MAGIC NUMBERS!
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. * /
        var textWidth = newText.length;
        this.context.fillRect(
            x*TILE_SIZE,
            fillY,
            TILE_SIZE*textWidth,
            TILE_SIZE
        );*/
        // Display character
        if(font){ this.context.font = FONT_SIZE+'px '+font;}
        this.context.fillStyle = background || '#204';
        this.context.fillText(newText, x*TILE_SIZE+1, y*TILE_SIZE+1);
        this.context.fillStyle = color || '#fff';
        this.context.fillText(newText, x*TILE_SIZE, y*TILE_SIZE);
        if(font){ this.context.font = FONT_SIZE+'px '+this.font;}
    },
    /*drawParagraph: function (x, y, newText, color, background, font, width){
        if(color == HIGHLIGHT){ color = this.highlightColor;}
        // Display Background
        this.context.fillStyle = background || '#000';
        var maxWidth = width || (displayHeight/TILE_SIZE * 2)-2;
        var words = newText.split(' ');
        var runningLength = 0;
        var currentLine = 0;
        var currentString = '';
        while(words.length){
            var nextWord = words.shift();
            if(nextWord.length + 1 + runningLength > maxWidth){ // 1 for ' '.
                this.drawString(
                    x, y-currentLine, currentString, color, background, font);
                currentLine++;
                currentString = '';
                runningLength = 0;
            } else if(runningLength !== 0){
                currentString += ' ';
                runningLength += 1;
            }
            runningLength += nextWord.length;
            currentString += nextWord;
        }
        this.drawString(
            x, y-currentLine, currentString, color, background, font);
    },*/
    drawCommand: function (x, y, key, name, command){
        var keyLength = key.length;
        this.drawString(x, y, key, HIGHLIGHT);
        if(name){
            this.drawString(x+(keyLength/2), y, name);
        }
        var totalLength = keyLength + (name? name.length : 0) +1; // +1 for ' '.
        for(var posX = 0; posX < totalLength; posX++){
            this.registerCommand(x+posX, y, command);
        }
    },
    clearCommands: function (){
        this.commandCoords = [];
    },
    registerCommand: function (x, y, command){
        var compoundIndex = (y*(displayWidth/TILE_SIZE)*2) + x;
        this.commandCoords[compoundIndex] = command;
    },
    triggerCommand: function (x, y){
        var compoundIndex = (y*(displayWidth/TILE_SIZE)*2) + x;
        var command = this.commandCoords[compoundIndex];
        if(command){
            if((typeof command) == 'function'){
                command();
            } else{
                client.command(command);
            }
            return true;
        }
        return false;
    },
    graphicsTimer: {
        time: 0,
        speed: CLIENT_SPEED,
        interval: undefined,
        iterate: undefined,
        iterator: (function (){
            var drawLayer = function (layerNumber){
                client.skin.switchLayer(layerNumber);
                client.skin.displayContext.drawImage(
                    client.skin.context.canvas,
                    0,0,
                    displayWidth*client.skin.scale,
                    displayHeight*client.skin.scale
                );
            };
            return function (){
                this.time++;
                client.tick();
                drawLayer(LAYER_TILES);
                drawLayer(LAYER_UNDER);
                drawLayer(LAYER_SPRITES);
            };
        })(),
        start: function (){
            this.iterate = this.iterator.bind(this);
            this.interval = setInterval(this.iterate, this.speed);
        },
        stop: function (){
            clearInterval(this.interval);
            this.iterate = null;
            this.time = 0;
        }
    }
});