var request = require('request');
var json2csv = require('json2csv');
var fs = require('fs');
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existingTaskId = '58e9feb95020aa002d0ab018';
const taskUrl = 'http://localhost:3333/api/tasks/' + existingTaskId;
const taskUnitsUrl = taskUrl + '/units';

request(taskUrl, function(error, response, body) {
    if (error || JSON.parse(body).error) {
        console.log('Something went wrong. Probably the id of the task is wrong.')
    } else {
        console.log('Found task! Lets add some tweets.');
        outputCSV()
    }
});

const outputCSV = () => {
    request(taskUnitsUrl, function(error, response, body) {
        if (!error) {
            const fields = ['tweet_id', 'tweet_text', 'rated_positive', 'rated_neutral', 'rated_negative'];
            const units = JSON.parse(body);
            const data = [];

            for (var i = 0; i < units.length; i++) {
                const solutions = units[i].solutions;
                const positives = 0;
                const neutrals = 0;
                const negatives = 0;

                for (var j = 0; j < solutions.length; j++) {
                    if (solutions[j].responses[0] == 'positive') {
                        positives = positives + 1;
                    } else if (solutions[j].responses[0] == 'negatives') {
                        negatives = negatives + 1;
                    } else if (solutions[j].responses[0] == 'neutrals') {
                        neutrals = neutrals + 1
                    }
                }

                data.push({
                  'tweet_id': units[i].content.tweet_id,
                  'tweet_text': units[i].content.tweet_text,
                  'rated_positive': positives,
                  'rated_neutral': neutrals,
                  'rated_negative': negatives
                });
            }

            const csv = json2csv({data: data, fields: fields});

            fs.writeFile('file.csv', csv, function(err) {
                if (err)
                    throw err;
                console.log('File saved with output pipeline!');
            });

        } else {
            console.error(error)
        }
    });
}
