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
    solution_limit: { type: Number, min: 0, default: 5 }, // A requester pays for a limited amount of responses
    content_definition: {
        content_type: {
            type: String,
            required: true,
            enum: ['IMAGE', 'TWEET'],
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
            response_type: {
                type: String,
                required: true,
                enum: ['NUMBER', 'FREE_TEXT', 'SELECT', 'IMAGE'],
            },
            response_select_options: {
                type: Array,
            }
        }
    }],
    requires_review: { type: Boolean, default: true }
});

module.exports = mongoose.model('Task', TaskSchema);
