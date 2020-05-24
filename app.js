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
            let fileExtension = value['name'].match(/\.[0-9a-z]+$/i)[0];
            fileHelper.upload_to_drive(value['proxyURL'], value['id'], fileExtension, msg.author.username);
        })
    }
    if (msg.embeds.length > 0) {
        msg.embeds.forEach(function(value) {
            // Check if the thumbnail has a video
            if (value.video != null) {
                // Upload the video thumbnail to drive
                let fileExtension = value.video.url.match(/\.[0-9a-z]+$/i)[0];
                fileHelper.upload_to_drive(value.url, msg.id, fileExtension, msg.author.username);
            }
            else {
                // Upload the picture thumbnail to drive
                let fileExtension = value.url.match(/\.[0-9a-z]+$/i)[0];
                fileHelper.upload_to_drive(value.url, msg.id, fileExtension, msg.author.username);
            }
        });
    }
})

// Login to client
client.login(token);

