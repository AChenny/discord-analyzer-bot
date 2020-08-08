// Description all functions to handle database interactions

// Imports
const config = require('./config.json');
// const mysql = require('mysql2'); //https://www.npmjs.com/package/mysql2
const mysql = require('mysql2/promise');
// Constants and configuration

// Description: Sends a query to a database using the configuration credentials
//  Parameters: 
//      query (String)
//          The query to be sent to the database 
//              Example: 'SELECT * FROM table;'
//      database_name (String)
//          The name of the database that this query will be sent to
//  Returns:
//      None
async function query_db(query, database_name) {
    const connection = await mysql.createConnection(
        {
            host: config.database_creds.host, 
            user: config.database_creds.user, 
            password: config.database_creds.password,
            database: database_name
        }
    );
    // query database
    const [rows, fields] = await connection.query(query);

    return;
}

// Export the functions
module.exports = {
    query_db
}