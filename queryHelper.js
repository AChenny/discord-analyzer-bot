// Description: This library contains all the functions that interact with queries and query responses

// Constants
const DATABASE_NAME = 'beta_bois';

// Table names
const AUTHOR_TABLE_NAME = 'authors';
const SERVER_TABLE_NAME = 'servers';

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
    
    let query = `INSERT IGNORE INTO ${AUTHOR_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;

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

    let query = `INSERT IGNORE INTO ${SERVER_TABLE_NAME} (${columnNameString}) VALUES (${valueStrings});`;
    return query;
}

// Export the functions
module.exports = {
    create_author_query, create_server_query
}