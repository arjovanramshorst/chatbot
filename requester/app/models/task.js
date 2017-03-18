var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
 * The task schema defines how the user can define different types of tasks.
 * When defining a task, the user does not yet have to specify content in the form of task units.
 * These task units will be added later, either through API or external datasources.
 */
var TaskSchema = new Schema({
    name: String,
    requester_id: String,
    solution_limit: Number, // A requester pays for a limited amount of responses
    external_sources: [{
        source_id: String,
        parameters: {} // e.g. hashtags [], users etc.
    }],
    questions: [{
        question: String,
        response_type: String,
        response_select_options: [String]
    }],
});

module.exports = mongoose.model('Task', TaskSchema);
