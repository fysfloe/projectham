var express = require('express'),
    router = express.Router(),
    twitter = require('twitter'),
    request = require("request"),
    geocoder = require("node-geocoder"),
    debug = require('debug')('project_ham');

var io = require('socket.io').listen(3001, {log: false});
io.set('origins', 'http://localhost:*');

router.get('/', function(req, res) {

    var ip = req.ip;
    console.log("New request from IP: " + ip);

    if(ip) {
        var users = req.db.get('userlist'); // get db collection

        try {
            users.findOne({ ip: ip }).on('success', function(doc) { // check if IP already exists
                if(!doc) {
                    require("node-geocoder").getGeocoder('freegeoip', 'http').geocode(ip, function(err, geores) {
                        console.log(geores);
                        if(!err && geores) {
                            users.insert({ip: ip, lat: geores[0].latitude, lng: geores[0].longitude, date: new Date().toLocaleString()})
                        } else {
                            console.log(err);
                        }
                    });
                } else {
                    console.log("IP already exists:", doc);
                }
            });

        } catch(error) {
            console.log("Collection userlist cannot be found (DB userdb).", error);
        }
    }

    res.render('index', { title: 'Project Ham' });
});

var twit,
    currentStream,
    clients = [],
    filters = [];

var overallCount = 0,
    retweetCount = 0,
    locationCount = 0,
    locationByUserCount = 0,
    replyCount = 0,
    replyToParentCount = 0,
    sendCount = 0;

var tweet_ids = [];

var connectionToSend, tweetToSend;

geocoder = geocoder.getGeocoder('openstreetmap', 'http');

io.sockets.on('connection', function (socket) {
    clients.push(socket);

    console.log("Number of Clients: " + clients.length);

    socket.on('filter', function(msg) {

        msg.forEach(function(item, index) {
            msg[index] = escapeString(item);
        });

        filters[socket.id] = (msg); // assign new filters of current client

        console.log("Filters:", filters);

        // 1. make string from filter object (filterToString)
        // 2. convert to array (split)
        // 3. delete duplicates (uniqueArray)
        var currentFilter = uniqueArray(filterToString(filters).split(','));

        console.log("Minimized for Twitter:", currentFilter);

        if(currentFilter.length > 350) {
            console.log("Sending Error to Client");

            try {
                socket.emit('err', 'Twitter stream is currently too busy.');
            } catch(err) {
                console.log("Error: ", err);
            }
        } else {
            InitStream();
        }
    });

    socket.on('close', function() {

        var index = clients.indexOf(socket);

        if(index >= 0) { // item found
            clients.splice(index, 1);
            delete filters[socket.id];

            console.log("Number of Clients: " + clients.length);
            console.log("Filters: ", filters);

            if(clients.length <= 0) {
                destroyStream();
                resetCounters();
                tweet_ids = [];
                filters = [];

            } else {
                InitStream();
            }

            socket.disconnect();
        }
    })
});

var resetCounters = function() {
    overallCount = 0;
    retweetCount = 0;
    locationCount = 0;
    locationByUserCount = 0;
    replyCount = 0;
    replyToParentCount = 0;
    sendCount = 0;
};

var destroyStream = function() {
    try {
        if(currentStream) currentStream.destroy();
    } catch(err) {
        console.log("Error destroying current stream.", err);
    }
};

var getClientSocketId = function(tweet) {
    var clientIDs = [], keywords = [];
    for (var id in filters) {
        if(filters.hasOwnProperty(id)){
            filters[id].forEach(function(keyword, index) {
                //console.log(keyword);
                //console.log(tweet);
                if(tweet.contains(keyword)) {
                    clientIDs.push(id);
                    keywords.push([keyword, index]);
                }
            });
        }
    }
    return [clientIDs, keywords];
};

var getClientSocket = function(id) {
    var i;
    for(i = 0; i < clients.length; i++) {
        if(clients[i].id === id) return clients[i];
    }

    return null;
};

