var request = require('request');
var Dropbox = require('dropbox')

var dbx = new Dropbox({accessToken: 'PUTNQdITp2UAAAAAAAASr04_JGUMS4kULPe9DU3LvNrrd1nyTu5c1ixv48eafae6'});
/**
 * Harcoded task id. Should be known to the user (requester) and can therefore be hardcoded.
 */
const existingTaskId = '58e53d116ba451013a5081c2';
const taskUnitsUrl = 'http://localhost:3333/api/tasks/' + existingTaskId + '/units';

const insertTask = (url) => {
    const unit = {
        content: {
            image_url: url
        }
    };

    console.log('inserting ' + url);

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

dbx.filesListFolder({path: ''}).then(function(response) {

    response.entries.forEach(file => {

        dbx.sharingCreateSharedLinkWithSettings({path: file.path_lower}).then(function(response) {
            insertTask(response.url);
        }).catch(function(error) {
            if (error.status === 409) {
                console.log('Dropbox file link exists. Probably already seeded then...')
            }
        });

    });
}).catch(function(error) {
    console.log(error);
});
