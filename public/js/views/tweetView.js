var projectham = projectham || {};

projectham.TweetView = Backbone.View.extend({

    tagName: 'li',

    render: function() {
        this.$el.html(JSON.stringify(this.model));
        return this;
    }
});
