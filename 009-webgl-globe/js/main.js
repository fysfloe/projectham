$(function () {
    var gv = new dataGlobe.GlobeView();
    var cv = new dataGlobe.ControlView({el: $('#controls')});

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
    $.get('data2.csv', function(data){
        gv.displayData(data);
        setTimeout(function(){
            cv.zoom("In");
            cv.goToPlace("Hagenberg")
        }, 3000);
     });



});