var express = require('express');
var Task = require('../../../core/models/task');
var Unit = require('../../../core/models/unit');

var router = express.Router();

// Reset the entire tasks collection and seed some new data
router.get('/reset-and-seed', function (req, res) {
    removeAllTasks(res);
    addSentimentTask(res);
    addLocalFilesTask(res);
    addContentCreationTask(res);
    res.json({ message: 'Finished!' })
});

const removeAllTasks = (res) => {
    // First remove all the current ones.
    Task.remove({}, function (err) {
        if (err)
            res.send(err);
    });
}

const addSentimentTask = (res) => {
    var task = new Task();
    task.name = 'Delft tweet relevance judgement';
    task.requester_id = 'hardcodedRequesterIdOne';
    task.description = 'Would these tweets be interesting for the official Delft Twitter account to retweet?';
    task.content_definition.content_type = 'TEXT_LIST';
    task.content_definition.content_fields = {
        'text': 'content.tweet_text',
    };
    task.questions = [{
        question: 'Should the official Delft twitter account retweet this tweet?',
        response_definition: {
            'response_type': 'SELECT',
            'response_select_options': [
                'Yes', 'No', 'I dont know'
            ]
        }
    }];

    task.save(function (err) {
        if (err)
            res.send(err);
        else
            console.log('Delft tweets task seeded!')
    });
}

const addLocalFilesTask = (res) => {
    var task = new Task();
    task.name = 'Delft image archive categorization';
    task.requester_id = 'hardcodedRequesterIdTwo';
    task.description = 'Newly digitized photos need to be categorized to be added to the Delft Image Archive.';
    task.content_definition.content_type = 'IMAGE_LIST';
    task.content_definition.content_fields = {
        'image_1': 'content.image_url',
    };
    task.questions = [{
        question: 'How well do you think this image belongs to category HISTORY?',
        response_definition: {
            'response_type': 'SELECT',
            'response_select_options': [
                'Very much', 'Quite well', 'Medium', 'Not really', 'Not at all'
            ]
        }
    },
    {
        question: 'How well do you think this image belongs to category TOPOLOGY?',
        response_definition: {
            'response_type': 'SELECT',
            'response_select_options': [
                'Very much', 'Quite well', 'Medium', 'Not really', 'Not at all'
            ]
        }
    },
    {
        question: 'How well do you think this image belongs to category PORTRAITS?',
        response_definition: {
            'response_type': 'SELECT',
            'response_select_options': [
                'Very much', 'Quite well', 'Medium', 'Not really', 'Not at all'
            ]
        }
    }];

    task.save(function (err) {
        if (err)
            res.send(err);
        else
            console.log('Local images dropbox seeded!')
    });
}


const addContentCreationTask = (res) => {
    var task = new Task();
    task.name = 'Content creation task';
    task.requester_id = 'hardcodedRequesterIdThree';
    task.description = 'The municipality wants to get insight in when particular Point of Interests are busy.';
    task.content_definition.content_type = 'TEXT_LIST';
    task.content_definition.content_fields = {
        'text': 'content.content_description',
    };
    task.questions = [{
        question: 'Please take a picture of the people at this Point of Interest',
        response_definition: {
            'response_type': 'IMAGE',
        }
    }];

    descriptions = [
        {'content_description': 'Markt (Plaza between City Hall and Nieuwe Kerk) during the weekends'},
        {'content_description': 'New train station between 17:00 and 18:00.'},
        {'content_description': 'Beestenmarkt at Fridays between 16:00 and 22:00.'},
        {'content_description': 'Museum Prinsenhof during the weekends.'}
    ];

    for (var i = 0; i < descriptions.length; i++) {
        var unit = new Unit();
        unit.task_id = task.id;
        unit.content = descriptions[i];

        unit.save(function (err) {
            if (err)
                res.send(err);
        });
    }

    task.save(function (err) {
        if (err)
            res.send(err);
        else
            console.log('Content creation task seeded!')
    });
}


module.exports = router;
