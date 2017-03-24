var express = require('express');
var Solution = require('../../../core/models/solution');

var router = express.Router();

// Index api route
router.get('/', function(req, res) {
    res.json({
        message: 'Welcome, requester! To the API...'
    });
});

// Should be moved to common.
router.get('/solutions/all', function(req, res) {
    Solution.find({}, function(err, solutions) {
        if (err)
            res.send(err)

        res.json({
            solution_array: solutions
        });
    });
});

router.get('/test-insert-solution', function(req, res) {
    var solution = new Solution();

    solution.task_id = 'randomidfortask';
    solution.worker_id = 'randomidforworker';
    solution.responses = [];

    solution.save(function(err) { // save the solution
        if (err)
            res.send(err);
        else
            res.json({
                message: 'Solution inserted!',
                solution: solution
            });
    });
});



module.exports = router;
