var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
 * The task schema defines how the user can define different types of tasks.
 * When defining a task, the user does not yet have to specify content in the form of task units.
 * These task units will be added later, either through API or external datasources.
 */
const TaskSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    requester_id: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    solution_limit: { type: Number, default: 5 }, // A requester pays for a limited amount of responses
    content_definition: {
        content_type: {
            type: String,
            required: true,
        }, // IMAGE / TWEET
        content_fields: {
            type: Object,
            required: true,
        } // e.g. unit.content.image_url
    },
    questions: [{
        question: {
            type: String,
            required: true,
        },
        response_definition: {
            type: Object,
            required: true,
        }
    }],
    requires_review: { type: Boolean, default: true }
});

module.exports = mongoose.model('Task', TaskSchema);
