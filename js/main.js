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
        //var cur_array = new Array(final_array.length);
        var accuracy = 8;

        var speed = 250,
            easing = mina.easeinout;

        var p1 = "M298.653,77.488c-122.247,0-221.347,99.101-221.347,221.347c0,122.247,99.1,221.347,221.347,221.347C420.9,520.182,520,421.082,520,298.835C520,176.589,420.9,77.488,298.653,77.488zM298.653,515c-32.104,0-61.167-112.92-82.206-133.959c-21.039-21.038-34.051-50.103-34.051-82.207c0-31.937,12.878-60.866,33.725-81.877c21.063-21.231,50.263-34.379,82.533-34.379c32.363,0,61.636,13.223,82.713,34.561c20.74,20.997,33.544,49.851,33.544,81.696c0,32.312-13.182,61.544-34.46,82.615C359.445,402.248,330.549,515,298.653,515z";
        var p2 = "M142.137,142.319c-86.442,86.442-86.441,226.591,0,313.033s226.589,86.441,313.031-0.001s86.441-226.59,0-313.032S228.579,55.877,142.137,142.319z M451.504,451.687c-22.701,22.7-123.098-36.595-152.851-36.595c-29.753,0-59.506-11.35-82.207-34.051c-22.583-22.583-33.932-52.145-34.049-81.743c-0.119-29.907,11.23-59.851,34.049-82.669c22.885-22.884,52.934-34.233,82.926-34.049c29.513,0.182,58.97,11.531,81.488,34.048c22.848,22.848,34.197,52.84,34.049,82.785C414.764,328.973,474.059,429.133,451.504,451.687z";
        var p3 = "M77.305,298.834c0,122.248,99.102,221.347,221.348,221.347c122.248,0,221.347-99.1,221.345-221.346c0-122.248-99.1-221.347-221.346-221.347C176.406,77.488,77.305,176.587,77.305,298.834zM514.816,298.835c0,32.104-112.92,61.167-133.957,82.206c-21.039,21.039-50.104,34.052-82.208,34.052c-31.937-0.001-60.865-12.879-81.878-33.726c-21.23-21.062-34.379-50.262-34.379-82.532c0-32.363,13.223-61.636,34.561-82.714c20.998-20.74,49.852-33.545,81.697-33.545c32.312,0,61.544,13.182,82.613,34.461C402.066,238.043,514.818,266.938,514.816,298.835z";
        var p4 = "M142.135,455.352c86.442,86.441,226.591,86.439,313.033-0.001c86.441-86.442,86.441-226.59,0-313.03c-86.443-86.442-226.591-86.442-313.032-0.001C55.695,228.761,55.694,368.909,142.135,455.352z M451.504,145.984c22.701,22.701-36.596,123.098-36.594,152.85c0,29.753-11.352,59.507-34.051,82.208c-22.584,22.583-52.146,33.932-81.745,34.049c-29.905,0.118-59.851-11.231-82.669-34.05c-22.884-22.884-34.232-52.932-34.049-82.925c0.182-29.513,11.53-58.97,34.049-81.488c22.848-22.848,52.84-34.198,82.783-34.048C328.791,182.724,428.951,123.429,451.504,145.984z";
        var p5 = "M298.652,520.184c122.247-0.001,221.346-99.103,221.346-221.348c0-122.248-99.1-221.347-221.345-221.346C176.405,77.49,77.305,176.59,77.305,298.835C77.305,421.082,176.405,520.183,298.652,520.184z M298.653,82.671c32.105,0,61.166,112.92,82.207,133.957c21.039,21.039,34.051,50.105,34.051,82.207c0,31.938-12.879,60.866-33.727,81.878c-21.062,21.23-50.262,34.379-82.532,34.38c-32.362,0-61.634-13.223-82.713-34.561c-20.74-20.998-33.544-49.851-33.545-81.697c0-32.312,13.183-61.545,34.461-82.612C237.861,195.421,266.756,82.669,298.653,82.671z";
        var p6 = "M455.17,455.353c86.439-86.442,86.438-226.591-0.002-313.032c-86.443-86.442-226.591-86.442-313.031,0c-86.441,86.443-86.441,226.591-0.001,313.032C228.578,541.793,368.727,541.793,455.17,455.353z M145.801,145.984c22.702-22.702,123.098,36.596,152.852,36.593c29.753,0,59.507,11.352,82.207,34.052c22.584,22.584,33.932,52.146,34.047,81.745c0.119,29.906-11.23,59.849-34.047,82.668c-22.885,22.884-52.932,34.232-82.925,34.05c-29.514-0.183-58.969-11.531-81.488-34.049c-22.848-22.848-34.197-52.842-34.049-82.784C182.542,268.696,123.247,168.537,145.801,145.984z";
        var p7 = "M520.002,298.835C520,176.589,420.898,77.49,298.653,77.489C176.405,77.49,77.305,176.59,77.307,298.835c0,122.247,99.101,221.347,221.346,221.347C420.898,520.183,520,421.082,520.002,298.835z M82.489,298.835c0-32.105,112.92-61.166,133.957-82.208c21.039-21.039,50.105-34.051,82.207-34.051c31.939,0,60.865,12.879,81.876,33.728c21.23,21.063,34.379,50.261,34.381,82.53c0,32.363-13.223,61.634-34.561,82.714c-20.998,20.74-49.85,33.544-81.697,33.545c-32.311,0-61.545-13.184-82.613-34.461C195.239,359.627,82.487,330.73,82.489,298.835z";
        var p8 = "M455.17,142.317c-86.443-86.44-226.591-86.438-313.033,0.002c-86.441,86.443-86.441,226.591,0,313.03c86.441,86.441,226.591,86.441,313.031,0.002C541.609,368.91,541.609,228.76,455.17,142.317z M145.801,451.686c-22.701-22.701,36.596-123.096,36.593-152.851c0.001-29.753,11.353-59.508,34.052-82.207c22.584-22.584,52.146-33.931,81.744-34.046c29.906-0.118,59.849,11.23,82.669,34.047c22.885,22.884,34.23,52.932,34.049,82.925c-0.182,29.514-11.529,58.968-34.049,81.488c-22.848,22.847-52.84,34.197-82.783,34.05C268.514,414.946,168.354,474.24,145.801,451.686z";

        /*[].slice.call ( document.querySelectorAll( '#mic' ) ).forEach( function( el ) {
            var s = Snap( el.querySelector( 'svg' ) ), path = s.select( 'path#it' ),
                pathConfig = {
                    from : path.attr( 'd' ),
                    to : p1
                };

            el.addEventListener( 'mouseenter', function() {
                path.animate( { 'path' : pathConfig.to }, speed, easing );
            } );

            el.addEventListener( 'mouseleave', function() {
                path.animate( { 'path' : pathConfig.from }, speed, easing );
            } );
        } );*/

        var s = Snap( '#mic' ),
            path = s.select('path#it'),
            to;

        for ( var i = 0; i < (array.length); i++ ){
            //var value = array[i] / 6 > 12 ? array[i] / 6 : 0;

            if(i % accuracy == 0 && array[i] > 3) {
                if (i < (array.length * 0.125)) {
                    to = p1;
                } else if (i < (array.length * 0.25)) {
                    to = p2;
                } else if (i < (array.length * 0.375)) {
                    to = p3;
                } else if (i < (array.length * 0.5)) {
                    to = p4;
                } else if (i < (array.length * 0.625)) {
                    to = p5;
                } else if (i < (array.length * 0.75)) {
                    to = p6;
                } else if (i < (array.length * 0.875)) {
                    to = p7;
                } else if (i < (array.length)) {
                    to = p8;
                }
            }
        }

        path.animate({ 'path': to }, speed);

        //redrawSVG();
    }

    $(document).ready(init);

}($));