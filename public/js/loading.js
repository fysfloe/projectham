$(document).ready(function () {
    init();
    animate();
});
var loadingTween, bar, half = false;
var coord = $("#bar > span");

function init() {
    var start = {lat: -180, lng: -90};
    var targets = {lat: 180, lng: 90};
    var target = targets[3];
    bar = $("#bar");
    var head = $("#loader > h1");
    var strokes = $("#strokes");
    var button = $("#button > button");
    var p = $('#loader > p');


    loadingTween = new TWEEN.Tween(start).to(target, 1500);
    //loadingTween.easing( TWEEN.Easing.Elastic.InOut );
    loadingTween.interpolation(TWEEN.Interpolation.Bezier);
    loadingTween.onUpdate(function () {


        half = !half;
    });

    eventBus.on("loading", function (loaded) {
        if (loaded == 1) {
            bar.width(loaded * 25 + "%");
        } else if (loaded == 4) {
            bar.width(110 + "%");
            setTimeout(function () {
                head.css("marginTop", "-140px");

                setTimeout(function () {
                    strokes.attr("class", "animate");
                    bar.css("opacity", "0");

                    button.click(function () {
                        $("#curtain").addClass("animate");
                        head.addClass("animate");
                        $("header > h1").addClass("show");
                        setTimeout(function(){
                            $("#loader").fadeOut();
                        }, 1500);

                        p.hide();
                    });

                    p.css('opacity', 1);
                }, 100);

                setTimeout(function () {
                    bar.css("opacity", "0");

                }, 150)
            }, 1500);

        } else {
            bar.width(loaded * 25 + "%")
        }


    });
}

function animate(time) {

    requestAnimationFrame(animate); // js/RequestAnimationFrame.js needs to be included too.
    var percentage = bar.width() / $(window).width();
    if (percentage <= 1) {
        half && coord.text(DecimalToDMS(((-180 + 360 * percentage) <= 175 ? (-180 + 360 * percentage) : 180), ((-90 + 180 * percentage) <= 85 ? (-90 + 180 * percentage) : 90)));
        half = !half;
    }


}
function DecimalToDMS(lat, lng) {
    lat = lat.toString().split(".");
    lng = lng.toString().split(".");

    var latDeg = lat[0],
        latMin = 0,
        latSec = 0,
        latDir = 'X',
        lngDeg = lng[0],
        lngMin = 0,
        lngSec = 0,
        lngDir = 'X';

    if (lat[0] < 0) {
        latDir = 'S';
    } else {
        latDir = 'N';
    }

    if (lng[0] < 0) {
        lngDir = 'W';
    } else {
        lngDir = 'E';
    }

    var latD = "0." + lat[1];
    var lngD = "0." + lng[1];

    latD = parseFloat(latD) * 3600;
    lngD = parseFloat(lngD) * 3600;

    latMin = Math.floor(latD / 60);
    lngMin = Math.floor(lngD / 60);

    latSec = latD - (latMin * 60);
    lngSec = lngD - (lngMin * 60);

    return latDeg + "° " + latMin + "' " + myRound(latSec, 2) + "'' " + latDir + ", " + lngDeg + "° " + lngMin + "' " + myRound(lngSec, 2) + "'' " + lngDir;
}


function myRound(zahl, n) {
    var factor;
    factor = Math.pow(10, n);
    return (Math.round(zahl * factor) / factor);
}