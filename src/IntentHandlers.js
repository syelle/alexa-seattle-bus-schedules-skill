'use strict';
var http           = require('http'),
    OneBusAway     = require('./OneBusAway');

var registerIntentHandlers = function (intentHandlers, skillContext, SkillConfig) {

	intentHandlers.GetNextArrivalsIntent = function(intent, session, response){
	    OneBusAway.handleStopArrivalsRequest(intent, session, response);
	};
};

exports.register = registerIntentHandlers;