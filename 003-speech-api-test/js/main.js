/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.module = (function($) {

    var box,
        listening,
        appView;

    var listen,
        movebox,
        init;

    listen = function() {
        console.log('listening');

        listening.css('background-color', 'green');
        
        if (annyang) {
            console.log('foo');

            // Let's define a command.
            var commands = {
                'move :direction :value': movebox
            };

            // Add our commands to annyang
            annyang.addCommands(commands);
        }
    };

    movebox = function(direction, value) {
        console.log('foo');

        var moveTo = {
            'x': direction == 'left' ? value * (-1) : (direction == 'right' ? value : 0),
            'y': direction == 'top' ? value * (-1) : (direction == 'bottom' ? value : 0),
        };

        console.log('transform: translate(' + moveTo.x + ',' + moveTo.y + ')');

        box.css({
            transform: 'translate(' + moveTo.x + 'px,' + moveTo.y + 'px)'
        });

        $("#save").trigger('custom');//projectham.AppView.saveCommand('Move ' + direction + ' ' + value);
    };

    init = function() {

        appView = new projectham.AppView();

        console.log(appView);

        box = $('.move');
        listening = $('#listening');

        if (annyang) {
            console.log('annyang started');

            // Let's define a command.
            var commands = {
                'ok ham': listen
            };

            // Add our commands to annyang
            annyang.addCommands(commands);

            // Start listening.
            annyang.start();
        }
    };

    $(document).ready(init);

}($));