var request = require('request');
var json2csv = require('json2csv');
var fs = require('fs');

const requesterId = 'hardcodedRequesterIdTwo'
const requesterTasksUrl = 'http://localhost:3333/api/requester/' + requesterId + '/tasks';

request(requesterTasksUrl, function(error, response, body) {
    const jsonBody = JSON.parse(body)
    if (error || jsonBody.length !== 1) {
        console.log('Something went wrong. No or multiple tasks found for this user?');
    } else {
        const taskId = jsonBody[0]._id;
        const taskUrl = 'http://localhost:3333/api/tasks/' + taskId;
        const taskUnitsUrl = taskUrl + '/units';
        outputCSV(taskUnitsUrl);
    }
});

const determineAgreement = (unit) => {
    var categoryAgreement = [];
    if (unit.solutions.length > 0) {
        for (var i = 0; i < unit.solutions[0].responses.length; i++) {
            const counts = {};
            var agreement = {
                value: '',
                max: 0,
                certainty: 0
            };

            for (var j = 0; j < unit.solutions.length; j++) {
                const solution = unit.solutions[j];
                const solutionResponse = solution.responses[i];

                counts[solutionResponse] = counts[solutionResponse]
                    ? counts[solutionResponse] + 1
                    : 1;

                if (counts[solutionResponse] > agreement.max) {
                    agreement.value = solutionResponse;
                    agreement.max = counts[solutionResponse];
                }
            }
            agreement.certainty = agreement.max / unit.solutions.length
            categoryAgreement[i] = agreement;
        }
    }
    return categoryAgreement;
}

const outputCSV = (taskUnitsUrl) => {
    request(taskUnitsUrl, function(error, response, body) {
        if (!error) {
            const fields = [
                'image_url',
                'history',
                'history_certainty',
                'portraits',
                'portraits_certainty',
                'topology',
                'topology_certainty'
            ];
            const units = JSON.parse(body);
            const data = [];

            for (var i = 0; i < units.length; i++) {
                const agreement = determineAgreement(units[i]);

                data.push({
                    'image_url': units[i].content.image_url,
                    'history': agreement[0]
                        ? agreement[0].value
                        : '',
                    'history_certainty': agreement[0]
                        ? agreement[0].certainty
                        : 0,
                    'portraits': agreement[1]
                        ? agreement[1].value
                        : '',
                    'portraits_certainty': agreement[1]
                        ? agreement[1].certainty
                        : 0,
                    'topology': agreement[2]
                        ? agreement[2].value
                        : '',
                    'topology_certainty': agreement[2]
                        ? agreement[2].certainty
                        : 0
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
