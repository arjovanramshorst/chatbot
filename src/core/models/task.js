var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
 * The task schema defines how the user can define different types of tasks.
 * When defining a task, the user does not yet have to specify content in the form of task units.
 * These task units will be added later, either through API or external datasources.
 */
const TaskSchema = new Schema({
    name: String,
    requester_id: String,
    description: String,
    solution_limit: { type: Number, default: 5 }, // A requester pays for a limited amount of responses
    content_definition: {
        content_type: String, // IMAGE / TWEET
        content_fields: Object // e.g. unit.content.image_url
    },
    questions: [{
        question: String,
        response_definition: Object
    }],
    requires_review: { type: Boolean, default: true }
});

module.exports = mongoose.model('Task', TaskSchema);
