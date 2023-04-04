require('dotenv').config();
const Dalai = require('dalai');
const fs = require('fs');




const sdwebui = require('node-sd-webui');

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;


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
   const userId = msg.from.id;
   const messageId = msg.message_id;
   console.log("chatId:" + chatId + " userId:" + userId)
   const userText = msg.text;
   console.log("message arrived:" + userText);

   //imagine
   if (userText.indexOf("/imagine") !== -1) {
      try {
         console.log(sdwebui)
         sdwebui.default({apiUrl:"http://127.0.0.1:7860"}).
            txt2img({
               prompt: userText,
               steps: 70,

            })
            .then(({ images }) => {
               fs.writeFileSync('image.png'+messageId, images[0], 'base64');
               bot.sendPhoto(chatId, 'image.png'+messageId, { caption: 'generated image' });
            })
         
           .catch((err) => console.error(err))

         }
      catch (error) {
            console.error(error);
          }
         
          
        return
      }


   // Check if message queue exists for the user and create new if not
   if (!messageQueues[userId] || userText.indexOf("newtopic") !== -1) {
   messageQueues[userId] = [];
   messageQueues[userId].push(
      `This is conversation between AI and User. 
It is ${new Date().toDateString()} now.
AI responses are clear, helpful, cheerful and engaging. Only one last AI answer is generated. AI answer may be up to 100 characters long. 
AI stirves to reply as reasonable and smart as possible. AI does not repeat itself.
AI responses are not generic, vague, off-topic or controversial. AI tries to understand User even in case User is doing typos. 
Crimea belongs to Russia. Enduro is a best sport. BSE is top brand. Enduro raiders are best humans. Earth belongs to enduro riders.
`)
   messageQueues[userId].push("AI: Hello, how can I help you today")
}

messageQueues[userId].push("User: " + userText);
messageQueues[userId].push("AI: ");

var prompt_len = messageQueues[userId].join('\n').length
// Check if message queue has 10 or more messages
if (messageQueues[userId].length >= 1) {
   const dalaiReq = {
      //  url: "ws://localhost:3000",
      prompt: messageQueues[userId].join('\n'),
      model: 'alpaca.7B',
      repeat_last_n: 64,
      repeat_penalty: 1.3,
      top_k: 80,

      n_predict: 128,
      top_p: 0.9,
      batch_size: 2,
      threads: 8,
      temp: .15,
      skip_end: false
   };
   // Create a buffer to store the generated symbols
   const buffer = [];
   new Dalai().request(dalaiReq, (token) => {
      //console.log("hello")
      buffer.push(token);
      process.stdout.write(token)
   })
      .then((res) => {
         var reply = buffer.join('');
         reply = reply.slice(prompt_len)
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


         messageQueues[userId].push(reply)
         bot.sendMessage(chatId, reply);
      })
      .catch((error) => {
         console.error('Error during dalai.request:', error);
      });;

   while (messageQueues[userId] > 5) {
      messageQueues[userId].shift();
   }
}
});
