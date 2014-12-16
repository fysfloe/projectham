var projectham = projectham || {};

projectham.AppView = Backbone.View.extend({
    el: $('main'),
    viewCommands: 3,
    numFilters: 3,

    image: [{
        'src': 'blue.png',
        'alt': 'Blue'
    }, {
        'src': 'orange.png',
        'alt': 'Orange'
    }, {
        'src': 'green.png',
        'alt': 'Green'
    }
    ],

    placeHolder: '<div class="table-cell add-filter"><figure><figcaption>Add Filter</figcaption><img src="img/ui/plus.png" alt="Plus"></figure></div>',


    initialize: function() {
        this.filterCount = 0;
        this.state = 0;

        $('.on-stream-started').hide();
        $('#start-stream').show();

        localStorage.clear();

        this.filterDiv = $('#filters');
        this.preFilterList = $('#preFilterList');
        this.addPreFilterButton = $('#b-add-filter1');
        this.addFilterButton = $('#b-add-filter2');
        this.filterErrMsg = $('#err-msg');
        this.preFilters = [];

        this.filterDiv.html("");

        for(var i = 0; i < 3; i++) {
            this.filterDiv.append(this.placeHolder);
        }

        this.commands = new projectham.CommandList();
        this.listenTo(this.commands, 'add', this.printCommand);
        this.commands.fetch();

        this.filters = new projectham.FilterList();
        this.listenTo(this.filters, 'add', this.printFilter);
        this.filters.fetch();

        this.filterInput = $("#i-add-filter");
        this.filterInputDiv = $("#filter-input-div");

        this.filterInputDiv.show();
        this.addPreFilterButton.show();
        this.preFilterList.html('');
        this.preFilterList.show();

        this.errMsg('');

        //------------- Julian

        this.tweets = new projectham.TweetList();
        this.connections = new projectham.ConnectionList();
        this.hashtags = new projectham.HashtagList();
        this.users = new projectham.UserList();

        this.listenTo(this.tweets, 'add', this.displayTweets);
        this.listenTo(this.connections, 'add', this.displayConnections);
        this.listenTo(this.hashtags, 'change', this.printHashtags);

        this.users.fetch();

        var _this = this;
        this.socket = null;

        window.onbeforeunload = function () {
            _this.socket.emit('close');
            //socket.onclose = function () {}; // disable onclose handler first
            //socket.close();
            _this.socket = null;
        };

        console.log('initialized');
    },

    events: {
        'click #b-add-filter2': 'addFilter',
        'click #b-add-filter1': 'addPreFilter',
        'click #start-stream': 'startStream',
        'click .add-filter': function() {
            this.errMsg('');
            this.filterInputDiv.show();
        },
        'click #stop-stream': 'stopStream',
        'keyup #i-add-filter': 'checkEnter'
    },

    saveCommand: function(command) {
        this.commands.create({
            command:    command
        });
    },

    clearCommands: function() {
        console.log('clear');
        var model;

        while(model = this.commands.at(0)) {
            model.destroy();
        }
    },

    printCommand: function(command) {
        var commandView;

        commandView = new projectham.CommandView({ model: command });
        //this.$('#commands').prepend(commandView.render().el);

        var listItems = $("#commands li");

        for(var i = 3; i < listItems.length; i++) {
            listItems[i].remove();
        }

        this.prependListItem('commands', commandView.render().el, 'prepend');

        if(listItems.length >= this.viewCommands) {
            this.$('#commands li:last-child').animate({
                'opacity': 0
            }, 500, function() {
                this.remove();
            });
        }
    },

    prependListItem: function(listName, listItemHTML, preApp) {
        if(preApp == 'prepend') {
            $(listItemHTML)
                .hide()
                .css('opacity',0.0)
                .prependTo('#' + listName)
                .slideDown(500)
                .animate({opacity: 1.0})
        } else {
            $(listItemHTML)
                .hide()
                .css('opacity', 0.0)
                .appendTo('#' + listName)
                .slideDown(500)
                .animate({opacity: 1.0})
        }
    },

    startStream: function() {
        if(this.preFilters.length == 0 && !this.filterInput.val()) {
            console.log('type a filter first!');

            this.errMsg('Please type a filter first.');
        } else {
            this.showExtendedInfo();
            this.state = 1;

            if (this.filterInput.val()) {
                this.addPreFilter();
            }

            for (var i = 0; i < this.preFilters.length; i++) {
                this.addFilter(this.preFilters[i]);
            }

            this.preFilterList.hide();
            this.addPreFilterButton.hide();

            //--------------------------------------------------
            if (!this.socket) {
                this.socket = io.connect('http://localhost:3001/');
                window.socket = this.socket;
            }

            eventBus.trigger('startStream', this.filters);

            this.socket.emit('filter', this.preFilters);

            var overallCount = 0,
                retweetCount = 0,
                locationByTweetCount = 0,
                locationByUserCount = 0,
                replyCount = 0,
                replyToParentCount = 0,
                connectionCount = 0,
                hashtagCount = 0,
                _this = this;

            var DOM_overall = $('#overall'),
                DOM_retweets = $('#retweets'),
                DOM_replies = $('#replies');
            //DOM_locationsUser = $('#locationsUser'),
            //DOM_locationsTweet = $('#locationsTweet'),
            //DOM_repliesToParent = $('#repliesToParent'),
            //DOM_connections = $('#connections'),
            //DOM_hashtags = $('#hashtags');

            this.socket.on('conn', function (conn) {
                ///DOM_connections.text(++connectionCount);
                _this.saveConnection(conn);
            });

            this.socket.on('tweet', function (tweet) {
                DOM_overall.text(++overallCount);
                if (tweet.type == 'retweet') {
                    DOM_retweets.text(++retweetCount);
                } else if (tweet.type == 'reply') {
                    DOM_replies.text(++replyCount);
                    /*if (tweet.parent_id) {
                     DOM_repliesToParent.text(++replyToParentCount);
                     }*/
                }

                /*if (tweet.location.type == 'user_geo') {
                 DOM_locationsUser.text(++locationByUserCount);
                 } else if (tweet.location.type == 'tweet_geo') {
                 DOM_locationsTweet.text(++locationByTweetCount);
                 }*/

                if (!$.isEmptyObject(tweet.hashtags)) {
                    $.each(tweet.hashtags, function () {
                        var foundHashtag = _this.hashtags.findWhere({text: this.text.toLowerCase().trim()});
                        var count;

                        if (!$.isEmptyObject(foundHashtag)) {
                            count = foundHashtag.attributes.count;
                            foundHashtag.set({count: ++count});
                            foundHashtag.save();
                            _this.hashtags.sort();
                        } else {
                            _this.saveHashtag({
                                text: this.text.toLowerCase().trim()
                            });
                            //DOM_hashtags.text(++hashtagCount);
                        }
                    });
                }

                _this.saveTweet(tweet);
            });

            this.socket.on('err', function (error) {
                alert("Sorry buddy, an error has occured:\n" + error);
                console.trace('Module A'); // [1]
                console.error(error.stack); // [2]
            });
        }
    },

    stopStream: function() {
        this.socket.emit('close');
        this.socket = null;

        this.initialize();
    },

    errMsg: function(e) {
        this.filterErrMsg.html(e);
    },

    showExtendedInfo: function() {
        $('.on-stream-started').show();
        $('#start-stream').hide();
    },

    addPreFilter: function() {
        if(this.preFilters.length >= 3) {
            console.log('maximum filter number reached');
        } else {
            console.log('foio');

            var preparedFilter = this.htmlEntities(this.filterInput.val().trim());

            console.log(preparedFilter);

            if(preparedFilter) {
                this.errMsg('');

                this.prependListItem('preFilterList', '<li>'+preparedFilter+'</li>', 'append');
                //this.preFilterList.append('<li>'+preparedFilter+'</li>');
                this.preFilters.push(preparedFilter);
            } else {
                this.errMsg('Please type a filter.');
            }

            this.filterInput.val("");
            if(this.preFilters.length == 3) {
                this.filterInputDiv.hide();
            }
        }
    },

    addFilter: function(filter) {
        if(this.filters.length >= 3) {
            console.log('maximum filter number reached');
        } else {
            var saveFilter = typeof filter === 'string' ? filter : this.htmlEntities(this.filterInput.val());

            var color;

            switch(this.filters.length) {
                case 0:
                    color = 0x4099FF;
                    break;
                case 1:
                    color = 0xE28C10;
                    break;
                case 2:
                    color = 0x81D056;
                    break;
                default:
                    break;
            }

            if(saveFilter) {
                this.filters.create({
                    filter: saveFilter,
                    color: color
                });

                this.filterInput.val("");
                this.filterInputDiv.hide();
            } else {
                this.errMsg('Please type a filter.');
            }
        }
    },

    printFilter: function(filter) {
        var filterView;

        filterView = new projectham.FilterView({ model: filter });
        this.$('#filters div:nth-child('+(this.filterCount + 1)+')').before(filterView.render(this.image[this.filterCount]).el);
        this.filterCount++;

        this.$('#filters .add-filter:last-child').remove();
    },

    checkEnter: function(event) {
        if(event.keyCode == 13) {
            if(this.state == 0) {
                this.$("#b-add-filter1").click();
            } else if(this.state == 1) {
                this.$("#b-add-filter2").click();
            }
        }
    },

    htmlEntities: function(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    // ------------------ Julian

    displayTweets: function(tweets) {
        var tweet = this.tweets.last();
        eventBus.trigger('newTweet', tweet);
    },

    displayConnections: function(connections) {
        var conn = this.connections.last();
        var parent = this.tweets.findWhere({id: conn.attributes.parent_id});
        var child = this.tweets.findWhere({id: conn.attributes.child_id});

        if(parent && child){
            conn = {};
            conn.filter = parent.attributes.filter;
            conn.parent = parent.attributes.location;
            conn.child = child.attributes.location;
            eventBus.trigger('newConn', conn);
        }
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

        /*console.log('parent ' + connection.parent_id);
         console.log('child ' + connection.child_id);
         console.log(parent_tweet);
         console.log(child_tweet);*/

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