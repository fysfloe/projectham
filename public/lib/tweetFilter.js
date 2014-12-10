var projectham = projectham || {};


var filterCount = 0;

projectham.GlobeFilter = function (name, color) {
    this.color = color ? color : 0x4099FF;

    this.total = new THREE.Mesh();
    this.total.name = "total_"+filterCount;

    this.geom = new THREE.Geometry();
    this.total.name = "geom_"+filterCount;

    this.retweets = new THREE.Mesh();
    this.retweets.name = "retweets_"+filterCount;

    this.tweets = new THREE.Mesh();
    this.tweets.name = "tweets_"+filterCount;

    this.replies = new THREE.Mesh();
    this.replies.name = "replies_"+filterCount;

    this.connections = new THREE.Group();

    this.opacity = 1;
    this.id = filterCount++;
    this.name = name;
    this.blending = THREE.AdditiveBlending;

    this.material = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: this.color,
        transparent: true,
        opacity: this.opacity,
        alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube2.png'),
        side: THREE.FrontSide
    });

    this.setOpacity = function (val) {
        this.material.opacity = val;
        this.opacity = val;
    };

    this.setColor = function (color){
        this.color = color;
        this.material.color = color;
    }

};