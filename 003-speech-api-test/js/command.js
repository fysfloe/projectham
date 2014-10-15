/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.Command = Backbone.Model.extend({
    defaults: {                             // every object that is created has these two attributes
        time: '',
        command: ''
    },

    initialize: function() {
        this.on('change', function() {
            console.log('Model has changed');
        })
    }
});