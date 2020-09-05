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
const MESSAGES_TABLE_NAME = config.messages_table_name;

// Include helper modules
const dbHelper = require("./dbHelper.js");
const queryHelper = require("./queryHelper.js");
const { check_if_id_exists_in_table } = require('./dbHelper.js');

// Constants

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

        // Get all the previous messages
        let finishFlag = false;
        let lastId;
        let messages;
        while(!finishFlag) {
            messages = await (await msg.channel.messages.fetch({before: lastId, limit: 100})).array();

            if (messages.length == 0) {
                finishFlag = true;
            }
            
            // Loop through the 100 messages and create query
            for (message of messages) {
                // Check if the message is already saved
                if (await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, MESSAGES_TABLE_NAME, message.id)) {
                    continue;
                }
                syncQueries = syncQueries.concat(await queryHelper.get_queries_from_message(message));
            }
            if (messages[(messages.length)-1]) {
                lastId = messages[(messages.length)-1].id;
                console.log("LAST ID: " + lastId);
            }
            else {
                break;
            }
        }
        
        dbHelper.send_queries_to_db_in_transaction(syncQueries, DATABASE_NAME);
    }
    else {
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
        
        queries = queries.concat(await queryHelper.get_queries_from_message(msg));

        dbHelper.send_queries_to_db_in_transaction(queries, DATABASE_NAME);
    }
})

// Login to client
client.login(token);

