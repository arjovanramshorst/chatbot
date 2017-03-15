var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var TaskSchema   = new Schema({
	name: String,
	requester_id: Number,
	sources: [{
		source_id : Number,
		parameters: { } // e.g. hashtags [],
	}],
	questions: [{
		question: String,
		response_type: String,
	}],
});

module.exports = mongoose.model('Task', TaskSchema);
