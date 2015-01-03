var projectham = projectham || {};

projectham.UserList = Backbone.Collection.extend({
    model: projectham.User,
    url: '/users'
    //localStorage: new Backbone.LocalStorage('projectham-connections')
});