var express = require('express');
var Task = require('../../../core/models/task');
var Unit = require('../../../core/models/unit');

var router = express.Router();

// Reset the entire tasks collection and seed some new data
router.get('/reset-and-seed', function (req, res) {
    removeAllTasks();
    addImageListTask(res)
    addSentimentTask(res)
    addLocalFilesTask(res)
});

var removeAllTasks = () => {
    // First remove all the current ones.
    Task.remove({}, function (err) {
        if (err)
            res.send(err);
    });
}

var addImageListTask = (res) => {
    var task = new Task();
    task.name = 'Some Test task';
    task.requester_id = 'whateveridfromsomerequesterinstring';
    task.content_definition.content_type = 'IMAGE_LIST';
    task.content_definition.content_fields = {
        'image_1': 'content.image_url_first',
        'image_2': 'content.image_url_second'
    }
    task.questions = [{
        question: 'Does the image show a readable receipt from a restaurant?',
        response_definition: {
            'response_type': 'SELECT',
            'response_select_options': [
                'yes', 'no'
            ]
        },
    },
        {
            question: 'What is the name of the restaurant on the receipt?',
            response_definition: {
                'response_type': 'FREE_TEXT',
                'response_length': 100
            },
        },
        {
            question: 'What is the total amount that should be paid?',
            response_definition: {
                'response_type': 'NUMBER',
            },
        },
    ];

    image_urls = [
        "https://upload.wikimedia.org/wikipedia/commons/0/0b/ReceiptSwiss.jpg",
        "http://www.makereceipts.com/receipt_preview.jpg",
        "https://stilgherrian.com/wp-content/uploads/2011/01/cabcharge-receipt-20110105-500w.jpg"
    ];

    for (var i = 0; i < image_urls.length; i++) {
        var unit = new Unit();
        unit.task_id = task.id;
        unit.content = {
            'image_url_first': image_urls[i],
            'image_url_second': image_urls[(i + 1) % 3]
        }
        unit.save(function (err) {
            if (err)
                res.send(err);
        });
    }

    task.save(function (err) {
        if (err)
            res.send(err);
        else
            res.json({
                message: 'Successfully seeded! Good luck!'
            });
    });
}

var addSentimentTask = (res) => {
    var task = new Task();
    task.name = 'Some Sentiment task for D. Trump tweets';
    task.requester_id = 'whateveridfromsomerequesterinstring';
    task.content_definition.content_type = 'TEXT';
    task.content_definition.content_fields = {
        'text': 'content.tweet_text',
    };
    task.questions = [{
        question: 'What is the sentiment of the tweet text shown?',
        response_definition: {
            'response_type': 'SELECT',
            'response_select_options': [
                'positivie', 'negative', 'neutral'
            ]
        }
    }];

    tweets = [
        {'tweet_id': Math.floor(Math.random() * 1000) + 1000, 'tweet_text': 'This is awesome!.'},
        {'tweet_id': Math.floor(Math.random() * 1000) + 1000, 'tweet_text': 'This is stupd!.'},
        {'tweet_id': Math.floor(Math.random() * 1000) + 1000, 'tweet_text': 'This is fine.'}
    ];

    for (var i = 0; i < tweets.length; i++) {
        var unit = new Unit();
        unit.task_id = task.id;
        unit.content = tweets[i];

        unit.save(function (err) {
            if (err)
                res.send(err);
        });
    }

    task.save(function (err) {
        if (err)
            res.send(err);
        else
            console.log('sentiment twitter seeded')
    });
}

var addLocalFilesTask = (res) => {
    var task = new Task();
    task.name = 'Some local folder images task for pipeline';
    task.requester_id = 'whateveridfromsomerequesterinstring';
    task.content_definition.content_type = 'IMAGE_LIST';
    task.content_definition.content_fields = {
        'image_1': 'content.image_url',
    };
    task.questions = [{
        question: 'What do you think of the image shown?',
        response_definition: {
            'response_type': 'SELECT',
            'response_select_options': [
                'nice', 'awful'
            ]
        }
    }];

    images = [
        {'image_url': 'https://www.dropbox.com/s/49e0ij21awcaqx4/trump2.jpg?dl=0'},
        {'image_url': 'https://www.dropbox.com/s/pht7c0fp5sjgol9/trump3.jpg?dl=0'}
    ];

    for (var i = 0; i < images.length; i++) {
        var unit = new Unit();
        unit.task_id = task.id;
        unit.content = images[i];

        unit.save(function (err) {
            if (err)
                res.send(err);
        });
    }

    task.save(function (err) {
        if (err)
            res.send(err);
        else
            console.log('local images twitter seeded')
    });
}


module.exports = router;
