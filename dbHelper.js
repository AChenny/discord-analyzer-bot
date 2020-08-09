// Description all functions to handle database interactions

// Imports
const config = require('./config.json');
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
//      [ fields, rows ] (Array)
//          Returns all the rows and the columns as a 2 dimensional array. Fields are the definitions, rows are values
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

    return [fields, rows];
}

// Description: Begins a transaction, sends the list of queries from arrays and commits or rollsback if there is an error
//  Parameters:
//      queries (Array of strings)
//          The queries to be sent to the database
//      database_name (String)
//          The name of the database these queries will be sent to
//  Returns:
//      None
async function send_queries_to_db_in_transaction(queries, database_name) {
    const connection = await mysql.createConnection(
        {
            host: config.database_creds.host, 
            user: config.database_creds.user, 
            password: config.database_creds.password,
            database: database_name
        }
    );

    // begin transaction
    console.log("Beginning transaction...");
    await connection.beginTransaction();

    // Send queries
    //      If, there are any errors, then rollback the transaction
    //      Else, commit
    const start_queries = async () => {
        let query_success = true;
        await asyncForEach(queries, async (query) => {
            console.log(`Sending query: ${query}`);
            try {
                await connection.query(query);
            }
            catch(err) {
                console.log("Rolling back...");
                connection.rollback();
                console.log(err);
                // If any of the queries has an error, set flag to false and 
                query_success = false;
            }
        })
        if (query_success) {
            let commit_response = await connection.commit();
            console.log("Commit Success!")
        }
    }
    start_queries();
    return;
}

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

// Export the functions
module.exports = {
    query_db, send_queries_to_db_in_transaction
}