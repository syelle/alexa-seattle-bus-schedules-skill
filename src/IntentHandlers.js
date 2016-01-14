'use strict';
var http           = require('http'),
    OneBusAway     = require('./OneBusAway');

var registerIntentHandlers = function (intentHandlers, skillContext, SkillConfig) {

	intentHandlers.GetNextArrivalsByStopNumberIntent = function(intent, session, response){
	    OneBusAway.handleGetArrivalsByStopNumberRequest(intent, session, response);
	};

	intentHandlers.SaveStopShortcutIntent = function(intent, session, response){
	    OneBusAway.handleStopShortcutRequest(intent, session, response);
	};

	intentHandlers.ConfirmSaveIntent = function(intent, session, response){
	    OneBusAway.handleStopSaveRequest(intent, session, response);
	};

	intentHandlers.CancelSaveIntent = function(intent, session, response){
	    OneBusAway.handleStopCancelRequest(intent, session, response);
	};

	intentHandlers.GetNextArrivalsBySavedStopIntent = function(intent, session, response){
	    OneBusAway.handleGetArrivalsBySavedStopRequest(intent, session, response);
	};

	intentHandlers['AMAZON.HelpIntent'] = function(intent, session, response){
	    OneBusAway.handleHelpRequest(intent, session, response);
	};
};

exports.register = registerIntentHandlers;