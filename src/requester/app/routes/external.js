var express = require('express');

var router = express.Router();
var Twitter = require('twitter-node-client').Twitter;
/**
 * TODO Remove this: This is no longer valid.
 */
var config = {
    "consumerKey": "Fqza8FljBeMEqUfqb7sEAKjly",
    "consumerSecret": "qVuDFsKmPkTJIO9v7CwTa9IZtPeEBTxqqp26yCzO22w0QXeBxI",
    "accessToken": "793447190127665156-M7a6C8MrQBndspJ8U2fH6jzrZzaEQBc",
    "accessTokenSecret": "t2DZ9VvgzeMHBGxGxUl8eoOSkmBAdzzeoQPeMeDEUruQo"
};
var twitter = new Twitter(config);

/**
 * TODO Remove this. This is no longer valid.
 */
router.get('/twitter/tweet', function(req, res) {
    var data = twitter.getSearch({
        'q': '#receipt',
        'count': 20,
        'filter': 'images'
    }, function() {
        res.status(404).send({
            "error": "No tweets found"
        });
    }, function(data) {
        res.send(
            data
        );
    });
});

module.exports = router;
