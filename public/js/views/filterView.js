var projectham = projectham || {};

projectham.FilterView = Backbone.View.extend({
    tagName: 'div class="table-cell"',

    events: {
        //'click .delbut': 'deleteEntry',
    },
    
    initialize: function() {
        console.log(this.model);
        this.listenTo(this.model, 'change:filter', this.render);
    },
    
    template: _.template($('#filterTemplate').html()),
    
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});