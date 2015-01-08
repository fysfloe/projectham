/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.module = (function($) {
    var bars,
        appView,
        audioContext,
        BUFF_SIZE,
        microphone_stream = null,
        gain_node = null,
        script_processor_node = null,
        script_processor_fft_node = null,
        analyserNode = null,
        ignore_onend,
        restart,
        mic,
        final_transcript,

        commands,
        app_started,

        // benni starts here
        gv,
        cv;

    var init,
        initAudioContext,
        initRecognition,
        matchCommand,
        executeCommand,
        showAlternativeInfo,
        toggleAudioFunc,
        stopApp,
        convertToInt,
        isInt,

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
        stopStream,
        addTrend;

    initRecognition = function() {
        final_transcript = '';
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
                final_span.innerHTML = final_transcript;
                interim_span.innerHTML = interim_transcript;
            }

            if(final_transcript) {
                var matched_command = matchCommand(final_transcript);

                if(matched_command) {
                    if(matched_command.string_array) {
                        var combined_command = matched_command.correct + " ";
                        for(var k = matched_command.num_keywords; k < matched_command.string_array.length; k++) {
                            if (!matched_command.string_array.hasOwnProperty(k)) continue;

                            combined_command += matched_command.string_array[k] + " ";
                        }

                        if(app_started) appView.saveCommand(combined_command);

                    } else {
                        if(app_started) appView.saveCommand(matched_command.correct);
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

                    mic.css("color", "green");

                    setTimeout(function () {
                        mic.css("color", "#0084b4");
                    }, 500);
                } else {
                    if(app_started) appView.saveCommand(final_transcript);

                    mic.css("color", "darkred");

                    setTimeout(function () {
                        mic.css("color", "#0084b4");
                    }, 500);
                }

                interim_span.innerHTML = '';

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
        mic.css({opacity: 1});
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

        console.log('foo');

        //gv.initFilters()
    };

    stopStream = function() {
        if(appView.state == 1) {
            appView.stopStream();
        }
    };

    addTrend = function(parameters) {
        var trend = parameters[2];

        trend = convertToInt(trend);

        console.log(trend);

        if(trend) {
            $("table#trends tr:nth-child("+trend+") td:last-child").trigger('click');
        }
    };

    convertToInt = function(convert) {
        if(typeof convert == 'string' || convert instanceof String) {
            console.log('string');

            switch(convert) {
                case 'one':
                    convert = 1;
                    break;
                case 'two':
                case 'to':
                    convert = 2;
                    break;
                case 'three':
                    convert = 3;
                    break;
                case 'four':
                case 'for':
                    convert = 4;
                    break;
                case 'five':
                    convert = 5;
                    break;
                default:
                    break;
            }
        }

        convert = parseInt(convert);

        if(isInt(convert)) {
            return convert;
        }

        return false;
    };

    isInt = function(value) {
        return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
    };

    addFilter = function() {
        $(".add-filter").trigger('click');
    };

    showAlternativeInfo = function() {
        var chrome = $("#chrome");
        var not_chrome = $("#not-chrome");
        chrome.css({
            opacity: 0.15
        });

        not_chrome.show();
    };

    initAudioContext = function() {
        audioContext = new AudioContext();
        console.log("audio is starting up ...");
        BUFF_SIZE = 16384;
        if (!navigator.getUserMedia) navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia(
                {audio: true},
                function (stream) {
                    start_microphone(stream);
                }, function (e) {
                    alert('Error capturing audio.');
                });
        } else {
            alert('getUserMedia not supported in this browser.');
        }

        var twoPi = 2 * Math.PI;
        var objectsCount = 32;
        var radius = 25;
        var j = 0;
        for (var k = 0; k < objectsCount; k++) {
            $("#bars").append("<div class='bar'></div>");
        }

        bars = $(".bar");
        var change = twoPi / objectsCount;
        for (var i = -Math.PI; i < Math.PI; i += change) {
            var x = radius * Math.cos(i);
            var y = radius * Math.sin(i);

            // rotation of object in radians 
            var rotation = i;
            bars.eq(j).css({
                transform: "rotate(" + (rotation - 1.5707963267949) + "rad)",
                left: x,
                top: y
            });

            j++;
        }
    };

    function process_microphone_buffer(event) {  // PCM audio data in time domain
        var i, N, inp, microphone_output_buffer;

        microphone_output_buffer = event.inputBuffer.getChannelData(0); // just mono - 1 channel for now
    }

    function start_microphone(stream){
        gain_node = audioContext.createGain();
        gain_node.connect( audioContext.destination );

        microphone_stream = audioContext.createMediaStreamSource(stream);
        //microphone_stream.connect(gain_node); // comment out to disconnect output speakers
        // ... everything else will work OK this
        // eliminates possibility of feedback squealing
        // or leave it in and turn down the volume

        script_processor_node = audioContext.createScriptProcessor(BUFF_SIZE, 1, 1);
        script_processor_node.onaudioprocess = process_microphone_buffer; // callback

        microphone_stream.connect(script_processor_node);

        // --- setup FFT

        script_processor_fft_node = audioContext.createScriptProcessor(2048, 1, 1);
        script_processor_fft_node.connect(gain_node);

        analyserNode = audioContext.createAnalyser();
        analyserNode.smoothingTimeConstant = 0;
        analyserNode.fftSize = 2048;

        microphone_stream.connect(analyserNode);

        analyserNode.connect(script_processor_fft_node);

        script_processor_fft_node.onaudioprocess = function() { // FFT in frequency domain
            // get the average for the first channel
            var fft_array = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(fft_array);

            if(app_started) drawSpectrum(fft_array);
        }
    }

    function stop_microphone() {
        script_processor_fft_node.onaudioprocess = function() {}
    }

    function drawSpectrum(array) {
        var bars = $(".bar");
        for(var i = 0; i < (array.length / 2); i++) {
            var value = array[i] / 4 > 8 ? array[i] / 4 : 0;

            if(i < 16) bars.eq(0).css({height: value+"px"});
            else if(i < 32) bars.eq(1).css({height: value+"px"});
            else if(i < 48) bars.eq(2).css({height: value+"px"});
            else if(i < 64) bars.eq(3).css({height: value+"px"});
            else if(i < 80) bars.eq(4).css({height: value+"px"});
            else if(i < 96) bars.eq(5).css({height: value+"px"});
            else if(i < 112) bars.eq(6).css({height: value+"px"});
            else if(i < 128) bars.eq(7).css({height: value+"px"});
            else if(i < 144) bars.eq(8).css({height: value+"px"});
            else if(i < 160) bars.eq(9).css({height: value+"px"});
            else if(i < 186) bars.eq(10).css({height: value+"px"});
            else if(i < 192) bars.eq(11).css({height: value+"px"});
            else if(i < 208) bars.eq(12).css({height: value+"px"});
            else if(i < 224) bars.eq(13).css({height: value+"px"});
            else if(i < 240) bars.eq(14).css({height: value+"px"});
            else if(i < 256) bars.eq(15).css({height: value+"px"});
            else if(i < 272) bars.eq(16).css({height: value+"px"});
            else if(i < 288) bars.eq(17).css({height: value+"px"});
            else if(i < 304) bars.eq(18).css({height: value+"px"});
            else if(i < 320) bars.eq(19).css({height: value+"px"});
            else if(i < 336) bars.eq(20).css({height: value+"px"});
            else if(i < 352) bars.eq(21).css({height: value+"px"});
            else if(i < 368) bars.eq(22).css({height: value+"px"});
            else if(i < 384) bars.eq(23).css({height: value+"px"});
            else if(i < 400) bars.eq(24).css({height: value+"px"});
            else if(i < 416) bars.eq(25).css({height: value+"px"});
            else if(i < 432) bars.eq(26).css({height: value+"px"});
            else if(i < 448) bars.eq(27).css({height: value+"px"});
            else if(i < 466) bars.eq(28).css({height: value+"px"});
            else if(i < 480) bars.eq(29).css({height: value+"px"});
            else if(i < 496) bars.eq(30).css({height: value+"px"});
            else if(i < 512) bars.eq(31).css({height: value+"px"});
        }
    }

    toggleAudioFunc = function() {
        if(app_started) {
            stopApp();
        } else {
            startApp();
        }
    };

    stopApp = function() {
        bars.css({height: '0'});
        app_started = false;
        $('#final_span').html('');
        $('#interim_span').html('');
        mic.css({opacity: 0.5})
    };

    init = function() {
        restart = true;

        appView = new projectham.AppView();

        console.log(appView);

        if(/chrome/.test(navigator.userAgent.toLowerCase())) {
            initRecognition();
            initAudioContext();
            mic = $("#mic");
            mic.on('click', toggleAudioFunc);
        } else {
            showAlternativeInfo();
        }

        //------- benni starts here --------
        gv = new projectham.GlobeView();
        cv = new projectham.ControlView({el: $('#filter-box')});

        var renderContainer = '#globe';

        THREE.DefaultLoadingManager.onProgress = function (item, loaded, total) {
            console.log(item, loaded, total);
        };

        $(renderContainer).append(gv.render({
            width: $('#globe').innerWidth(),
            height: $('#globe').innerHeight(),
            mapSrc: 'img/world_map.png',
            enableTrackball: true
        }).el);

        gv.rotateCameraCon(0.001);
        gv.startCameraRotation();
        /*$.get('Global_Routes.csv', function(data){
         gv.displayConnection(data);
         });
        $.get('data/data2.csv', function(data){
            gv.displayData(data);
        });*/


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
            'correct': 'app started',
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

        'add_trend': {
            'correct': 'add trend',
            'function': addTrend,
            'has_parameters': true,
            'possibilities': {
                0: 'add trend',
                1: 'at trend',
                2: 'add trent',
                3: 'at trent',
                4: 'add friend',
                5: 'at friend',
                6: 'add friends',
                7: 'at friends',
                8: 'add trends',
                9: 'at trends'
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
                1: 'start',
                2: 'startstream'
            }
        },

        'stop_stream': {
            'correct': 'stop stream',
            'function': stopStream,
            'has_parameters': false,
            'possibilities': {
                0: 'stop stream',
                1: 'stopstream'
            }
        },

        'stop_listening': {
            'correct': 'stop listening',
            'function': stopApp,
            'has_parameters': false,
            'possibilities': {
                0: 'stop listening'
            }
        }
    };

    $(document).ready(init);

}($));