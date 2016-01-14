'use strict';
var http           = require('http'),
    storage        = require('./Storage'),
    SkillConfig    = require('./Config');

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

OneBusAway.getStopArrivalsByStopNumber = function (stopNumber, response) {
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
            // Only return info on the next 3 arrivals
            var arrivalsToProcess = stopArrivals.slice(0, 3);

            if(arrivalsToProcess.length === 1){
                speechOutput = 'Here is the next arrival for that stop:';
            } else {
                speechOutput = 'Here are the next ' + arrivalsToProcess.length + ' arrivals for that stop:';  
            }
            
            for (var i = 0; i < arrivalsToProcess.length; i++){
                var responses = this.generateArrivalResponse(arrivalsToProcess[i], requestTime);

                speechOutput += responses.speechResponse;
                cardOutput += responses.cardResponse;
            }
        } else if (stopData.code == 404){
            speechOutput = cardOutput = 'That bus stop does not exist.';
        } else {
            speechOutput = cardOutput = 'I could not get arrival info due to an unknown error. Error code is ' + stopData.code;
        }

        response.tellWithCard(speechOutput, cardTitle, cardOutput);
    }).bind(this));
};

OneBusAway.handleGetArrivalsByStopNumberRequest = function(intent, session, response){
    this.getStopArrivalsByStopNumber(intent.slots.busStop.value, response);
};

OneBusAway.handleStopShortcutRequest = function(intent, session, response){
    this.getViaAPI(this.stopInfoRequestURL(intent.slots.busStop.value), (function(stopData){
        var speechOutput = '';
        var cardOutput = '';

        var stopInfo = null;

        if (stopData.data !== null && stopData.data.entry !== null){
            stopInfo = stopData.data.entry;
        }

        if(stopInfo !== null){
            var stopNumber = stopInfo.code;
            var stopName = stopInfo.name;
            var stopDirection = intent.slots.stopDirection.value;

            session.attributes.stopInfo = {};
            session.attributes.stopInfo.stopNumber = stopNumber;
            session.attributes.stopInfo.name = stopName;
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
};

OneBusAway.handleStopSaveRequest = function(intent, session, response){
    storage.loadUserStops(session, function (userStops) {
        var stopData = {
            id: session.attributes.stopInfo.stopNumber,
            name: session.attributes.stopInfo.name
        };

        userStops.data[session.attributes.stopInfo.stopDirection] = stopData;

        userStops.save(function () {
            response.tell('Your stop has been saved as ' + session.attributes.stopInfo.stopDirection + '.');
        });
    });
};

OneBusAway.handleStopCancelRequest = function(intent, session, response){
    response.tell('Request cancelled.');
};

OneBusAway.handleGetArrivalsBySavedStopRequest = function(intent, session, response){
    storage.loadUserStops(session, function (userStops) {
        var stopNumber = userStops.data[intent.slots.stopDirection.value].id; 

        OneBusAway.getStopArrivalsByStopNumber(stopNumber, response); 
    });
};

module.exports = OneBusAway;