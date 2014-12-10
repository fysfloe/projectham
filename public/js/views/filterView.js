var projectham = projectham || {};

projectham.FilterView = Backbone.View.extend({
    tagName: 'div class="table-cell"',

    events: {
        //'click .delbut': 'deleteEntry',
    },
    
    initialize: function() {
        console.log(this.model);
        this.listenTo(this.model, 'change:content', this.render);
    },
    
    template: _.template($('#filterTemplate').html()),
    
    render: function(image) {
        var extendedModel = this.model.toJSON();

        extendedModel.src = image.src;
        extendedModel.alt = image.alt;

        this.$el.html(this.template(extendedModel));
        return this;
    }
});