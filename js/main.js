/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.module = (function($) {

    var box,
        listening,
        appView,
        speechRecognition,
        audioContext,
        BUFF_SIZE,
        audioInput = null,
        microphone_stream = null,
        gain_node = null,
        script_processor_node = null,
        script_processor_fft_node = null,
        analyserNode = null,
        ctx,
        gradient,
        audioviz,
        initialPoints,
        final_array,
        stopMic,
        startMic;

    var listen,
        movebox,
        init,
        initAnnyang,
        initAudioContext,
        start,
        result,
        resultMatch,
        resultNoMatch;

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

        appView.saveCommand('Move ' + direction + ' ' + value);
    };

    init = function() {
        console.log('foo');


        //initAnnyang();
        initAudioContext();
        stopMic = $('#stopmic');
        stopMic.on('click', stop_microphone);

        startMic = $('#startmic');
        startMic.on('click', initAudioContext);

        appView = new projectham.AppView();

        box = $('.move');
        listening = $('#listening');
        var points = audioviz.attr("points");
        final_array = getPointsArray(points);
        for(var i = 0; i < final_array.length; i++) {
            final_array[i] = final_array[i].split(",");
        }
        console.log(final_array);
    };

    initAnnyang = function() {
        if (annyang) {
            // Let's define a command.
            var commands = {
                'ok ham': listen
            };

            // Add our commands to annyang
            annyang.addCommands(commands);

            // Start listening.
            annyang.start();

            console.log(annyang);
        }

        annyang.addCallback('start', start);
        annyang.addCallback('result', result);
        annyang.addCallback('resultMatch', resultMatch);
        annyang.addCallback('resultNoMatch', resultNoMatch);

        annyang.debug(true);

        function start() {
            $('#annyang-message').text('Annyang started!');
            $('#current-message').text('Listening');
            console.log(event);
        }

        function result() {
            //console.log(event.results.item(0));
            $('#annyang-message').text('You spoke!');
            $('#current-message').text('Updating data');
        }

        function resultMatch() {
            $('#annyang-message').text('You said something cool!');
            //$('#current-message').text('Finished updating');
        }

        function resultNoMatch() {
            $('#annyang-message').text('You said something not so cool...');
            //$('#current-message').text('Finished updating');
        }
    };

    initAudioContext = function() {
        audioContext = new AudioContext();
        audioviz = $("#audioviz");
        initialPoints = audioviz.attr("points");

        console.log("audio is starting up ...");

        BUFF_SIZE = 16384;

        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;

        if (navigator.getUserMedia){

            navigator.getUserMedia({audio:true},
                function(stream) {
                    start_microphone(stream);
                },
                function(e) {
                    alert('Error capturing audio.');
                }
            );

        } else { alert('getUserMedia not supported in this browser.'); };
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

            drawSpectrum(fft_array);
        }
    }

    function stop_microphone() {
        script_processor_fft_node.onaudioprocess = function() {}
    }

    function getPointsArray(string) {
        var array = string.split(" ");
        /*for(var j = 0; j < array.length; j++) {
            array[j] = array[j].split(",");
        }*/

        return array;
    }

    function getPointsString(array) {
        for(var k = 0; k < array.length; k++) {
            array[k] = array[k] ? array[k].toString() : "";
        }

        return array.join(" ");
    }

    function redrawSVG() {
        audioviz.attr("points", initialPoints);
    }

    function drawSpectrum(array) {
        var cur_array = new Array(final_array.length);
        var accuracy = 7;

        for ( var i = 0; i < (cur_array.length); i++ ){
            var value = array[i] / 6 > 12 ? array[i] / 6 : 0;

            if(i % accuracy == 0) {
                if (final_array[i * accuracy]) {
                    cur_array[i] = new Array(2);

                    if (i < (cur_array.length * 0.25 / accuracy)) {
                        cur_array[i][0] = Number(final_array[i * accuracy][0]) - value;
                        cur_array[i][1] = Number(final_array[i * accuracy][1]) + value;
                    } else if (i < (cur_array.length * 0.5 / accuracy )) {
                        cur_array[i][0] = Number(final_array[i * accuracy][0]) - value;
                        cur_array[i][1] = Number(final_array[i * accuracy][1]) - value;
                    } else if (i < (cur_array.length * 0.75 / accuracy )) {
                        cur_array[i][0] = Number(final_array[i * accuracy][0]) + value;
                        cur_array[i][1] = Number(final_array[i * accuracy][1]) - value;
                    } else if (i < (cur_array.length / accuracy)) {
                        cur_array[i][0] = Number(final_array[i * accuracy][0]) + value;
                        cur_array[i][1] = Number(final_array[i * accuracy][1]) + value;
                    }

                }
            }
        }

        audioviz.attr("points", getPointsString(cur_array));


        //redrawSVG();
    }

    $(document).ready(init);

}($));