var express = require('express');
var Task = require('../../../core/models/task');
var Unit = require('../../../core/models/unit');

var router = express.Router();

// Reset the entire tasks collection and seed some new data
router.get('/reset-and-seed', function(req, res) {
    removeAllTasks();
    addSingleTask(res)
});

var removeAllTasks = () => {
    // First remove all the current ones.
    Task.remove({}, function(err) {
        if (err)
            res.send(err);
    });
}

var addSingleTask = (res) => {
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
        {
            question: 'Send a picture?',
            response_definition: {
                'reponse_type': 'IMAGE',
            }
        }
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
        unit.save(function(err) {
            if (err)
                res.send(err);
        });
    }

    task.save(function(err) {
        if (err)
            res.send(err);
        else
            res.json({
                message: 'Successfully seeded! Good luck!'
            });
    });
}

module.exports = router;
