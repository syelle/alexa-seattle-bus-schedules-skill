'use strict';
var http           = require('http'),
    SkillConfig    = require('./Config');

var OneBusAway = {};

OneBusAway.requestURL = function(busStopID){
    // DOC: http://developer.onebusaway.org/modules/onebusaway-application-modules/current/api/where/methods/arrivals-and-departures-for-stop.html
    // EXAMPLE: http://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/1_13830.json?minutesBefore=0&key=
    return 'http://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/1_' + busStopID + '.json?minutesBefore=0&key=' + SkillConfig.OBA_API_KEY;
};

OneBusAway.getStopInfo = function(busStopID, callback){
    http.get(this.requestURL(busStopID), function(res){
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

OneBusAway.handleStopInfoRequest = function(intent, session, response){
    this.getStopInfo(intent.slots.busStop.value, (function(stopData){
        var requestTime = parseInt(stopData.currentTime);
        var speechOutput = '';
        var cardOutput = '';

        var stopArrivals = null;

        if (stopData.data !== null && stopData.data.entry !== null){
            stopArrivals = stopData.data.entry.arrivalsAndDepartures;
        }

        if(stopArrivals !== null){
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

        var cardTitle = 'Next arrivals for stop: ' + intent.slots.busStop.value;
        response.tellWithCard(speechOutput, cardTitle, cardOutput);
    }).bind(this));
};

module.exports = OneBusAway;