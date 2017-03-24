var task = function (bot, msg) {
  var chatId = msg.chat.id;
  var url1 = 'https://i1.sndcdn.com/avatars-000218045674-aqegev-t500x500.jpg';
  var url2 = 'https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/8/005/068/2d4/3ba18ea.jpg';

  var url;
  if(Math.random() < 0.5) {
    url = url1;
  } else {
    url = url2;
  }
  bot.sendPhoto(chatId, url, {
    caption: "Who do you see on this image?",
    reply_markup: JSON.stringify({
      one_time_keyboard: true,
      keyboard: [
        ['/answer Lizzy Scholten'],
        ['/answer Jan Cees van Senden']
      ]
    }),
  });
};

module.exports = task;
