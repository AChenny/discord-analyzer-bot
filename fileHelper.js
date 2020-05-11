const https = require('https')
const fs = require('fs');
const googleDriveHelper  = require('./googleDriveHelper.js')
const request = require('request');

// Input: A proxy link to the file to download
// Description: Takes a link and downloads it to a local directory
// const download = function(url){
//     const file = fs.createWriteStream("./test.png");
//     const request = https.get(url, function(response) {
//         response.pipe(file);
//     });
// }

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

// Input: A link to a picture
// Description: Takes the link and uploads it to the google drive
async function upload_to_drive(url) {
    const data = await download(url);
    googleDriveHelper.uploadFile(data);
}

// Export the functions
module.exports = {
    upload_to_drive
}