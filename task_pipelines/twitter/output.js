var request = require('request');
var json2csv = require('json2csv');
var fs = require('fs');
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existingTaskId = '58ea2224833029001fb5d00b';
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
            const fields = ['tweet_id', 'tweet_text', 'yes', 'no', 'dont_know'];
            const units = JSON.parse(body);
            const data = [];

            for (var i = 0; i < units.length; i++) {
                const solutions = units[i].solutions;
                const positives = 0;
                const neutrals = 0;
                const negatives = 0;

                for (var j = 0; j < solutions.length; j++) {
                    if (solutions[j].responses[0].toLowerCase() == 'yes') {
                        positives = positives + 1;
                    } else if (solutions[j].responses[0].toLowerCase() == 'no') {
                        negatives = negatives + 1;
                    } else if (solutions[j].responses[0].toLowerCase() == 'i dont know') {
                        neutrals = neutrals + 1
                    }
                }

                data.push({
                  'tweet_id': units[i].content.tweet_id,
                  'tweet_text': units[i].content.tweet_text,
                  'yes': positives,
                  'no': negatives,
                  'dont_know': neutrals
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
