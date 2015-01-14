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


        THREE.DefaultLoadingManager.onLoad = function(){
            _this.animateGlobe();
        }
        THREE.DefaultLoadingManager.onProgress = function (item, loaded, total) {

            console.log(item, loaded, total);


        };

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
        this.camera.position.z = this.distance;
        //this.camera.lookAt(new THREE.Vector3(10.443329520636075, 10.010497358953545, 4.0173981090580995));
        this.camera.position.set(10.443329520636075, 10.010497358953545, -4.0173981090580995);

        //this.ambientLight = new THREE.AmbientLight(0x090c10);
        this.ambientLight = new THREE.AmbientLight(0x1a232f); // TODO Mac Display

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
            //color: 0x070707,
            map: THREE.ImageUtils.loadTexture('img/world_map_semi_details.png'),
            //map: THREE.ImageUtils.loadTexture(this.mapSrc),
            bumpMap: THREE.ImageUtils.loadTexture('img/world_map_alpha.png'),
            specularMap: THREE.ImageUtils.loadTexture('img/world_map_semi_details.png'),
            bumpScale: .03,
            //alphaMap: THREE.ImageUtils.loadTexture('img/world_map_semi.png'),
            // specular: 0x00050a,
            specular: 0x0a0a0a,
            shininess: 2,
            transparent: false,
            opacity: 1,
            side: THREE.FrontSide,
            wireframe: false
        });

        //Initialize Globe
        this.globeWire = new THREE.Mesh(
            new THREE.SphereGeometry(5, 50, 50),
            this.globeMaterialWire
        );

        this.globeFront = new THREE.Mesh(
            new THREE.SphereGeometry(5.0, 50, 50),
            this.globeMaterialFront
        );

        this.globeFront.translateY(-50);
        this.scene.add(this.globeFront);
        //this.scene.add(this.globeWire);

        var customMaterial = new THREE.ShaderMaterial(
            {
                uniforms: {
                    "c": {type: "f", value: 0.4},
                    "p": {type: "f", value: 6.0},
                    //  glowColor: {type: "c", value: new THREE.Color(0x5ea9e6)},
                    glowColor: {type: "c", value: new THREE.Color(0x68bbff)}, // TODO Mac Display
                    viewVector: {type: "v3", value: this.camera.position}
                },
                vertexShader: document.getElementById('vertexShader').textContent,
                fragmentShader: document.getElementById('fragmentShader').textContent,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

        var customMaterial2 = new THREE.ShaderMaterial(
            {
                uniforms: {
                    "c": {type: "f", value: 1.0},
                    "p": {type: "f", value: 3.5},
                    //  glowColor: {type: "c", value: new THREE.Color(0x5ea9e6)},
                    glowColor: {type: "c", value: new THREE.Color(0x68bbff)}, // TODO Mac Display
                    viewVector: {type: "v3", value: this.camera.position}
                },
                vertexShader: document.getElementById('vertexShader').textContent,
                fragmentShader: document.getElementById('fragmentShader').textContent,
                side: THREE.FrontSide,
                blending: THREE.AdditiveBlending,
                transparent: true

            });

        var ballGeometry = new THREE.SphereGeometry(6, 32, 16);
        var ballGeometry2 = new THREE.SphereGeometry(5.03, 50, 50);
        this.ball = new THREE.Mesh(ballGeometry, customMaterial);
        this.ball2 = new THREE.Mesh(ballGeometry2, customMaterial2);

        this.ball.translateY(-50);
        this.ball2.translateY(-50);

        this.scene.add(this.ball2);
        this.scene.add(this.ball);

        //Initialize Background ("Space")
        this.BGtexture = THREE.ImageUtils.loadTexture(this.bgSrc);
        this.BGtexture.wrapS = this.BGtexture.wrapT = THREE.RepeatWrapping;
        this.BGtexture.repeat.set(1, 1);

        this.spaceSphere = new THREE.Mesh(
            new THREE.SphereGeometry(1000, 64, 64),
            new THREE.MeshBasicMaterial({
                // color: 0x333333,
                color: 0x555555,
                map: this.BGtexture,
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
                antialias: false,
                sortObjects: true,
                preserveDrawingBuffer: true
            });
        } else {
            this.renderer = new THREE.CanvasRenderer();
        }
        this.renderer.setSize(this.width, this.height);

        this.$el.html(this.renderer.domElement);

        // Enable Trackball
        this.controls = options.enableTrackball ? new THREE.TrackballControls(this.camera, this.renderer.domElement, this) : null;


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

    animateGlobe: function(){
        var _this = this;
        var position = { x: -50};
        var target = {x: 0};
        var globeTween = new TWEEN.Tween(position).to(target, 5000);

        console.log(this.globeFront);
        globeTween.onUpdate(function(){
            _this.globeFront.position.y = (position.x);
            _this.ball.position. y = (position.x);
            _this.ball2.position.y = (position.x);
        });

        globeTween.start();

    },

    initFilters: function (filter1, filter2, filter3) {
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


        filter.name = (filter.name == "") ? tweet.filter.text : filter.name;

        if (!tweet.user.followers || tweet.user.followers <= 0) {
            value = 1;
        } else {
            value = tweet.user.followers;
        }

        value = Math.pow(value, 1 / 20) - 0.9;

        position = _this.latLongToVector3(tweet.location.lat, tweet.location.lng, value, true);

        //cylinder
        if (tweet.type == "tweet") {
            cube = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, value * 2, 8, 1, true), filter.tweetMaterial);
        } else if (tweet.type == "retweet") {
            cube = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, value * 2, 8, 1, true), filter.retweetMaterial);
        } else if (tweet.type == "reply") {
            cube = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, value * 2, 8, 1, true), filter.replyMaterial);
        } else {
            return;
        }

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


            _this.scene.remove(cube);

            var geom = new THREE.Geometry();

            if (tweet.type == "tweet") {
                filter.tweets.geometry.merge(cube.geometry, cube.matrix);
                _this.scene.remove(filter.tweets);
                geom.merge(filter.tweets.geometry);
                filter.tweets = new THREE.Mesh(geom, filter.tweetMaterial);
                _this.scene.add(filter.tweets);
            } else if (tweet.type == "retweet") {
                filter.retweets.geometry.merge(cube.geometry, cube.matrix);
                _this.scene.remove(filter.retweets);
                geom.merge(filter.retweets.geometry);
                filter.retweets = new THREE.Mesh(geom, filter.retweetMaterial);
                _this.scene.add(filter.retweets);
            } else if (tweet.type == "reply") {
                filter.replies.geometry.merge(cube.geometry, cube.matrix);
                _this.scene.remove(filter.replies);
                geom.merge(filter.replies.geometry);
                filter.replies = new THREE.Mesh(geom, filter.replyMaterial);
                _this.scene.add(filter.replies);
            } else {
                return;
            }

            TWEEN.remove(this);
        });
        scaleTween.start();


    },

    displayConnection: function (conn) {

        var filter,
            x,
            y,
            x2,
            y2,
            lineRes,
            cPHeight,
            factor,
            cP1,
            cP2,

            _this;

        _this = this;
        filter = this.getFilter(conn.filter.id);

        lineRes = 100;

        x = parseFloat(conn.parent.lat);
        y = parseFloat(conn.parent.lng);

        x2 = parseFloat(conn.child.lat);
        y2 = parseFloat(conn.child.lng);


        var length = Math.sqrt(Math.pow((x - x2), 2) + Math.pow((y - y2), 2));

        if (length > 180) {

            length = 360 - length;

            factor = (length - 360) / -720;

            var y2temp;

            if (y2 > 0) {
                y2temp = y2 - 360;
            } else {
                y2temp = y2 + 360;
            }

            cP1 = this.calculateCP(factor, x, y, x2, y2temp, true);
            cP2 = this.calculateCP((1 - factor), x, y, x2, y2temp, true);

        } else {

            factor = (length - 360) / -720;

            cP1 = this.calculateCP(factor, x, y, x2, y2);
            cP2 = this.calculateCP((1 - factor), x, y, x2, y2);

        }

        //var factor = Math.sqrt((length / 950));     // Faktor berechnet sich zur Hyperbel y = 135*x^2 ( 135 gewählt um dort Grenzwert zu überschreiten)


        var cp = new THREE.CurvePath();
        cp.autoClose = false;

        cPHeight = 0.3 + (length / 40 * (length / 180));

        //var xM = (x + x2) / 2;
        //var yM = (y + y2) / 2;

        cP1 = this.latLongToVector3(cP1[0], cP1[1], cPHeight);
        cP2 = this.latLongToVector3(cP2[0], cP2[1], cPHeight);


        //// DISPLAY CONTROL POINTS

//        var cube = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1));
//        cube.translateX(cP1.x);
//        cube.translateY(cP1.y);
//        cube.translateZ(cP1.z);
//        cube.lookAt(new THREE.Vector3(0, 0, 0));
//
//        var cube2 = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1));
//        cube2.translateX(cP2.x);
//        cube2.translateY(cP2.y);
//        cube2.translateZ(cP2.z);
//        cube2.lookAt(new THREE.Vector3(0, 0, 0));
//
//
//        this.scene.add(cube);
//        this.scene.add(cube2);


        var position1 = this.latLongToVector3(x, y, 0.01);
        var position2 = this.latLongToVector3(x2, y2, 0.01);
        //var position3 = this.calculateMidPoint(x,y,x2,y2,2);
        var cubicLine = new THREE.CubicBezierCurve3(position1, cP1, cP2, position2);

        cubicLine.autoClose = false;
        cp.add(cubicLine);

        var curveGeo = cp.createPointsGeometry(lineRes);


        // DISPLAY LINE AT ONCE


        //curvedLine.name = "line_" + i;
        //curvedLine.geometry.verticesNeedUpdate = true;
        //curvedLine.material = ;
        //curvedLine.geometry.vertices.push(curveGeo.vertices[0], curveGeo.vertices[1]);
        //curvedLine.geometry.verticesNeedUpdate = true;


        var tempGeom = new THREE.Geometry();
        var v1 = curveGeo.vertices[0];
        tempGeom.vertices.push(v1);
        var curvedLine = new THREE.Line();
        this.animateLine(filter, curveGeo, tempGeom, curvedLine, 0, 1, function (line) {
            _this.scene.remove(line);
            var finalLine = new THREE.Line(curveGeo, filter.lineMaterial);
            finalLine.lookAt(new THREE.Vector3(0, 0, 0));
            filter.connections.add(finalLine);
            _this.scene.remove(filter.connections);
            _this.scene.add(filter.connections);
        });


    },

    generateScreenshot: function () {
        //var canvas = $('#globe canvas');
        var img = new Image(),
            canvas = document.createElement('canvas'),
            filter1 = new Image(),
            filter2 = new Image(),
            filter3 = new Image(),
            fLength = 12,
            _this = this;

        filter1.src = './img/ui/colors/blue.png';
        filter2.src = './img/ui/colors/orange.png';
        filter3.src = './img/ui/colors/green.png';


        img.src = _this.renderer.domElement.toDataURL("image/png");

        canvas.width = 1024;
        canvas.height = 768;

        var newWidth = img.width * (canvas.height/img.height);

        var context = canvas.getContext('2d');
        context.fillRect(0,0,canvas.width, canvas.height);
        context.drawImage(img, 0, 0, img.width,    img.height, (canvas.width - newWidth) / 2, 0, newWidth, canvas.height);  // destination rectangle

        if(this.filters._0){
            context.drawImage(filter1, 0, 0, filter1.width, filter1.width, 30, 645, 68, 68);  // destination rectangle
            context.fillStyle = "white";
            context.font = "normal normal 300 16px 'Bebas Neue'";
            context.textAlign="center";

            context.fillText(this.filters._0.name.length <= 14 ? this.filters._0.name : this.filters._0.name.substring(0, fLength) + "...", 64, 735);

            if(this.filters._1){
                context.drawImage(filter2, 0, 0, filter2.width, filter2.width, 116, 645, 68, 68);  // destination rectangle
                context.fillText(this.filters._1.name.length <= 14 ? this.filters._1.name : this.filters._1.name.substring(0, fLength) + "...", 150, 735);

                if(this.filters._2){
                    context.drawImage(filter3, 0, 0, filter3.width, filter3.width, 202, 645, 68, 68);  // destination rectangle
                    context.fillText(this.filters._2.name.length <= 14 ? this.filters._2.name : this.filters._2.name.substring(0, fLength) + "...", 236, 735);

                }
            }
        }

        context.font = "normal normal 300 16px 'Bebas Neue'";
        context.textAlign="end";
        context.fillStyle = "white";

        context.fillText("total", 829, 735);
        context.fillText("retweets", 909, 735);
        context.fillText("Replies", 994, 735);

        // DRAW STATS
        context.fillStyle = "#0084B4";
        context.font = "normal normal 300 40px 'Bebas Neue'";

        context.fillText($('#overall').text(), 829, 713);
        context.fillText($('#retweets').text(), 909, 713);
        context.fillText($('#replies').text(), 994, 713);

        // DRAW HEADING
        context.fillStyle = "white";
        context.textAlign="start";
        context.font = "normal normal 600 37px 'Bebas Neue'";
        context.fillText("Project Ham", 221, 64);

        context.fillStyle = "#0084B4";
        context.font = "normal normal 300 37px 'Bebas Neue'";
        context.fillText("My Twitter Live Stream Experience", 388, 64);

        this.controls.enabled = true;

        var filename = Math.floor(Date.now() / 1000) + "_" + (Math.floor(Math.random() * 1000)).toString().hashCode() + ".png";

        $.post( 'save-image/' + filename, {
            base64: canvas.toDataURL('image/png')
        }, function(success) {
            alert(success);
        }).fail(function() {
            alert( 'An error occurred.' );
        });
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

        eventBus.on("takeScreenshot", function () {
            _this.zoomOutToOrigin(function(){
                _this.controls.enabled = false;
                _this.generateScreenshot();
            });

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
            var connection = {
                filter: {
                    text: 'merkel',
                    id: 0
                },
                parent: {
                    lat: 36,
                    lng: 138,
                    type: 'user_location'
                },
                child: {
                    lat: -33,
                    lng: -71.5,
                    type: 'user_location'
                }
            }

            _this.displayConnection(connection)

        });

        eventBus.on("soloMode", function (id) {
            console.log(id);
            var filter = _this.getFilter(id);
            console.log(_this.filters);
            if (filter.isDetailView) {
                $.each(_this.filters, function (key, value) {
                    console.log(value);
                    if (value && value.id != filter.id && !value.isVisible) {
                        _this.fadeInFilter(value.id);
                    }
                });
            } else {
                $.each(_this.filters, function (key, value) {
                    console.log(value);
                    if (value && value.id != filter.id && value.isVisible) {
                        _this.fadeOutFilter(value.id);
                    }
                });
            }
            _this.changeView(id);
        });

        eventBus.on("toggleVisibility", function (id) {
            var filter = _this.getFilter(id);
            filter.isVisible ? _this.fadeOutFilter(id) : _this.fadeInFilter(id);
        });

        eventBus.on("fadeOut", function () {
            _this.fadeOutFilter(0);
            _this.fadeOutFilter(2);
        });

        eventBus.on("fadeIn", function () {
            _this.fadeInFilter(0);
            _this.fadeInFilter(2);
        });

        eventBus.on("addFilter", function (e) {
            _this.initFilters(
                new projectham.GlobeFilter(e.models[0].get('filter'), e.models[0].get('color'), 0),
                e.models[1] ? new projectham.GlobeFilter(e.models[1].get('filter'), e.models[1].get('color'), 1) : undefined,
                e.models[2] ? new projectham.GlobeFilter(e.models[2].get('filter'), e.models[2].get('color'), 2) : undefined
            );
        });

        eventBus.on("newTweet", function (e) {
            _this.displayTweet(e.attributes);
        });

        eventBus.on("newConn", function (e) {
            _this.displayConnection(e);
        });

        eventBus.on("startStream", function () {
            $.each(_this.scene.children, function (key, value) {
                if (key > 5) {
                    _this.scene.remove(value);
                }
            });
            $.each(_this.scene.children, function (key, value) {
                if (key > 5) {
                    _this.scene.remove(value);
                }
            });
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

    animateLine: function (filter, curveGeo, tempGeom, curvedLine, i, j, callback) {


        var _this = this;
        var filter = filter;
        var curveGeo = curveGeo;
        var tempGeom2 = tempGeom;
        var tempGeom = new THREE.Geometry();
        var curvedLine2;

        var i = i;
        var j = j;

        var v1 = curveGeo.vertices[i];
        var v2 = curveGeo.vertices[j];

        var position = {x: v1.x, y: v1.y, z: v1.z};
        var target = {x: v2.x, y: v2.y, z: v2.z};

        tempGeom.merge(tempGeom2);
        tempGeom.vertices.push(v1.clone());
        tempGeom.dynamic = true;

        this.scene.remove(curvedLine);
        curvedLine2 = new THREE.Line(tempGeom, filter.lineMaterial);
        this.scene.add(curvedLine2);


        var lineTween = new TWEEN.Tween(position).to(target, 0.3);

        lineTween.onUpdate(function () {
            curvedLine2.geometry.vertices[j].set(position.x, position.y, position.z);
            curvedLine2.geometry.verticesNeedUpdate = true;
        });

        lineTween.onComplete(function () {
            i += 1;
            j += 1;

            if (curveGeo.vertices[j]) {
                _this.animateLine(filter, curveGeo, tempGeom, curvedLine2, i, j, callback);
            } else {
                callback(curvedLine2);
            }


        });

        lineTween.start();
    },

    startCameraRotation: function () {
        this.isTween = true;
        (!(this.rotationTween.isPlaying())) ? this.rotationTween.start() : ((this.rotationTween.isPaused())) ? this.rotationTween.play() : null;
    },

    pauseCameraRotation: function () {
        this.isTween = false;
        (this.rotationTween.isPlaying()) ? this.rotationTween.pause() : null;

    },

    fadeOutFilter: function (filterID) {
        var filter = this.getFilter(filterID);

        var position = {o: filter.material.opacity};
        var target = {o: 0};

        var fadeOutTween = new TWEEN.Tween(position).to(target, 200);

        fadeOutTween.onUpdate(function () {
            filter.setOpacity(position.o);
        });

        fadeOutTween.onComplete(function () {
            filter.isVisible = false;
            TWEEN.remove(this);
        });

        fadeOutTween.start();
    },

    fadeInFilter: function (filterID) {
        var filter = this.getFilter(filterID);
        var position = {o: filter.material.opacity};
        var target = {o: 1};

        var fadeOutTween = new TWEEN.Tween(position).to(target, 200);

        fadeOutTween.onUpdate(function () {
            filter.isVisible = true;
            filter.setOpacity(position.o);
        });

        fadeOutTween.onComplete(function () {
            TWEEN.remove(this);
        });

        fadeOutTween.start();
    },

    changeView: function (filterID) {
        var tweetColor = new THREE.Color(0x4099FF),
            retweetColor = new THREE.Color(0xE28C10),
            replyColor = new THREE.Color(0x81D056),
            filter = this.getFilter(filterID),
            _this = this,
            position,
            target;

        if (!filter.isDetailView) {
            this.scene.remove(filter.total);
            filter.tweets.material = filter.tweetMaterial;
            filter.retweets.material = filter.retweetMaterial;
            filter.replies.material = filter.replyMaterial;

            position = {
                r1: filter.material.color.r,
                g1: filter.material.color.g,
                b1: filter.material.color.b,

                r2: filter.material.color.r,
                g2: filter.material.color.g,
                b2: filter.material.color.b,

                r3: filter.material.color.r,
                g3: filter.material.color.g,
                b3: filter.material.color.b

            };

            target = {
                r1: tweetColor.r,
                g1: tweetColor.g,
                b1: tweetColor.b,

                r2: retweetColor.r,
                g2: retweetColor.g,
                b2: retweetColor.b,

                r3: replyColor.r,
                g3: replyColor.g,
                b3: replyColor.b

            };

            var changeTween = new TWEEN.Tween(position).to(target, 200);

            changeTween.onUpdate(function () {
                filter.setTweetColor(position.r1, position.g1, position.b1);
                filter.setLineColor(position.r1, position.g1, position.b1);
                filter.setRetweetColor(position.r2, position.g2, position.b2);
                filter.setReplyColor(position.r3, position.g3, position.b3);
            });

            changeTween.onComplete(function () {
                TWEEN.remove(this);
                filter.isDetailView = true;
            });

            changeTween.start();
        } else {
            target = {
                r1: filter.material.color.r,
                g1: filter.material.color.g,
                b1: filter.material.color.b,

                r2: filter.material.color.r,
                g2: filter.material.color.g,
                b2: filter.material.color.b,

                r3: filter.material.color.r,
                g3: filter.material.color.g,
                b3: filter.material.color.b

            };

            position = {
                r1: tweetColor.r,
                g1: tweetColor.g,
                b1: tweetColor.b,

                r2: retweetColor.r,
                g2: retweetColor.g,
                b2: retweetColor.b,

                r3: replyColor.r,
                g3: replyColor.g,
                b3: replyColor.b

            };

            var changeTween = new TWEEN.Tween(position).to(target, 200);

            changeTween.onUpdate(function () {
                filter.setTweetColor(position.r1, position.g1, position.b1);
                filter.setLineColor(position.r1, position.g1, position.b1);
                filter.setRetweetColor(position.r2, position.g2, position.b2);
                filter.setReplyColor(position.r3, position.g3, position.b3);
            });

            changeTween.onComplete(function () {
                TWEEN.remove(this);
                filter.isDetailView = false;
            });

            changeTween.start();
        }


    },

    zoomOutToOrigin: function(callback){
        this.controls.zoom('reset', 0.03);
        $("#overlay").addClass('flash');
        setTimeout(function(){ $("#overlay").removeClass('flash') }, 400);
        callback && setTimeout(function(){callback()}, 500);
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

    scaleSize: function (maxW, maxH, currW, currH) {

        var ratio = currH / currW;

        if (currW >= maxW && ratio <= 1) {
            currW = maxW;
            currH = currW * ratio;
        } else if (currH >= maxH) {
            currH = maxH;
            currW = currH / ratio;
        }

        return [currW, currH];
    },


    latLongToVector3: function (lat, lon, heigth, offset) {
        var phi = (lat) * Math.PI / 180;
        var theta = (lon - 180) * Math.PI / 180;
        var radius = (offset) ? (5 - heigth) : 5;

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

    calculateCP: function (factor, x1, y1, x2, y2, inverse) {

        var xC,
            yC;

        if (inverse) { // -- -> -+
            xC = x1 + ((x2 - x1) * factor);
            yC = y1 + ((y2 - y1) * factor);

            if (y2 > 0) {
                yC -= 360;
            } else {
                yC += 360;
            }

        } else {

            xC = x1 + ((x2 - x1) * factor);
            yC = y1 + ((y2 - y1) * factor);
        }

        return [xC, yC];
    },

    getFilter: function (filterID) {
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
    }
});

String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
