// Inspired by https://github.com/scotch-io/node-api

// BASE SETUP
// =============================================================================

// call the packages we need
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const morgan = require('morgan');
const request = require('request');

const Tgfancy = require("tgfancy");

const Task = require('../core/models/task');
const Unit = require('../core/models/unit');
const Solution = require('../core/models/solution');

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// set port
const port = /*process.env.PORT || */ 3000;

/* ========== TELEGRAM SETUP ============= */
// replace the value below with the Telegram token you receive from @BotFather 
//const token = '295147674:AAERxZjce89nISZpVfBMbyJDK6FIHE8u1Zw'; //Lizzy, username: @buck_a_bot
// const token = '334665274:AAHal-GI-g_Os4OiSOQ04D7h1pUY_98Slgo'; //Bjorn, username: @@BuckABot
// const token = '373349364:AAGPbNZb8tdCBabVGCQMm_vG_UBjAh7_rkY'; //Arjo, username: @bucky_two_bot
//const token = '361869218:AAEcJhYl42u9FmynLhp1Ti5VKRzlEladmDk'; //Joost, username: @bucky_three_bot
//
const localConfig = require('./env')

const token = localConfig.token

// Create a bot that uses 'polling' to fetch new updates
const bot = new Tgfancy(token, {polling: true, orderedSending: true});

/* ========== MONGODB SETUP ============= */
// connect to mongodb
const mongoose = require('mongoose');
mongoose.connect('db');

// verify connection to mongodb
const conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function () {
    console.log('Connected successfully to MongoDB');
});

const REVIEW_CHANCE = 0.5

/* ======================= */

const stateTracker = {};
const activeTask = {};
const activeUnit = {};
const questionCounter = {};
const activeTaskAnswers = {};
const activeReview = {};

const commands = [
    '/start',
    '/reset',
    '/choosetask',
    '/help',
    '/quit' // TODO
];

const getState = function(chatId) {
    return stateTracker[chatId];
};

const setState = function(chatId, state) {
    stateTracker[chatId] = state;
};

const getTask = function(chatId) {
    return activeTask[chatId];
};

const setTask = function(chatId, task) {
    activeTask[chatId] = task;
};

const getUnit = function(chatId) {
    return activeUnit[chatId];
};

const setUnit = function(chatId, unit) {
    activeUnit[chatId] = unit;
};

const setReviewUserId = function(chatId, userId) {
    activeReview[chatId] = userId
}

const getReviewUserId = function(chatId) {
    return activeReview[chatId]
}

const pushAnswer = function(chatId, answer) {
    if(chatId in activeTaskAnswers === false) {
        activeTaskAnswers[chatId] = [];
    }
    activeTaskAnswers[chatId].push(answer);
};

const getAnswers = function(chatId) {
    if(chatId in activeTaskAnswers) {
        return activeTaskAnswers[chatId];
    } else {
        return [];
    }
};

const clearAnswers = function(chatId) {
    if(chatId in activeTaskAnswers) {
        activeTaskAnswers[chatId] = [];
    }
};

const initQuestionCounter = function(chatId) {
    questionCounter[chatId] = 0;
};

const incrementQuestionCounter = function(chatId) {
    questionCounter[chatId] += 1;
};

const clearQuestionCounter = function(chatId) {
    delete questionCounter[chatId];
};

const getQuestionCounter = function(chatId) {
    return questionCounter[chatId];
};

