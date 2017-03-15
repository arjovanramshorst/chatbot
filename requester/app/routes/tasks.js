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

// on routes that end in /tasks/:task_id
// ----------------------------------------------------
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

// insert an empty test task
router.get('/test-insert', function(req, res) {
    var task = new Task(); // create a new instance of the Task model

    task.name = 'TESTS'; // set the tasks name
    task.requester_id = 1;
    task.sources = [];
    task.questions = [];

    task.save(function(err) { // save the task
        if (err)
            res.send(err);
        else
            res.json({
                message: 'Task inserted!',
                task: task
            });
    });
});

module.exports = router;
