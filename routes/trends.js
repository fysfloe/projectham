var express = require('express');
var router = express.Router();

function monk2rest(res) {
    return function(e,d) {
        if(e) return res.json(e);
        res.json(d);
    }
}

router.get('/', function(req,res) {
    req.db.get('trendslist').find({}, monk2rest(res));
});

module.exports = router;
