var projectham = projectham || {};

projectham.AppView = Backbone.View.extend({
    el: $('main'),
    viewCommands: 3,
    
    initialize: function() {
        this.commands = new projectham.CommandList();
        this.listenTo(this.commands, 'add', this.printCommand);
        this.commands.fetch();
        
        console.log('initialized');
    },
    
    events: {
        //'click #save': 'saveCommand',
        'click #clear': 'clearCommands'
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
                console.log('foo');
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
    }
});