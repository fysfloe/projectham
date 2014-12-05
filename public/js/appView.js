var projectham = projectham || {};

projectham.AppView = Backbone.View.extend({
	
	el: $("#twitterStream"),
	
	initialize: function() {
		this.tweets = new projectham.TweetList();
		this.connections = new projectham.ConnectionList();
        this.hashtags = new projectham.HashtagList();

		this.listenTo(this.tweets, 'add', this.printTweets);
		this.listenTo(this.connections, 'add', this.printConnections);
		this.listenTo(this.hashtags, 'change', this.printHashtags);

        var _this = this;
        var socket;
        var filter = $('#chooseFilter');

        $('#letsGo').click(function(e) {

            if(filter.val().trim()) {
                if(!socket) {
                    socket = io.connect('http://localhost:3001/');
                    window.socket = socket;
                }

                $('#stopStream').click(function(e) {
                    socket.emit('close');
                });

                var filterArray = filter.val().trim().split(',');
                socket.emit('start_filtering', filterArray);

                window.onbeforeunload = function() {
                    socket.emit('close');
                    //socket.onclose = function () {}; // disable onclose handler first
                    //socket.close();
                };

                var overallCount = 0,
                    retweetCount = 0,
                    locationByTweetCount = 0,
                    locationByUserCount = 0,
                    replyCount = 0,
                    replyToParentCount = 0,
                    connectionCount = 0,
                    hashtagCount = 0;

                var DOM_overall = $('#overall'),
                    DOM_retweets = $('#retweets'),
                    DOM_locationsUser = $('#locationsUser'),
                    DOM_locationsTweet = $('#locationsTweet'),
                    DOM_replies = $('#replies'),
                    DOM_repliesToParent = $('#repliesToParent'),
                    DOM_connections = $('#connections'),
                    DOM_hashtags = $('#hashtags');

                socket.on('newConn', function (conn) {
                    DOM_connections.text(++connectionCount);
                    _this.saveConnection(conn);
                });

                socket.on('newTwitt', function (tweet) {
                    DOM_overall.text(++overallCount);
                    if(tweet.type == 'retweet') {
                        DOM_retweets.text(++retweetCount);
                    } else if(tweet.type == 'reply') {
                        DOM_replies.text(++replyCount);
                        if(tweet.parent_id) {
                            DOM_repliesToParent.text(++replyToParentCount);
                        }
                    }

                    if(tweet.location.type == 'user_geo') {
                        DOM_locationsUser.text(++locationByUserCount);
                    } else if(tweet.location.type == 'tweet_geo') {
                        DOM_locationsTweet.text(++locationByTweetCount);
                    }

                    if(!$.isEmptyObject(tweet.hashtags)) {
                        $.each(tweet.hashtags, function() {
                            var foundHashtag = _this.hashtags.findWhere({text: this.text.toLowerCase().trim()});
                            var count;

                            if(!$.isEmptyObject(foundHashtag)) {
                                count = foundHashtag.attributes.count;
                                foundHashtag.set({count: ++count});
                                foundHashtag.save();
                                _this.hashtags.sort();
                            } else {
                                _this.saveHashtag({
                                   text: this.text.toLowerCase().trim()
                                });
                                DOM_hashtags.text(++hashtagCount);
                            }
                        });
                    }

                    _this.saveTweet(tweet);
                });

               socket.on('error', function(error) {
                   alert("Sorry buddy, an error has occured: " + error);
                });

               e.preventDefault();
            }
        });
	},
	
	printTweets: function(tweets) {

        this.$("#tweets").empty();

        // LATER HANDLING
        /*var tweetView;
        var tweet = this.tweets.last();

        console.log(tweet);

        tweetView = new projectham.TweetView({model: tweet});
        this.$("#tweets").append(tweetView.render().el);

        */

        tweets.collection.each(function(tweet) {
            var tweetView;

            tweetView = new projectham.TweetView({model: tweet});
            this.$("#tweets").append(tweetView.render().el);
        });
	},

    printConnections: function(connections) {

        this.$("#connectionList").empty();

        connections.collection.each(function(connection) {
            var conView;
            conView = new projectham.TweetView({model: connection});
            this.$("#connectionList").append(conView.render().el);
        });
    },

    printHashtags: function(hashtags) {
        this.$("#hashtagList").empty();

        hashtags.collection.each(function(hashtag) {
            var hashView;
            hashView = new projectham.TweetView({model: hashtag});
            this.$("#hashtagList").append(hashView.render().el);
        });
    },
	
	saveTweet: function(tweet) {
		this.tweets.create(tweet);
	},

    saveHashtag: function(hashtag) {
        this.hashtags.create(hashtag);
    },

    saveConnection: function(connection) {

        var parent_tweet = this.tweets.get(connection.parent_id);
        var child_tweet = this.tweets.get(connection.child_id);

        console.log('parent ' + connection.parent_id);
        console.log('child ' + connection.child_id);
        console.log(parent_tweet);
        console.log(child_tweet);

        if(parent_tweet && child_tweet) {
            if(parent_tweet.attributes.location && child_tweet.attributes.location) {
                this.connections.create({
                    parent_id: connection.parent_id,
                    child_id: connection.child_id
                    /*parent: {
                        lat: parent_tweet.attributes.location.lat,
                        lng: parent_tweet.attributes.location.lng
                    },
                    child: {
                        lat: child_tweet.attributes.location.lat,
                        lng: child_tweet.attributes.location.lng
                    }*/
                });
            }
        }
    },
	
	clearTweets: function() {
		var model;
		while(model = this.tweets.at(0)) {
			model.destroy();
		}
	}
});