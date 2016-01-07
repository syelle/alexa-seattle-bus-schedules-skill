'use strict';
var http           = require('http'),
    SkillConfig    = require('./Config');

var OneBusAway = {};

OneBusAway.requestURL = function(busStopID){
    // DOC: http://developer.onebusaway.org/modules/onebusaway-application-modules/current/api/where/methods/arrivals-and-departures-for-stop.html
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

OneBusAway.handleStopInfoRequest = function(intent, session, response){
    this.getStopInfo(intent.slots.busStop.value, function(stopData){

        if(stopData.data.entry.arrivalsAndDepartures[0].predictedArrivalTime){
            var busNumber = stopData.data.entry.arrivalsAndDepartures[0].routeShortName;
            var predictedArrivalTime = stopData.data.entry.arrivalsAndDepartures[0].predictedArrivalTime;
            var requestTime = stopData.currentTime;

            //requestTime and predictedArrivalTime are milliseconds since the epoch, so need to convert to minutes
            var timeToArrival = Math.round(((predictedArrivalTime - requestTime) / 1000 / 60));

            var cardText = 'The next bus, ' + busNumber + ', is arriving in ' + timeToArrival + ' minutes.';
        } else {
            var text = 'That bus stop does not exist.'
            var cardText = text;
        }

        var heading = 'Next bus for stop: ' + intent.slots.busStop.value;
        response.tellWithCard(cardText, heading, cardText);
    });
};

module.exports = OneBusAway;