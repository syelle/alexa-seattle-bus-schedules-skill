'use strict';

var registerEventHandlers = function (eventHandlers, skillContext) {
	eventHandlers.onLaunch = function(launchRequest, session, response){
	  var output = 'Say the number or saved name of a bus stop to get its next arrivals. You can also say, save a stop.';

	  var reprompt = output;

	  response.ask(output, reprompt);
	};
};

exports.register = registerEventHandlers;