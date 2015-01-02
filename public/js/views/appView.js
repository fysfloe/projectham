var projectham = projectham || {};

projectham.AppView = Backbone.View.extend({
    el: $('body'),
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


    initialize: function () {

        this.filterCount = 0;
        this.state = 0;

        $('.on-stream-started').hide();
        $('#start-stream').show();

        localStorage.clear();

        this.trends = $('#trends');
        this.trends.show();

        this.fullscreenButton = $('#fullscreen');
        this.fullscreenState = 0;

        this.addFullScreenEventHandler();

        this.toolsButton = $('#tools');
        this.sidebarState = 0;

        this.filterBox = $('#filter-box');
        this.webspeechBox = $('#web-speech-box');
        this.footer = $('footer');

        this.filterDiv = $('#filters');
        this.filterSoloDiv = $('#filter-solo');

        this.filterBoxH2 = this.filterBox.find('h2');

        this.filterSoloDiv.hide();

        this.preFilterList = $('#preFilterList');
        this.addPreFilterButton = $('#b-add-filter1');
        this.addFilterButton = $('#b-add-filter2');
        this.filterErrMsg = $('#err-msg');
        this.filterRatio = $('#filter-ratio');
        this.filterRatio.html('');
        this.filterCounts = [3];
        this.filterCounts[0] = this.filterCounts[1] = this.filterCounts[2] = this.overallCount = 0;

        this.filterDiv.html("");

        for (var i = 0; i < 3; i++) {
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

        this.getTrends();

        //------------- Benni

        this.currentSepFilter = '';
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
        'click #b-add-filter2': 'addFilterDuringStream',
        'click #fullscreen': 'toggleFullscreen',
        'click #tools': 'toggleSidebars',
        'click #b-add-filter1': 'addFilter',
        'click #start-stream': 'startStream',
        'click .add-filter': function () {
            this.errMsg('');
            this.filterInputDiv.show();
        },
        'click #stop-stream': 'stopStream',
        'keyup #i-add-filter': 'checkEnter',
        'click table#trends td:last-child': function (ev) {
            this.filterInput.val($(ev.target).text());
        },
        'click .solo': 'separateView',
        'click .visibility': 'toggleVisibility',
        'click .end-solo': 'endSeparateView'
    },

    saveCommand: function (command) {
        this.commands.create({
            command: command
        });
    },

    clearCommands: function () {
        console.log('clear');
        var model;

        while (model = this.commands.at(0)) {
            model.destroy();
        }
    },

    printCommand: function (command) {
        var commandView;

        commandView = new projectham.CommandView({model: command});
        //this.$('#commands').prepend(commandView.render().el);

        var listItems = $("#commands li");

        for (var i = 3; i < listItems.length; i++) {
            listItems[i].remove();
        }

        this.prependListItem('commands', commandView.render().el, 'prepend');

        if (listItems.length >= this.viewCommands) {
            this.$('#commands li:last-child').animate({
                'opacity': 0
            }, 500, function () {
                this.remove();
            });
        }
    },

    prependListItem: function (listName, listItemHTML, preApp) {
        if (preApp == 'prepend') {
            $(listItemHTML)
                .hide()
                .css('opacity', 0.0)
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

    startStream: function () {
        if (this.filters.length == 0 && !this.filterInput.val()) {
            console.log('type a filter first!');

            this.errMsg('Please type a filter first.');
        } else {
            this.showExtendedInfo();
            this.filterBoxH2.html('Filtered by');
            this.state = 1;

            if (this.filterInput.val()) {
                this.addFilter();
            }

            this.preFilterList.hide();
            this.addPreFilterButton.hide();
            this.trends.hide();

            if (!this.socket) {
                this.socket = io.connect('http://localhost:3001/');
                window.socket = this.socket;
            }

            this.socket.emit('filter', this.prepareFilters());

            var retweetCount = 0,
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
                DOM_overall.text(++_this.overallCount);
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

            eventBus.trigger('startStream');
        }
    },

    stopStream: function () {
        this.socket.emit('close');
        this.socket = null;

        this.initialize();
    },

    errMsg: function (e) {
        this.filterErrMsg.html(e);
    },

    showExtendedInfo: function () {
        $('.on-stream-started').show();
        $('#start-stream').hide();
    },

    addFilter: function (filter) {
        if (this.filters.length >= 3) {
            console.log('maximum filter number reached');
        } else {
            var saveFilter = typeof filter === 'string' ? filter : this.htmlEntities(this.filterInput.val());

            if (saveFilter) {
                this.errMsg('');

                this.prependListItem('preFilterList', '<li>' + saveFilter + '</li>', 'append');
                //this.preFilterList.append('<li>'+preparedFilter+'</li>');


                var color;

                switch (this.filters.length) {
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

                this.filters.create({
                    filter: saveFilter,
                    color: color
                });

                this.filterInput.val("");
                if (this.state == 1 || this.filters.length == 3) {
                    this.filterInputDiv.hide();
                }

                this.filterRatio.append('<div>');
                this.filterRatioDivs = this.filterRatio.find('div');

                console.log(this.filters);

                eventBus.trigger('addFilter', this.filters);
            } else {
                this.errMsg('Please type a filter.');
            }
        }
    },

    printFilter: function (filter) {
        var filterView;

        filterView = new projectham.FilterView({model: filter});
        this.$('#filters div:nth-child(' + (this.filterCount + 1) + ')').before(filterView.render(this.image[this.filterCount]).el);
        this.filterCount++;

        this.$('#filters .add-filter:last-child').remove();
    },

    checkEnter: function (event) {
        if (event.keyCode == 13) {
            if (this.state == 0) {
                this.$("#b-add-filter1").click();
            } else if (this.state == 1) {
                this.$("#b-add-filter2").click();
            }
        }
    },

    htmlEntities: function (str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    // ------------------ Julian

    displayTweets: function (tweets) {
        var tweet = this.tweets.last();

        this.filterCounts[tweet.attributes.filter.id]++;

        var i = 0,
            _this = this,
            overallWidth = 0,
            addWidth,
            curWidths = [];

        this.filterRatioDivs.each(function() {
            overallWidth += _this.filterCounts[i]/_this.overallCount*100;

            var width = _this.filterCounts[i]/_this.overallCount*100 - 0.5;
            curWidths[i] = width;

            $(this).width(width + "%");
            i++;
        });

        if(overallWidth < 100) {
            addWidth = (100 - overallWidth)/this.filterRatioDivs.length;
            this.filterRatioDivs.each(function() {
                $(this).width((curWidths[i] + addWidth) + "%");
            });
        }

        eventBus.trigger('newTweet', tweet);
    },

    displayConnections: function (connections) {
        var conn = this.connections.last();
        var parent = this.tweets.findWhere({id: conn.attributes.parent_id});
        var child = this.tweets.findWhere({id: conn.attributes.child_id});

        if (parent && child) {
            conn = {};
            conn.filter = parent.attributes.filter;
            conn.parent = parent.attributes.location;
            conn.child = child.attributes.location;
            eventBus.trigger('newConn', conn);
        }
    },

    printHashtags: function (hashtags) {
        this.$("#hashtagList").empty();

        hashtags.collection.each(function (hashtag) {
            var hashView;
            hashView = new projectham.TweetView({model: hashtag});
            this.$("#hashtagList").append(hashView.render().el);
        });
    },

    saveTweet: function (tweet) {
        this.tweets.create(tweet);
    },

    saveHashtag: function (hashtag) {
        this.hashtags.create(hashtag);
    },

    saveConnection: function (connection) {

        var parent_tweet = this.tweets.get(connection.parent_id);
        var child_tweet = this.tweets.get(connection.child_id);

        /*console.log('parent ' + connection.parent_id);
         console.log('child ' + connection.child_id);
         console.log(parent_tweet);
         console.log(child_tweet);*/

        if (parent_tweet && child_tweet) {
            if (parent_tweet.attributes.location && child_tweet.attributes.location) {
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

    clearTweets: function () {
        var model;
        while (model = this.tweets.at(0)) {
            model.destroy();
        }
    },

    toggleSidebars: function () {
        if (this.sidebarState == 0) {
            this.filterBox.animate({
                opacity: 0,
                left: '-20em'
            });

            this.webspeechBox.animate({
                opacity: 0,
                right: '-20em'
            });

            this.footer.animate({
                opacity: 0,
                bottom: '-20em'
            });

            this.sidebarState = 1;
            this.toolsButton.find('span').html('Show Tools');

        } else if (this.sidebarState == 1) {
            this.filterBox.animate({
                opacity: 1,
                left: '0'
            });

            this.webspeechBox.animate({
                opacity: 1,
                right: '0'
            });

            this.footer.animate({
                opacity: 1,
                bottom: '0'
            });

            this.sidebarState = 0;
            this.toolsButton.find('span').html('Hide Tools');
        }
    },

    toggleFullscreen: function () {
        if (this.fullscreenState == 0) {

            var element = document.body;

            // Supports most browsers and their versions.
            var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) || element.mozRequestFullScreen || element.msRequestFullscreen;

            if (requestMethod) { // Native full screen.
                requestMethod.call(element);
            } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
                var wscript = new ActiveXObject("WScript.Shell");
                if (wscript !== null) {
                    wscript.SendKeys("{F11}");
                }
            }

            this.fullscreenButton.html('&#xe600;');
            this.fullscreenState = 1;

        } else if (this.fullscreenState == 1) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }

            this.fullscreenButton.html('&#xe601;');
            this.fullscreenState = 0;
        }
    },

    addFullScreenEventHandler: function () {
        var _this = this;

        document.addEventListener("fullscreenchange", function () {
            if (!document.fullscreenElement) {
                _this.fullscreenButton.html('&#xe601;');
            }
        }, false);
        document.addEventListener("webkitfullscreenchange", function () {
            if (!document.webkitFullscreenElement) {
                _this.fullscreenButton.html('&#xe601;');
            }
        }, false);
        document.addEventListener("mozfullscreenchange", function () {
            if (!document.mozFullScreenElement) {
                _this.fullscreenButton.html('&#xe601;');
            }
        }, false);
    },

    getTrends: function () {
        var tds = $('table#trends td:last-child span');
        var i = 0;

        $.get("data/trends_example_formatted.json", function (data) {
            var trends = data[data.length - 1].trends[0].trends;

            tds.each(function () {
                $(this).html((trends[i].name).replace('#', ''));
                i++;
            })
        });
    },

    prepareFilters: function () {
        var preparedFilters = [];
        var i = 0;

        this.filters.each(function (filter) {
            console.log(filter.attributes.filter);

            preparedFilters[i] = filter.attributes.filter;
            i++;
        });

        console.log(preparedFilters);

        return preparedFilters;
    },

    addFilterDuringStream: function () {
        this.addFilter();
        this.socket.emit('filter', this.prepareFilters());
    },

    separateView: function(ev) {
        var model,
            id,
            _this = this,
            filter = ev.target.parentElement.parentElement.childNodes[1].firstElementChild.textContent;

            this.currentSepFilter = filter;

        model = this.filters.find(function(m) {
            return m.get('filter') == filter;
        });

        id = this.filters.indexOf(model);

        eventBus.trigger('soloMode', id);

        this.filterBoxH2.html(filter + '<span class="end-solo">&#xe603;</span>');

        this.filterDiv.fadeOut(500, function() {
            _this.filterSoloDiv.fadeIn(500);
        });
    },

    endSeparateView: function(ev) {
        console.log(ev);
        var model,
            id,
            filter = this.currentSepFilter;

        model = this.filters.find(function(m) {
            return m.get('filter') == filter;
        });

        id = this.filters.indexOf(model);

        eventBus.trigger('soloMode', id);
        
        this.filterBoxH2.html('Filtered by');

        this.filterSoloDiv.hide();
        this.filterDiv.show();
    },

    toggleVisibility: function(ev) {
        var model,
            id,
            figure = ev.target.parentElement.parentElement.childNodes[1],
            filter = figure.firstElementChild.textContent;

        model = this.filters.find(function(m) {
            return m.get('filter') == filter;
        });

        id = this.filters.indexOf(model);

        if(figure.classList.contains('visible')) {
            figure.classList.remove('visible');
            ev.target.classList.remove('ci-color');
            ev.target.classList.add('white');
        } else {
            figure.classList.add('visible');
            ev.target.classList.remove('white');
            ev.target.classList.add('ci-color');
        }

        eventBus.trigger('toggleVisibility', id);
    }
});