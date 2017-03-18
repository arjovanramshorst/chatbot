var express = require('express');
var Task = require('../models/task');
var Unit = require('../models/unit');

var router = express.Router();

// Reset the entire tasks collection and seed some new data
router.get('/reset-and-seed', function(req, res) {
    removeAllTasks()
    addSingleTask(res)
});

const removeAllTasks = () => {
    // First remove all the current ones.
    Task.remove({}, function(err, task) {
        if (err)
            res.send(err);
    });
}

const addSingleTask = (res) => {
    var task = new Task();
    task.name = 'Some Test task';
    task.requester_id = 'whateveridfromsomerequesterinstring';
    task.external_sources = [{
        source_id: 'someidoftwitterofinstagram',
        parameters: {
            hastags: ['receipt', 'restaurant', 'delft'],
            hastag_separator: 'AND',
        }
    }];
    task.questions = [{
            question: 'Does the image show a readable receipt from a restaurant?',
            response_type: 'SELECT',
            response_select_options: ['yes', 'no']
        },
        {
            question: 'What is the name of the restaurant on the receipt?',
            response_type: 'FREE_TEXT',
        },
        {
            question: 'What is the total amount that should be paid?',
            response_type: 'NUMBER',
        },
    ];

    image_urls = [
        "http://www.bountifulutah.gov/file/828a35ca-9cb8-447c-9f55-c6973e3d981f",
        "https://www.cs.princeton.edu/~xinyi/images/GoogleLogo.png",
        "https://image.freepik.com/iconen-gratis/apple-logo_318-40184.jpg",
    ]

    for (var i = 0; i < 3; i++) {
        var unit = new Unit();
        unit.task_id = task.id;
        unit.content.image_url = image_urls[i];
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
