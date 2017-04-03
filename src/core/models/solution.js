var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * A solution is a response submitted by a worker to a certain unit (of a task).
 * It contains a response to all of the questions submitted by the requester.
 * The response could be anything from text, to a number, to an image.
 */
var SolutionSchema = new Schema({
    worker_id: String, // Parent is a unit (not a task)
    unit_id: String,
    task_id: String,
    responses: [],
});

module.exports = mongoose.model('Solution', SolutionSchema);
