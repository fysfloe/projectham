var projectham = projectham || {};

projectham.Tweet = Backbone.Model.extend({
	defaults: function() {
		return {
			id: null,
			text: '',
            parent_id: null,
            type: '',
            location: {
                lat: null,
                lng: null,
                type: ''
            },
            user: {
                name: '',
                followers: null,
                lang: ''
            },
            hashtags: null
		}
	},
	
	initialize: function () {
		this.on('change', function () {
			console.log('model changed');
		});
	}
});