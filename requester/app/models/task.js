var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TaskSchema = new Schema({
    name: String,
    requester_id: String,
    solution_limit: Number, // A requester pays for a limited amount of responses
    sources: [{
        source_id: String, // e.g. instagram id / twitter id from Source schema
        parameters: {} // e.g. hashtags [], users etc.
    }],
    // solutions: [ // Unnecessary? maybe better in solutions Schema.
    // 	Number, // All the solutions submitted by workers
    // ],
    questions: [{
        question: String,
        response_type: String,
        response_select_options: [String]
    }],
});

module.exports = mongoose.model('Task', TaskSchema);
