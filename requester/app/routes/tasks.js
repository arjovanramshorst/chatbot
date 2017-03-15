var express = require('express');
var Task = require('../models/task');

var router = express.Router();

router.route('/')

    // create a task
    .post(function(req, res) {

        var task = new Task(); // create a new instance of the Task model
        task.name = req.body.name; // set the tasks name (comes from the request)

        task.save(function(err) {
            if (err)
                res.send(err);

            res.json({
                message: 'Task created!'
            });
        });
    })

    // get all the tasks
    .get(function(req, res) {
        Task.find({}, function(err, tasks) {
            if (err)
                res.send(err)

            res.json({
                taskarray: tasks
            });
        });
    });

// Reset the entire tasks collection and seed new ones.
router.get('/reset-and-seed', function(req, res) {
    // First remove all the current ones.
    Task.remove({}, function(err, task) {
        if (err)
            res.send(err);
    });
    // Then insert a new one.
    var task = new Task();
    task.name = 'Some Test task';
    task.requester_id = 'whateveridfromsomerequesterinstring';
    task.sources = [{
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

    task.save(function(err) {
        if (err)
            res.send(err);
        else
            res.json({
                message: 'Successfully seeded! Good luck!'
            });
    });
});


// Task specific operations like details, update, delete
router.route('/:task_id')
    // get the task by id
    .get(function(req, res) {
        Task.findById(req.params.task_id, function(err, task) {
            if (err)
                res.send(err);
            res.json(task);
        });
    })
    // update the task by id
    .put(function(req, res) {
        Task.findById(req.params.task_id, function(err, task) {

            if (err)
                res.send(err);

            task.name = req.body.name;
            task.save(function(err) {
                if (err)
                    res.send(err);

                res.json({
                    message: 'Task updated!'
                });
            });

        });
    })
    // delete the task by id
    .delete(function(req, res) {
        Task.remove({
            _id: req.params.task_id
        }, function(err, task) {
            if (err)
                res.send(err);

            res.json({
                message: 'Successfully deleted'
            });
        });
    });

module.exports = router;
