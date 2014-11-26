var projectham = projectham || {};

projectham.AppView = Backbone.View.extend({
    el: $('main'),
    
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
        this.$('#commands').append(commandView.render().el);
    }
});