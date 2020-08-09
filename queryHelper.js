// Description: This library contains all the functions that interact with queries and query responses

// Constants
const DATABASE_NAME = 'beta_bois';

// Table names
const AUTHOR_TABLE_NAME = 'authors'

// Description: Creates the author table query from authors object 
// Parameters:
//      id (String) *Required
//          The ID of the author. Will be used as the primary key in this database
//      username (String) *Required 
//          Name of the author
//      discriminator (String)
//          Numbers at the end of
//      avatarUrl (String)
//          Link to the URL of the author
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

// Export the functions
module.exports = {
    create_author_query
}