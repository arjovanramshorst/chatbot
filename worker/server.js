// Inspired by https://github.com/scotch-io/node-api

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var request  	 = require('request');
var TelegramBot = require('node-telegram-bot-api');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set port
var port     = /*process.env.PORT || */ 3000;

// replace the value below with the Telegram token you receive from @BotFather 
var token = '334665274:AAHal-GI-g_Os4OiSOQ04D7h1pUY_98Slgo';

// Create a bot that uses 'polling' to fetch new updates 
var bot = new TelegramBot(token, { polling: true });

var stateTracker = {};

// Matches "/echo [whatever]" 
bot.onText(/\/echo (.+)/, function (msg, match) {
  // 'msg' is the received Message from Telegram 
  // 'match' is the result of executing the regexp above on the text content 
  // of the message 
 
  var chatId = msg.chat.id;
  var resp = match[1]; // the captured "whatever" 
 
  // send back the matched "whatever" to the chat 
  bot.sendMessage(chatId, resp);
});

// // Matches /start
// bot.onText(/\/start/, function (msg) {
//   bot.sendMessage(msg.chat.id, 'Hi, I\'m Bucky! Do you want to do a task with me? (possible answers: Yes, No)');
// });
 
// Listen for any kind of message. There are different kinds of 
// messages. 
bot.on('message', function (msg) {
  var chatId = msg.chat.id;

  // add chatId to statetracker
  if (stateTracker[chatId] === undefined) {
    stateTracker[chatId] = 'new';
    console.log("Added chatId " + chatId + " to the stateTracker.");
  }

  console.log("\nState for " + chatId + " is: " + stateTracker[chatId]);

  runStateCode(chatId, msg);

   

  // send received message to RASA-NLU to identify the intent
  request.post(
    'http://localhost:5000/parse', { json: { q: msg.text } }, function (error, response, body) {
      if (error) {
        console.log(error);
      }
      if (!error && response.statusCode == 200 && body !== undefined) {
        // Log the response from RASA NLU to the console
        console.log("Text: " + msg.text);
        console.log("Intent: " + body.intent);
        console.log("Confidence: " + body.confidence);
      }
   });
});

// processes the state
var runStateCode = function(chatId, msg) {
  switch(stateTracker[chatId]) {
    case 'new':
      bot.sendMessage(chatId, "Hi there! I am Bucky and we could work together to finish some much needed work. Would you like to do a task to earn an extra buck?", {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['Yes'],
            ['No']
          ]
        })
      });
      // switch to new_pending state
      stateTracker[chatId] = 'new_pending';
      break;
    case 'greet_pending':
    case 'new_pending':
      if (msg.text === 'Yes') {
        // switch to task_choice state
        stateTracker[chatId] = 'task_choice_pending'

        bot.sendMessage(chatId, "Great! What type of task would you like to do?", {
          reply_markup: JSON.stringify({
            one_time_keyboard: true,
            keyboard: [
              ['Image recognition'],
              ['Provide more information on tasks'],
              ['I don\'t want to do a task']
            ]
          })
        });

      } else if (msg.text === 'No') {
        // switch to goodbye state
        stateTracker[chatId] = 'goodbye';
        bot.sendMessage(chatId, "Thanks for the effort. Hope to see you soon!");
      } else {
        console.log(msg.text);
        console.log("Unknown answer by user.")
      }
      break;
    case 'goodbye':
      // switch to greet_pending to avoid infinite default loop.
      stateTracker[chatId] = 'greet_pending'

      bot.sendMessage(chatId, "Hi there! Would you like to do a task to earn an extra buck?", {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['Yes'],
            ['No']
          ]
        })
      });
      break;
    case 'task_choice_pending':
      if (msg.text === 'Image recognition') {
        stateTracker[chatId] = 'task_process_pending';
        runStateCode(chatId, msg);
      } else if (msg.text === 'Provide more information on tasks') {
        stateTracker[chatId] = 'task_info';
        runStateCode(chatId, msg);
      }
      break;
    case 'task_info':
      bot.sendMessage(chatId, "Description of Task X.");
      stateTracker[chatId] = 'greet_pending';
      msg.text = 'Yes';
      runStateCode(chatId, msg);
      break;
    case 'task_process_pending':
      bot.sendMessage(chatId, "Please perform this task", {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['Do task']
          ]
        })
      }); 

      stateTracker[chatId] = 'task_completion';
      break;

    case 'task_completion':
      bot.sendMessage(chatId, "Great job! What would you like to do next?", {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['Perform same type of task'],
            ['Perform another type of task'],
            ['Quit for now']
          ]
        })
      });

      stateTracker[chatId] = 'task_completion_pending';
      break;
    case 'task_completion_pending':
      if (msg.text === 'Perform same type of task') {
        stateTracker[chatId] = 'task_process_pending';
        runStateCode(chatId, msg);
      } else if (msg.text === 'Perform another type of task') {
        stateTracker[chatId] = 'greet_pending';
        msg.text = 'Yes';
        runStateCode(chatId, msg);
      } else if (msg.text === 'Quit for now') {
        stateTracker[chatId] = 'greet_pending';
        msg.text = 'No';
        runStateCode(chatId, msg);
      } else {
        console.log("Unknown answer by user.");
      }
      break;
      
    default:
      // switch to greet_pending to avoid infinite default loop.
      stateTracker[chatId] = 'greet_pending'

      bot.sendMessage(chatId, "Hi there! Would you like to do a task to earn an extra buck?", {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['Yes'],
            ['No']
          ]
        })
      });       
  }
}

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
