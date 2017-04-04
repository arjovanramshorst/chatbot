// Inspired by https://github.com/scotch-io/node-api

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var morgan = require('morgan');
var request = require('request');
var Tgfancy = require("tgfancy");

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
var token = '295147674:AAERxZjce89nISZpVfBMbyJDK6FIHE8u1Zw';
//var token = '334665274:AAHal-GI-g_Os4OiSOQ04D7h1pUY_98Slgo';

// Create a bot that uses 'polling' to fetch new updates
var bot = new Tgfancy(token, {polling: true, orderedSending: true});

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
var lastTask = {};
var questionCounter = {};
var currentAnswers = {};
var currentUnit = {};

var commands = [
    '/begin',
    '/quit',
    '/choosetask',
    '/help'
];

var getState = function(chatId) {
    return stateTracker[chatId];
};

var setState = function(chatId, state) {
    stateTracker[chatId] = state;
};

var getActiveTask = function(chatId) {
    return lastTask[chatId];
};

var setActiveTask = function(chatId, unit) {
    lastTask[chatId] = unit;
};

var getActiveUnit = function(chatId) {
    return currentUnit[chatId];
};

var setActiveUnit = function(chatId, unit) {
    currentUnit[chatId] = unit;
};

var pushAnswer = function(chatId, answer) {
    if(chatId in currentAnswers === false) {
        currentAnswers[chatId] = [];
    }
    currentAnswers[chatId].push(answer);
};

var getAnswers = function(chatId) {
    if(chatId in currentAnswers) {
        return currentAnswers[chatId];
    } else {
        return [];
    }
};

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', function (msg) {
    if (commands.indexOf(msg.text) === -1) {
        var chatId = msg.chat.id;

        // add chatId to statetracker
        if (chatId in stateTracker === false) {
            setState(chatId, 'new');
            console.log("Added user " + chatId + " to the stateTracker.");
        }

        console.log("\nState for " + chatId + " is: " + getState(chatId));

        executeState(chatId, msg);
    } else {
        console.log('Shortcut match found');
    }
});


var executeState = function(chatId, msg) {
    var task, question;

    switch (getState(chatId)) {
        case 'new':
            bot.sendMessage(chatId, "Hi there! I am Bucky and we could work together to finish some much needed work.");
            setState(chatId, 'start');
            executeState(chatId, msg);
            break;
        case 'start': // provides an overview of tasks

            Task.find({}, function (err, tasks) {

                // If there are tasks
                if(tasks.length > 0) {
                    // set the new state
                    setState(chatId, 'task_choice_pending');

                    // fill the task_names array
                    task_names = [];
                    tasks.forEach(function (task) {
                        task_names.push([task.name]);
                    });

                    // Send message to the worker
                    bot.sendMessage(chatId, "What task would you like to do?", {
                        reply_markup: JSON.stringify({
                            one_time_keyboard: true,
                            keyboard: task_names
                        })
                    });
                }
                // If there are no tasks
                else {
                    bot.sendMessage(chatId, "Hi there! I am Bucky. There are no tasks available at the moment. Come back later!");
                }
            });
            //NOTE: no need to make recursive call as the bot will passively await the answer.
            break;
        case 'task_choice_pending': // waiting for user to select task
            Task.find({}, function (err, tasks) {
                var found = false;
                tasks.forEach(function (task) {
                    if (msg.text === task.name) {
                        found = true;
                        setActiveTask(chatId, task);
                    }
                });

                if(found) {
                    setState(chatId, 'task_init');
                } else {
                    bot.sendMessage(chatId, "Sorry, but I do not know that task.");
                    setState(chatId, 'start');
                }

                executeState(chatId, msg);
            });
            break;
        case 'task_init': // sending data from unit
            task = getActiveTask(chatId);

            Unit.findOne({task_id: task._id}, function (err, unit) {
                questionCounter[chatId] = 0;
                setActiveUnit(chatId, unit);

                // process all unit content
                switch (task.content_definition.content_type) {
                    case 'IMAGE_LIST':
                        Object.keys(unit.content).forEach(function (key) {
                            bot.sendPhoto(chatId, unit.content[key], {});
                        });
                        break;
                    case 'TEXT_LIST':
                        Object.keys(unit.content).forEach(function (key) {
                            bot.sendMessage(chatId, unit.content[key], {});
                        });
                        break;
                    default:
                        bot.sendMessage(chatId, "Please perform the following task");
                }

                setState(chatId, 'task_ask_question');
                executeState(chatId, msg);
            });
            break;
        case 'task_ask_question': // asking a question
            task = getActiveTask(chatId);
            question = task.questions[questionCounter[chatId]];

            // ask the question
            switch (question.response_definition.response_type) {
                case 'SELECT':
                    var answers = [];
                    question.response_definition.response_select_options.forEach(function (option) {
                        answers.push([option]);
                    });

                    bot.sendMessage(chatId, question.question, {
                        reply_markup: JSON.stringify({
                            one_time_keyboard: true,
                            keyboard: answers
                        })
                    });
                    break;
                case 'FREE_TEXT':
                    bot.sendMessage(chatId, question.question);
                    break;
                case  'NUMBER':
                    bot.sendMessage(chatId, question.question);
                    break;
                default:
                    console.log('Unknown response_definition');
                    bot.sendMessage(chatId, question.question);
            }

            setState(chatId, 'task_awaiting_answer');
            //NOTE: no need to make recursive call as the bot will passively await the answer.
            break;
        case 'task_awaiting_answer': // waiting for an answer
            task = getActiveTask(chatId);
            question = task.questions[questionCounter[chatId]];
            var valid_answer = false;

            // compare answer with response type and insert in array of answers
            if (msg.text && question.response_definition !== 'IMAGE') {
                pushAnswer(chatId, msg.text);
                valid_answer = true;
            } else if (msg.photo && question.response_definition === 'IMAGE') {
                pushAnswer(chatId, msg.photo);
                valid_answer = true;
            } else {
                bot.sendMessage(chatId, 'That answer is not valid. Expected format: ' + question.response_definition);
                valid_answer = false;
            }

            //if no valid answer was given
            if(valid_answer === false) {
                setState(chatId, 'task_ask_question');
            }
            //if there are still questions remaining
            else if(questionCounter[chatId] < task.questions.length - 1) {
                questionCounter[chatId] += 1;
                setState(chatId, 'task_ask_question');
            }
            //if there are no questions remaining
            else {
                setState(chatId, 'task_complete');
            }

            executeState(chatId, msg);
            break;
        case 'task_complete': // clean up when task is complete
            //save the solution to the task
            saveAnswers(getAnswers(chatId), chatId, getActiveTask(chatId)._id, getActiveUnit(chatId)._id);
            bot.sendMessage(chatId, "The task is complete!");

            setState(chatId, 'start');
            executeState(chatId, msg);
            break;
        default:
            setState(chatId, 'new');
            executeState(chatId, msg);

    }
};

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

// Matches /start
bot.onText(/\/start/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'new');
    executeState(chatId, msg);
});

// Matches /choosetask
bot.onText(/\/choosetask/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'begin');
    executeState(chatId, msg);
});

// Matches /quit
bot.onText(/\/quit/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'new');
    executeState(chatId, msg);
});

// Matches /help
bot.onText(/\/help/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'help'); //TODO: This state does not exist yet.
    executeState(chatId, msg);
});

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
