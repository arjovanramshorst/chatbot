var request = require('request');
var json2csv = require('json2csv');
var fs = require('fs');

/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existingTaskId = '58e29d01c7882000261414f3';
const taskUnitsUrl = 'http://localhost:3333/api/tasks/' + existingTaskId + '/units';



request(taskUnitsUrl, function(error, response, body) {
    if (!error) {
        const fields = ['tweet_id', 'tweet_text'];
        const units = JSON.parse(body);
        const data = [];

        for (var i = 0; i < units.length; i++) {
            data.push({
                'tweet_id': units[i].content.tweet_id,
                'tweet_text': units[i].content.tweet_text
            })
        }

        const csv = json2csv({
            data: data,
            fields: fields
        });

        fs.writeFile('file.csv', csv, function(err) {
            if (err) throw err;
            console.log('File saved with output pipeline!');
        });

    } else {
        console.error(error)
    }
});
