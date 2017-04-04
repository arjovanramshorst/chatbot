var Dropbox = require('dropbox');

var dbx = new Dropbox({accessToken: 'PUTNQdITp2UAAAAAAAASr04_JGUMS4kULPe9DU3LvNrrd1nyTu5c1ixv48eafae6'});


dbx.filesListFolder({path: ''}).then(function(response) {

    response.entries.forEach(file => {

        dbx.sharingCreateSharedLinkWithSettings({path: file.path_lower}).then(function(response) {
            console.log(response.url);
        }).catch(function(error) {
          if(error.status === 409) {
            console.log('link already exists.')
          }
        });

    });
}).catch(function(error) {
    console.log(error);
});
