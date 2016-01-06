'use strict';

var registerEventHandlers = function (eventHandlers, skillContext) {
	eventHandlers.onLaunch = function(launchRequest, session, response){
	  var output = 'Welcome to Real-Time Seattle Bus Schedules. ' +
	    'Say the number of a bus stop to get its next arrival.';

	  var reprompt = 'Which bus stop do you want to find more about?';

	  response.ask(output, reprompt);
	};
};

exports.register = registerEventHandlers;