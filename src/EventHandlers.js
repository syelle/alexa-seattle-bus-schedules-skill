'use strict';

var registerEventHandlers = function (eventHandlers, skillContext) {
	eventHandlers.onLaunch = function(launchRequest, session, response){
	  var output = 'Welcome to Real-Time Seattle Bus Schedules, powered by One Bus Away. ' +
	    'Say the number of a bus stop to get its next arrivals.';

	  var reprompt = 'Say the number of a bus stop to get its next arrivals.';

	  response.ask(output, reprompt);
	};
};

exports.register = registerEventHandlers;