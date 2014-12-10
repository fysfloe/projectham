var projectham = projectham || {};

projectham.ConnectionList = Backbone.Collection.extend({
    model: projectham.Connection,
    //url: "/"
    localStorage: new Backbone.LocalStorage('projectham-connections')
});