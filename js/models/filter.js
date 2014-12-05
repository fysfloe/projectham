/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.Filter = Backbone.Model.extend({
    defaults: function() {
        return {
            filter: ''
        }
    },

    initialize: function() {
        this.on('change', function() {})
    }
});