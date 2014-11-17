/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.module = (function($) {

    var box,
        listening,
        appView,
        recognition,
        recognizing,
        ignore_onend;

    var movebox,
        init,
        initRecognition,
        startRecognition,
        stopRecognition,
        toggleRecognition;

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
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);
            final_span.innerHTML = linebreak(final_transcript);
            interim_span.innerHTML = linebreak(interim_transcript);
        };

        var two_line = /\n\n/g;
        var one_line = /\n/g;
        function linebreak(s) {
            return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
        }

        var first_char = /\S/;
        function capitalize(s) {
            return s.replace(first_char, function(m) { return m.toUpperCase(); });
        }

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
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);
            final_span.innerHTML = linebreak(final_transcript);
            interim_span.innerHTML = linebreak(interim_transcript);
        };

        var two_line = /\n\n/g;
        var one_line = /\n/g;
        function linebreak(s) {
            return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
        }

        var first_char = /\S/;
        function capitalize(s) {
            return s.replace(first_char, function(m) { return m.toUpperCase(); });
        }

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

        /*

        appView = new projectham.AppView();

        console.log(appView);

        box = $('.move');
        listening = $('#listening');

        if (annyang) {
            console.log('annyang started');

            // Let's define a command.
            var commands = {
                'ok ham': initRecognition
            };

            // Add our commands to annyang
            annyang.addCommands(commands);

            // Start listening.
            annyang.start();

            console.log(annyang);
        }

        */
    };

    $(document).ready(init);

}($));