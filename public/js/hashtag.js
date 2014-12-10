var projectham = projectham || {};

projectham.Hashtag = Backbone.Model.extend({
    defaults: function() {
        return {
            text: '',
            count: 1
        }
    },

    initialize: function () {
        this.on('change', function () {
            console.log('tag count changed');
        });
    }
});