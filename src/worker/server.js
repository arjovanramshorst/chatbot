// Inspired by https://github.com/scotch-io/node-api

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var morgan = require('morgan');
var request = require('request');
var TelegramBot = require('node-telegram-bot-api');

var Task = require('../core/models/task');
var Unit = require('../core/models/unit');
var Solution = require('../core/models/solution');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// set port
var port = /*process.env.PORT || */ 3000;

/* ========== TELEGRAM SETUP ============= */
// replace the value below with the Telegram token you receive from @BotFather 
var token = '334665274:AAHal-GI-g_Os4OiSOQ04D7h1pUY_98Slgo';

// Create a bot that uses 'polling' to fetch new updates 
var bot = new TelegramBot(token, {polling: true});

/* ========== MONGODB SETUP ============= */
// connect to mongodb
var mongoose = require('mongoose');
mongoose.connect('db');

// verify connection to mongodb
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function () {
    console.log('Connected successfully to MongoDB');
});

/* ======================= */

var stateTracker = {};
var lastText = {};
var lastTask = {};
var questionCounter = {};
var currentAnswers = {};
var currentUnit = {};

var commands = ['/begin',
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

        //  // send received message to RASA-NLU to identify the intent
        //  request.post('http://localhost:5000/parse', { json: { q: msg.text } }, function (error, response, body) {
        //    if (error) {
        //      console.log(error);
        //    }
        //    if (!error && response.statusCode == 200 && body !== undefined) {
        //      // save the result of the analysis according to chatId
        //      var result = {
        //        text: msg.text,
        //        intent: body.intent,
        //        confidence: body.confidence
        //      };
        //      lastText[chatId] = result;

        //      runStateCode(chatId, msg);
        //    } else {
        //      console.log("Something went wrong with the analysis by the RASA-NLU. The text was: " + msg.text);
        //      runStateCode(chatId, msg);
        //    }
        // });
        runStateCode(chatId, msg);
    }
});

