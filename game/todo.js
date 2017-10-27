/*

+blob jump is wierd
Movement should bias towards 8px grid (zelda tweak)
Trees don't block properly. Weird.
C: Disable HUD toggle while not in main combat phase
C: Boss death animation
C: Clean up wave over screen (scores at fixed position)
C: Inter-region preview too long
//
G: Redo push puff graphic (swirl)
G: Gardener Portrait
-G: Title Screen
G: Sorcerer firesnake skill
G: Inter-region preview graphics
//
D: Decide on each region's story boss
DG: second 16 cards (sun/moon, 8 major arcana)
    D: Determine what sun and moon do
    D: Determine 8 trump cards
    G: Do actual graphics
DG: Redesign needed classes
DG: Boss Cut Scenes
DG: Ending


================================================================================

Knight - Castle
Healer - Castle
Brigand - Forest
Adventurer (Revolutionary) - Forest

Wizard - Wastes
Bard - Wastes
Barbarian (Warlord/Berserker) - Desert
Illusionist (Conjurer/Mystic)- Desert

Paladin (Guardian/Dragoon) - Inferno
Mage Knight (Warlock/SpellSword- Inferno
Scholar (Alchemist/Necromancer) - Ruins
Hero/Monk/Ninja/PMR - Ruins

Purpose
    Take down the King    

Thoughts:
    Knight - Red Haven (Castle)
    Healer - Red Haven (Castle)
    Wizard - North 
    Brigand - Red Haven (Khandroma)
    Paladin - East Kingdom
    Mage Knight - East Kingdom
    Barbarian - North
    Scholar - East Kingdom
    Bard - North
    Illusionist - North
    Hero - East Kingdom
    Adventurer - Red Haven (Willognook)
    
================================================================================

Tweaks
 - Client
    - Invulnerability should fade somehow graphically, so users know when it'll be gone
    - Change client.skin.drawString() to be sane.
 - Game
    - Don't freeze player while pushing.
    - Hoz/Ver stops result in 1/4Tau turns, not random direction dancing.
    - behaviorPause causes enemies to slow down / speed up, not just pause / unpause
    - Different fist projectiles for different icons (skin colors)

Maps
 ? Region Specific maps
Region Themes
 - Play song for each region
 ? Boss Songs
Cards
 - Cards that change a class directly
Game
 - Game Over
   - Send Client a Game Over message including data about the game
     - Display Game Data
 - Lots of bugs with waves that end with dead players, or with tombed players
Client
 - Store key presses, so that keyDown(E) -> keyDown(W) -> keyUp(W) results in Move(E)
 - Sound Support
   - Test Mod Music libraries
   - Music
Classes
 - Finish classes needing change, such as templar
 - Add revolutionary
Combat
 - Combat Feedback
   - Defended Sound
Structure
 - Refactor all movement code to remove need for regionId, assume one wave.
 - Refactor client memory to assume one wave, no need for regions and maps.
Website
 - Track High Scores
 - Player Profiles


Cards:
    Summer - 1 2 3 4 Sun Moon
    Autumn - 1 2 3 4 Sun Moon
    Winter - 1 2 3 4 Sun Moon
    Spring - 1 2 3 4 Sun Moon
    Trumps - 1 2 3 4 5 6 7 8
    32 total


==== Done: =====================================================================

---- i.14? ----
Bug:
1   /home/vesta/Desktop/return to Johnsford/networked/game/game_manager.js:367
    success = playerClient.hero.place(testX*env.TILE_SIZE, testY*env.TILE_SIZE, this.currentWave.id);
                                               ^
    
    TypeError: Cannot read property 'place' of null
        at Object.game.displayWave (/home/vesta/Desktop/return to Johnsford/networked/game/game_manager.js:367:44)
        at Timeout.setTimeout (/home/vesta/Desktop/return to Johnsford/networked/game/game_manager.js:451:18)
        at tryOnTimeout (timers.js:232:11)
        at Timer.listOnTimeout (timers.js:202:5)
        
2   Wave ended with one character dead and tomb expired, and one character as a skeleton.

    /home/vesta/Desktop/return to Johnsford/networked/game/game_manager.js:381
    success = playerClient.hero.place(testX*env.TILE_SIZE, testY*env.TILE_SIZE, this.currentWave.id);
                                           ^

    TypeError: Cannot read property 'place' of null
        at Object.game.displayWave (/home/vesta/Desktop/return to Johnsford/networked/game/game_manager.js:381:44)
        at Timeout.setTimeout (/home/vesta/Desktop/return to Johnsford/networked/game/game_manager.js:467:18)
        at tryOnTimeout (timers.js:232:11)
        at Timer.listOnTimeout (timers.js:202:5)
 
---- i.14 ----
Bug Fix:
    Warlord flail no longer blocked from front and back.
    Aura potion projectile was centering effects on alchemist, not potion.
    Monk meditation skill was refilling monk's aura.
    Rogue bomb arrow explosion was being blocked by front protection.
    Axe attacks were broken.
    Graphic layering was broken when last movable was displayed at a low layer.
Client:
 + New Graphics
   + Explosion animation
   + Skill Hud graphics
 + Map features
   + Water tiles now autojoin.
   + Bridges now automatically orient vertically or horizontally.
Game Tweaks:
 + Ninja star no longer prevents sword swipe.
 + Enemies start at randomly offset times to help prevent clumping.
 + Player with front protection are now open to attacks when attacking or casting.
 + Drakes now release puffs of wind when flapping.
 + Actors with front protection no longer pushed back when hit.
 + Bosses drop more items when dying.
 + Boar/Monkey enemies replaced with goblins.

---- i.13 ----
Bug Fix:
    Smashy Skulls now properly seek players
    Scorpion graphics/segment-movements fixed
Client:
 + Improved Status Display
   + No longer just a card display
   + Shows 'Gems' (card cost paying points)
   + Displays Secondary and Teriary skill icons
   + Displays class Portrait and Name
Game:
 + Added Tier3 classes: RoyalGuard, Alchemist, Warlock, Necromancer, Sorcerer,
    Warlord, Diva, Conjurer, Berserker, Soloist, Mystic, Rogue, Monk, Ninja, Gardener.
 + Projectiles disappear when actor who created them disappears
 + Players can join game at start of wave before it begins
 
---- i.12 ----
Client Tweaks:
 + Change display layers to use different canvases (faster) instead of swapping image data (slow).
 + Add scoring events.
 + Add death (enemy defeat) events.
 + 'Next Up: Castle!'. At end of wave, display the next area, including a full screen background picture.
 + Added images for cards, more card types.
Structural
    Separated game from client completely. Added networking.
    
---- i.11 ----
Bug Fix:
    Snaking enemy body segments could refer to undefined heads in hurt function.
Added Regions:
 + Plains: Bug, Bird, Boar, Spider
 + Castle: Knight, Templar, LordKnight, Drake
 + Wastes: Kzussy, Vulture, EvilEye, Blob
 + Desert: Snake, AntLion, Bombshell, Scorpion
 + Ruins: Ghost, Spine, Mummy, Skull
 + Inferno: Imp, FireWall, Vampire, Demon

---- i.10 ----
Bug Fix:
    Centering movables near edges didn't work.
    Couldn't restart game via spacebar after game over.
    Actors with falsy direction created projectiles that didn't move.
    Hero was not removed from player at game over (score carried over).
Cards
 + Structure to describe and fetch classes by path levels (1 Knight + 2 Mage, etc)
 + Card types in model library
 + Cards that increase or descrease a path level
 + Card EXP cost, with attendant game structures
Region Themes
 + Enemy Types, including bosses, based on wave number
 + Started Plains. Graphic, basic enemies, and low level boss.
 + Started Graveyard. Graphic, basic enemies, and low level boss.
Maps
 + Place Players Logically
 + Place Bosses Logically
Enemies
 + Half Speed option
 + Enemies pause to give warning before shooting
Client
 + Show Health and Magic bars above players.

---- i.9 ----
Classes
 + All 2nd tier classes finished: Knight, Paladin, Dark Knight, Barbarian, Cleric, Druid, Bard, Wizard, Illusionist, Pirate
Added Cards
 + Basic card awarding
 + Basic card using
 + Basic client card interface
Added More Maps

---- i.8 ----
Bug Fix
 + Movement broken for objects with dimensions larger than env.TILE_SIZE
Enemies
 + Normal
 + Optional "atomic" (limited to grid) movement
 + Can shoot, options of projectile type and frequency
 + Diagonal
 + Snaking
   + Length
   + Head, Body, Tail differences
   + Death all at once, or by parts
   + Optional body invulnerability (only the head can be hurt)
Classes
 + Can Change Class during wave or between
 + Class Skills
   + Melee Sword, one at a time arrows, spells with animation, healing
 + Classes, 1st Tier: Knight, Acolyte, Mage, Archer
 + Magic Display
Maps
 + Place Enemies Logically
Actors
 + Melee Attacks
 + Optional Front Protection (shields)
 + Restructured behaviors and behavior inheritence to use behavioral triggers
Events
 + Add a 'repeats' option to animations, to loop through N times

---- i.7 ----
Bug Fix
 + Bug: Movables could be placed overlapping edge of map.
Game
 + Track score for each player and for game as whole, display at end of wave
 + Remove Dead Players at end of wave
 + Insert Waiting Players at start of wave
 + Clear Client commands at start of wave
Audio
 + Sound Effects
Headstones
 + Left behind by dead players
 + Disappear after time limit
 + Can be used to revive players
Sequence
 + Non-mapped objects that iterate with the region
 + Can restrict User action until finished
Events
 + Restructure so they don't need to use objects on the server side
Items
 + Different Appearance Rates
 + Time Limits
 
---- i.6 ----
Game
 - Game Over
   + Cleanup game object
   - Send Client a Game Over message including data about the game
     + Show Game Over Message
   + Send Client back to Title
Client
 + Controls (primary, help, etc)
 + Animations that control how a mover is drawn.
Combat
 - Combat Feedback
   + Hurt knockback
   + Invulnerability Flash
Projectiles
 + Range Limits
 + Time Limits
 + Terminal Explosions
 + Persistent
 + Player Projectiles collect items
Maps
 + Multiple Maps chosen randomly
 + Boss only maps
 + Special one-use maps
Items
 + Place Centrally when dropped
 
---- i.5 ----
Client
 - HUD
   + Wave Number
Region Themes
 + Exist
 + Different Theme Every 10 waves
 + Different Graphics for each theme
Items
 + Exist
 + Collectable
Movement
 + Integrate tile and pixel positions to one value
 + Density based on Movement Flags, allowing for water, etc.
Structural
 + Changed Object.create to Object.extend, cleaned up.

*/