const clearTemporaryData = function(chatId) {
    clearAnswers(chatId);
    clearQuestionCounter(chatId);
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

const saveAnswers = (answers, chatId, unit) => {
    return new Promise((resolve, reject) => {
        unit.solutions.push({
            responses: answers,
            user_id: chatId,
        });
        unit.save(function(err) {
            if (err) {
                console.error(err);
                reject(err);
            }
            else {
                console.log("Saved answers successfully!");
                resolve(unit);
            }
        });
    })
}

const fetchTaskByName = (name) => fetchTask({name: name});

const fetchUnitsForTask = (task) => {
    return new Promise((resolve, reject) => {
        Unit.find({task_id: task._id}, (err, units) => {
            if(err) {
                reject(err)
            } else {
                resolve(units)
            }
        })
    })
}

const saveReview = (answers, chat_id, unit) => {
    console.log('trying saving answers?')
    if(answers.length > 0 && !answers.includes('no')) {
        return storeReview(unit, chat_id, 'confirmed')
    } else if(answers.length > 0 && answers.includes('no')) {
        return storeReview(unit, chat_id, 'rejected')
    } else {
        console.log('One or more incorrect answers given')
        console.log(answers)
        return Promise.reject('Incorrect answers given')
    }
}

const storeReview = (unit, chat_id, review) => {
    unit.solutions.forEach(solution => {
        if(solution.user_id === chat_id) {
            console.log('solution is successfully reviewed');
            solution.reviewed = review;
        }
    })
    return new Promise((resolve, reject) => {
        unit.save((err) => {
            if(err) {
                reject(err)
            } else {
                console.log('Review stored successfully')
                resolve()
            }
        });
    })
}

const getReviewUnit = (units, chatId) => {
    const reviewSolutions = units.filter(unit => {
        // Filter units that require at least one solution to be reviewed.
        return unit.solutions.findIndex(solution => solution.reviewed === 'pending' && solution.user_id !== chatId) !== -1;
    }).map(unit => {
        // map units with the list of solutions that need to be reviewed.
        return {
            unit: unit,
            solutions: unit.solutions.filter(solution => (solution.reviewed === 'pending' && solution.user_id !== chatId))
        }
    });
    if (reviewSolutions.length > 0) {
        // Return the first unit with the user_id of a solution in an object.
        return {
            unit: reviewSolutions[0].unit,
            user_id: reviewSolutions[0].solutions[0].user_id
        };
    }

    return null;
}

const getResponseForQuestion = (unit, reviewedId, questionNumber) => {
    return unit.solutions.find(solution => solution.user_id === reviewedId).responses[questionNumber]
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg) {
    if (commands.indexOf(msg.text) === -1) {
        var chatId = msg.chat.id;

        // add chatId to statetracker
        if (chatId in stateTracker === false) {
            setState(chatId, 'new');
            console.log("Added user " + chatId + " to the stateTracker.");
        }

        executeState(chatId, msg);
    } else {
        console.log('Shortcut match found');
    }
});


