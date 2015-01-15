var projectham = projectham || {};

projectham.FilterView = Backbone.View.extend({
    tagName: 'div class="table-cell"',

    events: {
        //'click .delbut': 'deleteEntry',
    },
    
    initialize: function() {
        this.listenTo(this.model, 'remove', this.remove);
        this.listenTo(this.model, 'change:filter', this.render);
        this.listenTo(this.model, 'change:src', this.render);
        this.listenTo(this.model, 'change:alt', this.render);
    },
    
    template: _.template($('#filterTemplate').html()),
    
    render: function() {
        console.log('render');

        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});