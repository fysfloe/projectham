/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.Filter = Backbone.Model.extend({
    defaults: function() {
        return {
            filter: '',
            color: null,
            src: null,
            alt: null
        }
    },

    initialize: function() {
        this.on('change', function() {})
    }
});