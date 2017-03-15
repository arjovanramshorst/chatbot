// call the packages we need
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var morgan = require('morgan');

/**
 * Configure Application
 */
// log requests to the console
app.use(morgan('dev'));
// configure body parser
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
// set port
var port = 3333;
// connect to mongodb
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:4444'); // connect to database
// verify connection to mongodb
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function() {
    console.log('Connected successfully to MongoDB');
});

/**
 * Configure API routes
 */
var commonRoutes = require('./app/routes/common');
var taskRoutes = require('./app/routes/tasks');
// register routes
app.use('/api', commonRoutes);
app.use('/api/tasks', taskRoutes);

/**
 * Start server
 */
app.listen(port);
console.log('Requester API started at ' + port);
