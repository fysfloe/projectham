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
        fullscreenButton,
        toolButton,

        app_started,

        bufferLoader = null,
        sources = [],

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
        recognition,
        onresultWhenStarted,
        onresultWhenNotStarted,
        playSound,

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
        addTrend,
        seperateView,
        endSeperateView,
        showFilter,
        hideFilter,
        fullscreen,
        exitFullscreen,
        showTools,
        hideTools,
        findFilter,
        editFilter,
        deleteFilter,
        chooseFilter;

    initRecognition = function() {
        var recognizing = false;
        var ignore_onend = true;
        var start_timestamp;
        recognition = new webkitSpeechRecognition();
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
            mic.css('opacity', 0.5);
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

        onresultWhenNotStarted();

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

    onresultWhenStarted = function() {
        recognition.onresult = function(event) {
            var final_transcript = '';
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
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            final_span.innerHTML = final_transcript;
            interim_span.innerHTML = interim_transcript;

            if(final_transcript) {  // when recognition is final
                var matched_command = matchCommand(final_transcript);

                if(matched_command) {   // a command has been found within the commands object
                    if(matched_command.has_parameters) {
                        appView.saveCommand(matched_command.correct + " " + matched_command.parameters.join(' '));
                    } else {
                        appView.saveCommand(matched_command.correct);
                    }

                    executeCommand(matched_command);
                    setMicColor('green');
                    playSound(0);
                } else {
                    appView.saveCommand(final_transcript);
                    setMicColor('red');
                    playSound(1);
                }

                final_transcript = '';
            }

            console.log('s');
        }
    };

    onresultWhenNotStarted = function() {
        recognition.onresult = function(event) {
            console.log(event);

            var final_transcript = '';
            for(var i = event.resultIndex; i < event.results.length; ++i) {
                if(event.results[i].isFinal) {
                    final_transcript = (event.results[i][0].transcript).trim();
                }
            }

            if(final_transcript) {
                if(startCommand.possibilities.indexOf(final_transcript.toLowerCase()) != -1) {
                    startCommand.function();
                    eventBus.trigger('goodToGo', true);
                }
            }
        };
    };

    function setMicColor(color) {
        mic.css('color', color);
        setTimeout(function () {
            mic.css("color", "#0084b4");
        }, 500);
    }

    executeCommand = function(command) {
        command.function(command.parameters);
    };

    matchCommand = function(command) {
        var string_array = command.split(' '),
            keyword = [],
            obj,
            parameters;

        // fill the keyword array with the different possibilities, so that it looks like this ['this', 'this is', 'this is it']
        for(var i = 0; i < maxKeyWordLength() && i < string_array.length; i++) {
            if(i == 0) keyword[i] = string_array[i];
            else keyword[i] = keyword[i-1] + " " + string_array[i];
        }

        // search for the keywords in the commands object (beginning with the longest possibility 'this is it')
        for(var j = keyword.length - 1; j >= 0; j--) {
            obj = hasCommand(keyword[j]);

            if(obj) {
                if(j < string_array.length) obj.parameters = [];
                for(var k = j+1; k < string_array.length; k++) {
                    obj.parameters.push(string_array[k]);
                }
                break;
            }
        }

        return obj;
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

    startApp = function() {
        app_started = true;
        mic.css({opacity: 1});
        console.log('app started');
        setTimeout(onresultWhenStarted, 1500);
    };

    stopApp = function() {
        bars.css({height: '0'});
        app_started = false;
        $('#final_span').html('');
        $('#interim_span').html('');
        onresultWhenNotStarted();
        mic.css({opacity: 0.5})
    };

    rotate = function(parameters) {
        var direction = parameters[0];

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
        var direction = parameters[0];

        cv.zoom(direction);
    };

    filterBy = function(parameters) {
        var filter = '';

        var possibilities = ['trend', 'trent'];

        if(possibilities.indexOf(parameters[0].toLowerCase()) != -1) {
            addTrend(parameters, true);
        } else {
            for(var i in parameters) {
                if (!parameters.hasOwnProperty(i)) continue;
                filter += parameters[i] + " ";
            }

            appView.filterInput.val(filter);
            appView.addFilterButton.trigger('click');
        }
    };

    /*addPreFilter = function() {
        if(appView.filterInput.val()) {
            appView.state == 0 ? appView.addPreFilterButton.trigger('click') : appView.addFilterButton.trigger('click');
        }
    };*/

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

    addTrend = function(parameters, filterBy) {
        var trend = parameters[1];

        trend = convertToInt(trend);

        if(trend) {
            $("table#trends tr:nth-child("+trend+") td:last-child").trigger('click');
        }
    };

    convertToInt = function(convert) {
        if(typeof convert == 'string' || convert instanceof String) {
            switch(convert) {
                case 'one':
                case '1':
                    convert = 1;
                    break;
                case 'two':
                case '2':
                case 'to':
                    convert = 2;
                    break;
                case 'three':
                case '3':
                    convert = 3;
                    break;
                case 'four':
                case '4':
                case 'for':
                    convert = 4;
                    break;
                case 'five':
                case '5':
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
                    eventBus.trigger('error', 'You didn\'t allow us to use your microphone. Why is that? Click allow at the top of the page and reload afterwards or just go on without using speech recognition.', 'reload');
                });

            var twoPi = 2 * Math.PI;
            var objectsCount = 32;
            var radius = 22;
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
        } else {
            eventBus.trigger('error', 'Your browser does not support speech recognition. Switch to <a href="https://www.google.de/chrome/browser/desktop/">Google Chrome</a> to enjoy the full experience of Project Ham or just go on without using speech recognition.');
        }

        bufferLoader = new BufferLoader(
            audioContext,
            [
                '../sounds/command_correct.wav',
                '../sounds/buzzer.wav',
            ],
            finishedLoading
        );

        bufferLoader.load();
    };

    playSound = function(i) {
        var source = audioContext.createBufferSource();
        source.buffer = sources[i];
        source.connect(audioContext.destination);
        source.start(0);
    };

    function finishedLoading(bufferList) {
        for(var i in bufferList) {
            sources[i] = bufferList[i];
        }
    }

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

    seperateView = function(parameters) {
        if(appView.state == 1) {
            if(parameters.length < 1) return;

            var filter = parameters[Object.keys(parameters)];
            var filterNo = convertToInt(filter);

            var DOM_filter;

            if(isInt(filterNo)) {
                DOM_filter = $('#filters .table-cell:nth-child('+filterNo+')');
                DOM_filter.find('.sv-options .solo').trigger('click');
            } else {
                var model = appView.filters.find(function(m) {
                    return m.get('filter').toLowerCase() == filter.toLowerCase();
                });

                if(model) {
                    DOM_filter = $('#filters .table-cell:nth-child('+(appView.filters.indexOf(model)+1)+')');
                    DOM_filter.find('.sv-options .solo').trigger('click');
                }
            }
        }
    };

    endSeperateView = function() {
        $('.end-solo').trigger('click');
    };

    hideFilter = function(parameters) {
        if(appView.state == 1) {
            if(parameters.length < 1) return;

            var filter = parameters[Object.keys(parameters)];
            var filterNo = convertToInt(filter);

            var DOM_filter;

            if(isInt(filterNo)) {
                DOM_filter = $('#filters .table-cell:nth-child('+filterNo+')');
                if(DOM_filter.find('figure').hasClass('visible')) {
                    DOM_filter.find('.sv-options .visibility').trigger('click');
                }
            } else {
                var model = appView.filters.find(function(m) {
                    return m.get('filter').toLowerCase() == filter.toLowerCase();
                });

                if(model) {
                    DOM_filter = $('#filters .table-cell:nth-child('+(appView.filters.indexOf(model)+1)+')');
                    if(DOM_filter.find('figure').hasClass('visible')) {
                        DOM_filter.find('.sv-options .visibility').trigger('click');
                    }
                }
            }
        }
    };

    showFilter = function(parameters) {
        if(appView.state == 1) {
            if(parameters.length < 1) return false;

            var filter = parameters[Object.keys(parameters)];
            var DOM_filter = findFilter(filter, '#filters .table-cell', true);

            if(!DOM_filter.find('figure').hasClass('visible')) {
                DOM_filter.find('.sv-options .visibility').trigger('click');
            }
        }
    };

    editFilter = function(parameters) {
        if(appView.state == 0) {
            if(parameters.length < 1) return false;

            var filter = parameters[Object.keys(parameters)];
            var DOM_filter = findFilter(filter, '#preFilterList li', true);

            if(DOM_filter) {
                DOM_filter.find('button.editbut').trigger('click');
            } else {
                return false;
            }
        }
    };

    deleteFilter = function(parameters) {
        if(appView.state == 0) {
            if(parameters.length < 1) return false;

            var filter = parameters[Object.keys(parameters)];
            var DOM_filter = findFilter(filter, '#preFilterList li', true);

            if(DOM_filter) {
                DOM_filter.find('button.delbut').trigger('click');
            } else {
                return false;
            }
        }
    };

    chooseFilter = function(parameters) {
        if(parameters.length < 1) return false;

        var filter = parameters[Object.keys(parameters)];
        var DOM_filter = findFilter(filter, '#running-filters li', false);

        if(DOM_filter) {
            console.log(DOM_filter);

            DOM_filter.trigger('click');
        } else {
            return false;
        }
    };

    findFilter = function(filter, selector, inCollection) {
        var filterNo,
            DOM_filter;

        filterNo = convertToInt(filter);

        if(isInt(filterNo)) {
            DOM_filter = $(selector+':nth-child('+filterNo+')');
        } else {
            if(inCollection) {
                var model = appView.filters.find(function(m) {
                    return m.get('filter').toLowerCase() == filter.toLowerCase();
                });

                if(model) {
                    DOM_filter = $(selector+':nth-child('+(appView.filters.indexOf(model)+1)+')');
                }
            } else {
                DOM_filter = $(selector+':nth-child('+(appView.allFilters.indexOf(filter.toLowerCase())+1)+')');
            }
        }

        return DOM_filter;
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

        document.addEventListener( 'keydown', function( ev ) {
            var keyCode = ev.keyCode || ev.which;
            if(keyCode === 32 && !app_started && !appView.filterInput.is(":focus")) {
                startApp();
            }
        } );

        document.addEventListener( 'keyup', function( ev ) {
            var keyCode = ev.keyCode || ev.which;
            if(keyCode === 32 && app_started && !appView.filterInput.is(":focus")) {
                stopApp();
            }
        } );

        fullscreenButton = $('#fullscreen');
        toolButton = $('#tools');

        //------- benni starts here --------
        gv = new projectham.GlobeView();
        cv = new projectham.ControlView({el: $('#filter-box')});

        var renderContainer = '#globe';

        THREE.DefaultLoadingManager.onProgress = function (item, loaded, total) {
            eventBus.trigger("loading", loaded);
            if(loaded == 4){
                toolButton.trigger('click');
            }
        };

        $(renderContainer).prepend(gv.render({
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

    fullscreen = function() {
        if(appView.fullscreenState == 0) {
            fullscreenButton.trigger('click');
        }
    };

    exitFullscreen = function() {
        if(appView.fullscreenState == 1) {
            fullscreenButton.trigger('click');
        }
    };

    showTools = function() {
        if(appView.sidebarState == 1) {
            toolButton.trigger('click');
        }
    };

    hideTools = function() {
        if(appView.sidebarState == 0) {
            toolButton.trigger('click');
        }
    };

    function maxKeyWordLength() {
        var curNum = 0,
            num = 0;

        for(var i in commands) {
            if (!commands.hasOwnProperty(i)) continue;
            for(var j in commands[i]) {
                if (!commands[i].hasOwnProperty(j)) continue;

                for(var k in commands[i].possibilities) {
                    if (!commands[i].possibilities.hasOwnProperty(k)) continue;

                    curNum = commands[i].possibilities[k].split(' ').length;

                    if(curNum > num) {
                        num = curNum;
                    }
                }

            }
        }

        return num;
    }

    /*
    command_sort = [
        {
            'reference': 'start_app',
            'possibility': 'ok ham'
        }
    ];
    */

    /**
     * Created by floe on 09.01.15.
     */
    var startCommand = {
        'correct': 'app started',
        'function': startApp,
        'has_parameters': false,
        'possibilities': [
            'listen',
            'yeah baby give me a listen',
            'yo listen',
            'yo listen up',
            'hate weezy',
            'hey sweetie',
            'hate wheatley',
            'hate we',
            'hate we be',
            'hate week',
            'hey crazy'
        ]
    };

    var commands = {
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

        'rotate': {
            'correct': 'rotate',
            'function': rotate,
            'has_parameters': true,
            'possibilities': [
                'rotate',
                'rot'
            ]
        },

        'go_to': {
            'correct': 'go to',
            'function': goTo,
            'has_parameters': true,
            'possibilities': [
                'go to',
                'show me',
                'jump to'
            ]
        },

        'reset': {
            'correct': 'reset',
            'function': reset,
            'has_parameters': false,
            'possibilities': [
                'reset'
            ]
        },

        'zoom': {
            'correct': 'zoom',
            'function': zoom,
            'has_parameters': true,
            'possibilities': [
                'zoom'
            ]
        },

        'filter_by': {
            'correct': 'filter by',
            'function': filterBy,
            'has_parameters': true,
            'possibilities': [
                'filter by'
            ]
        },

        'add_filter': {
            'correct': 'add filter',
            'function': addFilter,
            'has_parameters': false,
            'possibilities': [
                'add filter',
                'and filter',
                'ad filter',
                'at filter',
                'ass filter',
                'new filter'
            ]
        },

        'add_trend': {
            'correct': 'add trend',
            'function': addTrend,
            'has_parameters': true,
            'possibilities': [
                'add trend',
                'at trend',
                'add trent',
                'at trent',
                'add friend',
                'at friend',
                'add friends',
                'at friends',
                'add trends',
                'at trends'
            ]
        },

        /*'add_preFilter': {
            'correct': 'add',
            'function': addPreFilter,
            'has_parameters': false,
            'possibilities': [
                'add',
                'and',
                'ad',
                'at',
                'ass',
                'plus'
            ]
        },*/

        'start_stream': {
            'correct': 'start stream',
            'function': startStream,
            'has_parameters': false,
            'possibilities': [
                'start stream',
                'startstream'
            ]
        },

        'stop_stream': {
            'correct': 'stop stream',
            'function': stopStream,
            'has_parameters': false,
            'possibilities': [
                'stop stream',
                'stopstream'
            ]
        },

        'stop_listening': {
            'correct': 'stop listening',
            'function': stopApp,
            'has_parameters': false,
            'possibilities': [
                'stop listening'
            ]
        },

        'solo': {
            'correct': 'solo',
            'function': seperateView,
            'has_parameters': true,
            'possibilities': [
                'solo',
                'solo filter',
                'solo number',
                'solo view',
                'show only',
                'show only filter',
                'show only filter number'
            ]
        },

        'end_solo': {
            'correct': 'end solo',
            'function': endSeperateView,
            'has_parameters': true,
            'possibilities': [
                'end solo',
                'and solo',
                'quit solo',
                'show all'
            ]
        },

        'hide': {
            'correct': 'hide',
            'function': hideFilter,
            'has_parameters': true,
            'possibilities': [
                'hide',
                'hide filter',
                'hide filter number',
                'hide number'
            ]
        },

        'show': {
            'correct': 'show',
            'function': showFilter,
            'has_parameters': true,
            'possibilities': [
                'show',
                'show filter',
                'show filter number',
                'show number'
            ]
        },

        'fullscreen': {
            'correct': 'fullscreen',
            'function': fullscreen,
            'has_parameters': false,
            'possibilities': [
                'fullscreen',
                'full screen',
                'go fullscreen',
                'go full screen',
                'start fullscreen',
                'start full screen'
            ]
        },

        'exit_fullscreen': {
            'correct': 'exit fullscreen',
            'function': exitFullscreen,
            'has_parameters': false,
            'possibilities': [
                'exit fullscreen',
                'exit full screen',
                'stop fullscreen',
                'stop full screen',
                'end fullscreen',
                'end full screen'
            ]
        },

        'hide_tools': {
            'correct': 'hide tools',
            'function': hideTools,
            'has_parameters': false,
            'possibilities': [
                'hide tools',
                'hyde tools',
                'height tools'
            ]
        },

        'show_tools': {
            'correct': 'show tools',
            'function': showTools,
            'has_parameters': false,
            'possibilities': [
                'show tools',
                'show tunes'
            ]
        },

        'edit_filter': {
            'correct': 'edit filter',
            'function': editFilter,
            'has_parameters': true,
            'possibilities': [
                'edit filter'
            ]
        },

        'delete_filter': {
            'correct': 'delete filter',
            'function': deleteFilter,
            'has_parameters': true,
            'possibilities': [
                'delete filter',
                'remove filter'
            ]
        },

        'choose_filter': {
            'correct': 'choose filter',
            'function': chooseFilter,
            'has_parameters': true,
            'possibilities': [
                'choose filter',
                'use filter',
                'choose',
                'use'
            ]
        }
    };

    $(document).ready(init);

}($));