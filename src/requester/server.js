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
mongoose.connect('db');

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
var seedRoutes = require('./app/routes/seed');
var taskRoutes = require('./app/routes/tasks');
var requesterRoutes = require('./app/routes/requester');
// register routes
app.use('/seed', seedRoutes);
app.use('/api', commonRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/requester', requesterRoutes);

/**
 * Start server
 */
app.listen(80);
console.log('Requester API started');
