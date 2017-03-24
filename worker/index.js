var TelegramBot = require('node-telegram-bot-api');

// import tasks
var imageIdentification = require('./tasks/image-identification.js');

// replace the value below with the Telegram token you receive from @BotFather
var token = '295147674:AAERxZjce89nISZpVfBMbyJDK6FIHE8u1Zw';

// Create a bot that uses 'polling' to fetch new updates
var bot = new TelegramBot(token, {polling: true});

// Matches /start
bot.onText(/\/start/, function (msg) {
  bot.sendMessage(msg.chat.id, 'Hi, I\'m Buck-A-Bot! Do you want to do a task with me? (possible answers: Yes, No)');
});

// Gives the worker a task
bot.onText(/\Yes(.*)|yes(.*)/, function (msg) {
  imageIdentification(bot, msg);
});

bot.onText(/\/answer (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const ans = match[1];
  bot.sendMessage(chatId, 'Your answer "' + ans + '" has been recorded. Want to do another task? (possible answers: Yes, No)');
});

// If the worker wants no task
bot.onText(/\No(.*)|no(.*)/, function (msg) {
  bot.sendMessage(msg.chat.id, 'Oke, better next time!');
});
