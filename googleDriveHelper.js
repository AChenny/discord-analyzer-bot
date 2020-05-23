"use strict";
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
* Describe with given media and metaData and upload it using google.drive.create method()
*/ 
function uploadFile(data, fileName, username) {
  // Read from credentials and store the content in a JSON object
  let credentialsContent = JSON.parse(fs.readFileSync('credentials.json'));
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), function (auth) {
      const drive = google.drive({version: 'v3', auth});
      // Check if folder has been created for current month and year
      let dateFolderName = getCurrentDateFolderName();
      getDirectoryId(drive, 'root', dateFolderName, function(dateFolderId) {
        if (typeof dateFolderId == 'undefined') {
          console.log("Creating a new date folder...")
          // With the newly created date folder, continue
          createDirectory(drive, [], dateFolderName, function(dateFolderId) {
            // New date folder, so user folder will not have been created -> Create one
            console.log("Creating a user new folder...")
            createDirectory(drive, [dateFolderId], username, function(userFolderId) {
              console.log(userFolderId);
              // Load file data
              const fileMetadata = {
                  'name': fileName,
                  parents: [userFolderId]
              };
              const media = {
                  mimeType: 'image/png',
                  body: data
              };
      
              // Upload file with the file data
              drive.files.create({
              resource: fileMetadata,
              media: media,
              fields: 'id'
              }, 
              (err, file) => {
                  if (err) {
                      // Handle error
                      console.error(err);
                  } else {
                      console.log('File Id: ', file.data.id);
                      console.log(`File created in: ${dateFolderName}/${username}`);
                  }
              });
            });
          });
        }
        else {
          getDirectoryId(drive, [dateFolderId], username, function(userFolderId) {
            if (typeof userFolderId == 'undefined') {
              console.log("Creating a new user folder...")
              createDirectory(drive, [dateFolderId], username, function(userFolderId) {
                // Load file data
                const fileMetadata = {
                    'name': fileName,
                    parents: [userFolderId]
                };
                const media = {
                    mimeType: 'image/png',
                    body: data
                };
        
                // Upload file with the file data
                drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
                }, 
                (err, file) => {
                    if (err) {
                        // Handle error
                        console.error(err);
                    } else {
                        console.log('File Id: ', file.data.id);
                        console.log(`File created in: ${dateFolderName}/${username}`);
                    }
                });
              });
            }
            else {
              const fileMetadata = {
                'name': fileName,
                parents: [userFolderId]
              };
              const media = {
                  mimeType: 'image/png',
                  body: data
              };
      
              // Upload file with the file data
              drive.files.create({
              resource: fileMetadata,
              media: media,
              fields: 'id'
              }, 
              (err, file) => {
                  if (err) {
                      // Handle error
                      console.error(err);
                  } else {
                      console.log('File Id: ', file.data.id);
                      console.log(`File created in: ${dateFolderName}/${username}`);
                  }
              });
            }
          })
        }
      });
    });
  });
}

// Input: Drive object, any parents (or root), the new directory name, and a callback using the new directory id
function createDirectory(drive, parents, directoryName, callback) {
  var fileMetadata = {
    'name': directoryName,
    'mimeType': 'application/vnd.google-apps.folder',
    parents: parents
  };

  drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  }, function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('New Folder Id: ', file.data["id"]);
      callback(file.data["id"]);
    }
  });
}

function getDirectoryId(drive, parents, directoryName, callback) {
  // Get the directories map first, return the directory ID
  getDirectoriesList(drive, parents, function(directoriesMap) {
    const directoryId = directoriesMap.get(directoryName);
    callback(directoryId);
  });
}

function getDirectoriesList(drive, parents, callback) {
  // Create a new directories map
  const directoriesMap = new Map();
  let query = '';
  if (parents != 'root') {
    query = `'' in ${parents}`;
  }

  drive.files.list({
    parents: parents,
    fields: 'files(id, name, mimeType)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      files.map((file) => {
        if(file.mimeType === 'application/vnd.google-apps.folder') {
          directoriesMap.set(file.name, file.id);
        }
      });
    } else {
      console.log('No files found.');
    }
    callback(directoriesMap);
  });
}

function getCurrentDateFolderName() {
  let d = new Date();
  return d.toLocaleDateString('default', { month: 'long', year: 'numeric'});
}

module.exports = {
    uploadFile
}