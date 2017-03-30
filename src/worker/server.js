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

/* ========== TELEGRAM SETUP ============= */
// replace the value below with the Telegram token you receive from @BotFather 
var token = '334665274:AAHal-GI-g_Os4OiSOQ04D7h1pUY_98Slgo';

// Create a bot that uses 'polling' to fetch new updates 
var bot = new TelegramBot(token, { polling: true });

/* ========== MONGODB SETUP ============= */
// connect to mongodb
var mongoose = require('mongoose');
mongoose.connect('db');

// verify connection to mongodb
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function() {
    console.log('Connected successfully to MongoDB');
});

/* ======================= */

var stateTracker = {};
var lastText = {};

var commands = [  '/begin',
                  '/quit',
                  '/choosetask',
                  '/help'
                ];

// Listen for any kind of message. There are different kinds of 
// messages. 
bot.on('message', function (msg) {
  if (commands.indexOf(msg.text) === -1) {
    console.log("not entering commands")

    var chatId = msg.chat.id;

    // add chatId to statetracker
    if (stateTracker[chatId] === undefined) {
      stateTracker[chatId] = 'new';
      console.log("Added chatId " + chatId + " to the stateTracker.");
    }

    console.log("\nState for " + chatId + " is: " + stateTracker[chatId]);

    // send received message to RASA-NLU to identify the intent
    request.post('http://localhost:5000/parse', { json: { q: msg.text } }, function (error, response, body) {
      if (error) {
        console.log(error);
      }
      if (!error && response.statusCode == 200 && body !== undefined) {
        // save the result of the analysis according to chatId
        var result = {
          text: msg.text,
          intent: body.intent,
          confidence: body.confidence
        };
        lastText[chatId] = result;

        runStateCode(chatId, msg);   
      } else {
        console.log("Something went wrong with the analysis by the RASA-NLU. The text was: " + msg.text);
        runStateCode(chatId, msg);   
      }
   });
  }  
});

// function that process any unknown response
var process_other_input = function(chatId) {
  console.log("Unknown answer by user.");

  var analysedText = lastText[chatId];
  var state = stateTracker[chatId];

  switch (state) {
    case 'greet_pending':
    case 'new_pending':
      if (analysedText.confidence > 0.5) {
        switch (analysedText.intent) {
        case 'task_request':
          msg = {
            text: 'Yes'
          };
          runStateCode(chatId, msg);
          break;
        case 'goodbye':
          msg = {
            text: 'No'
          };
          runStateCode(chatId, msg);
          break;
        default:
          bot.sendMessage(chatId, "I am not sure what you mean. Please reply using the following options:", {
            reply_markup: JSON.stringify({
              one_time_keyboard: true,
              keyboard: [
                ['Yes'],
                ['No']
              ]
            })
          });
        }
      } else {
        bot.sendMessage(chatId, "I am not sure what you mean. Please reply using the following options:", {
          reply_markup: JSON.stringify({
            one_time_keyboard: true,
            keyboard: [
              ['Yes'],
              ['No']
            ]
          })
        });
      }
      break;
    case 'goodbye':
      break;
    case 'task_choice_pending':
      break;
    case 'task_info':
      break;
    case 'task_process_pending':
      break;
    case 'task_completion_pending':
      break;
    case 'task_completion':
      break;
    default:
      console.log('x');
  }
};

// processes the state
var runStateCode = function(chatId, msg) {
  switch (stateTracker[chatId]) {
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

        bot.sendMessage(chatId, "What type of task would you like to do?", {
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
      } 
      // else {
      //   process_other_input(chatId);
      // }
      break;
    case 'goodbye':
      bot.sendMessage(chatId, "Hi there! Would you like to do a task to earn an extra buck?", {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['Yes'],
            ['No']
          ]
        })
      });

      // switch to greet_pending to avoid infinite default loop.
      stateTracker[chatId] = 'greet_pending'
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

// Matches /begin
bot.onText(/\/begin/, function (msg) {
  var chatId = msg.chat.id;
  stateTracker[chatId] = 'goodbye';
  runStateCode(chatId, msg);
});

// Matches /choosetask
bot.onText(/\/choosetask/, function (msg) {
  var chatId = msg.chat.id;
  msg.text = 'Yes';
  stateTracker[chatId] = 'greet_pending';
  runStateCode(chatId, msg);
});

// Matches /quit
bot.onText(/\/quit/, function (msg) {
  var chatId = msg.chat.id;

  if (stateTracker[chatId] === 'task_completion') {
    msg.text = 'Yes';
    stateTracker[chatId] = 'greet_pending';
    runStateCode(chatId, msg);
  } else {
    console.log("Saying no to greet_pending");
    msg.text = 'No';
    stateTracker[chatId] = 'greet_pending';
    runStateCode(chatId, msg);
  }
});

// Matches /help
bot.onText(/\/help/, function (msg) {
  var chatId = msg.chat.id;
  bot.sendMessage(chatId, "I am here to help! You can use any of the following commands to start working.", {
    reply_markup: JSON.stringify({
      one_time_keyboard: true,
      keyboard: [
        [commands[0]],
        [commands[1]],
        [commands[2]],
        [commands[3]]
      ]
    })
  });
});


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
