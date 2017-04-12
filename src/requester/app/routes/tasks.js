var express = require('express');
var Task = require('../../../core/models/task');
var Unit = require('../../../core/models/unit');

var router = express.Router();

router.route('/')
    // get all the tasks
    .get(function(req, res) {
        Task.find({}, function(err, tasks) {
            if (err)
                res.send(err)

            res.json({
                taskarray: tasks
            });
        });
    })
    // create a task
    .post(function(req, res) {

        let task = new Task(); // create a new instance of the Task model
        task.name = req.body.name; // set the tasks name (comes from the request)
        task.requester_id = req.body.id;
        task.description = req.body.description;
        task.solution_limit = req.body.solution_limit || 5;
        task.content_definition = req.body.content_definition;
        task.questions = req.body.questions;
        task.requires_review = req.body.requires_review;
        task.save(function(err) {
            if (err)
                res.send(err);

            res.json({
                message: 'Task created!'
            });
        });
    });

// Task specific operations like details, update, delete
router.route('/:task_id')
    // get the task by id
    .get(function(req, res) {
        Task.findById(req.params.task_id, function(err, task) {
            if (err || task == null) {
                res.send({ error : 'Cannnot find task id. '});
            } else {
                Unit.find({
                    task_id: task._id
                }, function(err, units) {
                    if (err)
                        res.send(err)
                    res.json({
                        'task': task,
                        'units': units
                    });
                });
            }
        });
    })
    // update the task by id
    .put(function(req, res) {
        Task.findById(req.params.task_id, function(err, task) {

            if (err)
                res.send(err);

            task.name = req.body.name; // set the tasks name (comes from the request)
            task.requester_id = req.body.id;
            task.description = req.body.description;
            task.solution_limit = req.body.solution_limit || 5;
            task.content_definition = req.body.content_definition;
            task.questions = req.body.questions;
            task.requires_review = req.body.requires_review;
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

// Task specific operations like details, update, delete
router.route('/:task_id/units')
    // Get all the task its task units by task id
    .get(function(req, res) {
        Task.findById(req.params.task_id, function(err, task) {
            if (err) {
                res.send(err);
            } else {
                Unit.find({
                    task_id: task._id
                }, function(err, units) {
                    if (err)
                        res.send(err)
                    res.json(units);
                });
            }
        });
    })
    // Create a unit, add it to a task by task id
    .post(function(req, res) {
        Task.findById(req.params.task_id, function(err, task) {
            if (err) {
                res.send(err);
            } else {
                var unit = new Unit();
                unit.task_id = req.params.task_id;
                unit.content = req.body.content;

                unit.save(function(err) {
                    if (err)
                        res.send(err);
                    res.json({
                        message: 'Unit created and added to task!'
                    });
                });
            }
        });
    });


module.exports = router;
