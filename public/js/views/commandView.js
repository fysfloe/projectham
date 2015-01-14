var projectham = projectham || {};

projectham.CommandView = Backbone.View.extend({
    tagName: 'li',
    
    events: {
        //'click .delbut': 'deleteEntry',
    },
    
    initialize: function() {
        this.listenTo(this.model, 'change:command', this.render);
    },
    
    template: _.template($('#commandTemplate').html()),
    
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});