const executeState = (chatId, msg) => {
    console.log("\nState for " + chatId + " is: " + getState(chatId));
    const task = getTask(chatId)
    const question = task ? task.questions[getQuestionCounter(chatId)] : null;
    const unit = getUnit(chatId)

    switch (getState(chatId)) {
        case 'new':
            bot.sendMessage(chatId, "Hi there! I am Bucky and we could work together to finish some much needed work.");
            bot.sendMessage(chatId, 'You can always use these commands as shortcuts: \n' +
                                    '/reset : to reboot \n' +
                                    '/choosetask : to choose a (different) task \n' +
                                    '/help : to get more information \n' +
                                    '/quit : to stop while doing a task, or to end the conversation');
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

            //if a description exists, send it
            if (task && task.description) {
                bot.sendMessage(chatId, task.description, {parse_mode: 'HTML'});
            }

            setState(chatId, 'init');
            executeState(chatId, msg);
            break;
        case 'init':
            if(Math.random() < REVIEW_CHANCE) {
                setState(chatId, 'review_init');
            } else {
                setState(chatId, 'task_init');
            }
            executeState(chatId, msg)
            break;
        case 'review_init': // sending data from unit
            fetchUnitsForTask(task).then(units => {
                const reviewUnit = getReviewUnit(units)
                if(reviewUnit !== null) {
                    // Doesn't really follow DRY principle.
                    const taskFields = task.content_definition.content_fields;
                    let fields = [];
                    Object.keys(taskFields).forEach(function (key) {
                        if (taskFields.hasOwnProperty(key)) {
                            var value = taskFields[key];
                            fields.push(value.substr(value.lastIndexOf(".") + 1));
                        }
                    });

                    // process all unit content
                    switch (task.content_definition.content_type) {
                        case 'IMAGE_LIST':
                            //send all declared unit contents
                            Object.keys(unit.content).forEach(function (key) {
                                if(fields.indexOf(key) !== -1) {
                                    bot.sendPhoto(chatId, unit.content[key], {});
                                }
                            });
                            break;
                        case 'TEXT_LIST':
                            //send all declared unit contents
                            Object.keys(unit.content).forEach(function (key) {
                                if(fields.indexOf(key) !== -1) {
                                    bot.sendMessage(chatId, unit.content[key], {});
                                }
                            });
                            break;
                        default:
                            bot.sendMessage(chatId, "Please perform the following task");
                    }
                    initQuestionCounter(chatId);
                    setUnit(chatId, reviewUnit.unit)
                    setReviewUserId(chatId, reviewUnit.user_id)
                    setState(chatId, 'task_review_question')
                    executeState(chatId, msg)
                }
                else {
                    // Do a normal task if no review task is available.
                    setState(chatId, 'task_init')
                    executeState(chatId, msg)
                }
            }).catch(err => console.log(err))

            break;
        case 'task_init':
            Unit.findOne({task_id: task._id, 'solutions': {$not: {$elemMatch: {user_id: chatId}}}}, function (err, unit) {
            if(unit === null) {
                bot.sendMessage(chatId, "Enough other people are already working on this task at the moment. Please select another.");
                setState(chatId, 'start');
                executeState(chatId, msg);
            }
            else {
                initQuestionCounter(chatId);
                setUnit(chatId, unit);

                //find all unit fields that are declared in the task
                const taskFields = task.content_definition.content_fields;
                let fields = [];
                Object.keys(taskFields).forEach(function (key) {
                    if (taskFields.hasOwnProperty(key)) {
                        var value = taskFields[key];
                        fields.push(value.substr(value.lastIndexOf(".") + 1));
                    }
                });

                // process all unit content
                switch (task.content_definition.content_type) {
                    case 'IMAGE_LIST':
                        //send all declared unit contents
                        Object.keys(unit.content).forEach(function (key) {
                            if(fields.indexOf(key) !== -1) {
                                bot.sendPhoto(chatId, unit.content[key], {});
                            }
                        });
                        break;
                    case 'TEXT_LIST':
                        //send all declared unit contents
                        Object.keys(unit.content).forEach(function (key) {
                            if(fields.indexOf(key) !== -1) {
                                bot.sendMessage(chatId, unit.content[key], {});
                            }
                        });
                        break;
                    default:
                        bot.sendMessage(chatId, "Please perform the following task");
                }

                setState(chatId, 'task_ask_question');
                executeState(chatId, msg);
                }
            })
            break;
        case 'task_ask_question': // asking a question
            // ask the question
            switch (question.response_definition.response_type) {
                case 'SELECT':
                    let answers = [];
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
        case 'task_review_question':
            // Show question
            // Show answer
            let solutionUserId = getReviewUserId(chatId)
            const response = getResponseForQuestion(unit, solutionUserId, getQuestionCounter(chatId))
            const reviewString = 'Regarding the above message, is the following answer correct?\nQ: '+ question.question + '\nA: ' + response

            bot.sendMessage(chatId, reviewString, {
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    keyboard: [['yes'],['no']],
                    resize_keyboard: true
                })
            })
            setState(chatId, 'task_review_awaiting')
            break
        case 'task_review_awaiting':
            // Receive answer (yes or no)
            if(msg.text && (msg.text === 'yes' || msg.text === 'no')) {
                pushAnswer(chatId, msg.text);
                if(getQuestionCounter(chatId) < task.questions.length - 1) {
                    incrementQuestionCounter(chatId);
                    setState(chatId, 'task_review_question');
                } else {
                    setState(chatId, 'task_review_complete');
                }
            } else {
                bot.sendMessage(chatId, 'Invalid answer, requires "yes" or "no"')
                setState(chatId, 'task_review_question')
            }
            executeState(chatId, msg)
            break;
        case 'task_review_complete':
            saveReview(getAnswers(chatId), getReviewUserId(chatId), getUnit(chatId)).then(() => {
                bot.sendMessage(chatId, "The review is complete!");

                clearTemporaryData(chatId)
                setState(chatId, 'task_info');
                executeState(chatId, msg);
            }).catch(err => {
                bot.sendMessage(chatId, 'Something went wrong..')
                setState(chatId, 'task_info');
                executeState(chatId, msg);
            });
            break;
        case 'task_complete': // clean up when task is complete
            //save the solution to the task
            saveAnswers(getAnswers(chatId), chatId, getUnit(chatId)).then((unit) => {
                bot.sendMessage(chatId, "Good job! You finished the task. Lets do another one!");

                //clear saved data
                clearTemporaryData(chatId);


                //serve a new unit of same task
                setState(chatId, 'task_info');
                executeState(chatId, msg);
            });
            break;
        case 'quit_task': // to quit while doing a task
            if (msg.text === 'yes, i want to quit') {
                setState(chatId, 'start');
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
            bot.sendMessage(chatId, 'Bye for now!');
            break;
        default:
            setState(chatId, 'new');
            executeState(chatId, msg);
    }
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
    if (getState(chatId) === 'task_info' || getState(chatId) === 'init' || getState(chatId) === 'task_init' || getState(chatId) === 'task_ask_question' || getState(chatId) === 'task_awaiting_answer') {
        bot.sendMessage(chatId, getTask(chatId).description, {parse_mode: 'HTML'});
    } else {
        bot.sendMessage(chatId, "Bucky makes it possible to do microwork, whether you are on the go or when you have more time. "
            + "A list of possible types of tasks is presented. If you select one of the types of tasks, then you can complete "
            + "them in return for a monetary compensation. When you are done, you can simply type '/quit' to end the conversation.");
        bot.sendMessage(chatId, 'You can always use these commands as shortcuts: \n' +
                                    '/reset : to reboot \n' +
                                    '/choosetask : to choose a (different) task \n' +
                                    '/help : to get more information \n' +
                                    '/quit : to stop while doing a task, or to end the conversation');
    }
});

// Matches /quit
bot.onText(/\/quit/, function (msg) {
    var chatId = msg.chat.id;

    //if busy with a task, first ask for confirmation
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
