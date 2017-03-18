var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
 * An external data source could be for example Instagram, Twitter or something else.
 * It is simply used as a reference when we implement the external data source pipeline.
 */
var ExternalSourceSchema = new Schema({
    name: String
});

module.exports = mongoose.model('ExternalSource', ExternalSourceSchema);
