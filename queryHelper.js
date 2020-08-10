// Description: This library contains all the functions that interact with queries and query responses

// Imports
const dateFns = require('date-fns');
const dbHelper = require("./dbHelper.js");

// Constants
const DATABASE_NAME = 'beta_bois';
const NUM_UNIQUE_ID_DIGITS = 3;

const MEDIA_TYPE_IDENTIFIER_MAP = {
    'embedded' : 'EMB',
    'attachment' : 'ATT'
};

// Table names
const AUTHOR_TABLE_NAME = 'authors';
const SERVER_TABLE_NAME = 'servers';
const MEDIA_TABLE_NAME = 'medias';
const CHANNEL_TABLE_NAME = 'channels';
const MESSAGE_TABLE_NAME = 'messages';
const MENTION_TABLE_NAME = 'mentions';


// Description: Creates the author table query
// Parameters:
//      id (String) *Required
//          The ID of the author. Will be used as the primary key in this database
//      username (String) *Required 
//          Name of the author
//      discriminator (String)
//          Numbers at the end of
//      avatarUrl (String)
//          Link to the URL of the author
// Returns:
//      query (String)
//          The query string to be sent to the database
function create_author_query (id, username, discriminator, avatarUrl) {
    let parameters = {
        'id': id, 
        'username': `"${username}"`
    };

    if (discriminator) {
        parameters['discriminator'] = discriminator;
    }
    if (avatarUrl) {
        parameters['avatar_url'] = avatarUrl;
    }

    let columnNameString = Object.keys(parameters).join(', ');
    let valueStrings = Object.values(parameters).join(', ');
    
    let query = `REPLACE ${AUTHOR_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;

    return query;
}


// Description: Creates a server table query
// Parameters:
//      serverId (String) *Required
//          The ID of the server. Will be used as the primary key in this database
//      serverName (String) *Required
//          The name of the server
// Returns:
//      query (String)
//          The query string to be sent to the database
function create_server_query (serverId, serverName) {
    let parameters = {
        'id' : serverId,
        'name' : `"${serverName}"`
    };

    let columnNameString = Object.keys(parameters).join(', ');
    let valueStrings = Object.values(parameters).join(', ');

    let query = `REPLACE ${SERVER_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;
    return query;
}

// Description: Creates the attachments table query
// Parameters:
//      mediaType (String) *Required
//          The origin type of the media. Supported: ['embedded', 'attachment']
//      bucketUrl (String) *Required
//          The URL to the media file in the bucket
//      size (int)
//          The size of the file in bytes
//      width (int) 
//          Only applicable to pictures, width of the media file in pixels
//      height (int)
//          Only applicable to picture, height of the media file in pixels
// Returns:
//      query (String)
//          The query string to be sent to the database
async function create_medias_query (mediaType, bucketUrl, size, width, height) {
    let mediaId = await create_unique_id_for_media(mediaType);

    let parameters = {
        'id' : `"${mediaId}"`,
        'bucket_url' : `"${bucketUrl}"`,
    };

    if (size) {
        parameters['size'] = size;
    }
    if (width) {
        parameters['width'] = width;
    }
    if (height) {
        parameters['height'] = height;
    }

    let columnNameString = Object.keys(parameters).join(', ');
    let valueStrings = Object.values(parameters).join(', ');

    let query = `INSERT INTO ${MEDIA_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;
    return query;
}

// Description: Creates a channel table query
// Parameters:
//      channelId (String) *Required
//          The ID of the channel. Will be used as the primary key in the DB.
//      name (String) *Required
//          The name of the channel
//      isNsfw (boolean) 
//          Boolean representing the nsfw status of the channel
//      type (String) 
//          Type of the channel
//              Example: 'text'
//      topic (String)
//          The topic of the channel
function create_channel_query (channelId, name, isNsfw = false, type, topic) {
    let parameters = {
        'id' : channelId,
        'name' : `"${name}"`,
        'is_nsfw' : isNsfw ? 1 : 0 // nsfw flag will be by default false unless specified in query call
    };

    if (type) {
        parameters['type'] = `"${type}"`;
    }
    if (topic) {
        parameters['topic'] = `${topic}`;
    }

    let columnNameString = Object.keys(parameters).join(', ');
    let valueStrings = Object.values(parameters).join(', ');

    let query = `REPLACE ${CHANNEL_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;
    return query;
}

// Description: Creates a mentions table query
// Parameters:
//      authorId (String) *Required
//          The id of the author
//      messageId (String) *Required
//          The ID of the message containing the mentions
//      recipientsIds (Array of Strings) 
//          A list of all the member ids mentioned
//      everyoneMention (boolean)
//          Flag to check if the author mentioned @everyone or @here
// Returns:
//      queries (Array of strings)
//          Array of all the query mentions
function create_mentions_query(authorId, messageId, recipientsIds, everyoneMention) {
    // For each of the recipients create a new query
    let queries = [];

    // 2 cases, either: 
    //      has recipients
    if (recipientsIds) {
        recipientsIds.forEach(function(recipientId) {
        let parameters = {
            'author_id' : authorId,
            'recipient_id' : recipientId,
            'message_id' : messageId
        };
        
        let columnNameString = Object.keys(parameters).join(', ');
        let valueStrings = Object.values(parameters).join(', ');

        let query = `INSERT INTO ${MENTION_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;
        queries.push(query);
        })
    }
    //      @everyone
    if (everyoneMention) {
        let parameters = {
            'author_id' : authorId,
            'message_id' : messageId,
            'everyone_mention' : "1"
        };

        let columnNameString = Object.keys(parameters).join(', ');
        let valueStrings = Object.values(parameters).join(', ');

        let query = `INSERT INTO ${MENTION_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;
        queries.push(query);
    }

    return queries;
}


// Description: Creates a unique ID for medias
// Parameters: 
//      type (String)
//          The type of the media. Supported: [embed,attachment] 
async function create_unique_id_for_media (typeName) {
    // Get the 3 letter type identifier
    let typeIdentifier = MEDIA_TYPE_IDENTIFIER_MAP[typeName];
    
    const convert_to_two_digits = function(num) {
        return ("0" + num).slice(-2);
    }
    const convert_to_x_unique_digits = function(num) {
        let numZeros = (Math.pow(10, NUM_UNIQUE_ID_DIGITS )).toString().slice(-NUM_UNIQUE_ID_DIGITS);
        return (numZeros + num).substr(-NUM_UNIQUE_ID_DIGITS)
    }

    // Get the 6 digit date code
    let dateNow = new Date();
    let year = dateNow.getFullYear().toString().slice(-2);
    let month = convert_to_two_digits(dateNow.getMonth());
    // Converts the month to 2 digits if it's less than 10
    let day = convert_to_two_digits(dateNow.getDate());
    let dateCode = [year, month, day].join('');

    // Get the x digit discriminator
    // Get the number of items from today's attachments [Definitions, Rows]
    let queryResults = await dbHelper.query_db(`SELECT * FROM ${MESSAGE_TABLE_NAME} WHERE DATE(\`Date\`)=CURDATE() AND ${MEDIA_TABLE_NAME} IS NOT NULL;`, DATABASE_NAME );
    
    // Get the number of attachments from today
    let numAttachmentsFromToday = queryResults[1].length;

    if (numAttachmentsFromToday >= 1000) {
        throw "Number of attachments exceeding max digits.";
    }

    // Convert this number to discriminator code
    let discriminatorCode = convert_to_x_unique_digits(numAttachmentsFromToday);

    let uniqueMediaId = [typeIdentifier, dateCode, discriminatorCode].join('-');

    return uniqueMediaId;
}

// Export the functions
module.exports = {
    create_author_query, create_server_query, create_medias_query, create_channel_query, create_mentions_query
}