var sendTweet = function(tweet, parent_id, type, lat, lng, locationType) {

    tweetToSend = {
        "id": tweet.id,
        "text": tweet.text,
        "parent_id": parent_id,
        "type": type,
        "location": {
            "lat": lat,
            "lng": lng,
            "type": locationType
        },
        "user": {
            "name": tweet.user.screen_name,
            "followers": tweet.user.followers_count,
            "lang": tweet.user.lang
        },
        "hashtags": tweet.entities.hashtags
    };

    var clientAndKeyword = getClientSocketId(tweet.text);

    console.log("\nClients:");
    console.log(clientAndKeyword);

    if(!isEmpty(clientAndKeyword[0])) {
        var i = 0;
        clientAndKeyword[0].forEach(function(id) {
            var socket = getClientSocket(id);

            if(socket) {

                console.log("now sending tweet " + tweet.id + " / Count: " + sendCount++ + " / Overall: " + overallCount);

                tweetToSend.filter = {
                    "text": clientAndKeyword[1][i][0],
                    "id": clientAndKeyword[1][i][1]
                };

                socket.emit('tweet', tweetToSend);

                if(parent_id) {
                    connectionToSend = {
                        "parent_id": parent_id,
                        "child_id": tweet.id
                    };

                    console.log(connectionToSend);
                    socket.emit('conn', connectionToSend);
                }

                i++;
            }
        });

    } else {
        console.log("not able to send:");
        console.log(tweet.text);
    }

    tweetToSend = null;
};

var addNewTweet = function(tweet, parent_id, type, callback, retweet) {

    var lat = null,
        lng = null,
        locationType = null;

    if(tweet.coordinates) {

        // store id of tweet
        tweet_ids[tweet.id] = 1;

        lat = tweet.coordinates.coordinates[1];
        lng = tweet.coordinates.coordinates[0];
        locationType = 'tweet_geo';

        sendTweet(tweet, parent_id, type, lat, lng, locationType);

        locationCount++;

        callback && callback(true, tweet.id, retweet); // if callback

    } else if(tweet.user) {
        if(tweet.user.location) {

            // reserve id of tweet
            tweet_ids[tweet.id] = 0;

            // GEOCODER MODULE
            geocoder.geocode(tweet.user.location, function(err, res) {
                if(!err && res[0]) {
                    if(res[0].latitude && res[0].longitude) {
                        lat = res[0].latitude;
                        lng = res[0].longitude;
                        locationType = 'user_geo';

                        locationByUserCount++;

                        sendTweet(tweet, parent_id, type, lat, lng, locationType); // problem: duplicate tweets due to callback

                        tweet_ids[tweet.id] = 1;

                        callback && callback(true, tweet.id, retweet); // if callback
                    } else {
                        tweet_ids[tweet.id] = -1; // geocoding failed = -1

                        callback && callback(false, tweet.id, retweet); // if callback
                    }
                } else {
                    tweet_ids[tweet.id] = -1; // geocoding failed = -1

                    callback && callback(false, tweet.id, retweet); // if callback
                }
            });

            // GEONAMES
            /*request("http://api.geonames.org/searchJSON?q=" + encodeURI(tweet.user.location) + "&maxRows=1&username=project_ham", function(error, response, body) {

             if(!error) {
             var data = JSON.parse(body);

             if(data.totalResultsCount > 0) {

             lat = data.geonames[0].lat;
             lng = data.geonames[0].lng;
             locationType = 'user_geo';

             locationByUserCount++;

             sendTweet(tweet, parent_id, type, lat, lng, locationType); // problem: duplicate tweets due to callback

             tweet_ids[tweet.id] = 1;

             callback && callback(true, tweet.id, retweet); // if callback

             } else {
             tweet_ids[tweet.id] = -1; // geocoding failed = -1

             callback && callback(false, tweet.id, retweet); // if callback
             }
             } else {
             tweet_ids[tweet.id] = -1; // geocoding failed = -1
             console.log(error);

             callback && callback(false, tweet.id, retweet); // if callback
             }
             });*/
        } else {
            callback && callback(false, tweet.id, retweet); // if callback
        }
    }
};

