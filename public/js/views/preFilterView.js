var projectham = projectham || {};

projectham.PreFilterView = Backbone.View.extend({
    tagName: 'li',

    events: {
        'click .delbut': 'deleteEntry',
        'dblclick .view': 'edit',
        'blur .edit': 'close'
    },

    initialize: function() {
        this.listenTo(this.model, 'remove', this.remove);
        this.listenTo(this.model, 'change:filter', this.render);
    },

    template: _.template($('#preFilterTemplate').html()),

    render: function() {
        console.log('rendererer');

        this.$el.html(this.template(this.model.toJSON()));
        this.input = this.$('.edit');
        return this;
    },

    deleteEntry: function() {
        this.model.destroy();
    },

    edit: function() {
        this.$el.addClass('editing');
        this.input.focus();
    },

    close: function() {
        this.model.set('filter', this.input.val());
        this.model.save();
        this.$el.removeClass('editing');
    }
});