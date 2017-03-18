var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UnitSchema = new Schema({
    task_id: String,
    content: {
        image_url: String
    }
});

module.exports = mongoose.model('Unit', UnitSchema);
