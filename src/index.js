'use strict';

var BusSchedule = require('./SeattleBusSchedule');

exports.handler = function(event, context) {
    var alexaSkill = new BusSchedule();
    alexaSkill.execute(event, context);
};