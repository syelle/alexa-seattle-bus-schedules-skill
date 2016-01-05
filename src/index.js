'use strict';

var BusSchedule = require('./seattle-bus-schedule');

exports.handler = function(event, context) {
    var alexaSkill = new BusSchedule();
    alexaSkill.execute(event, context);
};