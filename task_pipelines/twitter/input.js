var request = require('request');
var Twitter = require('twitter-node-client').Twitter;
<<<<<<< HEAD
=======
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existingTaskId = '58ea3cbf16681b001fabc691';
const taskUrl = 'http://localhost:3333/api/tasks/' + existingTaskId;
const taskUnitsUrl = taskUrl + '/units';
>>>>>>> docs

const requesterId = 'hardcodedRequesterIdOne'
const requesterTasksUrl = 'http://localhost:3333/api/requester/' + requesterId + '/tasks';

request(requesterTasksUrl, function(error, response, body) {
  const jsonBody = JSON.parse(body)
  if(error || jsonBody.length !== 1) {
    console.log('Something went wrong. No or multiple tasks found for this user?');
  }
  else {
    const taskId = jsonBody[0]._id;
    const taskUrl = 'http://localhost:3333/api/tasks/' + taskId;
    const taskUnitsUrl = taskUrl + '/units';
    insertTweets(taskUrl, taskUnitsUrl);
  }
});

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
    filterWords = [
        'fuck',
        'sex',
        'sexy',
        'nude',
        'busty',
        'swingers',
        'naked',
        'shit',
        'amateur',
        'titty',
        'relationships',
        'deepthroat',
        'bigboob',
        'skypefun',
        'camshow',
        'bigtit',
        'kikmessenger',
        'bj',
        'hotsluts',
        'beach',
        'sluts',
        'wank',
        'creampie',
        'swinger',
        'facials',
        'rimming',
        'orgy',
        'fav',
        'interracial',
        'companion',
        'nylon',
        'strapon',
        'porno',
        'milfs',
        'august',
        'cumprincess',
        'tugjob',
        'couple',
        'nipples',
        'ebony',
        'latex'
    ];
    for (var i = 0; i < filterWords.length; i++) {
        if (text.toLowerCase().indexOf(filterWords[i]) !== -1) {
            return false
        }
    }
    return true
};

const insertTweets = (taskUrl, taskUnitsUrl) => {
    const data = twitter.getSearch({
        'q': '#delft',
        'count': 100
    }, function() {
        res.status(404).send({"error": "No tweets found"});
    }, function(data) {
        const json_result = JSON.parse(data).statuses;

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
                    const screenName = json_result[i].user.screen_name;
                    const text = json_result[i].text;

                    const tweet_text = '@' + screenName + ' tweeted: ' + text

                    if (existingTweetIds.indexOf(id) === -1) {
                        if (validateTweetText(text)) {
                            newUnits.push({
                                content: {
                                    tweet_id: id,
                                    tweet_text: tweet_text
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

                console.log({'message': 'Successful insert!', 'new units length': newUnits.length});
            } else {
                console.error(error)
            }
        });
    });
}
