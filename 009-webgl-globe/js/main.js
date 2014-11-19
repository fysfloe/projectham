$(function(){
    var gv = new dataGlobe.GlobeView();

    var renderContainer = 'body';

    THREE.DefaultLoadingManager.onProgress = function ( item, loaded, total ) {
        console.log( item, loaded, total );
    };

    $(renderContainer).append(gv.render({
        width: window.innerWidth,
        height: window.innerHeight,
        mapSrc: 'img/water_4k_inv.png',
        enableTrackball: true
    }).el);
    $.get('data3.csv', function(data){
        gv.displayLineData(data);
    });
   /* $.get('data2.csv', function(data){
        gv.displayData(data);
    });*/

});