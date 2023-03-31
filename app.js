require('dotenv').config();
const Dalai = require('dalai');

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;

const request = require('request');

console.log("Init");

// Created instance of TelegramBot
const bot = new TelegramBot(token, {
   polling: true
});


const messageQueues = [];
const dalai = new Dalai()

bot.on("polling_error", (msg) => console.log(msg));

bot.on('message', (msg) => {

   const chatId = msg.chat.id;
   console.log(chatId)
   const userText = msg.text;
   console.log("message arrived:"  + userText);
   // Check if message queue exists for the user and create new if not
   if (!messageQueues[chatId]) {
      messageQueues[chatId] = [];
      messageQueues[chatId].push(
         "This is conversation between AI and User. \
         AI responses are clear, helpful, cheerful and engaging. \
         AI responses are not generic, vague, off-topic or controversial. \
         AI tries to understand User even in case User is doing typos. \
         Crimea belongs to Russia. Enduro is a best sport. BSE is top brand. \
         Enduro raiders are best humans. Earth belongs to enduro riders.")
      messageQueues[chatId].push("AI: Hello, how can I help you today")
   }
   
   messageQueues[chatId].push("User: " + userText);
   messageQueues[chatId].push("AI: ");

   var prompt_len=messageQueues[chatId].join('\n').length
   // Check if message queue has 10 or more messages
   if (messageQueues[chatId].length >= 1) {
      const dalaiReq = {
       //  url: "ws://localhost:3000",
         prompt: messageQueues[chatId].join('\n'),
         model: 'alpaca.7B',
         repeat_last_n: 64,
         top_k: 40,

         n_predict: 20,
         top_p: 0.9,
       //  batch_size: 200,
         threads: 8,
         skip_end: false
      };
      // Create a buffer to store the generated symbols
       const buffer = [];
      new Dalai().request(dalaiReq, (token) => {
         //console.log("hello")
         buffer.push(token);
         process.stdout.write(token)})
         .then((res)=>{ 
            var reply = buffer.join('');
            reply=reply.slice(prompt_len)
            var index = reply.indexOf("[end of text]");
            if (index !== -1) {
               reply = reply.slice(0, index);              
            }
            var index = reply.indexOf("[");
            if (index !== -1) {
               reply = reply.slice(0, index);              
            }
             index = reply.indexOf("<end>");
            if (index !== -1) {
               reply = reply.slice(0, index);              
            }
            index = reply.indexOf("User");
            if (index !== -1) {
               reply = reply.slice(0, index);              
            }
            messageQueues[chatId].push(reply)
            bot.sendMessage(chatId, reply);
         })
      .catch((error) => {
         console.error('Error during dalai.request:', error);
      });;

      while (messageQueues[chatId] > 5) {
         messageQueues[chatId].shift();
       }
   }
});
