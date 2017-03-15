// Inspired by https://github.com/scotch-io/node-api

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set port
var port     = /*process.env.PORT || */ 3333;

// connect to mongodb
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:4444'); // connect to database
var Task     = require('./app/models/task');

// verify connection to mongodb
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function() {
  console.log('Connected successfully to MongoDB')
});

// API ROUTES
// =============================================================================

// create router
var router = express.Router();

// simple logging middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});

// test route
router.get('/', function(req, res) {
	res.json({ message: 'Welcome, requester!' });
});

router.get('/test-insert', function(req, res) {
	var task = new Task();		// create a new instance of the Task model

	task.name = 'TESTS';  // set the tasks name
  task.requester_id = 1;
  task.sources = [];
  task.questions = [];

	task.save(function(err) { // save the task
		if (err)
			res.send(err);
    else
      res.json({ message: 'Task inserted!', task: task });
	});
});

// get all tasks route
router.get('/alltasks', function(req, res) {
	Task.find({}, function(err, tasks	) {
		if (err)
			res.send(err)

		res.json({ taskarray: tasks });
	});
});

// task routes
// ----------------------------------------------------
router.route('/tasks')

	// create a task
	.post(function(req, res) {

		var task = new Task();		// create a new instance of the Task model
		task.name = req.body.name;  // set the tasks name (comes from the request)

		task.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Task created!' });
		});


	})

	// get all the tasks
	.get(function(req, res) {
		Task.find(function(err, tasks) {
			if (err)
				res.send(err);

			res.json(tasks);
		});
	});

// on routes that end in /tasks/:task_id
// ----------------------------------------------------
router.route('/tasks/:task_id')

	// get the task by id
	.get(function(req, res) {
		Task.findById(req.params.task_id, function(err, task) {
			if (err)
				res.send(err);
			res.json(task);
		});
	})

	// update the task by id
	.put(function(req, res) {
		Task.findById(req.params.task_id, function(err, task) {

			if (err)
				res.send(err);

			task.name = req.body.name;
			task.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Task updated!' });
			});

		});
	})

	// delete the task by id
	.delete(function(req, res) {
		Task.remove({
			_id: req.params.task_id
		}, function(err, task) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});


// REGISTER ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Requester API started at ' + port);
