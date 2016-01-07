'use strict';
var http           = require('http'),
    OneBusAway     = require('./OneBusAway');

var registerIntentHandlers = function (intentHandlers, skillContext, SkillConfig) {

	intentHandlers.GetNextBusIntent = function(intent, session, response){
	    OneBusAway.handleStopInfoRequest(intent, session, response);
	};
};

exports.register = registerIntentHandlers;