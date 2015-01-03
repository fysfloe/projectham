var projectham = projectham || {};

projectham.User = Backbone.Model.extend({
    defaults: function() {
        return {
            ip: '',
            lat: null,
            lng: null,
            date: new Date().toLocaleString()
        }
    },

    parse: function(response) {
        var parsed = _(response).pick(
            'ip',
            'lat',
            'lng',
            'date'
        );
        parsed.id = response._id;
        return parsed;
    }
});