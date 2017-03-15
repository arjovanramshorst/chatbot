var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');

var app = express();

/**
 * Configure Application
 */
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// connect to mongodb
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:4444');

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
var port = 3333;
app.listen(port);
console.log('Requester API started at ' + port);
