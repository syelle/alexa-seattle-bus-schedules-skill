'use strict';
var http                    = require('http'),
    storage                 = require('./Storage'),
    TextToNumberConverter   = require('./TextToNumberConverter'),
    SkillConfig             = require('./Config');

var OneBusAway = {};

OneBusAway.stopArrivalsRequestURL = function(stopNumber){
    // DOC: http://developer.onebusaway.org/modules/onebusaway-application-modules/current/api/where/methods/arrivals-and-departures-for-stop.html
    // EXAMPLE: http://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/1_13830.json?minutesBefore=0&key=
    return 'http://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/1_' + stopNumber + '.json?minutesBefore=0&key=' + SkillConfig.OBA_API_KEY;
};

OneBusAway.stopInfoRequestURL = function(stopNumber){
    // DOC: http://developer.onebusaway.org/modules/onebusaway-application-modules/1.1.14/api/where/methods/stop.html
    // EXAMPLE: http://api.pugetsound.onebusaway.org/api/where/stop/1_13830.json?key=
    return 'http://api.pugetsound.onebusaway.org/api/where/stop/1_' + stopNumber + '.json?key=' + SkillConfig.OBA_API_KEY;
};

OneBusAway.getViaAPI = function(requestURL, callback){
    http.get(requestURL, function(res){
        var response = '';

        res.on('data', function(data){
            response += data;
        });

        res.on('end', function(){
            var result = JSON.parse(response);
            callback(result);
        });

    }).on('error', function(e){
        console.log('Error: ' + e);
    });
};

OneBusAway.generateArrivalResponse = function(arrivalInfo, requestTime){
    var responses = {};

    var busNumber = arrivalInfo.routeShortName;
    var isRealTimeInfo = arrivalInfo.predicted;

    var arrivalTime = 0;

    if(isRealTimeInfo){
        arrivalTime = parseInt(arrivalInfo.predictedArrivalTime);
    } else {
        arrivalTime = parseInt(arrivalInfo.scheduledArrivalTime);
    }

    //requestTime and predictedArrivalTime are milliseconds since the epoch, so need to convert to minutes
    var timeToArrival = Math.round(((arrivalTime - requestTime) / 1000 / 60));

    var speechOutput = ' Route ' + busNumber;
    var cardOutput = '- Route ' + busNumber + ': ';

    if(isRealTimeInfo) {
        speechOutput += ', in ' + timeToArrival;
    } else {
        speechOutput += ', is scheduled to arrive in ' + timeToArrival;
    }

    cardOutput += timeToArrival;

    if (timeToArrival == '1') {
        speechOutput += ' minute.';
        cardOutput += ' minute';
    } else {
        speechOutput += ' minutes.';
        cardOutput += ' minutes';
    } 

    if(!isRealTimeInfo){
        cardOutput += ' (scheduled)';
    }

    cardOutput += '\n';

    responses.speechResponse = speechOutput;
    responses.cardResponse = cardOutput;

    return responses;
};

OneBusAway.getStopArrivalsByStopNumber = function (stopNumber, routeName, response) {
    this.getViaAPI(this.stopArrivalsRequestURL(stopNumber), (function(stopData){

        var cardTitle = 'Next arrivals for stop: ' + stopNumber;
        var cardOutput = '';
        var speechOutput = '';

        var stopArrivals = null;

        if (stopData.data !== null && stopData.data.entry !== null){
            stopArrivals = stopData.data.entry.arrivalsAndDepartures;
        }

        if(stopArrivals !== null){
            var requestTime = parseInt(stopData.currentTime);
            var introSpeechOutput = '';
            var arrivalSpeechOutput = '';
            var numberOfArrivals = 0;

            if(routeName == null){
                // Only return info on the next 3 arrivals
                var arrivalsToProcess = stopArrivals.slice(0, 3); 

                for (var i = 0; i < arrivalsToProcess.length; i++){
                    numberOfArrivals++;

                    var responses = this.generateArrivalResponse(arrivalsToProcess[i], requestTime);
                    arrivalSpeechOutput += responses.speechResponse;                      
                    cardOutput += responses.cardResponse;
                }
            }
            else {
                var convertedRouteName = TextToNumberConverter.convert(routeName);

                // Only return info on the next three arrivals for the specified route
                for (var i = 0; i < stopArrivals.length; i++){
                    if(stopArrivals[i].routeShortName == convertedRouteName){
                        numberOfArrivals++;

                        var responses = this.generateArrivalResponse(stopArrivals[i], requestTime);
                        arrivalSpeechOutput += responses.speechResponse;                      
                        cardOutput += responses.cardResponse;
                    }  
                }
            }

            if(numberOfArrivals === 0){
                if(routeName != null){
                    introSpeechOutput = 'I could not find any arrival info for the ' + routeName + ' at that stop.'; 
                } else{
                    introSpeechOutput = 'I could not find any arrival info for that stop.';                      
                }
                response.tell(introSpeechOutput);       
                return;       
            }
            else if(numberOfArrivals === 1){
                introSpeechOutput = 'Here is the next arrival for that stop:';
            } else {
                introSpeechOutput = 'Here are the next ' + numberOfArrivals + ' arrivals for that stop:';  
            }
            
            speechOutput = introSpeechOutput + arrivalSpeechOutput;
        } else if (stopData.code == 404){
            speechOutput = cardOutput = 'That bus stop does not exist.';
        } else {
            speechOutput = cardOutput = 'I could not get arrival info due to an unknown error. Error code is ' + stopData.code;
        }

        response.tellWithCard(speechOutput, cardTitle, cardOutput);
    }).bind(this));
};

