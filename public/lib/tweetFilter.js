var projectham = projectham || {};




projectham.GlobeFilter = function (name, color, id) {
    this.color = color ? color : 0x4099FF;

    this.total = new THREE.Mesh();
    this.total.name = "total_"+id;

    this.geom = new THREE.Geometry();
    this.total.name = "geom_"+id;

    this.retweets = new THREE.Mesh();
    this.retweets.name = "retweets_"+id;

    this.tweets = new THREE.Mesh();
    this.tweets.name = "tweets_"+id;

    this.replies = new THREE.Mesh();
    this.replies.name = "replies_"+id;

    this.alphaMap = THREE.ImageUtils.loadTexture('img/alpha_map_cube2.png')

    this.connections = new THREE.Group();

    this.opacity = 1;
    this.id = id;
    this.name = name;
    this.blending = THREE.AdditiveBlending;
    this.isVisible = true;
    this.isDetailView = false;

    this.material = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: this.alphaMap,
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.tweetMaterial = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: this.alphaMap,
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.retweetMaterial = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: this.alphaMap,
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.replyMaterial = new THREE.MeshBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: this.opacity,
        alphaMap: this.alphaMap,
        side: THREE.FrontSide,
        depthWrite: false
    });

    this.lineMaterial = new THREE.LineBasicMaterial({
        blending: this.blending,
        color: new THREE.Color(this.color),
        transparent: true,
        opacity: 0.5,
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