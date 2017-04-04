var express = require('express');
var Task = require('../../../core/models/task');
var Unit = require('../../../core/models/unit');

var router = express.Router();


/**
 * TODO WORK IN PROGRESS
 */
router.route('/:requester_id/tasks')
    .get(function(req, res) {
        Task.find({
                requester_id: req.params.requester_id
            },
            function(err, task) {
                if (err) {
                    res.send(err)
                } else {
                    res.send(task)
                }
            }
        );
    });

router.route('/:requester_id/task/:task_id/units')
    .get(function(req, res) {

        var task = Task.find({
            requester_id: req.params.requester_id,
            function(err, task) {
                if (err) {
                    res.send(err)
                } else {

                }
            }
        })

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
    });

module.exports = router
