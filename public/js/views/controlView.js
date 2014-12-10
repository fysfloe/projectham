/**
 * Created by Benedikt Schreter on 17.11.2014.
 */

var projectham = projectham || {};

projectham.ControlView = Backbone.View.extend({

    /*
     EVENTS
     */

    events: {
        "click #reset": 'resetControls',
        "click #rotate": 'rotateGlobe',
        "click #goTo": 'goToPlace',
        "keypress #searchField": 'detectEnter'
    },


    /*
     EVENT TRIGGER METHODS
     */

    resetControls: function () {
        eventBus.trigger('reset');
    },

    rotateGlobe: function (dir) {
        var val;

        if (dir instanceof Object) {
            val = "right";
        } else {
            val = dir ? dir : "right";
        }

        eventBus.trigger('rotate', val);
    },

    detectEnter: function (e) {
        if (e.which === 13) {     //13 refers to key "enter"
            this.goToPlace();
        }
    },

    goToPlace: function (placeName) {
        var val = (placeName ? placeName : $(this.el).find('#searchField').val());
        eventBus.trigger('goTo', val);
    },

    zoom: function (dir) {
        eventBus.trigger('zoom', dir);
    }

});