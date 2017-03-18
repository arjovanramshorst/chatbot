module.exports = require('../../node_modules/twitter-js-client/lib/Twitter');

var express = require('express');
var Task = require('../models/task');
var Unit = require('../models/unit');

var router = express.Router();

/**
 * Twitter settings
 */
var config = {
    "consumerKey": "Fqza8FljBeMEqUfqb7sEAKjly",
    "consumerSecret": "qVuDFsKmPkTJIO9v7CwTa9IZtPeEBTxqqp26yCzO22w0QXeBxI",
    "accessToken": "793447190127665156-M7a6C8MrQBndspJ8U2fH6jzrZzaEQBc",
    "accessTokenSecret": "t2DZ9VvgzeMHBGxGxUl8eoOSkmBAdzzeoQPeMeDEUruQo"
};
var twitter = new module.exports.Twitter(config);

//post to retrieve user data
router.get('/twitter/tweet', function (req, res) {
    var data = twitter.getTweet({ id: '842161536437235712'}, function(){
        res.status(404).send({
            "error" : "No tweets found"
        });
    }, function(data){
        res.send({"tweet" : data});
    });
});

module.exports = router;
