var projectham = projectham || {};

projectham.Connection = Backbone.Model.extend({
    defaults: function() {
        return {
            parent_id: null,
            child_id: null
            /*parent: {
                lat: null,
                lng: null
            },
            child: {
                lat: null,
                lng: null
            }*/
        }
    },

    initialize: function () {
        this.on('change', function () {
            console.log('model changed');
        });
    }
});