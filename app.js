// Authors: Anderson Chen
// Title: Bois bot

// Initialize the discord application
const Discord = require('discord.js');
const fs = require('fs');
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
const configFileName = 'config.json';

// Create commands for the bot
client.on('ready', () => {
    console.log('Client is ready!');
});

// Main message handler
client.on('message', async function(msg) {
    // Ignore this user if they're part of the ignored users list
    if (config.ignore_users_list.includes(msg.author.id)) {
        return;
    }
    if (msg.content == '!sync') {
        if (!config.tracking_channels.includes(msg.channel.id)) {
            msg.channel.send("This channel is not being tracked, input `!track` to start tracking.");
            return;
        }

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

        // Check if server exists in the table, if not add the server
        if (!await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, SERVERS_TABLE_NAME, msg.guild.id)) {
            console.log("New server..")
            syncQueries.push(queryHelper.create_server_query(msg.guild.id, msg.guild.name));
        };

        // Check if the channel exists in the table, if not, add the channel
        if (!await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, CHANNELS_TABLE_NAME, msg.channel.id)) {
            let channel = msg.channel;
            syncQueries.push(queryHelper.create_channel_query(channel.id, channel.name, channel.nsfw, channel.type, channel.topic));
        };

        dbHelper.send_queries_to_db_in_transaction(syncQueries, DATABASE_NAME);

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
                let queries = []
                // Check if the message is already saved
                if (await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, MESSAGES_TABLE_NAME, message.id)) {
                    continue;
                }

                // Check if the author of this message is added to the authors table
                if (!await dbHelper.check_if_id_exists_in_table(DATABASE_NAME, AUTHORS_TABLE_NAME,  message.author.id)) {
                    console.log("New author");
                    queries.push(queryHelper.create_author_query(message.author.id, message.author.username, message.author.discriminator));
                };

                queries = queries.concat(await queryHelper.get_queries_from_message(message));
                dbHelper.send_queries_to_db_in_transaction(queries, DATABASE_NAME);
            }
            if (messages[(messages.length)-1]) {
                lastId = messages[(messages.length)-1].id;
                console.log("LAST ID: " + lastId);
            }
            else {
                break;
            }
        }
        console.log("Finished sync!");
        message.channel.send('Finished syncing!');
    }
    else if (msg.content.startsWith('!ignore')) {
        // Get the mentioned user(s) and add them to the config file to ignore
        let userMentions = msg.mentions.members.array();
        
        // Update the ignore list in the config.json
        fs.readFile(configFileName, async (err, data) => {
            // Constants
            const ignoreUsersListKey = 'ignore_users_list';

            if(err) throw err;
            let configData = await JSON.parse(data);
            let successfulIgnores = []

            for (i in userMentions) {
                let ignoreUserId = userMentions[i].id;
                if (!configData[ignoreUsersListKey].includes(ignoreUserId)) {
                    configData[ignoreUsersListKey].push(userMentions[i].id);
                }
            }
            fs.writeFileSync(configFileName, JSON.stringify(configData, null, 4));
            msg.channel.send("__All Ignores__")
            for (i in configData[ignoreUsersListKey]) {
                msg.channel.send(`<@${configData[ignoreUsersListKey][i]}>`);
            }
            // TODO: Fix this so that the config file can dynamically reload
            msg.channel.send("Config file updated, bot reset required.");
        })
    }
    else if (msg.content == "!track") {
        // Update the tracking list in config file
        fs.readFile(configFileName, async (err, data) => {
            // Constants
            const trackingChannelsKey = 'tracking_channels';
            
            if(err) throw err;
            let configData = await JSON.parse(data);
            
            let channelId = msg.channel.id;

            if (!configData[trackingChannelsKey].includes(channelId)) {
                configData[trackingChannelsKey].push(channelId);
            }

            fs.writeFileSync(configFileName, JSON.stringify(configData, null, 4));
            // TODO: Fix this so that the config file can dynamically reload
            msg.channel.send("Now tracking this channel. Restart bot to update config file.");
        })
    }
    else {
        if (!config.tracking_channels.includes(msg.channel.id)) {
            msg.channel.send("This channel is not being tracked, input `!track` to start tracking.")
            return;
        }
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

