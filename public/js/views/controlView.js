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
        "click #connection": 'displayConnection',
        "click #change": 'changeView',
        "click #fadeIn": 'fadeIn',
        "click #fadeOut": 'fadeOut',
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
        var val;

        if (placeName instanceof Object) {
            val = $(this.el).find('#searchField').val();
        } else {
            val = (placeName ? placeName : $(this.el).find('#searchField').val());
        }

        eventBus.trigger('goTo', val);
    },

    zoom: function (dir) {
        eventBus.trigger('zoom', dir);
    },

    displayConnection: function () {
        eventBus.trigger('draw');
    },

    changeView: function () {
        eventBus.trigger('change');
    },

    fadeIn: function () {
        eventBus.trigger('fadeIn');
    },

    fadeOut: function () {
        eventBus.trigger('fadeOut');
    }

});