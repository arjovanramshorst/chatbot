// Inspired by https://github.com/scotch-io/node-api

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var request  	 = require('request');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set port
var port     = /*process.env.PORT || */ 3000;

// connect to mongodb
// var mongoose   = require('mongoose');
// mongoose.connect('mongodb://localhost:4444'); // connect to database
// var Task     = require('./app/models/task');

// verify connection to mongodb
// var conn = mongoose.connection;
// conn.on('error', console.error.bind(console, 'connection error:'));
// conn.once('open', function() {
//   console.log('Connected successfully to MongoDB')
// });

// API ROUTES
// =============================================================================

// create router
var router = express.Router();

// simple logging middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	// console.log('Something is happening.');
	next();
});

// test route
router.get('/', function(req, res) {
	res.json({ message: 'Welcome, worker!' });
});

// parse a question and respond
router.get('/communicate/:q', function(req, res) {
	request.post(
    'http://localhost:5000/parse', { json: { q: req.params.q } }, function (error, response, body) {
      if (error) {
      	console.log(error);
      }
      if (!error && response.statusCode == 200) {
        // console.log(body);
        // console.log(response);
        res.json({ 	message: 'Received a message!', 
        						received_message: body.text, 
        						confidence: body.confidence, 
        						intent: body.intent
        });
      }
    }
	);
});


// REGISTER ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Worker API started at ' + port);
