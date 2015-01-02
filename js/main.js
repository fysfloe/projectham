/**
 * Created by floe on 15.10.14.
 */

var projectham = projectham || {};

projectham.module = (function($) {

    var appView,
        audioContext,
        BUFF_SIZE,
        audioInput = null,
        microphone_stream = null,
        gain_node = null,
        script_processor_node = null,
        script_processor_fft_node = null,
        analyserNode = null;

    var init,
        bars,
        initAudioContext;


    init = function() {
        initAudioContext();

        appView = new projectham.AppView();
    };

    initAudioContext = function() {
        audioContext = new AudioContext();
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


        var twoPi = 2*Math.PI;
        var objectsCount = 32;
        var radius = 50;
        var j = 0;

        for(var k = 0; k < objectsCount; k++) {
            $("#bars").append("<div class='bar'></div>");
        }

        bars = $(".bar");

        var change = twoPi/objectsCount;
        for (var i=-Math.PI; i < Math.PI; i+=change) {
            var x = radius*Math.cos(i);
            var y = radius*Math.sin(i);
            // rotation of object in radians
            var rotation = i;

            bars.eq(j).css({
                transform: "rotate("+(rotation-1.5707963267949)+"rad)",
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

            drawSpectrum(fft_array);
        }
    }

    function drawSpectrum(array) {
        //var cur_array = new Array(final_array.length);
        var accuracy = 8;
        var bars = $(".bar");

        for ( var i = 0; i < (array.length / 2); i++ ){
            var value = array[i] / 4 > 12 ? array[i] / 4 : 0;

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

    $(document).ready(init);

}($));