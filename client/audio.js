var spriteData = [
    {url: 'audio/fx/attack_1.wav', sprite: {
        'test': [0,500]
    }}
];
client.audio = {
    sounds: {},
    senseSounds: function (soundArray){
        soundArray.forEach(function (sensoryData){
            this.playSound(sensoryData.name, sensoryData.options);
        }, this)
    },
    playSound: function (soundId, options){
        var sound = this.sounds[soundId];
        if(!sound){ return null;}
        var instanceId = sound.play();
        return instanceId;
    },
//============================================================================//
    setup: function (configuration){
        var audioResource = {
            _new: function (id, parentHowl){
                this.id = id;
                this.parent = parentHowl;
                client.audio.sounds[id] = this;
                return this;
            },
            play: function (){
                var soundId// = this.parent.play('test');
                return soundId;
            }
        };
        var resourcePath = 'rsc';
        spriteData.forEach(function (howlData){
            var newHowl = new Howl({
                src: [resourcePath+'/'+howlData.url],
                sprite: howlData.sprite
            });
            this.test = newHowl;
            for(var key in howlData.sprite){
                if(!howlData.sprite.hasOwnProperty(key)){ continue;}
                Object.instantiate(audioResource, key, newHowl);
            }
        }, this);
    }
}