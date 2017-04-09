var request = require('request');
var json2csv = require('json2csv');
var fs = require('fs');
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
<<<<<<< HEAD
 const requesterId = 'hardcodedRequesterIdOne'
 const requesterTasksUrl = 'http://localhost:3333/api/requester/' + requesterId + '/tasks';
=======
const existingTaskId = '58ea3cbf16681b001fabc68f';
const taskUrl = 'http://localhost:3333/api/tasks/' + existingTaskId;
const taskUnitsUrl = taskUrl + '/units';
>>>>>>> docs

 request(requesterTasksUrl, function(error, response, body) {
   const jsonBody = JSON.parse(body)
   if(error || jsonBody.length !== 1) {
     console.log('Something went wrong. No or multiple tasks found for this user?');
   }
   else {
     const taskId = jsonBody[0]._id;
     const taskUrl = 'http://localhost:3333/api/tasks/' + taskId;
     const taskUnitsUrl = taskUrl + '/units';
     outputCSV(taskUnitsUrl);
   }
 });


const outputCSV = (taskUnitsUrl) => {
    request(taskUnitsUrl, function(error, response, body) {
        if (!error) {
            const fields = ['tweet_id', 'tweet_text', 'yes', 'no', 'dont_know'];
            const units = JSON.parse(body);
            const data = [];

            for (var i = 0; i < units.length; i++) {
                const solutions = units[i].solutions;
                var positives = 0;
                var neutrals = 0;
                var negatives = 0;

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
