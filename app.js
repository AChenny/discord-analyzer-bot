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
const dbHelper = require("./dbHelper.js");
const queryHelper = require("./queryHelper.js");

// Constants
const SUPPORTED_FILE_TYPES = [
    'video',
    'gifv',
    'image'
];

const SUPPORTED_FILE_EXTENSIONS = [
    '.webm', '.jpg', '.jpeg', '.png', '.mp4', '.gif', '.docx', '.doc', '.pdf', '.txt'
];

var channels = client.guilds;

// Create commands for the bot
client.on('ready', () => {
    console.log('Client is ready!');
});

// Main message handler
client.on('message', async function(msg) {
    // let author_query = queryHelper.create_author_query(msg.author.id, msg.author.username, msg.author.discriminator);
    // let server_query = queryHelper.create_server_query(msg.guild.id, msg.guild.name);
    // let queries = [];
    // queries.push(author_query);
    // queries.push(server_query);
    // dbHelper.send_queries_to_db_in_transaction(queries, "beta_bois");

    // Check for media and upload then get the object URL in the bucket
    let objectUrl;
    if (msg.attachments.size > 0) {
        await asyncForEach (msg.attachments.array(), async (value, key) => {
            // Upload to drive using the url, file id, and the username as inputs
            let fileExtension;
            try {
                fileExtension = value['name'].match(/\.[0-9a-z]+$/i)[0];
                if (!SUPPORTED_FILE_EXTENSIONS.includes(fileExtension)) {
                    console.log('WARNING: Unsupported file extension'.concat(fileExtension));
                }
            }
            catch (err){
                if (err instanceof TypeError) {
                    console.log("File extension error. Uploading as binary.");
                    fileExtension = '';
                }
                else {
                    throw err;
                }
            }
            objectUrl = await fileHelper.upload_to_drive(value['url'], value['id'], fileExtension, msg.author.username);
        });
    }
    if (msg.embeds.length > 0) {
        await asyncForEach (msg.embeds, async (value) => {
            if (SUPPORTED_FILE_TYPES.includes(value.type)) {
                // Check if the thumbnail has a video
                let mediaUrl = value.video ? value.video.url : value.url;

                // Try to get the file extension from the url. If none can be found, then upload the file as default mp4 or png depending on the media
                let fileExtension = mediaUrl.match(/\.[0-9a-z]+$/i)[0];
                if (fileExtension) {
                    objectUrl = await fileHelper.upload_to_drive(mediaUrl, msg.id, fileExtension, msg.author.username);
                }
                else {
                    if (value.video) {
                        objectUrl = await fileHelper.upload_to_drive(mediaUrl, msg.id, '.mp4', msg.author.username);
                    }
                    else {
                        objectUrl = await fileHelper.upload_to_drive(value.url, msg.id, '.png', msg.author.username);
                    }
                }
            }
            else {
                console.log("Unsupported file type: ".concat(value.type));
            }
        });
    }
    console.log(objectUrl);
})

// Description: Asynchrounous foreach function, works the same way as foreach, but async.
// Input:
//      array (Array)
//          Some array to loop through
//      callback (function)
//          Some async function to call on the array
// Output: None
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

// Login to client
client.login(token);

