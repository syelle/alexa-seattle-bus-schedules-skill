var SkillConfig    = require('./Config'),
    AlexaSkill     = require('./AlexaSkill'),
    eventHandlers  = require('./EventHandlers'),
    intentHandlers = require('./IntentHandlers');

var skillContext = {};

var BusSchedule = function(){
	AlexaSkill.call(this, SkillConfig.APP_ID);
};

BusSchedule.prototype = Object.create(AlexaSkill.prototype);
BusSchedule.prototype.constructor = BusSchedule;

eventHandlers.register(BusSchedule.prototype.eventHandlers, skillContext);
intentHandlers.register(BusSchedule.prototype.intentHandlers, skillContext, SkillConfig);

module.exports = BusSchedule;