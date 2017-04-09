var request = require('request');
var Dropbox = require('dropbox')

var dbx = new Dropbox({accessToken: 'PUTNQdITp2UAAAAAAAASr04_JGUMS4kULPe9DU3LvNrrd1nyTu5c1ixv48eafae6'});

const requesterId = 'hardcodedRequesterIdTwo'
const requesterTasksUrl = 'http://localhost:3333/api/requester/' + requesterId + '/tasks';

request(requesterTasksUrl, function(error, response, body) {
    const jsonBody = JSON.parse(body)
    if (error || jsonBody.length !== 1) {
        console.log('Something went wrong. No or multiple tasks found for this user?');
    } else {
        const taskId = jsonBody[0]._id;
        const taskUnitsUrl = 'http://localhost:3333/api/tasks/' + taskId + '/units';
        insertNewUnits(taskUnitsUrl);
    }
});

/**
* TODO: Process image to make it an actual pipeline.
*/

const insertUnit = (imageUrl, taskUnitsUrl) => {
    console.log('inserting new image...')
    const unit = {
        content: {
            image_url: imageUrl
        }
    };
    request.post({
        url: taskUnitsUrl,
        form: unit
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('Failed to add image:', err);
        }
        console.log('Success! Server response: ', body);
    });
};

const insertNewUnits = (taskUnitsUrl) => {
    dbx.filesListFolder({path: ''}).then(function(response) {

        response.entries.forEach(file => {

            dbx.sharingCreateSharedLinkWithSettings({path: file.path_lower}).then(function(response) {
                const imageUrl = response.url.substr(0, response.url.length - 1) + '1' // To make sure it becomes visible in Telegram. Not so clean.
                insertUnit(imageUrl, taskUnitsUrl);
            }).catch(function(error) {
                if (error.status === 409) {
                    console.log('Dropbox file link exists. Probably already seeded then...')
                }
            });
        });
    }).catch(function(error) {
        console.log(error);
    });
}
