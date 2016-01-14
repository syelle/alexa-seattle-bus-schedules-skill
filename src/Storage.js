'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
	var dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});

	var userStopsTableName = 'OBA_UserStops';

    function UserStops(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {};
        }
        this._session = session;
    }

    UserStops.prototype = {
        save: function (callback) {
            this._session.attributes.userStops = this.data;
            dynamoDB.putItem({
                TableName: userStopsTableName,
                Item: {
                    userId: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadUserStops: function (session, callback) {
            if (session.attributes.userStops) {
                console.log('get stops from session=' + session.attributes.userStops);
                callback(new UserStops(session, session.attributes.userStops));
                return;
            }

            dynamoDB.getItem({
                TableName: userStopsTableName,
                Key: {
                    userId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var userStops;

                if (err) {
                    console.log(err, err.stack);
                    userStops = new UserStops(session);
                } else if (data.Item === undefined) {
                    userStops = new UserStops(session);
                } else {
                    console.log('get stops from dynamodb=' + data.Item.Data.S);
                    userStops = new UserStops(session, JSON.parse(data.Item.Data.S));
                }

                session.attributes.userStops = userStops.data;
                callback(userStops);               
            });
        },
        newUserStops: function (session) {
            return new UserStops(session);
        }
    };

})();

module.exports = storage;