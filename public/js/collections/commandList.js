/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.CommandList = Backbone.Collection.extend({
    model: projectham.Command,
    localStorage: new Backbone.LocalStorage('projectham-speech')
});