/*
    Things I hate about GNU Image Manipulation Program
        Prefered name is an ablist slur
        No select-none keyboard shortcut
        Selections:
            Moving sections of pixels:
                Should be:
                    1. Select selection tool.
                    2. Draw Selection.
                    3. Hold Ctrl and move selection by keyboard arrows or mouse.
                    4. Repeat 2-3.
                Is:
                    1. Select Selection tool.
                    2. Draw Selection.
                    3. Cut selection via ctrl+x.
                    4. Past into new psuedo layer.
                    5. Select Movement tool.
                    6. Move selection by keyboard or arrows.
                    7. Select selection tool click outside of selection to merge down psuedo layer.
                    8. Repeat 2-7.
            * Why the fuck is there a dotter line around the size that my image used to be?
                Don't tell me "the layer is a different size than the canvas than the image whatever"
                Bad design. Why the fuck would I want to increase the size of the canvas without increasing
                the size of the layer I'm working on? Is there an option to always and everywhere
                force the layer size to be the same as the canvas size?
        Saving PNGs:
            Should be:
                1. Ctrl+S
            Is:
                1. Select export from menu
                2. select file name from browse dialog.
                3. Confirm that you want to save over old version
                4. Confirm some options window that asks me how lossy I want my loss-less format to be.
            
            

*/