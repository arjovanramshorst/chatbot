var request = require('request');
var Dropbox = require('dropbox')

var dbx = new Dropbox({accessToken: 'PUTNQdITp2UAAAAAAAASr04_JGUMS4kULPe9DU3LvNrrd1nyTu5c1ixv48eafae6'});
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existingTaskId = '58ea38b597c2340020894e40';
const taskUrl = 'http://localhost:3333/api/tasks/' + existingTaskId;
const taskUnitsUrl = taskUrl + '/units';

request(taskUrl, function(error, response, body) {
    if (error || JSON.parse(body).error) {
        console.log('Something went wrong. Probably the id of the task is wrong.')
    } else {
        console.log('Found task! Lets add some files from dropbox.');
        insertNewUnits()
    }
});

/**
* TODO: Process image to make it an actual pipeline.
*/

const insertUnit = (url) => {
    const unit = {
        content: {
            image_url: url
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

const insertNewUnits = () => {
    dbx.filesListFolder({path: ''}).then(function(response) {

        response.entries.forEach(file => {

            dbx.sharingCreateSharedLinkWithSettings({path: file.path_lower}).then(function(response) {
                const url = response.url.substr(0,response.url.length -1) + '1' // To make sure it becomes visible in Telegram. Not so clean.
                insertUnit(url);
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
