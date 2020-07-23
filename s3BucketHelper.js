// Description: All functions to handle s3 bucket interactions
const config = require('./config.json');

const AWS_ACCESS_KEY = config.AWS_CREDENTIALS.access_key;
const AWS_SECRET_KEY = config.AWS_CREDENTIALS.secret_key;

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
});

const BUCKET_NAME = 'discord-bot-bucket';

// Description: Uploads a file to s3 bucket in a date folder -> user
// Input: Data from file to upload (bytes), filename including the extension(string), username to make the folder for(string) 
// Output: None
function upload_file (data, filename, username) {
    return;
}