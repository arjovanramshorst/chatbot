var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
 * The task unit schema defines the different units that belong to a certani task.
 * These can be added through an api by the user, or can be added through external data sources.
 */
var UnitSchema = new Schema({
    task_id: String, // Parent is a task.
    content: Object,
    solutions: [{
        responses: [],
        reviewed: String
    }]
});

module.exports = mongoose.model('Unit', UnitSchema);
