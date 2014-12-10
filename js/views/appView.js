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
        'click #stop-stream': 'initialize',
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

            if(this.filterInput.val()) {
                this.addPreFilter();
            }

            for(var i = 0; i < this.preFilters.length; i++) {
                this.addFilter(this.preFilters[i]);
            }

            this.preFilterList.hide();
            this.addPreFilterButton.hide();

            // start streaming here
        }
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

            if(saveFilter) {
                this.filters.create({
                    filter: saveFilter
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
    }
});