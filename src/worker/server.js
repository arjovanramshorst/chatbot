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
//var token = '295147674:AAERxZjce89nISZpVfBMbyJDK6FIHE8u1Zw'; //Lizzy, username: @buck_a_bot
// var token = '334665274:AAHal-GI-g_Os4OiSOQ04D7h1pUY_98Slgo'; //Bjorn, username: @BuckABot
//var token = '373349364:AAGPbNZb8tdCBabVGCQMm_vG_UBjAh7_rkY'; //Arjo, username: @bucky_two_bot
var token = '361869218:AAEcJhYl42u9FmynLhp1Ti5VKRzlEladmDk'; //Joost, username: @bucky_three_bot

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
var activeTask = {};
var activeUnit = {};
var questionCounter = {};
var activeTaskAnswers = {};

var commands = [
    '/start',
    '/reset',
    '/choosetask',
    '/help',
    '/quit' // TODO
];

var getState = function(chatId) {
    return stateTracker[chatId];
};

var setState = function(chatId, state) {
    stateTracker[chatId] = state;
};

var getTask = function(chatId) {
    return activeTask[chatId];
};

var setTask = function(chatId, unit) {
    activeTask[chatId] = unit;
};

var getUnit = function(chatId) {
    return activeUnit[chatId];
};

var setUnit = function(chatId, unit) {
    activeUnit[chatId] = unit;
};

var pushAnswer = function(chatId, answer) {
    if(chatId in activeTaskAnswers === false) {
        activeTaskAnswers[chatId] = [];
    }
    activeTaskAnswers[chatId].push(answer);
};

var getAnswers = function(chatId) {
    if(chatId in activeTaskAnswers) {
        return activeTaskAnswers[chatId];
    } else {
        return [];
    }
};

var clearAnswers = function(chatId) {
    if(chatId in activeTaskAnswers) {
        activeTaskAnswers[chatId] = [];
    }
};

var initQuestionCounter = function(chatId) {
    questionCounter[chatId] = 0;
};

var incrementQuestionCounter = function(chatId) {
    questionCounter[chatId] += 1;
};

var clearQuestionCounter = function(chatId) {
    delete questionCounter[chatId];
};

var getQuestionCounter = function(chatId) {
    return questionCounter[chatId];
};

const fetchTasks = (query = {}) => {
    return new Promise((resolve, reject) => {
        Task.find(query, function (err, tasks) {
            if (tasks.length > 0) {
                resolve(tasks);
            } else if (tasks.length === 0) {
                reject();
            }
        });
    });
}

const fetchTask = (query = {}) => {
    return new Promise((resolve, reject) => {
        Task.findOne(query, (err, task) => {
            if(err) {
                reject(err)
            } else {
                resolve(task)
            }
        })
    })
}

const fetchTaskByName = (name) => fetchTask({name: name});

