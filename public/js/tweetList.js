var projectham = projectham || {};

projectham.TweetList = Backbone.Collection.extend({
	model: projectham.Tweet,
    //url: "/"
	localStorage: new Backbone.LocalStorage('projectham-tweets')
});