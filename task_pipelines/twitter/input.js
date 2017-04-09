var request = require('request');
var Twitter = require('twitter-node-client').Twitter;
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existingTaskId = '58e29d01c7882000261414f3';
const taskUnitsUrl = 'http://localhost:3333/api/tasks/' + existingTaskId + '/units';

/**
 * Twitter configurations
 */
const config = {
    "consumerKey": "Fqza8FljBeMEqUfqb7sEAKjly",
    "consumerSecret": "qVuDFsKmPkTJIO9v7CwTa9IZtPeEBTxqqp26yCzO22w0QXeBxI",
    "accessToken": "793447190127665156-M7a6C8MrQBndspJ8U2fH6jzrZzaEQBc",
    "accessTokenSecret": "t2DZ9VvgzeMHBGxGxUl8eoOSkmBAdzzeoQPeMeDEUruQo"
};
const twitter = new Twitter(config);

// Process unit to check if we should add it to new units.
const validateTweetText = (text) => {
    required_words = [
        'obama',
        'obamacare',
        'president'
    ];
    for (var i = 0; i < required_words.length; i++) {
        if (text.toLowerCase().indexOf(required_words[i]) !== -1) {
            return true
        }
    }
    return false
};

const data = twitter.getUserTimeline({
    screen_name: 'realDonaldTrump',
    count: 1000
}, function() {
    res.status(404).send({
        "error": "No tweets found"
    });
}, function(data) {
    const json_result = JSON.parse(data);

    request(taskUnitsUrl, function(error, response, body) {
        if (!error) {
            const currentUnits = JSON.parse(body);
            const existingTweetIds = [];
            const newUnits = [];

            // Check which ones are already in the database
            for (var i = 0; i < currentUnits.length; i++) {
                const existingId = currentUnits[i].content.tweet_id
                existingTweetIds.push(existingId)
            }

            // Add tweets which are not yet in the database
            for (var i = 0; i < json_result.length; i++) {
                const id = json_result[i].id_str;
                const text = json_result[i].text;

                if (existingTweetIds.indexOf(id) === -1) {
                    if (validateTweetText(text)) {
                        newUnits.push({
                            content: {
                                tweet_id: id,
                                tweet_text: text
                            }
                        });
                    }
                }
            }

            for (var i = 0; i < newUnits.length; i++) {
                request.post({
                    url: taskUnitsUrl,
                    form: newUnits[i]
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        return console.error('Failed to add tweet:', err);
                    }
                    console.log('Success! Server response: ', body);
                });
            }

            console.log({
                'message': 'Successful insert!',
                'new units length': newUnits.length,
            });
        } else {
            console.error(error)
        }
    });
});