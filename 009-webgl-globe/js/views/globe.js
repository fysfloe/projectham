/**
 * Created by Benedikt on 17.11.2014.
 */
var dataGlobe = dataGlobe || {};

dataGlobe.GlobeView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render', '_updateScene', 'latLongToVector3', 'buildAxes', 'displayData');
    },

    render: function (options) {
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
        this.camera.position.z = this.distance // 1.5
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(this.ambientLight);

        this.spotLight = new THREE.SpotLight(0xffffff, 1);
        this.scene.add(this.spotLight);

        this.scene.add(new THREE.DirectionalLight(0xffffff, 0.5));

        this.globeMaterialFront = new THREE.MeshLambertMaterial({
            color: 0x444444,
           // map: THREE.ImageUtils.loadTexture(this.mapSrc),
            // specularMap: THREE.ImageUtils.loadTexture(this.specularMapSrc),
            // specular: new THREE.Color(this.specularColor),
            alphaMap: THREE.ImageUtils.loadTexture('img/water_4k_inv_light_grey.png'),
            //shininess: 4
            transparent: true,
            opacity: 1,
            side: THREE.FrontSide
        })

        //Initialize Globe
        this.globeFront = new THREE.Mesh(
            new THREE.SphereGeometry(5, 50, 50),
            this.globeMaterialFront
        );

        this.globeMaterialBack = new THREE.MeshLambertMaterial({
            color: 0x444444,
            //map: THREE.ImageUtils.loadTexture(this.mapSrc),
            // specularMap: THREE.ImageUtils.loadTexture(this.specularMapSrc),
            // specular: new THREE.Color(this.specularColor),
            alphaMap: THREE.ImageUtils.loadTexture('img/water_4k_inv_grey.png'),
            //shininess: 4
            transparent: true,
            opacity: 1,
            side: THREE.BackSide

        })

        //Initialize Globe
        this.globeBack = new THREE.Mesh(
            new THREE.SphereGeometry(5, 50, 50),
            this.globeMaterialBack
        );



        var customMaterial = new THREE.ShaderMaterial(
            {
                uniforms: {  },
                vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
                fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            }   );

        var ballGeometry = new THREE.SphereGeometry( 5.9, 32, 16 );
        var ball = new THREE.Mesh( ballGeometry, customMaterial );
        this.scene.add( ball );
        this.scene.add(this.globeFront);

        this.scene.add(this.globeBack);

        //Initialize Background ("Space")
        this.BGtexture = THREE.ImageUtils.loadTexture(this.bgSrc);
        this.BGtexture.wrapS = this.BGtexture.wrapT = THREE.RepeatWrapping;
        this.BGtexture.repeat.set(1, 1);

        this.spaceSphere = new THREE.Mesh(
            new THREE.SphereGeometry(900, 64, 64),
            new THREE.MeshBasicMaterial({
                map: this.BGtexture,
                side: THREE.BackSide
            })
        );
        this.scene.add(this.spaceSphere);


        //this.scene.add(this.buildAxes(1000));


        // Fallback WebGL to Canvas Renderer
        if (window.WebGlRenderingContext || document.createElement('canvas').getContext('experimental-webgl')) {
            this.renderer = new THREE.WebGLRenderer({
                //antialias: true,
                //preserveDrawingBuffer: false
            });
        } else {
            this.renderer = new THREE.CanvasRenderer();
        }
        this.renderer.setSize(this.width, this.height);

        this.$el.html(this.renderer.domElement);

        // Enable Trackball
        this.controls = options.enableTrackball ? new THREE.TrackballControls(this.camera) : null;

        this._updateScene();


        return this;
    },

    _updateScene: function () {
        var updateScene = this._updateScene;
        requestAnimationFrame(updateScene);
        this.controls ? this.controls.update() : null;
        this.spotLight.position.copy(this.camera.position);
        this.renderer.render(this.scene, this.camera);

    },


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

    displayData: function (data, material) {
        this.geom = new THREE.Geometry();
        this.cubeMat = material || new THREE.MeshLambertMaterial({
            //color: '0xffffff',
            emissive: '0xffffff',
            opacity: 1,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide
        });
        this.data = data || null;

        var arrayData = this.CSVToArray(this.data);

        console.log(arrayData);

        var highestValue = 0;
        arrayData.forEach(function (entry) {
            if (parseInt(entry[0]) > highestValue) {
                highestValue = entry[0];
            }
        });

        for (var i = 0; i < arrayData.length - 1; i++) {
            //get the data, and set the offset, we need to do this since the x,y coordinates
            //from the data aren't in the correct format
            var entry = arrayData[i];

            var x = parseFloat(entry[1]);
            var y = parseFloat(entry[2]);
            var value = (parseInt(entry[0]) / highestValue < 0.1 ? 0.1 : parseInt(entry[0]) / highestValue) * 2;
            //var value = 0.2
            // calculate the position where we need to start the cube
            var position = this.latLongToVector3(x, y, value / 2);
            // create the cube
            var cube = new THREE.Mesh(new THREE.BoxGeometry(.01, .01, value, 1, 1, 1), this.cubeMat);

            // position the cube correctly
            cube.translateX(position.x);
            cube.translateY(position.y);
            cube.translateZ(position.z);

            cube.lookAt(new THREE.Vector3(0, 0, 0));


            // merge with main model
            cube.updateMatrix();
            this.geom.merge(cube.geometry, cube.matrix);


        }


        // create a new mesh, containing all the other meshes.
        var total = new THREE.Mesh(this.geom, this.cubeMat);

        // and add the total mesh to the scene
        this.scene.add(total);

    },

    displayLineData: function (data) {
        this.data = data || null;

        var arrayData = this.CSVToArray(this.data);
        var geom = new THREE.Geometry();
        var geom2 = new THREE.Geometry();
        var geom3 = new THREE.Geometry();

        var lineMaterial = new THREE.LineBasicMaterial({
            color: 0x3fbaf3,
            transparent: true,
            opacity: 0.2,
            linewidth: 1
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





        for (var i = 0; i < 10; i++) {
            var x = parseFloat(arrayData[i][0]);
            var y = parseFloat(arrayData[i][1]);

            var x2 = parseFloat(arrayData[i][2]);
            var y2 = parseFloat(arrayData[i][3]);

            var x3 = (x+x2)/2;
            var y3 = (y+y2)/2;


            var position1 = this.latLongToVector3(x, y, 0.1);
            var position2 = this.latLongToVector3(x2, y2, 0.1);
            var position3 = this.latLongToVector3(x3, y3, 1);
            //var position3 = this.calculateMidPoint(x,y,x2,y2,2);

           /* var cp = new THREE.CurvePath();
            cp.add(new THREE.CQuadraticBezierCurve3(position1, position3, position2));

            var lineMesh = new THREE.Mesh(cp.createPointsGeometry(100), lineMaterial);
            geom.merge(lineMesh.geometry, lineMesh.matrix);*/

            var cube = new THREE.Mesh(new THREE.BoxGeometry(.01, .01, 0.2, 1, 1, 1), lineMaterial);
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
            geom3.merge(cube3.geometry, cube3.matrix);



        }

      /*  console.log(geom);
        var total = new THREE.Line(geom, lineMaterial);
        this.scene.add(total);*/

        var total = new THREE.Mesh(geom, lineMaterial);
        var total2 = new THREE.Mesh(geom2, lineMaterial2);
        var total3 = new THREE.Mesh(geom3, lineMaterial3);
        this.scene.add(total);
        this.scene.add(total2);
        this.scene.add(total3);
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

        var lon = Math.atan2(x,y);
        var hyp = Math.sqrt(x*x+y*y);
        var lat = Math.atan2(hyp,z);

        var LAT = lat * (180/Math.PI);
        var LON = lon * (180/Math.PI);

        return this.latLongToVector3(LAT,LON, height);


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