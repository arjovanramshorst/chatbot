var request = require('request');
var Twitter = require('twitter-node-client').Twitter;
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existing_task_id = '58dd588617254c0bc175508e';
const task_units_url = 'http://localhost:3333/api/tasks/' + existing_task_id + '/units';

/**
 * Twitter configurations
 */
var config = {
    "consumerKey": "Fqza8FljBeMEqUfqb7sEAKjly",
    "consumerSecret": "qVuDFsKmPkTJIO9v7CwTa9IZtPeEBTxqqp26yCzO22w0QXeBxI",
    "accessToken": "793447190127665156-M7a6C8MrQBndspJ8U2fH6jzrZzaEQBc",
    "accessTokenSecret": "t2DZ9VvgzeMHBGxGxUl8eoOSkmBAdzzeoQPeMeDEUruQo"
};
var twitter = new Twitter(config);

var data = twitter.getUserTimeline({
    screen_name: 'realDonaldTrump',
    count: 1000
}, function () {
    res.status(404).send({
        "error": "No tweets found"
    });
}, function (data) {
    const json_result = JSON.parse(data);

    request(task_units_url, function (error, response, body) {
        if (!error) {
            const current_units = JSON.parse(body);
            // Check for tweet ids currently in database.
            const existing_tweet_ids = [];

            for (var i = 0; i < current_units.length; i++) {
                const existing_id = current_units[i].content.tweet_id
                existing_tweet_ids.push(existing_id)
            }

            // Add tweets which are not yet in the database
            const new_units = []
            for (var i = 0; i < json_result.length; i++) {
                const id = json_result[i].id_str;
                const text = json_result[i].text;

                if (existing_tweet_ids.indexOf(id) < 0) {
                    new_units.push({content: {tweet_id: id, tweet_text: text}});
                }
            }
            console.log('new: ' + new_units)

            for (var i = 0; i < new_units.length; i++) {
                request.post({
                    url: task_units_url,
                    form: new_units[i]
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        return console.error('Failed to add tweet:', err);
                    }
                    console.log('Success! Server response: ', body);
                });
            }

            console.log({
                'message': 'Successful insert!',
                'new units length': new_units.length,
                'new units': new_units
            })
        } else {
            console.error(error)
        }
    });
});
