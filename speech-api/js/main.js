/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.module = (function($) {

    var box,
        listening,
        appView,
        ignore_onend,
        commands,
        keywords,
        appStarted;

    var movebox,
        init,
        initRecognition,
        matchCommand,
        listen;

    initRecognition = function() {
        var final_transcript = '';
        var recognizing = false;
        var ignore_onend;
        var start_timestamp;
        var recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = function() {
            recognizing = true;
            console.log('speak now');
        };

        recognition.onerror = function(event) {
            if (event.error == 'no-speech') {
                console.log('no speech');
                ignore_onend = true;
            }
            if (event.error == 'audio-capture') {
                console.log('no microphone');
                ignore_onend = true;
            }
            if (event.error == 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    console.log('info blocked');
                } else {
                    console.log('info denied');
                }
                ignore_onend = true;
            }
        };

        recognition.onend = function() {
            recognizing = false;
            if (ignore_onend) {
                return;
            }
            if (!final_transcript) {
                console.log('speak now');
                return;
            }

            if (window.getSelection) {
                window.getSelection().removeAllRanges();
                var range = document.createRange();
                range.selectNode(document.getElementById('final_span'));
                window.getSelection().addRange(range);
            }
        };

        recognition.onresult = function(event) {
            var interim_transcript = '';
            if (typeof(event.results) == 'undefined') {
                recognition.onend = null;
                recognition.stop();
                upgrade();
                return;
            }
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript = (event.results[i][0].transcript).trim();
                } else {
                    interim_transcript = event.results[i][0].transcript;
                }
            }
            //final_transcript = capitalize(final_transcript);
            final_span.innerHTML = final_transcript;
            interim_span.innerHTML = interim_transcript;

            if(final_transcript) {
                var matchedCommand = hasCommand(final_transcript);

                console.log(matchedCommand);

                if(matchedCommand) {
                    appView.saveCommand(matchedCommand);
                } else {
                    appView.saveCommand(final_transcript);
                }

                final_transcript = '';
            }
        };

        if (recognizing) {
            recognition.stop();
        } else {
            final_transcript = '';
            recognition.lang = 'en';
            recognition.start();
            ignore_onend = false;
            final_span.innerHTML = '';
            interim_span.innerHTML = '';
        }

        listening.css('background-color', 'green');
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

        appView.saveCommand('Move ' + direction + ' ' + value);
    };

    init = function() {
        appStarted = false;

        appView = new projectham.AppView();

        console.log(appView);

        box = $('.move');
        listening = $('#listening');

        initRecognition();
    };

    matchCommand = function(command) {
        console.log(hasCommand(command));

        return(hasCommand(command));
    };

    listen = function() {
        appStarted = true;
    };

    keywords = ['move'];

    function hasCommand(value) {
        for(var i in commands) {

            console.log(commands[i]);

            if (!commands.hasOwnProperty(i)) continue;
            for(var j in commands[i]) {

                console.log("value "+value);

                if (!commands[i].hasOwnProperty(j)) continue;
                if(commands[i][j] == value) {
                    console.log('FOUNDFOUND');

                    return commands[i].correct;
                }
            }
        }

        return false;
    }

    commands = {
        'start_app': {
            'correct': 'ok ham',
            0: 'okay ham',
            1: 'ok hand',
            2: 'okay hand',
            3: 'ok m',
            4: 'okay m',
            5: 'okay have',
            6: 'ok have'
        },
        'move': {
            'correct': 'move right',
            0: ''
        },
        'foo': 'foo'
    };

    $(document).ready(init);

}($));