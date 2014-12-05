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

        $('.on-stream-started').hide();
        $('#start-stream').show();

        localStorage.clear();

        this.filterDiv = $('#filters');

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

        console.log('initialized');
    },
    
    events: {
        'click #b-add-filter': 'addFilter',
        'click #start-stream': 'showExtendedInfo',
        'click .add-filter': function() {
            this.filterInputDiv.show();
        },
        'click #stop-stream': 'initialize'
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

        this.prependListItem('commands', commandView.render().el);

        if(listItems.length >= this.viewCommands) {
            this.$('#commands li:last-child').animate({
                'opacity': 0
            }, 500, function() {
                this.remove();
            });
        }
    },

    prependListItem: function(listName, listItemHTML) {
        $(listItemHTML)
            .hide()
            .css('opacity',0.0)
            .prependTo('#' + listName)
            .slideDown(500)
            .animate({opacity: 1.0})
    },

    showExtendedInfo: function() {
        this.addFilter();
        $('.on-stream-started').show();
        $('#start-stream').hide();
    },

    addFilter: function() {
        if(this.filters.length >= 3) {
            console.log('maximum filter number reached');
        } else {
            this.filters.create({
                filter: this.filterInput.val()
            });

            this.filterInput.val("");
            this.filterInputDiv.hide();
        }
    },

    printFilter: function(filter) {
        var filterView;

        filterView = new projectham.FilterView({ model: filter });

        this.$('#filters div:nth-child('+(this.filterCount + 1)+')').before(filterView.render(this.image[this.filterCount]).el);

        this.filterCount++;

        this.$('#filters .add-filter:last-child').remove();
    }
});