/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.FilterList = Backbone.Collection.extend({
    model: projectham.Filter,
    localStorage: new Backbone.LocalStorage('projectham-filters')
});