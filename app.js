// Authors: Anderson Chen
// Title: Bois bot

// Initialize the discord application
const Discord = require('discord.js');
const client = new Discord.Client();

// Read from config file to get settings
const config = require('./config.json');
const token = config.authentication.token;

// Create commands for the bot
client.on('ready', () => {
    console.log('Client is ready!');
});

// Main message handler
client.on('message', msg=>{
    if (msg.attachments.size > 0) {
        console.log("Contains file.");
    }
})

// Login to client
client.login(token);

