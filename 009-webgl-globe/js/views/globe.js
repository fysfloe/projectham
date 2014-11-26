/**
 * Created by Benedikt Schreter on 17.11.2014.
 */
var dataGlobe = dataGlobe || {};

var eventBus = _.extend({}, Backbone.Events);

dataGlobe.GlobeView = Backbone.View.extend({

    /*
     INIT
     */
    initialize: function () {
        this.isTween = false;
        _.bindAll(this, 'render', '_updateScene', 'latLongToVector3', 'buildAxes', 'displayData');

    },


    /*
     RENDER & PROCESS DATA FUNCTIONS
     */

    render: function (options) {
        this.width = options.width || 500;
        this.height = options.height || 500;
        this.distance = options.distance || 15;
        this.mapSrc = options.mapSrc || 'img/5_night_8k.jpg';
        this.bgSrc = options.bgSrc || 'img/galaxy_starfield.png';
        this.specularMapSrc = options.specularMapSrc || 'img/water_4k.png';
        this.specularColor = options.specularColor || 'white';
        this.shininessInt = options.shininessInt || 4;
        this.total = null;

        this.manager = new THREE.LoadingManager();
        this.manager.onProgress = function (item, loaded, total) {

            console.log(item, loaded, total);

        };

        this.scene = new THREE.Scene();
        this.scene1 = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
        this.camera.position.z = this.distance;
        //this.camera.lookAt(new THREE.Vector3(10.443329520636075, 10.010497358953545, 4.0173981090580995));
        this.camera.position.set(10.443329520636075, 10.010497358953545, -4.0173981090580995);


        this.ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(this.ambientLight);

        this.spotLight = new THREE.SpotLight(0xffffff, 1.5);
        this.scene.add(this.spotLight);

        this.scene.add(new THREE.DirectionalLight(0xffffff, 1));

        this.globeMaterialFront = new THREE.MeshLambertMaterial({
            // color: 0x111111,
            map: THREE.ImageUtils.loadTexture(this.mapSrc),
            // specularMap: THREE.ImageUtils.loadTexture(this.specularMapSrc),
            // specular: new THREE.Color(this.specularColor),
            //alphaMap: THREE.ImageUtils.loadTexture('img/water_4k_inv_light_light_grey.png'),
            //shininess: 4
            transparent: false,
            opacity: 1,
            side: THREE.DoubleSide
        })

        //Initialize Globe
        this.globeFront = new THREE.Mesh(
            new THREE.SphereGeometry(5, 50, 50),
            this.globeMaterialFront
        );


        var customMaterial = new THREE.ShaderMaterial(
            {
                uniforms: {},
                vertexShader: document.getElementById('vertexShader').textContent,
                fragmentShader: document.getElementById('fragmentShader').textContent,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.1
            });

        var ballGeometry = new THREE.SphereGeometry(5.9, 32, 16);
        var ball = new THREE.Mesh(ballGeometry, customMaterial);
        this.scene.add(ball);
        this.scene.add(this.globeFront);

        //this.scene.add(this.globeBack);

        //Initialize Background ("Space")
        this.BGtexture = THREE.ImageUtils.loadTexture(this.bgSrc);
        this.BGtexture.wrapS = this.BGtexture.wrapT = THREE.RepeatWrapping;
        this.BGtexture.repeat.set(1, 1);

        this.spaceSphere = new THREE.Mesh(
            new THREE.SphereGeometry(900, 64, 64),
            new THREE.MeshBasicMaterial({
                map: this.BGtexture,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.1
            })
        );
        this.scene.add(this.spaceSphere);


        //this.scene.add(this.buildAxes(1000));


        // Fallback WebGL to Canvas Renderer
        if (window.WebGlRenderingContext || document.createElement('canvas').getContext('experimental-webgl')) {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: false
            });
        } else {
            this.renderer = new THREE.CanvasRenderer();
        }
        this.renderer.setSize(this.width, this.height);

        this.$el.html(this.renderer.domElement);

        // Enable Trackball
        this.controls = options.enableTrackball ? new THREE.TrackballControls(this.camera, this.renderer.domElement, this) : null;


        /* var renderModel = new THREE.RenderPass(this.scene, this.camera);
         var effectBloom = new THREE.BloomPass(5);
         var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
         var renderMask = new THREE.MaskPass(this.scene, this.camera);
         var renderMaskInv = new THREE.MaskPass(this.scene, this.camera);
         renderMaskInv.inverse = true
         var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);

         var width = window.innerWidth || 2;
         var height = window.innerHeight || 2;

         effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);

         effectCopy.renderToScreen = true;

         this.composer = new THREE.EffectComposer(this.renderer);

         this.composer.addPass(renderMaskInv);
         this.composer.addPass(renderModel);


         this.composer.addPass(effectFXAA);
         this.composer.addPass(effectBloom);

         this.composer.addPass(effectCopy);*/

        this._updateScene();
        this._eventHandler();


        return this;
    },

    _updateScene: function () {

        var updateScene = this._updateScene;
        requestAnimationFrame(updateScene);


        TWEEN.update();


        this.controls ? this.controls.update() : null;

        var controls = this.controls;


        this.spotLight.position.copy(this.camera.position);
        this.renderer.render(this.scene, this.camera);
        //this.composer.render();

    },

    displayData: function (data, material) {
        this.geom = new THREE.Geometry();
        var color = 0x3a7aa2;
        var blending = THREE.AdditiveBlending;
        var materials = [
            new THREE.MeshPhongMaterial({
                transparent: true,
                color: color,
                opacity: 1,
                blending: blending
                // alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube.png'),
                //side: THREE.DoubleSide
            }),
            new THREE.MeshPhongMaterial({
                transparent: true,
                color: color,
                opacity: 1,
                blending: blending,
                // alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube.png'),
                side: THREE.FrontSide
            }),
            new THREE.MeshPhongMaterial({
                transparent: true,
                color: color,
                opacity: 1,
                blending: blending,
                //alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube.png'),
                side: THREE.FrontSide
            }),
            new THREE.MeshPhongMaterial({
                transparent: true,
                color: color,
                opacity: 1,
                blending: blending,
                //alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube.png'),
                side: THREE.FrontSide
            }),
            new THREE.MeshPhongMaterial({
                transparent: true,
                color: color,
                opacity: 1,
                blending: blending,
                //alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube.png'),
                side: THREE.FrontSide
            }),
            new THREE.MeshPhongMaterial({
                transparent: true,
                color: color,
                opacity: 1,
                blending: blending,
                //alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube.png'),
                side: THREE.FrontSide
            }),
        ];
        this.data = data || null;

        var arrayData = this.CSVToArray(this.data);

        var highestValue = 0;
        arrayData.forEach(function (entry) {
            if (parseInt(entry[0]) > highestValue) {
                highestValue = entry[0];
            }
        });
        var _this = this,
            entry,
            x,
            y,
            value,
            position,
            cube;


        setTimeout((function () {
            for (var i = 0, len = arrayData.length; i < len; i++) {
                entry = arrayData[i];

                x = parseFloat(entry[1]);
                y = parseFloat(entry[2]);
                value = (parseInt(entry[0]) / highestValue < 0.1 ? 0.1 : parseInt(entry[0]) / highestValue) * 2;
                //var value = 0.2
                // calculate the position where we need to start the cube
                position = _this.latLongToVector3(x, y, value / 2);
                // create the cube
                cube = new THREE.Mesh(new THREE.BoxGeometry(.01, .01, value, 1, 1, 1));


                //cube.applyMatrix(new THREE.Matrix4().makeTranslation(0, value / 2, 0));

                // position the cube correctly
                cube.translateX(position.x);
                cube.translateY(position.y);
                cube.translateZ(position.z);

                cube.lookAt(new THREE.Vector3(0, 0, 0));


                // merge with main model
                cube.updateMatrix();
                _this.geom.merge(cube.geometry, cube.matrix);
            }

            _this.total = new THREE.Mesh(_this.geom, new THREE.MeshFaceMaterial(materials));
            console.log(_this.total);
            //this.total.scale.x = 0.1;

            // and add the total mesh to the scene
            _this.scene.add(_this.total);

        }), 0);

    },

    displayLineData: function (data) {
        this.data = data || null;

        var arrayData = this.CSVToArray(this.data);
        var geom = new THREE.Geometry();
        var geom2 = new THREE.Geometry();
        var geom3 = new THREE.Geometry();
        var lineGeom = new THREE.Geometry();


        var lineMaterial = new THREE.LineBasicMaterial({
            blending: THREE.AdditiveBlending,
            color: 0x3a7aa2,
            transparent: true,
            opacity: 0.8,
            linewidth: 1,
            alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube.png')
        });

        var lineMaterial2 = new THREE.LineBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.2,
            linewidth: 1
        });

        var lineMaterial3 = new THREE.LineBasicMaterial({
            color: 0xFF8900,
            transparent: true,
            opacity: 0.2,
            linewidth: 1
        });


        var cp = new THREE.CurvePath();

        for (var i = 0, len = 10000; i < len; i++) {
            var x = parseFloat(arrayData[i][0]);
            var y = parseFloat(arrayData[i][1]);

            var x2 = parseFloat(arrayData[i][2]);
            var y2 = parseFloat(arrayData[i][3]);

            var length = Math.sqrt(Math.pow((x - x2), 2) + Math.pow((y - y2), 2));

            if (length < 150) {

                var cPHeight = length < 25 ? length / 30 : (length < 50 ? length / 45 : length / 60);
                var x3 = (x + x2) / 2;
                var y3 = (y + y2) / 2;
                var cP1 = this.calculateCP(x, y, x3, y3);
                var cP2 = this.calculateCP(x2, y2, x3, y3);

                cP1 = this.latLongToVector3(cP1[0], cP1[1], cPHeight);
                cP2 = this.latLongToVector3(cP2[0], cP2[1], cPHeight);


                var position1 = this.latLongToVector3(x, y, -0.02);
                var position2 = this.latLongToVector3(x2, y2, -0.02);
                //var position3 = this.calculateMidPoint(x,y,x2,y2,2);


                cp.add(new THREE.CubicBezierCurve3(position1, cP1, cP2, position2));


                var lineMesh = new THREE.Mesh(curvedLine, lineMaterial);
                lineGeom.merge(lineMesh.geometry, lineMesh.matrix);

                /*var cube = new THREE.Mesh(new THREE.BoxGeometry(.01, .01, 0.2, 1, 1, 1), lineMaterial);
                 var cube2 = new THREE.Mesh(new THREE.BoxGeometry(.01, .02, 0.2, 1, 1, 1), lineMaterial2);
                 var cube3 = new THREE.Mesh(new THREE.BoxGeometry(.01, .02, 0.2, 1, 1, 1), lineMaterial3);


                 // position the cube correctly
                 cube.translateX(position1.x);
                 cube.translateY(position1.y);
                 cube.translateZ(position1.z);

                 // position the cube correctly
                 cube2.translateX(position2.x);
                 cube2.translateY(position2.y);
                 cube2.translateZ(position2.z);

                 // position the cube correctly
                 cube3.translateX(position3.x);
                 cube3.translateY(position3.y);
                 cube3.translateZ(position3.z);

                 cube.lookAt(new THREE.Vector3(0, 0, 0));
                 cube2.lookAt(new THREE.Vector3(0, 0, 0));
                 cube3.lookAt(new THREE.Vector3(0, 0, 0));


                 // merge with main model
                 cube.updateMatrix();
                 cube2.updateMatrix();
                 cube3.updateMatrix();

                 geom.merge(cube.geometry, cube.matrix);
                 geom2.merge(cube2.geometry, cube2.matrix);
                 geom3.merge(cube3.geometry, cube3.matrix);*/


            }
        }
        var curvedLine = new THREE.Line(cp.createPointsGeometry(1000000), lineMaterial);
        curvedLine.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.add(curvedLine);
        /*
         console.log(lineGeom);
         var total = new THREE.Line(lineGeom, lineMaterial, THREE.LineStrip);
         this.scene.add(curvedLine);
         var total = new THREE.Mesh(lineGeom, lineMaterial);

         var total = new THREE.Mesh(geom, lineMaterial);
         var total2 = new THREE.Mesh(geom2, lineMaterial2);
         var total3 = new THREE.Mesh(geom3, lineMaterial3);

         this.scene.add(total2);
         this.scene.add(total3);

         this.scene.add(total);*/
    },


    /*
     EVENT BUS HANDLER
     */

    _eventHandler: function () {
        var _this = this;

        eventBus.on("reset", function () {

            var reset = {x: 10.443329520636075, y: 10.010497358953545, z: -4.0173981090580995, _x: 0, _y: 1, _z: 0};
            _this._rotateToPlace(reset);
            _this.startCameraRotation();

        });

        eventBus.on("rotate", function (dir) {
            _this.rotateCameraAtValue(dir);
        });

        eventBus.on("goTo", function (value) {
            _this.pauseCameraRotation();
            _this._getLatLngFromPlaceName(value);
        });

        eventBus.on("zoom", function (dir) {
            _this.controls.zoom(dir, 0.03);
        });
    },


    /*
     EVENT PROCESSING METHODS
     */

    _getLatLngFromPlaceName: function (name) {
        var _this = this,
            zoomlevel = 4,
            target;
        var reqUrl = "http://api.geonames.org/searchJSON?formatted=true&q=" + encodeURIComponent(name) + "&maxRows=1&lang=en&username=project_ham&style=full";
        console.log(name);
        $.getJSON(reqUrl, function (data) {
            if (data.totalResultsCount) {
                var pV = _this.latLongToVector3(data.geonames[0].lat, data.geonames[0].lng, zoomlevel);
                target = {x: pV.x, y: pV.y, z: pV.z, _x: 0, _y: 1, _z: 0};
                _this._rotateToPlace(target);
            } else {
                alert("404: Not Found :(");
            }

        });
    },

    _rotateToPlace: function (target) {
        var _this = this;

        this.isTween = true;
        var position = {
            x: parseFloat(this.camera.position.x),
            y: parseFloat(this.camera.position.y),
            z: parseFloat(this.camera.position.z),
            _x: parseFloat(this.camera.up.x),
            _y: parseFloat(this.camera.up.y),
            _z: parseFloat(this.camera.up.z)
        };
        var tween = new TWEEN.Tween(position).to(target, 1500);


        tween.onUpdate(function () {
            _this.camera.position.set(position.x, position.y, position.z);
            _this.camera.up.set(position._x, position._y, position._z);
        });

        tween.onComplete(function () {
            _this.camera.position.set(target.x, target.y, target.z);
            _this.camera.up.set(target._x, target._y, target._z);
            console.log(_this.camera.rotation);
            _this.isTween = false;
            TWEEN.remove(this);
        });

        tween.start();

    },

    rotateCameraAtValue: function (dir) {
        var vector = this.controls.target.clone();
        var l = (new THREE.Vector3()).subVectors(this.camera.position, vector).length();
        var up = this.camera.up.clone();
        var quaternion = new THREE.Quaternion();
        var _this = this;
        var length;

        if(dir.toLowerCase() == 'right'){
            length = 0.01;
        }else if(dir.toLowerCase() == 'left'){
            length = -0.01;
        }

        var rotationAnim = new TWEEN.Tween(length).to(length, 750);

        rotationAnim.onUpdate(function () {
            up = _this.camera.up.clone();
            quaternion.setFromAxisAngle(up, length);
            _this.camera.position.applyQuaternion(quaternion);
        });

        rotationAnim.onComplete(function(){
            TWEEN.remove(this);
        });

        rotationAnim.start();

    },

    rotateCameraCon: function (speed) {
        var _this = this;
        var vector = this.controls.target.clone();
        var l = (new THREE.Vector3()).subVectors(this.camera.position, vector).length();
        var up = this.camera.up.clone();
        var quaternion = new THREE.Quaternion();

        this.rotationTween = new TWEEN.Tween(speed).to(speed, 1000);

        this.rotationTween.onUpdate(function () {
            up = _this.camera.up.clone();
            quaternion.setFromAxisAngle(up, speed);
            _this.camera.position.applyQuaternion(quaternion);
        });

        this.rotationTween.chain(this.rotationTween);
    },

    startCameraRotation: function () {
        this.isTween = true;
        (!(this.rotationTween.isPlaying())) ? this.rotationTween.start() : ((this.rotationTween.isPaused())) ? this.rotationTween.play() : null;
    },

    pauseCameraRotation: function () {
        this.isTween = false;
        (this.rotationTween.isPlaying()) ? this.rotationTween.pause() : null;

    },


    /*
     HELPER METHODS
     */

    buildAxes: function (length) {
        var axes = new THREE.Object3D();

        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x00FF00, false)); // +Y
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x00FF00, true)); // -Y
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z
        axes.add(this.buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z

        return axes;
    },

    buildAxis: function (src, dst, colorHex, dashed) {
        var geom = new THREE.Geometry(),
            mat;

        if (dashed) {
            mat = new THREE.LineDashedMaterial({linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3});
        } else {
            mat = new THREE.LineBasicMaterial({linewidth: 3, color: colorHex});
        }

        geom.vertices.push(src.clone());
        geom.vertices.push(dst.clone());
        geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        var axis = new THREE.Line(geom, mat, THREE.LinePieces);

        return axis;

    },


    latLongToVector3: function (lat, lon, heigth) {
        var phi = (lat) * Math.PI / 180;
        var theta = (lon - 180) * Math.PI / 180;
        var radius = 5;

        var x = -(radius + heigth) * Math.cos(phi) * Math.cos(theta);
        var y = (radius + heigth) * Math.sin(phi);
        var z = (radius + heigth) * Math.cos(phi) * Math.sin(theta);


        return new THREE.Vector3(x, y, z);
    },

    calculateMidPoint: function (lat1, lon1, lat2, lon2, height) {
        var lat1 = (lat1) * Math.PI / 180;
        var lon1 = (lon1) * Math.PI / 180;
        var lat2 = (lat2) * Math.PI / 180;
        var lon2 = (lon2) * Math.PI / 180;

        var x1 = Math.cos(lat1) * Math.cos(lon1);
        var y1 = Math.cos(lat1) * Math.sin(lon1);
        var z1 = Math.sin(lat1);

        var x2 = Math.cos(lat2) * Math.cos(lon2);
        var y2 = Math.cos(lat2) * Math.sin(lon2);
        var z2 = Math.sin(lat2);

        var x = (x1 + x2) / 2;
        var y = (y1 + y2) / 2;
        var z = (z1 + z2) / 2;

        var lon = Math.atan2(x, y);
        var hyp = Math.sqrt(x * x + y * y);
        var lat = Math.atan2(hyp, z);

        var LAT = lat * (180 / Math.PI);
        var LON = lon * (180 / Math.PI);

        return this.latLongToVector3(LAT, LON, height);


    },

    calculateCP: function (x1, y1, x2, y2) {
        var xC = (x1 + x2) / 2;
        xC = (x1 + xC) / 2;

        var yC = (y1 + y2) / 2;
        yC = (y1 + yC) / 2;

        return [xC, yC];
    },

    CSVToArray: function (strData, strDelimiter) {
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec(strData)) {

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[1];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ) {

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push([]);

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[2]) {

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[2].replace(
                    new RegExp("\"\"", "g"),
                    "\""
                );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[3];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[arrData.length - 1].push(strMatchedValue);
        }

        // Return the parsed data.
        return ( arrData );
    }


});

dataGlobe.ControlView = Backbone.View.extend({

    /*
     EVENTS
     */

    events: {
        "click #reset": 'resetControls',
        "click #rotate": 'rotateGlobe',
        "click #goTo": 'goToPlace',
        "keypress #searchField": 'detectEnter'
    },


    /*
     EVENT TRIGGER METHODS
     */

    resetControls: function () {
        eventBus.trigger('reset');
    },

    rotateGlobe: function (dir) {

        var val;

        if (dir instanceof Object) {
            val = "right";
        } else {
            val = dir ? dir : "right";
        }

        eventBus.trigger('rotate', val);
    },

    detectEnter: function (e) {
        if (e.which === 13) {     //13 refers to key "enter"
            this.goToPlace();
        }
    },

    goToPlace: function (placeName) {
        var val = (placeName ? placeName : $(this.el).find('#searchField').val());
        eventBus.trigger('goTo', val);
    },

    zoom: function (dir) {
        eventBus.trigger('zoom', dir);
    }

});