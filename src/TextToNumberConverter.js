'use strict';

var TextToNumberConverter = (function () {
	var NumberDictionary = {
	    'zero': 0,
	    'oh': 0,
	    'one': 1,
	    'two': 2,
	    'three': 3,
	    'four': 4,
	    'five': 5,
	    'six': 6,
	    'seven': 7,
	    'eight': 8,
	    'nine': 9,
	    'ten': 10,
	    'eleven': 11,
	    'twelve': 12,
	    'thirteen': 13,
	    'fourteen': 14,
	    'fifteen': 15,
	    'sixteen': 16,
	    'seventeen': 17,
	    'eighteen': 18,
	    'nineteen': 19,
	    'twenty': 20,
	    'thirty': 30,
	    'forty': 40,
	    'fifty': 50,
	    'sixty': 60,
	    'seventy': 70,
	    'eighty': 80,
	    'ninety': 90
	};

    return {
        convert: function (numberString) {
        	var numericalResult = 0;
        	var lastConvertedNumber = 0;

        	var parsedNumericalString = new String(numberString).split(' ');

        	for(var i = 0; i < parsedNumericalString.length; i++) {
        		var currentElement = parsedNumericalString[i];

        		var convertedNumber = NumberDictionary[currentElement];

        		if(convertedNumber == null) {
        			// Input wasn't a number. Return the inputted string in title case
        			// since OBA API returns route names such as 'D Line' in title case

					// Capitalization logic taken from http://stackoverflow.com/a/7852847
					var returnString = numberString.replace(/\b./g, function(m){ return m.toUpperCase(); });

        			console.log('Not a number: ' + currentElement);
        			console.log('TextToNumberConverter returning: ' + returnString);
        			return returnString;
        		}
        		else {
        			if(numericalResult != 0 && convertedNumber < 10 && lastConvertedNumber < 10)
        			{
        				// The user is speaking a multi-digit number (such as 312) as "three one two" instead 
        				// of "three hundred twelve". Make sure to increase the magnitude of current number
        				// before adding the next one.
        				numericalResult = numericalResult * 10 + convertedNumber;
        			}
        			else {
        				numericalResult += convertedNumber;
        			} 

        			lastConvertedNumber = convertedNumber;
        		}

        	}

        	console.log('TextToNumberConverter converted ' + numberString + ' into ' + numericalResult);
            return numericalResult;
        }
    };
})();

module.exports = TextToNumberConverter;