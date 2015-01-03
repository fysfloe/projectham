var express = require('express');
var router = express.Router();

function monk2rest(res) {
    return function(e,d) {
        if(e) return res.json(e);
        res.json(d);
    }
}

router.get('/', function(req,res) {
    req.db.get('userlist').find({}, monk2rest(res));
});

router.get('/:id', function(req, res) {
    req.db.get('userlist').findOne({_id: req.params.id}, monk2rest(res));
});

router.post('/', function(req, res) {
    req.db.get('userlist').insert(req.body, monk2rest(res));
});

router.delete('/:id', function(req, res) {
    req.db.get('userlist').remove({_id: req.params.id}, monk2rest(res));
});

router.put('/:id', function(req, res) {
    req.db.get('userlist').update({_id: req.params.id}, req.body, monk2rest(res));
});

module.exports = router;
