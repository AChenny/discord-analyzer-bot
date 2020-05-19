// Authors: Anderson Chen
// Title: Bois bot

// Initialize the discord application
const Discord = require('discord.js');
const client = new Discord.Client();

// Read from config file to get settings
const config = require('./config.json');
const token = config.authentication.token;

// Include helper modules
const fileHelper = require("./fileHelper.js");

// Create commands for the bot
client.on('ready', () => {
    console.log('Client is ready!');
});

// Main message handler
client.on('message', msg=>{
    if (msg.attachments.size > 0) {
        msg.attachments.forEach(function(value, key) {
            // Upload to drive using the proxyURL, file id, and the username as inputs
            fileHelper.upload_to_drive(value['proxyURL'], value['id'], msg.author.username);
        })
    }
    if (msg.embeds.length > 0) {
        console.log("Contains embeds.");
    }
})

// Login to client
client.login(token);

