var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var TaskSchema   = new Schema({
	_id: integer,
	name: String,
	requester_id: ObjectID,
	sources: [
		{
source_id : Number, 
parameters: { } // e.g. hashtags [],
},
	]
	questions: [
		question: String,
		response_type: String,
],
});

module.exports = mongoose.model('Task', TaskSchema);
