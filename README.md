# alexa-seattle-bus-schedules-skill
A skill for Amazon Echo that uses the OneBusAway API to deliver real-time transit arrivals to the user.

## Dependencies
- [Amazon Echo](http://www.amazon.com/gp/product/B00X4WHP5E/ref=sv_devicesubnav_0): Voice input & speech output.
- [Amazon Lambda](https://aws.amazon.com/lambda/): Hosting & execution of business logic.
- [Alexa Skills Kit](https://developer.amazon.com/appsandservices/solutions/alexa/alexa-skills-kit/getting-started-guide): Access to basic capabilities of the Amazon Echo.
- [DynamoDB](https://aws.amazon.com/dynamodb/): Persistance of per-user settings and preferences.
- [OneBusAway API](http://developer.onebusaway.org/modules/onebusaway-application-modules/1.1.14/api/where/index.html): retrieval of real-time bus information.

## Attribution
- Word capitalization logic taken from http://stackoverflow.com/a/7852847.
