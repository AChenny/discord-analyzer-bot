const https = require('https')
const fs = require('fs');
const googleDriveHelper  = require('./googleDriveHelper.js')
const request = require('request');

// Input: A proxy link to the file to download
// Output: Returns the streamed data as a Promise object
const download = function(url)  {
    return new Promise(function (resolve, reject) {
        request(
          {
            method: "GET",
            url: url,
            encoding: null,
          },
          (err, res, body) => {
            if (err && res.statusCode != 200) {
              reject(err);
              return;
            }
            const stream = require("stream");
            const bs = new stream.PassThrough();
            bs.end(body);
            resolve(bs);
          }
        );
    });
}

// Input: A link to a picture, filename, and username
// Description: Takes the link and uploads it to the google drive into that usernames folder
async function upload_to_drive(url, filename, username) {
  const data = await download(url);
  
  // username will be used as the folder for googledrive
  googleDriveHelper.uploadFile(data, filename, username);
}

// Export the functions
module.exports = {
    upload_to_drive
}