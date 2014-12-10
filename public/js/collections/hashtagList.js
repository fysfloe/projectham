var projectham = projectham || {};

projectham.HashtagList = Backbone.Collection.extend({
    model: projectham.Hashtag,
    //url: "/"
    localStorage: new Backbone.LocalStorage('projectham-hashtags'),
    comparator: function(hashtag) {
        return -hashtag.get('count');
    }
});