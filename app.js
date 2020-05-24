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

// Constants
const SUPPORTED_FILE_TYPES = [
    'video',
    'gifv',
    'image'
];



// Create commands for the bot
client.on('ready', () => {
    console.log('Client is ready!');
});

// Main message handler
client.on('message', msg=>{
    if (msg.attachments.size > 0) {
        msg.attachments.forEach(function(value, key) {
            // Upload to drive using the url, file id, and the username as inputs
            let fileExtension = value['name'].match(/\.[0-9a-z]+$/i)[0];
            fileHelper.upload_to_drive(value['url'], value['id'], fileExtension, msg.author.username);
        })
    }
    if (msg.embeds.length > 0) {
        msg.embeds.forEach(function(value) {
            if (SUPPORTED_FILE_TYPES.includes(value.type)) {
                // Check if the thumbnail has a video
                if (value.video != null) {
                    // Try to get the file extension from the url, you you can't then upload as a mp4
                    try {
                        let fileExtension = value.video.url.match(/\.[0-9a-z]+$/i)[0];
                        fileHelper.upload_to_drive(value.video.url, msg.id, fileExtension, msg.author.username);
                    }
                    catch {
                        fileHelper.upload_to_drive(value.video.url, msg.id, '.mp4', msg.author.username);
                    }
                    
                }
                else {
                    // Try to get the file extension from the url, if you can't then upload as a png
                    try {
                        let fileExtension = value.url.match(/\.[0-9a-z]+$/i)[0];
                        fileHelper.upload_to_drive(value.url, msg.id, fileExtension, msg.author.username);
                    }
                    catch {
                        fileHelper.upload_to_drive(value.url, msg.id, '.png', msg.author.username);
                    }
                }
            }
            else {
                console.log("Unsupported file type: ".concat(value.type));
            }
        });
    }
})

// Login to client
client.login(token);

