# discord-analyzer-bot

Discord Analyzer Bot is an application which can be run and be used to scrape, store, and analyze data from discord servers.

## Getting Started

These instructions will get you started on creating your bot

### Prerequisites

1. Create a google drive account
2. Create a discord application -> https://discord.com/developers/applications
3. Create a `config.json`file in the root of the project and fill this out 
```
{
    "authentication" : {
        "token" : "<YOUR DISCORD AUTHENTICATION TOKEN>"
    }
}
```
4. Run through the node.js google drive quickstart to get your google drive credentials and token-> https://developers.google.com/drive/api/v3/quickstart/nodejs
5. Run your application with `node .`


## Use Cases
### 1. Storing files into Google Drive
While your discord bot is running and is invited to your discord server, all files and some links to media will be uploaded to your google drive

## Future Features
### 
* Create template to run this bot on AWS
* Store text into a database 

## Authors
* **Anderson Chen** - (https://github.com/AChenny)

## License

[TBA]
