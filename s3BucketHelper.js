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
// Parameters: 
//      data (bytestream/bytestring)
//          The stream of data in byte form to upload to the bucket
//      filename (String)
//          The filename to be used in the bucket including the extension
//              Example: 'picture.png'
//      username (String) 
//          Name of the username which will be used as the name of the folder
// Returns:
//      object_url (String)
//          The url to the object in the bucket or null if the upload failed
async function upload_file(data, filename, username) {
    let bucketKey = [getCurrentDateFolderName(), username, filename].join('/');
    const params = {
        Bucket: BUCKET_NAME,
        Key: bucketKey,
        Body: data
    };

    let object_url;
    try {
        const data = await s3.upload(params).promise();
        object_url = data.Location;
    }
    catch (err) {
        throw err;
    }
    return object_url;
}

function getCurrentDateFolderName() {
    let d = new Date();
    return d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
}


module.exports = {
    upload_file
}