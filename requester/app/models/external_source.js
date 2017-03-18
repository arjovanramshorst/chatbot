var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ExternalSourceSchema = new Schema({
    name: String
});

module.exports = mongoose.model('ExternalSource', ExternalSourceSchema);
