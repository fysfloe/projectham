/**
 * Created by Benedikt Schreter on 17.11.2014.
 */
var projectham = projectham || {};

projectham.GlobeView = Backbone.View.extend({

    /*
     INIT
     */
    initialize: function () {
        this.isLineAnim = false;
        this.lineVar = 3;
        _.bindAll(this, 'render', '_updateScene', 'latLongToVector3', 'buildAxes', 'displayTweet');
        this.filters = {};
    },


    /*
     RENDER & PROCESS DATA FUNCTIONS
     */

    render: function (options) {
        var _this = this;
        this.width = options.width || 500;
        this.height = options.height || 500;
        this.distance = options.distance || 15;
        this.mapSrc = options.mapSrc || 'img/5_night_8k.jpg';
        this.bgSrc = options.bgSrc || 'img/galaxy_starfield.png';
        this.specularMapSrc = options.specularMapSrc || 'img/water_4k.png';
        this.specularColor = options.specularColor || 'white';
        this.shininessInt = options.shininessInt || 4;

        this.manager = new THREE.LoadingManager();
        this.manager.onProgress = function (item, loaded, total) {

            console.log(item, loaded, total);

        };

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
        this.camera.position.z = this.distance;
        //this.camera.lookAt(new THREE.Vector3(10.443329520636075, 10.010497358953545, 4.0173981090580995));
        this.camera.position.set(10.443329520636075, 10.010497358953545, -4.0173981090580995);


        this.ambientLight = new THREE.AmbientLight(0x090c10);
        //this.ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(this.ambientLight);

        this.spotLight = new THREE.SpotLight(0xffffff, 7);
        this.scene.add(this.spotLight);

        //this.scene.add(new THREE.DirectionalLight(0xffffff, 1));

        this.globeMaterialWire = new THREE.MeshLambertMaterial({
            color: 0xff0000,
            //map: THREE.ImageUtils.loadTexture(this.mapSrc),
            // specularMap: THREE.ImageUtils.loadTexture(this.specularMapSrc),
            // specular: new THREE.Color(this.specularColor),
            //alphaMap: THREE.ImageUtils.loadTexture('img/world_map_alpha.png'),
            //shininess: 4
            transparent: true,
            opacity: .4,
            side: THREE.DoubleSide,
            wireframe: false
        });

        this.globeMaterialFront = new THREE.MeshPhongMaterial({
            color: 0x000407,
            //color: 0x222222,
            map: THREE.ImageUtils.loadTexture('img/world_map_semi.png'),
            //map: THREE.ImageUtils.loadTexture(this.mapSrc),
            bumpMap: THREE.ImageUtils.loadTexture('img/world_map_alpha.png'),
            bumpScale:.03,
            //alphaMap: THREE.ImageUtils.loadTexture('img/world_map_semi.png'),
            specular:  0x00050a,
            shininess:  2,
            transparent: false,
            opacity:1,
            side: THREE.FrontSide,
            wireframe: false
        });

        //Initialize Globe
        this.globeWire = new THREE.Mesh(
            new THREE.SphereGeometry(5, 50, 50),
            this.globeMaterialWire
        );

        this.globeFront = new THREE.Mesh(
            new THREE.SphereGeometry(5.01, 50, 50),
            this.globeMaterialFront
        );

        this.scene.add(this.globeFront);
        //this.scene.add(this.globeWire);

        //Initialize Background ("Space")
        this.BGtexture = THREE.ImageUtils.loadTexture(this.bgSrc);
        this.BGtexture.wrapS = this.BGtexture.wrapT = THREE.RepeatWrapping;
        this.BGtexture.repeat.set(1, 1);

        this.spaceSphere = new THREE.Mesh(
            new THREE.SphereGeometry(900, 64, 64),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                // map: this.BGtexture,
                side: THREE.BackSide,
                transparent: false,
                opacity: 1
            })
        );
        this.scene.add(this.spaceSphere);


        //this.scene.add(this.buildAxes(1000));


        // Fallback WebGL to Canvas Renderer
        if (window.WebGlRenderingContext || document.createElement('canvas').getContext('experimental-webgl')) {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                sortObjects: true
            });
        } else {
            this.renderer = new THREE.CanvasRenderer();
        }
        this.renderer.setSize(this.width, this.height);

        this.$el.html(this.renderer.domElement);

        // Enable Trackball
        this.controls = options.enableTrackball ? new THREE.TrackballControls(this.camera, this.renderer.domElement, this) : null;

        //Add empty total meshes of filters
        $.each(this.filters, function(key,value){
            _this.scene.add(value.total);
        });


        var windowResize = THREEx.WindowResize(this.renderer, this.camera);
        this._updateScene();
        this._eventHandler();


        return this;
    },

    _updateScene: function () {

        var updateScene = this._updateScene;
        requestAnimationFrame(updateScene);
        TWEEN.update();
        /* if (this.isLineAnim) {
         if(this.lineVar == 2){
         this.scene.add(this.lines);
         }

         this.lines.geometry.verticesNeedUpdate = true;
         this.lines.geometry.vertices.push(this.lineVertices[this.lineVar]);
         this.lines.geometry.verticesNeedUpdate = true;
         console.log(this.lines);

         this.lineVar++;
         if (this.lineVar >= 100) {
         this.lineVar = 2;
         this.isLineAnim = false;
         }
         }*/
        this.controls ? this.controls.update() : null;
        var controls = this.controls;
        this.spotLight.position.copy(this.camera.position);
        this.renderer.render(this.scene, this.camera);
        //this.composer.render();

    },

    initFilters: function (filter1,filter2,filter3){
        this.filters = {
            _0: filter1,
            _1: filter2,
            _2: filter3
        };
    },

    displayTweet: function (tweet) {

        var _this = this,
            filter,
            position,
            mesh,
            cube,
            value;

        filter = this.getFilter(tweet.filter.id);

        if (tweet.type == "tweet") {
            mesh = filter.tweets;
        } else if (tweet.type == "retweet") {
            mesh = filter.retweets;
        } else if (tweet.type == "reply") {
            mesh = filter.replies;
        } else {
            return;
        }


        filter.name = (filter.name == "") ? tweet.filter.text : filter.name;

        if(!tweet.user.followers || tweet.user.followers <= 0) {
            value = 1;
        } else {
            value = tweet.user.followers;
        }

        value = Math.pow(value, 1/20) - 0.9;

        position = _this.latLongToVector3(tweet.location.lat, tweet.location.lng, value / 2);

        //cylinder
        cube = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, value, 8, 1, false), filter.material);
        cube.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));

        //position the cube correctly
        cube.translateX(position.x);
        cube.translateY(position.y);
        cube.translateZ(position.z);

        cube.lookAt(new THREE.Vector3(0, 0, 0));

        cube.scale.set(1, 1, 0.1);
        this.scene.add(cube);

        var start = {i: 0.1};
        var target = {i: 1};
        var scaleTween = new TWEEN.Tween(start).to(target, 200).onUpdate(function () {
            cube.scale.z = start.i;
        });

        scaleTween.onComplete(function () {
            //cube.scale.z = target.i;

            cube.updateMatrix();
            filter.geom.merge(cube.geometry, cube.matrix);

            _this.scene.remove(cube);

            _this.scene.remove(filter.total);
            //_this.renderer.deallocateObject(_this.total);

            var geom = new THREE.Geometry();
            geom.merge(filter.geom);

            filter.total = new THREE.Mesh(geom, filter.material);

            _this.scene.add(filter.total);

            TWEEN.remove(this);
        });
        scaleTween.start();


    },

    displayLineData: function (data) {
        this.data = data || null;

        var arrayData = this.CSVToArray(this.data);
        var lineRes = 100;


        this.lineVertices = [];

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


        for (var i = 0, len = 1; i < len; i++) {
            var x = parseFloat(arrayData[i][0]);
            var y = parseFloat(arrayData[i][1]);

            var x2 = parseFloat(arrayData[i][2]);
            var y2 = parseFloat(arrayData[i][3]);

            var length = Math.sqrt(Math.pow((x - x2), 2) + Math.pow((y - y2), 2));

            if (length < 150) {

                var cp = new THREE.CurvePath();
                cp.autoClose = false;

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
                var cubicLine = new THREE.CubicBezierCurve3(position1, cP1, cP2, position2);

                cubicLine.autoClose = false;
                cp.add(cubicLine);

                var curveGeo = cp.createPointsGeometry(lineRes);
                var curvedLine = new THREE.Line();
                curvedLine.name = "line_" + i;
                curvedLine.geometry.verticesNeedUpdate = true;
                curvedLine.material = lineMaterial;
                curvedLine.geometry.vertices.push(curveGeo.vertices[0], curveGeo.vertices[1]);
                curvedLine.geometry.verticesNeedUpdate = true;

                curvedLine.lookAt(new THREE.Vector3(0, 0, 0));
                this.lines = curvedLine;
                this.lineVertices = curveGeo.vertices;

                //this.scene.add(this.lines);


            }
        }


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
            _this.pauseCameraRotation();
            _this.rotateCameraAtValue(dir);
        });

        eventBus.on("goTo", function (value) {
            _this.pauseCameraRotation();
            _this._getLatLngFromPlaceName(value);
        });

        eventBus.on("zoom", function (dir) {
            _this.controls.zoom(dir, 0.03);
        });

        eventBus.on("scale", function () {
            var tweet1 = {
                id: 12125512,
                text: 'Project Ham is the yellow from the egg #obama',
                parent_id: null,
                type: 'reply',
                location: {
                    lat: 48.3669367,
                    lng: 14.5172742,
                    type: 'user_location'
                },
                user: {
                    name: 'hans',
                    followers: 200550,
                    lang: 'de'
                },
                hashtags: null,
                filter: {
                    text: 'obama',
                    id: 0
                }
            };

            var tweet2 = {
                id: 12125512,
                text: 'Project Ham is NOT the yellow from the egg #putin',
                parent_id: null,
                type: 'retweet',
                location: {
                    lat: 45.3669367,
                    lng: 14.5172742,
                    type: 'user_location'
                },
                user: {
                    name: 'hans',
                    followers: 200550,
                    lang: 'de'
                },
                hashtags: null,
                filter: {
                    text: 'merkel',
                    id: 1
                }
            };

            _this.displayTweet(tweet1);
            _this.displayTweet(tweet2);
            _this.fadeOutFilter(0);

        });

        eventBus.on("draw", function () {
           /* if (_this.lineVar == 3) {
                _this.scene.add(_this.lines);
            }
            _this.scene.remove(_this.lines);
            _this.lines.geometry.verticesNeedUpdate = true;
            _this.lines.geometry.vertices.push(_this.lineVertices[_this.lineVar], _this.lineVertices[_this.lineVar + 1]);
            _this.lines.geometry.verticesNeedUpdate = true;
            var lines = _this.lines;
            _this.scene.add(lines);

            console.log(_this.scene);
            console.log(_this.lines.geometry.verticesNeedUpdate);

            _this.lineVar++;
            if (_this.lineVar >= 100) {
                _this.lineVar = 3;
                _this.isLineAnim = false;
            }*/

            var tweet1 = {
                id: 12125512,
                text: 'Project Ham is the yellow from the egg #obama',
                parent_id: null,
                type: 'retweet',
                location: {
                    lat: 48.3669367,
                    lng: 40.5172742,
                    type: 'user_location'
                },
                user: {
                    name: 'hans',
                    followers: 200550,
                    lang: 'de'
                },
                hashtags: null,
                filter: {
                    text: 'obama',
                    id: 0
                }
            };

            var tweet2 = {
                id: 12125512,
                text: 'Project Ham is NOT the yellow from the egg #putin',
                parent_id: null,
                type: 'tweet',
                location: {
                    lat: 45.3669367,
                    lng: 20.5172742,
                    type: 'user_location'
                },
                user: {
                    name: 'hans',
                    followers: 200550,
                    lang: 'de'
                },
                hashtags: null,
                filter: {
                    text: 'putin',
                    id: 2
                }
            };

            _this.displayTweet(tweet1);
            _this.displayTweet(tweet2);
            _this.fadeInFilter(0);
        });

        eventBus.on("startStream", function (e) {
            _this.initFilters(
                new projectham.GlobeFilter(e.models[0].get('filter'), e.models[0].get('color')),
                e.models[1] ? new projectham.GlobeFilter(e.models[1].get('filter'), e.models[1].get('color')) : undefined,
                e.models[2] ? new projectham.GlobeFilter(e.models[2].get('filter'), e.models[2].get('color')) : undefined
            );
        });

        eventBus.on("newTweet", function(e) {
            console.log(e.attributes);

            _this.displayTweet(e.attributes);
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
            _this.isTween = false;
            TWEEN.remove(this);
        });

        tween.start();

    },

    rotateCameraAtValue: function (dir) {
        var length = 60,
            _this = this,
            offsetX,
            offsetY;


        if (dir.toLowerCase() == 'right') {
            offsetX = -length;
            offsetY = 0;
        } else if (dir.toLowerCase() == 'left') {
            offsetX = length;
            offsetY = 0;
        } else if (dir.toLowerCase() == 'up') {
            offsetY = length;
            offsetX = 0;
        } else if (dir.toLowerCase() == 'down') {
            offsetY = -length;
            offsetX = 0;
        } else {
            offsetX = -length;
            offsetY = 0;
        }

        var position = {x: parseInt(this.width / 2), y: parseInt(this.height / 2)};

        var target = {x: parseInt(position.x + offsetX), y: parseInt(position.y + offsetY)};

        var rotationAnim = new TWEEN.Tween(position).to(target, 750);
        _this.controls.setRotateStart(position);

        rotationAnim.onUpdate(function () {
            _this.controls.rotate(position);
        });

        rotationAnim.onComplete(function () {
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

    animateCube: function (cube, filter) {
        this.scene.add(cube);

        var _this = this;
        var position = {i: 0.1};
        var target = {i: 1};
        var cubeGeom = new THREE.Geometry();
        var scaleTween = new TWEEN.Tween(position).to(target, 200).onUpdate(function () {
            cube.scale.z = position.i;
        });

        scaleTween.onComplete(function () {
            //cube.scale.z = target.i;


            cube.updateMatrix();
            _this.geom.merge(cube.geometry, cube.matrix);


            _this.scene.remove(cube);

            _this.scene.remove(_this.total);
            //_this.renderer.deallocateObject(_this.total);

            var geom = new THREE.Geometry();
            geom.merge(_this.geom);

            _this.total = new THREE.Mesh(geom, _this.material);
            _this.scene.add(_this.total);
            TWEEN.remove(this);


            if (filter == 1) {
                _this.cc++;
                _this.cubes.children[_this.cc] && _this.animateCube(_this.cubes.children[_this.cc], 1);
            } else if (filter == 2) {
                _this.cc2++;
                _this.cubes2.children[_this.cc2] && _this.animateCube(_this.cubes2.children[_this.cc2], 2);
            }
        });
        scaleTween.start();
    },

    animateLine: function (line, vertices, runVar) {

        var vert = vertices[runVar];
        line.geometry.verticesNeedUpdate = true;
        line.geometry.vertices.push(vert);
        line.geometry.verticesNeedUpdate = true;


    },

    startCameraRotation: function () {
        this.isTween = true;
        (!(this.rotationTween.isPlaying())) ? this.rotationTween.start() : ((this.rotationTween.isPaused())) ? this.rotationTween.play() : null;
    },

    pauseCameraRotation: function () {
        this.isTween = false;
        (this.rotationTween.isPlaying()) ? this.rotationTween.pause() : null;

    },

    fadeOutFilter: function(filterID) {
        var filter = this.getFilter(filterID);
        var position = { o: filter.material.opacity};
        var target = { o: 0};

        var fadeOutTween = new TWEEN.Tween(position).to(target, 200);

        fadeOutTween.onUpdate(function(){
            filter.setOpacity(position.o);
        });

        fadeOutTween.onComplete(function(){
            TWEEN.remove(this);
        });

        fadeOutTween.start();
    },

    fadeInFilter: function(filterID) {
        var filter = this.getFilter(filterID);
        var position = { o: filter.material.opacity};
        var target = { o: 1};

        var fadeOutTween = new TWEEN.Tween(position).to(target, 200);

        fadeOutTween.onUpdate(function(){
            filter.setOpacity(position.o);
        });

        fadeOutTween.onComplete(function(){
            TWEEN.remove(this);
        });

        fadeOutTween.start();
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

    getFilter: function(filterID){
        switch (filterID) {
            case 0:
                return this.filters._0;
                break;
            case 1:
                return this.filters._1;
                break;
            case 2:
                return this.filters._2;
                break;
            default:
                return null;
                break;
        }
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