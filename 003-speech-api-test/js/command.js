/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.Command = Backbone.Model.extend({
    defaults: function() {                             // every object that is created has these two attributes
        return {
            content: '',
            time: new Date().toLocaleTimeString()
        }
    },

    initialize: function() {
        this.on('change', function() {
            console.log('Model has changed');
        })
    }
});