// Listen for any kind of message. There are different kinds of messages.
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
        case 'help':
            bot.sendMessage(chatId, "Bucky makes it possible to do microwork, whether you are on the go or when you have more time. "
                + "A list of possible types of tasks is presented. If you select one of the types of tasks, then you can complete "
                + "them in return for a monetary compensation. When you are done, you can simply type '/quit' to end the conversation.");
            setState(chatId, 'start');
            executeState(chatId, msg);
            break;
        case 'start': // provides an overview of tasks
            fetchTasks().then(tasks => {
                setState(chatId, 'task_choice_pending');

                const taskNames = tasks.map(task => [task.name])

                bot.sendMessage(chatId, "What task would you like to do?", {
                    reply_markup: JSON.stringify({
                        one_time_keyboard: true,
                        keyboard: taskNames,
                        resize_keyboard: true
                    })
                });

            }).catch(() => {
                bot.sendMessage(chatId, "Hi there! I am Bucky. There are no tasks available at the moment. Come back later!");
            });
            //NOTE: no need to make recursive call as the bot will passively await the answer.
            break;
        case 'task_choice_pending': // waiting for user to select task
            fetchTaskByName(msg.text).then(result => {
                setTask(chatId, result);
                setState(chatId, 'task_info');
                executeState(chatId, msg);
            }).catch(err => {
                bot.sendMessage(chatId, "Sorry, but I do not know that task.");
                setState(chatId, 'start');
                executeState(chatId, msg);
            });
            break;
        case 'task_info': // give the user some info about the task before starting
            task = getTask(chatId);
            if (task && 'description' in task)
                bot.sendMessage(chatId, task.description);

            setState(chatId, 'task_init');
            executeState(chatId, msg);
            break;
        case 'task_init': // sending data from unit
            task = getTask(chatId);

            Unit.findOne({task_id: task._id, 'solutions': {$not: {$elemMatch: {user_id: chatId}}}}, function (err, unit) {
                if(unit === null) {
                    bot.sendMessage(chatId, "Enough other people are already working on this task at the moment. Please select another.");
                    setState(chatId, 'start');
                    executeState(chatId, msg);
                }
                else {
                    initQuestionCounter(chatId);
                    setUnit(chatId, unit);

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
                }
            });
            break;
        case 'task_ask_question': // asking a question
            task = getTask(chatId);
            question = task.questions[getQuestionCounter(chatId)];

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
                            keyboard: answers,
                            resize_keyboard: true
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
            task = getTask(chatId);
            question = task.questions[getQuestionCounter(chatId)];
            var valid_answer = false;
            var response_type = question.response_definition.response_type;
            var response_select_options = question.response_definition.response_select_options;

            // compare answer with response type and insert in array of answers
            if (msg.text && response_type === 'NUMBER') {
                // replace , by . zo check more options of a number input
                var text = msg.text.replace(",", ".");
                if(!isNaN(text)) {
                    pushAnswer(chatId, msg.text);
                    valid_answer = true;
                } else {
                    valid_answer = false;
                }
            } else if (msg.text && response_type === 'FREE_TEXT') {
                pushAnswer(chatId, msg.text);
                valid_answer = true;
            } else if (msg.text && response_type === 'SELECT') {
                // check if answer is contained in response_select_options
                if(response_select_options.indexOf(msg.text) === -1){
                    valid_answer = false;
                } else {
                    pushAnswer(chatId, msg.text);
                    valid_answer = true;
                }
            } else if (msg.photo && response_type === 'IMAGE') {
                pushAnswer(chatId, msg.photo);
                valid_answer = true;
            } else {
                console.log(question.response_definition);
                valid_answer = false;
            }

            //if no valid answer was given
            if(valid_answer === false) {
                if (response_type === 'SELECT'){
                    bot.sendMessage(chatId, 'That answer is not valid. Expected format: ' + question.response_definition.response_select_options);
                    setState(chatId, 'task_ask_question');
                } else {
                    bot.sendMessage(chatId, 'That answer is not valid. Expected format: ' + question.response_definition.response_type);
                    setState(chatId, 'task_ask_question');
                }
            }
            //if there are still questions remaining
            else if(getQuestionCounter(chatId) < task.questions.length - 1) {
                incrementQuestionCounter(chatId);
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
            saveAnswers(getAnswers(chatId), chatId, getUnit(chatId));
            bot.sendMessage(chatId, "Good job! You finished the task. Lets do another one!");

            //clear saved data
            clearAnswers(chatId);
            clearQuestionCounter(chatId);

            //serve a new unit of same task
            setState(chatId, 'task_init');
            executeState(chatId, msg);
            break;
        case 'quit_task': // to quit while doing a task
            if (msg.text === 'yes, i want to quit') {
                setState(chatId, 'quit_chat');
                executeState(chatId, msg);
            } else if (msg.text === 'no, i want to continue with the task') {
                setState(chatId, 'task_ask_question');
                executeState(chatId, msg);
            } else {
                bot.sendMessage(chatId, "Sorry, but I do not understand what you mean, please answer using the buttons below.", {
                    reply_markup: JSON.stringify({
                        one_time_keyboard: true,
                        keyboard: [
                           ['yes, i want to quit'],
                           ['no, i want to continue with the task']
                        ],
                        resize_keyboard: true
                    })
                });
                setState(chatId, 'quit_task');
            }
            break;
        case 'quit_chat':
            setState(chatId, 'start');

            //clear saved data
            clearAnswers(chatId);
            clearQuestionCounter(chatId);

            bot.sendMessage(chatId, 'Bye for now!');
            break;
        default:
            setState(chatId, 'new');
            executeState(chatId, msg);
    }
};

// Writes the answers for unit unitId by worker chatId to the database
const saveAnswers = (answers, chatId, unit) => {
    unit.solutions.push({
        responses: answers,
        reviewed: 'PENDING',
        user_id: chatId,
    });

    unit.save(function(err) {
        if (err)
            console.error(err);
        else {
            console.log("Saved answers successfully!");
        }
    });
};

// Matches /start
bot.onText(/\/start/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'new');
    executeState(chatId, msg);
});

// Matches /choosetask
bot.onText(/\/choosetask/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'start');
    executeState(chatId, msg);
});

// Matches /reset
bot.onText(/\/reset/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'new');
    bot.sendMessage(chatId, 'I will reboot now!');
    executeState(chatId, msg);
});

// Matches /help
bot.onText(/\/help/, function (msg) {
    var chatId = msg.chat.id;
    setState(chatId, 'help');
    executeState(chatId, msg);
});

// Matches /quit
bot.onText(/\/quit/, function (msg) {
    var chatId = msg.chat.id;
    if (getState(chatId) === 'task_init' || getState(chatId) === 'task_ask_question' || getState(chatId) === 'task_awaiting_answer' || getState(chatId) === 'task_complete') {
        bot.sendMessage(chatId, "Are you sure you want to quit now during your task?", {
            reply_markup: JSON.stringify({
                one_time_keyboard: true,
                keyboard: [
                   ['yes, i want to quit'],
                   ['no, i want to continue with the task']
                ],
                resize_keyboard: true
            })
        });
        setState(chatId, 'quit_task');
        executeState(chatId, msg);
    } else {
        setState(chatId, 'quit_chat');
        executeState(chatId, msg);
    }
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
