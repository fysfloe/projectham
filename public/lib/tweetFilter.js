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
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube2.png'),
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.tweetMaterial = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube2.png'),
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.retweetMaterial = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube2.png'),
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.replyMaterial = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: THREE.ImageUtils.loadTexture('img/alpha_map_cube2.png'),
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.lineMaterial = new THREE.LineBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: 0.5,
        linewidth: 1,
        depthWrite: false
    });

    this.setOpacity = function (val) {
        this.material.opacity = val;
        this.tweetMaterial.opacity = val;
        this.retweetMaterial.opacity = val;
        this.replyMaterial.opacity = val;
        this.lineMaterial.opacity = val;
        this.opacity = val;
    };

    this.setColor = function (color){
        this.color = color;
        this.material.color = color;
        this.lineMaterial.color = color;
    }

    this.setTweetColor = function (r,g,b){
        this.tweetMaterial.color.setRGB(r,g,b);
    }
    this.setRetweetColor = function (r,g,b){
        this.retweetMaterial.color.setRGB(r,g,b);
    }
    this.setReplyColor = function (r,g,b){
        this.replyMaterial.color.setRGB(r,g,b);
    }
    this.setLineColor = function (r,g,b){
        this.lineMaterial.color.setRGB(r,g,b);
    }

};