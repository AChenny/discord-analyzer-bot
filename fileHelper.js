const s3BucketHelper = require('./s3BucketHelper.js');
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

// Description: Takes the link and uploads it into the drive into that usernames folder
// Parameters:
//    url (String)
//        The url to the picture to the media file to be uploaded
//    filename (String)
//        The filename without the fileExtension
//    fileExtension (String)
//        The file extension of the file
//            Example: '.png'
//    username (String)
//        The name of the user sending the media file. Which will be used to create them a folder in the drive
async function upload_to_drive(url, filename, fileExtension, username) {
  const data = await download(url);
  let driveFileName = filename.concat(fileExtension);

  // Upload to s3 bucket
  let bucketUrl = await s3BucketHelper.upload_file(data, driveFileName, username);

  return bucketUrl;
}

/*Input: A link to a file and verifies that it is a picture 
* Output: Boolean
*/  
function _validate_picture(url) {

}

// Export the functions
module.exports = {
    upload_to_drive
}