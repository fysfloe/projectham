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
        //'click #save': 'saveCommand'
    },
    
    saveCommand: function(command) {
        console.log('In');

        this.commands.create({
            command:    command
        });
        
        console.log(this.commands);
    },
    
    printCommand: function(command) {
        var commandView;
        
        commandView = new projectham.CommandView({ model: command });
        this.$('#commands').append(commandView.render().el);
    }
});