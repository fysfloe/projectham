$(document).ready(function () {
    init();
    animate();
});

function init(){
    var start = {w: 0, lat: -180, lng: -90};
    var target = {w: 110, lat: 180, lng: 90};

    var bar = $("#bar");
    var coord = $("#bar > span");
    var head = $("#loader > h1");
    var strokes = $("#strokes");
    var button = $("#button > button");
    var half = false;
    console.log(strokes);

    var loadingTween = new TWEEN.Tween(start).to(target, 10000);
    //loadingTween.easing( TWEEN.Easing.Elastic.InOut );
    loadingTween.interpolation(TWEEN.Interpolation.Bezier);
    loadingTween.onUpdate(function () {
        console.log(start);
        bar.width(start.w + '%');

        half && coord.text(DecimalToDMS(start.lat, start.lng));
        half = !half;
    });


    loadingTween.onComplete(function () {
        TWEEN.remove(this);

        head.css("marginTop", "-100px");

        setTimeout(function(){
            strokes.attr("class", "animate");
            bar.css("opacity", "0");

            button.click(function(){
               $("#curtain").addClass("animate");
                head.addClass("animate");
            });
        }, 100);

        setTimeout(function(){
            bar.css("opacity", "0");

        }, 150)

    });

    loadingTween.start();

}

function animate(time) {

    requestAnimationFrame( animate ); // js/RequestAnimationFrame.js needs to be included too.
    TWEEN.update(time);

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


    return latDeg + "° " + latMin + "' " + myRound(latSec, 0) + "'' " + latDir + ", " + lngDeg + "° " + lngMin + "' " + myRound(lngSec, 0) + "'' " + lngDir;


}


function myRound(zahl, n) {
    var factor;
    factor = Math.pow(10, n);
    return (Math.round(zahl * factor) / factor);
}