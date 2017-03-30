var express = require('express');
var request = require('request');

var router = express.Router();
var Twitter = require('twitter-node-client').Twitter;
/**
 * TODO: Move entire file to pipeline folder.
 */
const existing_task_id = '58dd0c742bc62b008dfeede4';
const task_units_url = 'http://localhost/api/tasks/' + existing_task_id + '/units';

var config = {
    "consumerKey": "Fqza8FljBeMEqUfqb7sEAKjly",
    "consumerSecret": "qVuDFsKmPkTJIO9v7CwTa9IZtPeEBTxqqp26yCzO22w0QXeBxI",
    "accessToken": "793447190127665156-M7a6C8MrQBndspJ8U2fH6jzrZzaEQBc",
    "accessTokenSecret": "t2DZ9VvgzeMHBGxGxUl8eoOSkmBAdzzeoQPeMeDEUruQo"
};
var twitter = new Twitter(config);

router.get('/twitter/tweet', function(req, res) {
    var data = twitter.getUserTimeline({
        screen_name: 'realDonaldTrump',
        count: 5
    }, function() {
        res.status(404).send({
            "error": "No tweets found"
        });
    }, function(data) {
        const json_result = JSON.parse(data);

        request(task_units_url, function (error, response, body) {
            if(!error) {
                const current_units = JSON.parse(body);

                // Check for tweet ids currently in database.
                const existing_tweet_ids = [];
                for (var i = 0; i < current_units.length; i++) {
                    const existing_id = current_units[i].content.tweet_id
                    console.log(existing_id)
                    existing_tweet_ids.push(existing_id)
                }

                // Add tweets which are not yet in the database
                const new_units = []
                for(var i = 0; i < json_result.length; i++) {
                    const id = json_result[i].id;
                    const text = json_result[i].text;

                    if(!existing_tweet_ids.includes(id)) {
                        new_units.push(id)
                    }
                }

                res.json({
                    'New units: ' : new_units
                })
            }
            else {
                res.send(error)
            }
        });
    });
});

module.exports = router;