// function that process any unknown response
var process_other_input = function (chatId) {
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
var runStateCode = function (chatId, msg) {
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
                stateTracker[chatId] = 'task_choice_pending';

                // retrieve all available tasks
                Task.find({}, function (err, tasks) {
                    // fill the task_names array
                    task_names = [];
                    tasks.forEach(function (task) {
                        task_names.push([task.name]);
                    });
                    task_names.push(['Provide more information on tasks']);
                    task_names.push(['I don\'t want to do a task']);

                    // Send message to the worker
                    bot.sendMessage(chatId, "What type of task would you like to do?", {
                        reply_markup: JSON.stringify({
                            one_time_keyboard: true,
                            keyboard: task_names
                        })
                    });
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
            if (msg.text === 'Provide more information on tasks') {
                stateTracker[chatId] = 'task_info';
                runStateCode(chatId, msg);
            } else {
                Task.find({}, function (err, tasks) {
                    tasks.forEach(function (task) {
                        if (msg.text === task.name) {
                            stateTracker[chatId] = 'task_process_pending';
                            lastTask[chatId] = task;
                            runStateCode(chatId, msg);
                        }
                    });
                });
            }
            break;
        case 'task_info':
            bot.sendMessage(chatId, "Description of Task X.");
            stateTracker[chatId] = 'greet_pending';
            msg.text = 'Yes';
            runStateCode(chatId, msg);
            break;
        case 'task_process_pending':
            var task = lastTask[chatId];
            if (!(chatId in questionCounter)) {
                questionCounter[chatId] = task.questions.length;
                Unit.findOne({task_id: lastTask[chatId]._id}, function (err, unit) {
                    currentUnit[chatId] = unit._id;

                    // process all unit content
                    switch (task.content_definition.content_type) {
                        case 'IMAGE_LIST':
                            Object.keys(unit.content).forEach(function (key) {
                                bot.sendPhoto(chatId, unit.content[key], {});
                            })
                            break;
                        case 'TEXT_LIST':
                            Object.keys(unit.content).forEach(function (key) {
                                bot.sendMessage(chatId, unit.content[key], {});
                            })
                        default:
                            bot.sendMessage(chatId, "Please perform this task", {
                                reply_markup: JSON.stringify({
                                    one_time_keyboard: true,
                                    keyboard: [
                                        ['Do task']
                                    ]
                                })
                            });
                    }
                    runStateCode(chatId, msg);
                });
            } else if (questionCounter[chatId] === 0) {
                processAnswer(chatId, msg, task.questions.length);
                questionCounter[chatId] -= 1;
                runStateCode(chatId, msg);
            } else if (questionCounter[chatId] < 0) {
                console.log("Completing task");
                saveAnswers(currentAnswers[chatId], chatId, task._id, currentUnit[chatId]);


                // Delete all allocated structures
                delete questionCounter[chatId];
                delete currentAnswers[chatId];
                delete currentUnit[chatId];

                stateTracker[chatId] = 'task_completion';
                runStateCode(chatId, msg);
            }
            else {
                console.log(questionCounter[chatId]);

                // If we expect the message to contain an answer to the last question
                processAnswer(chatId, msg, task.questions.length);

                // process next question
                switch (task.questions[questionCounter[chatId] - 1].response_definition.response_type) {
                    case 'SELECT':
                        var answers = [];
                        task.questions[questionCounter[chatId] - 1].response_definition.response_select_options.forEach(function (option) {
                            answers.push([option]);
                        });

                        bot.sendMessage(chatId, task.questions[questionCounter[chatId] - 1].question, {
                            reply_markup: JSON.stringify({
                                one_time_keyboard: true,
                                keyboard: answers
                            })
                        });
                        break;
                    case 'FREE_TEXT':
                        bot.sendMessage(chatId, task.questions[questionCounter[chatId] - 1].question, {});
                        break;
                    case  'NUMBER':
                        bot.sendMessage(chatId, task.questions[questionCounter[chatId] - 1].question, {});
                        break;
                    default:
                        console.log('Unknown response_definition');
                }
                // decrease questionCounter
                questionCounter[chatId] -= 1;
            }
            ;
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

// Writes the answers for unit unitId by worker chatId to the database
var saveAnswers = function (answers, chatId, taskId, unitId) {
    var solution = new Solution();

    solution.task_id = taskId;
    solution.worker_id = chatId;
    solution.unit_id = unitId;
    solution.responses = answers;

    solution.save(function(err) {
        if (err)
            console.error(err);
        else {
            console.log("Saved answers successfully!");
        }
    })
}

/* Processes an answer to a question of a task and stores it in a global variable */
var processAnswer = function (chatId, msg, task_length) {
    if (questionCounter[chatId] < task_length) {
        if (msg.text) {
            currentAnswers[chatId].push(msg.text);
            console.log(currentAnswers[chatId]);
        } else if (msg.photo) {
            currentAnswers[chatId].push(msg.photo);
            console.log(currentAnswers[chatId]);
            if (msg.caption) {
                console.log(msg.caption)
            } else {
                console.log("Photo without caption");
            }
        }
        // currentAnswers[chatId].push();
    } else {
        // initialize array for answers
        currentAnswers[chatId] = [];
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
router.use(function (req, res, next) {
    // do logging
    // console.log('Something is happening.');
    next();
});

// test route
router.get('/', function (req, res) {
    res.json({message: 'Welcome, worker!'});
});

// parse a question and respond
router.get('/communicate/:q', function (req, res) {
    request.post(
        'http://localhost:5000/parse', {json: {q: req.params.q}}, function (error, response, body) {
            if (error) {
                console.log(error);
            }
            if (!error && response.statusCode === 200) {
                // console.log(body);
                // console.log(response);
                res.json({
                    message: 'Received a message!',
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
