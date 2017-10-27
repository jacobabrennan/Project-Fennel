'use strict';

var enemyMass = (function (){
//==============================================================================
return env.extend(enemy, {
    width: 24,
    height: 24,
    //
    group: [],
    groupSize: 2,
    childType: enemy,
    childDiameter: 16,
    childDistance: 4,
    respawn_time: 128,
    //
    _new: function (){
        var result = enemy._new.apply(this, arguments);
        {
            /*var/coord/center = coord(c.x + width/2, c.y + height/2)
            for(var/I = 1 to group_size){
                var/coord/angle
                if(group_size <= 6 || I <= 6){
                    angle = round(((I-1)*(360/min(group_size,6))))
                    angle = coord(
                        cos(angle)*((width/2)+child_distance),
                        sin(angle)*((width/2)+child_distance),
                    )
                }
                else{
                    angle = round(((I-1)*(360/(group_size-6))))
                    angle = coord(
                        cos(angle)*((width/2)+(child_diameter)),
                        sin(angle)*((width/2)+(child_diameter)),
                    )
                }
                var/game/enemy/archetype/ball/group_member/M = new child_type()
                M.leader = src
                M.leader_offset = angle
                M.c.x = center.x + angle.x
                M.c.y = center.y + angle.y
                if(M.c.x < 0 || M.c.x > world.maxx*TILE_WIDTH ){ M.c.x = M.leader.c.x}
                if(M.c.y < 0 || M.c.y > world.maxx*TILE_HEIGHT){ M.c.y = M.leader.c.y}
                group.Add(M)
            }*/
        }
        return result;
    },
    trigger: function (trigger, options){
        switch(trigger){
            case TRIGGER_TURN_TURN:
                // Replace Lost members
                if(Math.random()*this.respawnTime > this.respawnTime-1){
                    var/coord/empty_slot = locate() in group
                    if(empty_slot){
                        var/coord/center = coord(c.x + width/2, c.y + height/2)
                        var/group_index = group.Find(empty_slot)
                        var/game/enemy/archetype/ball/group_member/M = new child_type()
                        M.leader = src
                        M.leader_offset = empty_slot
                        M.c.x = center.x
                        M.c.y = center.y
                        group[group_index] = M
                    }
                }
                // Set members loose
                if(rand()*respawn_time*3 > (respawn_time*3)-1){
                    var groupMember = env.arrayPick(this.group);
                        var/group_index = group.Find(M)
                        group[group_index] = M.leader_offset
                        M.leader = null
                        M.leader_offset = null
                    }
                }
                break;
        }
    },
    die: function (){
        this.group.forEach(function (memberId){
            var groupMember = mapManager.idManager.get(memberId);
            groupMember.die();
        }, this);
        return enemy.die.apply(this, arguments);
    },
    dispose: function (){
        this.group.forEach(function (memberId){
            var groupMember = mapManager.idManager.get(memberId);
            groupMember.dispose();
        }, this);
        return enemy.dispose.apply(this, arguments);
    }
			group_member{
				parent_type = /game/enemy/archetype/normal
				movement = env.MOVEMENT_ALL
				move_toggle = -1
				var{
					game/enemy/archetype/ball/leader
					coord/leader_offset
					}
				behavior(){
					if(leader){
						var/coord/leader_center = coord(leader.c.x+(leader.width/2), leader.c.y+(leader.height/2))
						leader_center.x = (leader_center.x-leader_offset.x) - (width /2)
						leader_center.y = (leader_center.y-leader_offset.y) - (height/2)
						var/gap_x = max(-speed, min(speed, leader_center.x - c.x))
						var/gap_y = max(-speed, min(speed, leader_center.y - c.y))
						px_move(gap_x, gap_y, dir)
						if(rand()*32 > 31){
							dir = env.pick(env.NORTH, env.SOUTH, env.EAST, env.WEST)
							}
						if(rand()*128 > 127){
							var/game/enemy/archetype/ball/group_member/E
							E = leader.group[rand(1,min(6,leader.group.len))]
							if(!istype(E)){
								var/coord/angle = E
								if(!istype(angle)){ return}
								var/group_index = leader.group.Find(angle)
								leader.group[group_index] = leader_offset
								leader_offset = angle
								}
							else{
								var/coord/new_angle = E.leader_offset
								E.leader_offset = leader_offset
								leader_offset = new_angle
								}
							}
						}
					else{
						. = ..()
						}
					}
				die(){
					if(leader && (src in leader.group)){
						var/group_index = leader.group.Find(src)
						leader.group[group_index] = leader_offset
						}
					. = ..()
					}
				hurt(amount, attacker, proxy){
					if(leader && !invulnerable){
						leader.invulnerable = max(env.INVULNERABLE_TIME, leader.invulnerable)
						//hurt(0, attacker, proxy)
						}
					. = ..()
					}
				}
			}
//==============================================================================
})();