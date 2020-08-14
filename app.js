// Authors: Anderson Chen
// Title: Bois bot

// Initialize the discord application
const Discord = require('discord.js');
const client = new Discord.Client();

// Read from config file to get settings
const config = require('./config.json');
const token = config.authentication.token;
const DATABASE_NAME = config.database_name;
const AUTHORS_TABLE_NAME = config.authors_table_name;
const SERVERS_TABLE_NAME = config.servers_table_name;
const CHANNELS_TABLE_NAME = config.channels_table_name;

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

// Create commands for the bot
client.on('ready', () => {
    console.log('Client is ready!');
});

// Main message handler
client.on('message', async function(msg) {
    if (msg.content == '!sync') {
        let usersPromise = await msg.guild.members.fetch();

        let users = usersPromise.array();
        let authors = [];
    
        // For each user, check if the user exists in the table, create author object
        for (user of users) {
            userId = user.id;

            if (await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, AUTHORS_TABLE_NAME, userId)) {
                continue;
            }
            username = user.user.username;
            discriminator = user.user.discriminator;
            
            authors.push({
                'userId' : userId,
                'username' : username,
                'discriminator' : discriminator
            });
        };
        
        let syncQueries = [];
        
        // For each author create a query for
        for (author of authors) {
            syncQueries.push(queryHelper.create_author_query(author.userId, author.username, author.discriminator));
        }

        dbHelper.send_queries_to_db_in_transaction(syncQueries, DATABASE_NAME);
    }
    else {
        // Check for media, upload, then get the object URL in the bucket
        let objectUrl;
        let mediaId;
    
        let queries = [];
    
        // Create author query
        if (!await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, AUTHORS_TABLE_NAME,  msg.author.id)) {
            console.log("New author");
            queries.push(queryHelper.create_author_query(msg.author.id, msg.author.username, msg.author.discriminator));
        };
        
        // Create server query
        if (!await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, SERVERS_TABLE_NAME, msg.guild.id)) {
            console.log("New server..")
            queries.push(queryHelper.create_server_query(msg.guild.id, msg.guild.name));
        };
        
        // Create channel query
        if (!await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, CHANNELS_TABLE_NAME, msg.channel.id)) {
            let channel = msg.channel;
            queries.push(queryHelper.create_channel_query(channel.id, channel.name, channel.nsfw, channel.type, channel.topic));
        };
        
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
                
                // [0] -> query, [1] -> mediaId
                let mediaQueryResults = await queryHelper.create_medias_query('attachment', objectUrl, value.size, value.width, value.height);
                queries.push(mediaQueryResults[0]);
                mediaId = mediaQueryResults[1];
            });
        }
        if (msg.embeds.length > 0) {
            await asyncForEach (msg.embeds, async (value) => {
                if (SUPPORTED_FILE_TYPES.includes(value.type)) {
                    // Check if the thumbnail has a video
                    let mediaUrl = value.video ? value.video.url : value.url;
    
                    // TEMP: Try to get the file extension from the url. If none can be found, then upload the file as default mp4 or png depending on the media
                    // In the future try to find a way to handle these and read the data and make a best judgement on the type of media
                    let fileExtension;
                    try {
                         fileExtension = mediaUrl.match(/\.[0-9a-z]+$/i)[0];
                    }
                    catch (err) {
                        fileExtension = value.video ? '.mp4' : 'png';
                    }
                    objectUrl = await fileHelper.upload_to_drive(mediaUrl, msg.id, fileExtension, msg.author.username);
                }
                else {
                    console.log("Unsupported file type: ".concat(value.type));
                }
                // TODO: Somehow get the size of the embedded media.
                let mediaQueryResults = await queryHelper.create_medias_query('embedded', objectUrl, value.size, value.thumbnail.width, value.thumbnail.height);
                queries.push(mediaQueryResults[0]);
                mediaId = mediaQueryResults[1];
            });
        }
    
        // Check if there are any mentions create query from that
        if (msg.mentions) {
            if (msg.mentions.everyone) {
                // Add the queries on top
                queries = queries.concat(queryHelper.create_mentions_query(msg.author.id, msg.id, null, true));
            }
            else {
                let mentionMembers = msg.mentions.members.array();
                let mentionMemberIds = [];
                mentionMembers.forEach(member => mentionMemberIds.push(member.id));
    
                queries = queries.concat(queryHelper.create_mentions_query(msg.author.id, msg.id, mentionMemberIds));
            }
        }
    
        // TODO: Create message query
        queries.push(queryHelper.create_messages_query(msg.id, msg.content, msg.guild.id, msg.author.id, msg.channel.id, mediaId ));
    
        dbHelper.send_queries_to_db_in_transaction(queries, DATABASE_NAME);
    }
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

