var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SolutionSchema = new Schema({
    worker_id: String,
    unit_id: String,
    responses: [{
        question: String,
        response_type: String,
        response: Schema.Types.Mixed
    }],
});

module.exports = mongoose.model('Solution', SolutionSchema);
