const https = require('https')
const fs = require('fs');

// Input: A proxy link to the file to download
// Description: Takes a link and downloads it to a local directory
const download = function(url){
    const file = fs.createWriteStream("./test.png");
    const request = https.get(url, function(response) {
        response.pipe(file);
    });
}

// Export the functions
module.exports = {
    download
}