var authenticateToTwitter = function() {
    if(!twit) {
        twit = new twitter({
            consumer_key: "1bOq10EhTL8UoeBGokYWHcYmP",
            consumer_secret: "Z8zn26aTnADiosDN79TI5BrY7R5j7VYujmxC4CP94j5i654FnC",
            access_token_key: "1491329144-ms8q9JOx70n2Rs6AeuBfaHITv3ut2UrfGyuZcud",
            access_token_secret: "M82JbLOmIyLi8fZ9UXMsWac0Ksc85kM1N2eOBSrnw2HcO"
        });
        console.log("Logged in to twitter.");
    }
};

var InitStream = function() {

    authenticateToTwitter();

    destroyStream();
	
	// 1. make string from filter object (filterToString)
	// 2. convert to array (split)
	// 3. delete duplicates (uniqueArray)
	// 4. convert to string again
	var currentFilter = uniqueArray(filterToString(filters).split(',')).join(',');

	if(currentFilter.trim().length <= 0) return; // do not start stream if filtersize is 0

    console.log("\nInit new stream\n");

    var parent_id = null,
        parent_tweet = null;
	
    twit.stream(
        'statuses/filter',

        {track: [currentFilter]}, // verschiedene sprachen beachten (evtl. einstellbar)
        //{locations: ['-180,-90,180,90']},
        function (stream) {

            stream.on('data', function (item) {

                currentStream = stream;

                if(overallCount > 1000000) {
                    resetCounters();

                    var size = 0, key;
                    for (key in tweet_ids) {
                        if (tweet_ids.hasOwnProperty(key)) {
                            ++size;
                            if(size < 200000) {
                                delete tweet_ids[key];
                            }
                        }
                    }
                }

                // tweets come in
                overallCount++;
                parent_id = null;

                if(!isEmpty(item.retweeted_status)) { // okay this is a retweet

                    parent_tweet = item.retweeted_status;
                    parent_id = parent_tweet.id;

                    // add original tweet if it does not exist; bei backbone evtl.auf binäre suche in externer liste mit IDs
                    if(tweet_ids[parent_id] === undefined) {
                        addNewTweet(parent_tweet, null, 'tweet', function(success, parent_id, retweet) {

                            if(success === true) {
                                // now add the retweet
                                addNewTweet(retweet, parent_id, 'retweet');

                            } else {
                                addNewTweet(retweet, null, 'retweet');
                            }

                            retweetCount++;

                        }, item);

                    } else if(tweet_ids[parent_id] == (-1)) { // geocoding failed on the parent tweet
                        console.log("failed geocoded retweet");
                        addNewTweet(item, null, 'retweet');

                    } else if(tweet_ids[parent_id] == 1) { // existing geocoded parent tweet
                        addNewTweet(item, parent_id, 'retweet');
                    }


                } else if(item.in_reply_to_status_id) { // okay this is a reply

                    parent_id = item.in_reply_to_status_id;

                    if(tweet_ids[parent_id] != undefined) {
                        addNewTweet(item, parent_id, 'reply');

                        replyToParentCount++;
                    } else {
                        addNewTweet(item, null, 'reply');
                    }

                    replyCount++;

                } else { // okay this is a native tweet

                    addNewTweet(item, null, 'tweet');
                }
            });

            stream.on('end', function () {
                console.log('\nEnd stream\n');

            });

            stream.on('error', function(e) {
                console.log('\nError from Twitter stream\n', e);
                io.sockets.emit('err', JSON.stringify(e));
            });

            stream.on('destroy', function () {
                console.log('\nDestroy stream\n');
            });
        }
    );
};

// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;

var isEmpty = function(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

var filterToString = function(obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str += obj[p] + ',';
        }
    }
    return str.slice(0, - 1);
};

String.prototype.contains = function(it) {
    return this.toLowerCase().indexOf(it.toLowerCase()) != -1;
};

var uniqueArray = function(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
};

var escapeString = function(html) {
    return String(html)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

module.exports = router;