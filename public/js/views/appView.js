var projectham = projectham || {};

projectham.AppView = Backbone.View.extend({
    el: $('body'),
    viewCommands: 3,
    numFilters: 3,

    image: [{
        'src': 'blue.png',
        'alt': 'Blue',
        'color': 0x4099FF
    }, {
        'src': 'orange.png',
        'alt': 'Orange',
        'color': 0xE28C10
    }, {
        'src': 'green.png',
        'alt': 'Green',
        'color': 0x81D056
    }
    ],

    placeHolder: '<div class="table-cell add-filter"><figure><figcaption>Add Filter</figcaption><img src="img/ui/plus.png" alt="Plus"></figure></div>',

    events: {
        //'click #b-add-filter2': 'addFilterDuringStream',
        'click #fullscreen': 'toggleFullscreen',
        'click #controls': 'toggleSidebars',
        'click #b-add-filter': 'addFilter',
        'click #start-stream': 'startStream',
        'click .startstream': 'startStream',
        'click #stop-stream': 'stopStream',
        'keyup #i-add-filter': 'checkEnter',
        'click .solo': 'separateView',
        'click .visibility': 'toggleVisibility',
        'click .end-solo': 'endSeparateView',
        'click #help': 'toggleHelp',
        'click #show-possible-commands': function() {
            console.log('foo');
            this.possibleCommands.toggle.bind(this.possibleCommands)();
        },

        'click .add-filter': function () {
            this.filterErrMsg.html('');
            this.runningFilters.slideDown();
            //this.filterInputDiv.show();
        },

        'click table#trends td:last-child': function (ev) {
            this.addFilter($(ev.target).text());
        },

        'click ul#running-filters li': function (ev) {
            this.addFilter($(ev.target).text());
            if(this.state == 1) {
                this.runningFilters.slideUp();
            }
        },

        'click #reset': function() {
            eventBus.trigger('reset');
        },

        'click .reload': function() {
            location.reload();
        },

        'click .tryagain': function() {},

        'click .accordion-heading': function (ev) {
            !$(ev.target).hasClass('opened') ? $(ev.target).addClass('opened') : $(ev.target).removeClass('opened');
            $(ev.target).next().slideToggle();

            $('.accordion-heading').not(ev.target).removeClass('opened').next().slideUp();
        }
    },

    initialize: function () {
        /*************************************************
             backbone stuff
         *************************************************/

        localStorage.clear();

        this.commands = new projectham.CommandList();
        this.filters = new projectham.FilterList();
        this.tweets = new projectham.TweetList();
        this.connections = new projectham.ConnectionList();
        this.hashtags = new projectham.HashtagList();
        this.users = new projectham.UserList();

        this.listenTo(this.commands, 'add', this.printCommand);
        this.listenTo(this.filters, 'add', this.printFilter);
        this.listenTo(this.filters, 'remove', this.rearrangeFilters);
        this.listenTo(this.tweets, 'add', this.displayTweets);
        this.listenTo(this.connections, 'add', this.displayConnections);
        this.listenTo(this.hashtags, 'change', this.printHashtags);

        this.commands.fetch();
        this.filters.fetch();
        this.users.fetch();

        /*************************************************
             helpers
         *************************************************/

        this.filterCount = 0;       // number of initialized filters
        this.state = 0;             // stream not yet started
        this.filterCounts = [3];    // counts for every filter (tweets, retweets, replies)
        this.filterCounts[0] = this.filterCounts[1] = this.filterCounts[2] = this.overallCount = 0;
        this.fullscreenState = 0;   // 0: not fullscreen, 1: fullscreen
        this.sidebarState = 0;      // 0: show, 1: hide
        this.helpState = 0;         // 0: hide, 1: show
        this.replyCount = 0;
        this.retweetCount = 0;
        this.soloMode = false;
        this.stats = {};
        this.currentSepFilter = '';

        this.allFilters = []; // lower case required!
        var _this = this;

        $('#running-filters li').each(function() {
           _this.allFilters.push($(this).text().toLowerCase());
        });

        console.log(this.allFilters);

        /*************************************************
             DOM elements
         *************************************************/

        // controls
        this.fullscreenButton = $('#fullscreen');
        this.controlsButton = $('#controls');
        this.helpOverlay = $('#helpOverlay');
        this.helpButton = $('#help');
        this.screenshotButton = $('#screenshot');
        this.stopStreamButton = $('#stop-stream');
        this.screenshotText = $('#screenshot-text');
        this.fbButton = $('.fb-share-button');

        // filter-box
        this.filterBox = $('#filter-box');
        this.filterBoxH2 = this.filterBox.find('h2');
        this.trends = $('#trends, #trends-heading');

        this.runningFilters = $('#running-filters-div');
        this.runningFiltersHeading = this.runningFilters.find('h3');
        this.noNewFilterMsg = $('#no-new-filters-msg');

        this.filterDiv = $('#filters');
        this.filterSoloDiv = $('#filter-solo');
        this.preFilterList = $('#preFilterList');

        this.filterInput = $("#i-add-filter");
        this.filterInputDiv = $("#filter-input-div");
        //this.addPreFilterButton = $('#b-add-filter1');
        this.addFilterButton = $('#b-add-filter');

        this.filterErrMsg = $('#filterErrMsg');
        this.filterRatio = $('#filter-ratio');

        this.DOM_overall = $('#overall');
        this.DOM_retweets = $('#retweets');
        this.DOM_replies = $('#replies');

        this.totalTweets = $('#total-tweets'); // heading switches from total to tweets on separate view

        // web-speech-box
        this.webspeechBox = $('#web-speech-box');

        // error/success box
        this.errBox = $('#errBox');
        console.log(this.errBox[0]);

        console.log($('#somedialog'));
        this.dlg = new DialogFx( $('#errBox')[0]) ;
        this.possibleCommands = new DialogFx( $('#possible-commands')[0] );
        this.errMsgText = $('#errMsg');
        this.action = $('#action');

        this.footer = $('footer');

        /*************************************************
             manipulate elements
         *************************************************/

        $('.on-stream-started').hide();
        $('.on-stream-not-started').show();
        $('#start-stream').show();
        this.trends.show();
        this.runningFilters.show();

        this.filterInputDiv.show();
        this.runningFiltersHeading.html('Currently Used Filters');
        this.noNewFilterMsg.hide();

        this.filterSoloDiv.hide();
        this.filterInputDiv.show();
        //this.addPreFilterButton.show();
        this.preFilterList.html('');
        this.preFilterList.show();

        this.helpOverlay.hide();
        this.fbButton.hide();

        this.filterDiv.html('');
        this.filterRatio.html('');

        this.filterErrMsg.html('');
        //this.errBox.hide();

        for (var i = 0; i < 3; i++) {
            this.filterDiv.append(this.placeHolder);
        }

        this.addFullScreenEventHandler();
        this.getTrends();

        /*************************************************
             eventBus events
         *************************************************/

        this.socket = null;

        window.onbeforeunload = function () {
            _this.socket.emit('close');
            //socket.onclose = function () {}; // disable onclose handler first
            //socket.close();
            _this.socket = null;
        };

        eventBus.on('error', function (e, action) {
            _this.dlg.toggle.bind(_this.dlg)();

            _this.errMsgText.html(e);
            _this.errBox.removeClass('success');
            _this.errBox.find('h2').html('Oh no...');
            if(!action || action == 'none') {
                _this.errBox.removeClass('with-action');
                _this.action.hide();
            } else {
                _this.errBox.addClass('with-action');
            }
            if (action == 'reload') {
                _this.errBox.find('.dialog__content').addClass('reload');
                _this.action.html('Reload<span class="icon">&#xe606;</span>');
            }
            if (action == 'tryagain') {
                _this.errBox.find('.dialog__content').addClass('tryagain');
                _this.action.html('Try Again<span class="icon">&#xe606;</span>')
            }
            if (action == 'startstream') {
                _this.errBox.find('.dialog__content').addClass('startstream');
                _this.action.html('Start Stream');
            }

            //_this.errBox.show();
        });

        eventBus.on('success', function (m, action, filename) {
            _this.dlg.toggle.bind(_this.dlg)();
            _this.errMsgText.html(m);
            _this.errBox.removeClass('with-action');
            _this.errBox.find('h2').html('Yiha!');
            if(action == 'share') {
                _this.fbButton.show();
                _this.fbButton.attr('data-href', 'http://127.0.0.1:3000/uploads/'+filename);
                (function(d, s, id) {
                    var js, fjs = d.getElementsByTagName(s)[0];
                    if (d.getElementById(id)) return;
                    js = d.createElement(s); js.id = id;
                    js.src = "//connect.facebook.net/de_DE/sdk.js#xfbml=1&appId=675085619278231&version=v2.0";
                    fjs.parentNode.insertBefore(js, fjs);
                }(document, 'script', 'facebook-jssdk'));
            }
            _this.errBox.addClass('success');
            _this.errBox.find('.dialog__content').removeClass('reload tryagain startstream');
            _this.errBox.show();
        });

        eventBus.on('noNewFilters', function() {
            alert('hu');
            this.noNewFilters()
        });

        console.log('initialized');
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

    rearrangeFilters: function() {
        this.filterDiv.append(this.placeHolder);

        this.filterCount--;
        var _this = this;

        this.filters.each(function(filter) {
            filter.set('src', _this.image[_this.filters.indexOf(filter)].src);
            filter.set('alt', _this.image[_this.filters.indexOf(filter)].alt);
            filter.set('color', _this.image[_this.filters.indexOf(filter)].color);
        });
    },

    startStream: function () {
        if (this.filters.length == 0 && !this.filterInput.val()) {
            this.filterErrMsg.html('Please choose a filter first.');
        } else {
            //this.filters.fetch();
            this.filterCounts[0] = this.filterCounts[1] = this.filterCounts[2] = this.overallCount = 0;
            this.showExtendedInfo();
            this.filterBoxH2.html('Filtered by');
            this.state = 1;
            $('#running-filters-heading').click();

            if (this.filterInput.val()) {
                this.addFilter();
            }

            this.preFilterList.hide();
            //this.addPreFilterButton.hide();
            this.trends.hide();
            this.runningFilters.hide();
            this.noNewFilterMsg.hide();
            this.filterInputDiv.hide();

            if (!this.socket) {
                this.socket = io('https://tweezee.herokuapp.com:80/') //, {'force new connection': true});
                //this.socket = io('http://localhost:3001'); //, {'force new connection': true});
                //this.socket = io.connect('http://185.26.156.28:64720/', {'force new connection': true}); todo: use for production on uberspace
                window.socket = this.socket;
            }

            this.socket.emit('filter', this.prepareFilters());

            var _this = this;

            this.socket.on('conn', function (conn) {
                _this.saveConnection(conn);
            });

            this.socket.on('tweet', function (tweet) {
                if(_this.soloMode) {
                    eventBus.trigger('checkStats');

                    eventBus.on('soloStats', function(stats) {
                        _this.stats = stats;

                        _this.DOM_overall.text(stats.tweets);
                        _this.DOM_replies.text(stats.replies);
                        _this.DOM_retweets.text(stats.retweets);
                    });
                }

                _this.overallCount++;

                _this.DOM_overall.text(!_this.soloMode ? _this.overallCount : _this.stats.tweets);

                if (tweet.type == 'retweet') {
                    _this.DOM_retweets.text(!_this.soloMode ? ++_this.retweetCount : _this.stats.retweets);
                } else if (tweet.type == 'reply') {
                    _this.DOM_replies.text(!_this.soloMode ? ++_this.replyCount : _this.stats.replies);
                }

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
                        }
                    });
                }

                _this.saveTweet(tweet);
            });

            this.socket.on('err', function (error) {
                eventBus.trigger('error', 'There was an error with the Twitter Stream. Don\'t know how to solve it? Us neither. Just try it again later.');
                console.trace('Module A'); // [1]
                console.error(error.stack); // [2]
            });

            eventBus.trigger('startStream');
        }
    },

    stopStream: function () {
        this.socket.emit('close');
        this.socket = null;

        this.stopStreamButton.hide();
        this.screenshotButton.show();
        this.screenshotText.show();

        //this.initialize();
    },

    showExtendedInfo: function () {
        $('.on-stream-started').show();
        $('.on-stream-not-started').hide();
        $('#start-stream').hide();
    },

    addFilter: function (filter) {
        if (this.filters.length >= 3) {
            eventBus.trigger('error', 'You reached the maximum filter number. It\'s time to start the stream now!', 'startstream');
        } else {
            var saveFilter = typeof filter === 'string' ? filter : this.htmlEntities(this.filterInput.val());

            var model = this.filters.find(function(m) {
                return m.get('filter').toLowerCase() == saveFilter.toLowerCase();
            });

            console.log(model);
            console.log(saveFilter);

            if(!model && saveFilter) {
                this.filterErrMsg.html('');

                this.filters.create({
                    filter: saveFilter,
                    color: this.image[this.filterCount].color,
                    src: this.image[this.filterCount].src,
                    alt: this.image[this.filterCount].alt
                });

                this.filterInput.val("");
                if (this.state == 1 || this.filters.length == 3) {
                    this.filterInputDiv.hide();
                }

                this.filterRatio.append('<div>');
                this.filterRatioDivs = this.filterRatio.find('div');

                eventBus.trigger('addFilter', this.filters);

                // add filters during stream
                if(this.socket) { // check if socket connection exists (stream is running)
                    this.socket.emit('filter', this.prepareFilters());
                }
            } else {
                this.filterErrMsg.html('Please choose a filter that doesn\'t yet exist.');
                //eventBus.trigger('wrongCommand');
            }
        }
    },

    printFilter: function (filter) {
        var filterView,
            preFilterView;

        filterView = new projectham.FilterView({model: filter});
        preFilterView = new projectham.PreFilterView({model: filter});

        this.$('#filters div:nth-child(' + (this.filterCount + 1) + ')').before(filterView.render().el);

        this.prependListItem('preFilterList', preFilterView.render().el, 'append');
        this.filterCount++;

        this.$('#filters .add-filter:last-child').remove();
    },

    checkEnter: function (event) {
        console.log('foo');

        if (event.keyCode == 13) {
            /*if (this.state == 0) {
                this.$("#b-add-filter1").click();
            } else if (this.state == 1) {
                this.$("#b-add-filter2").click();
            }*/

            this.addFilterButton.click();
        }
    },

    htmlEntities: function (str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    noNewFilters: function() {
        eventBus.trigger('error', 'There are so many people using Tweezee at the moment. That\'s why you can\'t type any new filters. But don\'t worry, you can still start a stream with some filters that are already in use. Just choose them from the list.');
        this.filterInputDiv.hide();
        this.trends.hide();
        this.noNewFilterMsg.show();
        this.runningFiltersHeading.html('Currently Available Filters');
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
            var width = _this.filterCounts[i]/_this.overallCount*100;
            curWidths[i] = width;

            $(this).width(width + "%");
            overallWidth += curWidths[i];
            i++;
        });

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
                top: '90%'
            });

            this.footer.animate({
                opacity: 0,
                bottom: '-20em'
            });

            this.sidebarState = 1;
            this.controlsButton.attr('title', 'Show Controls');

            this.webspeechBox.addClass('hidden-controls');

        } else if (this.sidebarState == 1) {
            this.filterBox.animate({
                opacity: 1,
                left: '0'
            });

            this.webspeechBox.animate({
                opacity: 1,
                top: '36%'
            });

            this.footer.animate({
                opacity: 1,
                bottom: '0'
            });

            this.sidebarState = 0;
            this.controlsButton.attr('title', 'Hide Controls');

            this.webspeechBox.removeClass('hidden-controls');
        }
    },

    toggleFullscreen: function () {
        if (this.fullscreenState == 0) {

            var element = document.body;

            // Supports most browsers and their versions.
            var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;

            if (requestMethod) { // Native full screen.
                requestMethod.call(element);
            } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
                var wscript = new ActiveXObject("WScript.Shell");
                if (wscript !== null) {
                    wscript.SendKeys("{F11}");
                }
            }

            this.fullscreenButton.html('&#xe600;');
            this.fullscreenButton.attr('title', 'Exit Fullscreen');
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
            this.fullscreenButton.attr('title', 'Fullscreen');
            this.fullscreenState = 0;
        }
    },

    addFullScreenEventHandler: function () {
        var _this = this;

        document.addEventListener("fullscreenchange", function () {
            if (!document.fullscreenElement) {
                _this.fullscreenButton.html('&#xe601;');
                _this.fullscreenButton.attr('title', 'Fullscreen');
                _this.fullscreenState = 0;
            }
        }, false);
        document.addEventListener("webkitfullscreenchange", function () {
            if (!document.webkitFullscreenElement) {
                _this.fullscreenButton.html('&#xe601;');
                _this.fullscreenButton.attr('title', 'Fullscreen');
                _this.fullscreenState = 0;
            }
        }, false);
        document.addEventListener("mozfullscreenchange", function () {
            if (!document.mozFullScreenElement) {
                _this.fullscreenButton.html('&#xe601;');
                _this.fullscreenButton.attr('title', 'Fullscreen');
                _this.fullscreenState = 0;
            }
        }, false);
    },

    getTrends: function () {
        var tds = $('table#trends td:last-child span');
        var i = 0;

        $.get("/trends", function (data) {
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

        this.soloMode = true;

        this.totalTweets.text('Tweets');
        this.filterBoxH2.html(filter + '<span class="end-solo">&#xe603;</span>');
        this.filterRatio.hide();
        this.filterDiv.hide();
        this.filterSoloDiv.show();
    },

    endSeparateView: function(ev) {
        var model,
            id,
            _this = this,
            filter = this.currentSepFilter;

        model = this.filters.find(function(m) {
            return m.get('filter') == filter;
        });

        id = this.filters.indexOf(model);

        eventBus.trigger('soloMode', id);

        this.totalTweets.text('Total');
        this.filterBoxH2.html('Filtered by');

        this.soloMode = false;

        this.filterSoloDiv.hide();
        this.filterDiv.show();
        this.filterRatio.show();
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
    },

    toggleHelp: function() {
        var _this = this;

        if(this.helpState == 0) {
            this.helpButton.html('&#xe117;');
            this.helpButton.attr('title', 'Close Help');
            this.helpState = 1;
            this.helpOverlay.show();
            this.helpOverlay.animate({
                'opacity': 1
            }, 500);
            $('.more-info').hide();
        } else if(this.helpState == 1) {
            this.helpButton.html('&#xe609;');
            this.helpButton.attr('title', 'Help');
            this.helpOverlay.animate({
                'opacity': 0
            }, 500, function() {
                _this.helpOverlay.hide();
            });
            this.helpState = 0;
            $('.more-info').show();
        }
    }
});
