// Description: All functions to handle s3 bucket interactions
const config = require('./config.json');
const path = require('path');

const AWS_ACCESS_KEY = config.AWS_CREDENTIALS.access_key;
const AWS_SECRET_KEY = config.AWS_CREDENTIALS.secret_key;

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
});

const BUCKET_NAME = 'discord-bot-bucket';

// Description: Uploads a file to s3 bucket in a date folder -> user
// Input: Data from file to upload (bytestream), filename including the extension(string), username to make the folder for(string) 
// Output: None
function upload_file (data, filename, username) {
    let bucketKey = [getCurrentDateFolderName(), username, filename].join('/'); 
    
    const params = {
        Bucket: BUCKET_NAME,
        Key: bucketKey,
        Body: data
    };
    s3.upload(params, function(err, data) {
        console.log(err, data);
    });
    return;
}

function getCurrentDateFolderName() {
    let d = new Date();
    return d.toLocaleDateString('default', { month: 'long', year: 'numeric'});
}

module.exports = {
    upload_file
}