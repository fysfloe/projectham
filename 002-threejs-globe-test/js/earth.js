(function () {
    var width = window.innerWidth,
        height = window.innerHeight,
        container = document.getElementById('earth');
        console.log(container);

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000);
    camera.position.z = 1.5;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    scene.add(new THREE.AmbientLight(0x333333));

    var light = new THREE.SpotLight(0xffffff,1);
    scene.add(light);

    var earth = new THREE.Mesh(
        new THREE.SphereGeometry(.5, 32, 32),
        new THREE.MeshPhongMaterial({
            map: THREE.ImageUtils.loadTexture('img/5_night_8k.jpg'),
            specularMap: THREE.ImageUtils.loadTexture('img/water_4k.png'),
            specular: new THREE.Color('white'),
            shininess: 4
        })
    );
    scene.add(earth);

    var texture = THREE.ImageUtils.loadTexture( 'img/galaxy_starfield.png' );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1 , 1 );

    var stars = new THREE.Mesh(
        new THREE.SphereGeometry(90, 64, 64),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
        })
    );
    scene.add(stars);
    var controls = new THREE.TrackballControls(camera);

    container.appendChild(renderer.domElement);

    render();

    function render() {
        controls.update();
        // Add Light to camera not to scene
        light.position.copy( camera.position );
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    renderer.setSize(width, height);
}());