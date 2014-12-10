/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.module = (function($) {

    var listening,
        appView,
        ignore_onend,
        restart,

        commands,
        app_started,

        // benni starts here
        gv,
        cv;

    var init,
        initRecognition,
        matchCommand,
        executeCommand,

        startApp,
        move,
        rotate,
        goTo,
        reset,
        zoom,
        filterBy,
        addPreFilter,
        addFilter,
        startStream,
        stopStream;

    initRecognition = function() {
        var final_transcript = '';
        var recognizing = false;
        var ignore_onend = true;
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
                    restart = false;
                }
                ignore_onend = true;
            }
        };

        recognition.onend = function() {
            console.log('ended');

            app_started = false;

            if(restart) recognition.start();

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

            if(app_started) {
                //final_transcript = capitalize(final_transcript);
                final_span.innerHTML = final_transcript;
                interim_span.innerHTML = interim_transcript;
            }

            if(final_transcript) {
                var matched_command = matchCommand(final_transcript);
                console.log(matched_command);

                console.log('matched command: ' + matched_command);

                if(matched_command) {
                    if(matched_command.string_array) {
                        var combined_command = matched_command.correct + " ";
                        for(var k = matched_command.num_keywords; k < matched_command.string_array.length; k++) {
                            if (!matched_command.string_array.hasOwnProperty(k)) continue;

                            combined_command += matched_command.string_array[k] + " ";
                        }

                        appView.saveCommand(combined_command);

                    } else {
                        appView.saveCommand(matched_command.correct);
                    }

                    if(matched_command.has_parameters) {
                        matched_command.parameters = {};
                        for(var j = matched_command.num_keywords; j < matched_command.string_array.length; j++) {
                            matched_command.parameters[j] = matched_command.string_array[j];
                        }
                        executeCommand(matched_command, matched_command.parameters);
                    } else {
                        executeCommand(matched_command);
                    }

                } else {
                    appView.saveCommand(final_transcript);
                }

                final_span.innerHTML = '';

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
    };

    executeCommand = function(command, parameters) {
        command.function(parameters);
    };

    matchCommand = function(command) {
        // if app has been started via command "ok ham", the commands will be devided into a keyword (first position of array) and parameters
        // the keyword has to be within the commands object
        if(app_started) {

            var string_array = command.split(' ');
            var keyword = string_array[0] + " " + string_array[1];

            console.log(string_array);

            var obj = hasCommand(keyword);

            if(!obj) {
                keyword = string_array[0];
                obj = hasCommand(keyword);
                obj.num_keywords = 1;
            } else {
                obj.num_keywords = 2;
            }

            obj.string_array = string_array;

            //obj.string_array[0] = obj.correct;

            return obj;
        }
        // otherwise we are looking for the whole string in the commands array
        else {
            return hasCommand(command);
        }
    };

    startApp = function() {
        app_started = true;

        listening.css('background-color', 'green');

        console.log('app started');
    };

    rotate = function(parameters) {
        var direction = parameters[1];

        cv.rotateGlobe(direction);
    };

    goTo = function(parameters) {
        var destination = '';

        for(var i in parameters) {
            if (!parameters.hasOwnProperty(i)) continue;
            destination += parameters[i] + " ";
        }

        destination = destination.trim();

        cv.goToPlace(destination);
    };

    reset = function() {
        cv.resetControls();
    };

    zoom = function(parameters) {
        var direction = parameters[1];

        cv.zoom(direction);
    };

    filterBy = function(parameters) {
        var filter = '';

        for(var i in parameters) {
            if (!parameters.hasOwnProperty(i)) continue;
            filter += parameters[i] + " ";
        }

        appView.filterInput.val(filter);
    };

    addPreFilter = function() {
        if(appView.filterInput.val()) {
            appView.state == 0 ? appView.addPreFilterButton.trigger('click') : appView.addFilterButton.trigger('click');
        }
    };

    startStream = function() {
        appView.startStream();
    };

    stopStream = function() {
        if(appView.state == 1) {
            appView.stopStream();
        }
    };

    addFilter = function() {
        console.log('here');

        $(".add-filter").trigger('click');
    };

    init = function() {
        appStarted = false;
        restart = true;

        appView = new projectham.AppView();

        console.log(appView);

        box = $('.move');
        listening = $('#listening');

        initRecognition();

        //------- benni starts here --------
        gv = new projectham.GlobeView();
        cv = new projectham.ControlView({el: $('#controls')});

        var renderContainer = '#globe';

        THREE.DefaultLoadingManager.onProgress = function (item, loaded, total) {
            console.log(item, loaded, total);
        };

        $(renderContainer).append(gv.render({
            width: window.innerWidth,
            height: window.innerHeight,
            mapSrc: 'img/world_map.png',
            enableTrackball: true
        }).el);

        gv.rotateCameraCon(0.001);
        gv.startCameraRotation();
        /*$.get('Global_Routes.csv', function(data){
         gv.displayLineData(data);
         });*/
        $.get('data/data2.csv', function(data){
            gv.displayData(data);
        });


    };

    function hasCommand(value) {
        for(var i in commands) {
            if (!commands.hasOwnProperty(i)) continue;
            for(var j in commands[i]) {
                if (!commands[i].hasOwnProperty(j)) continue;

                for(var k in commands[i].possibilities) {
                    if (!commands[i].possibilities.hasOwnProperty(k)) continue;

                    if(commands[i].possibilities[k] == value.toLowerCase()) {
                        return {
                            'correct': commands[i].correct,
                            'function': commands[i].function,
                            'has_parameters': commands[i].has_parameters
                        };
                    }
                }

            }
        }

        return false;
    }

    /*
    command_sort = [
        {
            'reference': 'start_app',
            'possibility': 'ok ham'
        }
    ];
    */

    commands = {
        /*'start_app': {
            'correct': 'ok ham',
            'function': startApp,
            'has_parameters': false,
            'possibilities': {
                0: 'ok ham',
                1: 'okay ham',
                2: 'ok hand',
                3: 'okay hand',
                4: 'ok m',
                5: 'okay m',
                6: 'okay have',
                7: 'ok have'
            }
        },*/

        'start_app': {
            'correct': 'listen',
            'function': startApp,
            'has_parameters': false,
            'possibilities': {
                0: 'listen',
                1: 'yeah baby give me a listen',
                2: 'yo listen',
                3: 'yo listen up'
            }
        },

        'move': {
            'correct': 'move',
            'function': move,
            'has_parameters': true,
            'possibilities': {
                0: 'move',
                1: 'mu',
                2: ''
            }
        },

        'rotate': {
            'correct': 'rotate',
            'function': rotate,
            'has_parameters': true,
            'possibilities': {
                0: 'rotate',
                1: 'rot',
                2: ''
            }
        },

        'go_to': {
            'correct': 'go to',
            'function': goTo,
            'has_parameters': true,
            'possibilities': {
                0: 'go to',
                1: 'show me',
                2: 'jump to'
            }
        },

        'reset': {
            'correct': 'reset',
            'function': reset,
            'has_parameters': false,
            'possibilities': {
                0: 'reset'
            }
        },

        'zoom': {
            'correct': 'zoom',
            'function': zoom,
            'has_parameters': true,
            'possibilities': {
                0: 'zoom'
            }
        },

        'filter_by': {
            'correct': 'filter by',
            'function': filterBy,
            'has_parameters': true,
            'possibilities': {
                0: 'filter by'
            }
        },

        'add_filter': {
            'correct': 'add filter',
            'function': addFilter,
            'has_parameters': false,
            'possibilities': {
                0: 'add filter',
                1: 'and filter',
                2: 'ad filter',
                3: 'at filter',
                4: 'ass filter',
                5: 'new filter'
            }
        },

        'add_preFilter': {
            'correct': 'add',
            'function': addPreFilter,
            'has_parameters': false,
            'possibilities': {
                0: 'add',
                1: 'and',
                2: 'ad',
                3: 'at',
                4: 'ass',
                5: 'plus'
            }
        },

        'start_stream': {
            'correct': 'start stream',
            'function': startStream,
            'has_parameters': false,
            'possibilities': {
                0: 'start stream',
                1: 'start'
            }
        },

        'stop_stream': {
            'correct': 'stop stream',
            'function': stopStream,
            'has_parameters': false,
            'possibilities': {
                0: 'stop stream'
            }
        }
    };

    $(document).ready(init);

}($));