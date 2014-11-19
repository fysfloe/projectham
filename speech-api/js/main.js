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
        gradient;

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
        initAnnyang();
        initAudioContext();

        appView = new projectham.AppView();

        box = $('.move');
        listening = $('#listening');
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

        console.log("audio is starting up ...");

        BUFF_SIZE = 16384;

        // get the context from the canvas to draw on
        ctx = $("#canvas").get()[0].getContext("2d");

        // create a gradient for the fill. Note the strange
        // offset, since the gradient is calculated based on
        // the canvas, not the specific element we draw
        gradient = ctx.createLinearGradient(0,0,0,300);
        gradient.addColorStop(1,'#000000');
        gradient.addColorStop(0.75,'#ff0000');
        gradient.addColorStop(0.25,'#ffff00');
        gradient.addColorStop(0,'#ffffff');

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
        microphone_stream.connect(gain_node); // comment out to disconnect output speakers
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

            // clear the current state
            ctx.clearRect(0, 0, 1000, 325);

            // set the fill style
            ctx.fillStyle=gradient;
            drawSpectrum(fft_array);
        }
    }

    function drawSpectrum(array) {
        for ( var i = 0; i < (array.length); i++ ){
            var value = array[i] * 0.8;

            ctx.fillRect(i*5,325-value,3,325);
        }
    }

    $(document).ready(init);

}($));