OneBusAway.handleGetArrivalsByStopNumberRequest = function(intent, session, response){
    // second parameter is null because we're not feeding in a route to filter by
    this.getStopArrivalsByStopNumber(intent.slots.busStop.value, null, response);
};

OneBusAway.handleStopShortcutRequest = function(intent, session, response){
    var stopNumber;
    var stopDirection;

    console.log('stopInfo: ' + JSON.stringify(session.attributes.stopInfo));

    if(session.attributes.stopInfo == null){
        session.attributes.stopInfo = {};
    } 

    console.log('intent.slots.busStop.value: ' + intent.slots.busStop.value);

    if(intent.slots.busStop.value != null){
        stopNumber = intent.slots.busStop.value;
        session.attributes.stopInfo.stopNumber = stopNumber;
    } else if (session.attributes.stopInfo.stopNumber != null) {
        stopNumber = session.attributes.stopInfo.stopNumber;
    }

    console.log('stopNumber: ' + stopNumber);

    console.log('intent.slots.stopDirection.value: ' + intent.slots.stopDirection.value);

    if(intent.slots.stopDirection.value != null){
        stopDirection = intent.slots.stopDirection.value;
        session.attributes.stopInfo.stopDirection = stopDirection;
    } else if (session.attributes.stopInfo.stopDirection != null) {
        stopDirection = session.attributes.stopInfo.stopDirection;
    }

    console.log('stopDirection: ' + stopDirection);

    if(stopNumber == null){
        var speechOutput = 'To save a stop, say, save stop, followed by the number of the stop you wish to save.';
        response.ask(speechOutput, speechOutput);
    } else if (stopDirection == null) {
        var speechOutput = 'Now, to specify a direction, say, save as, followed by a direction for the stop you wish to save. ' + 
         'For example, you can say, save as north, or, save as southeast. You can also say, save as downtown, or, save as uptown.';
        response.ask(speechOutput, speechOutput);
    }

    if(stopNumber != null && stopDirection != null){
        this.getViaAPI(this.stopInfoRequestURL(stopNumber), (function(stopData){
            var speechOutput = '';
            var cardOutput = '';

            var stopInfo = null;

            if (stopData.data !== null && stopData.data.entry !== null){
                stopInfo = stopData.data.entry;
            }

            if(stopInfo !== null){
                var stopName = stopInfo.name;

                session.attributes.stopInfo.name = stopName;
                session.attributes.stopInfo.stopNumber = stopNumber;
                session.attributes.stopInfo.stopDirection = stopDirection;

                speechOutput += 'You asked to save the stop at ' + stopName + ' as ' + stopDirection + '. Is this correct?';
                response.ask(speechOutput, speechOutput);
                return;
            } else if (stopData.code == 404){
                speechOutput = cardOutput = 'That bus stop does not exist.';
                response.tell(speechOutput);
                return;
            } else {
                speechOutput = cardOutput = 'I could not get stop info due to an unknown error. Error code is ' + stopData.code;
                response.tell(speechOutput);
                return;
            }
        }).bind(this));
    }
};

OneBusAway.handleStopSaveRequest = function(intent, session, response){
    storage.loadUserStops(session, function (userStops) {
        var stopData = {
            id: session.attributes.stopInfo.stopNumber,
            name: session.attributes.stopInfo.name
        };

        userStops.data[session.attributes.stopInfo.stopDirection] = stopData;

        userStops.save(function () {
            response.tell("Your stop has been saved as " + session.attributes.stopInfo.stopDirection + ". " + 
                "To ask for arrivals, you can now say, ask One Bus Away for " + session.attributes.stopInfo.stopDirection + "bound arrivals."
            );

            // we must clear out the session's stop info after saving so the next save request starts from scratch
            session.attributes.stopInfo = null;
        });
    });
};

OneBusAway.handleStopCancelRequest = function(intent, session, response){
    response.tell('Request cancelled.');
};

OneBusAway.handleGetArrivalsBySavedStopRequest = function(intent, session, response){
    storage.loadUserStops(session, function (userStops) {
        var stopNumber = userStops.data[intent.slots.stopDirection.value].id; 

        OneBusAway.getStopArrivalsByStopNumber(stopNumber, intent.slots.routeName.value, response); 
    });
};

OneBusAway.handleHelpRequest = function(intent, session, response){
    response.ask('Say the number or saved name of a bus stop to get its next arrivals. You can also say, save a stop.');
};

OneBusAway.handleStopRequest = function(intent, session, response){
    response.shouldEndSession = true;
    response.tell('Exiting.');
};

module.exports = OneBusAway;